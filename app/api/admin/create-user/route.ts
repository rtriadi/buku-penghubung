import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { fetch as undiciFetch } from 'undici';

export async function POST(req: Request) {
  try {
    const { name, email, role, password, studentId, classId } = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase URL or Service Role Key is not configured on the server.' },
        { status: 500 }
      );
    }

    // Initialize the admin client with undici fetch to bypass Next.js global fetch patch
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        fetch: undiciFetch as any,
      },
    });

    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });

    if (authError) {
      let errMsg = authError.message;
      if (errMsg === '{}' || !errMsg) {
        errMsg = `Gagal membuat akun: Terjadi masalah database di Supabase Auth (kemungkinan email '${email}' dalam status bermasalah/orphaned di auth.identities atau indeks email database bermasalah). Silakan gunakan email lain atau reindex tabel auth.users di Supabase.`;
      }
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. The trigger "on_auth_user_created" might have created a basic profile.
    // Let's upsert/update the profile with the correct name, role, classId, and studentId.
    // This ensures all columns are correctly populated regardless of trigger limitations.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        name,
        role,
        email, // save email directly to profiles for easy client-side querying
        class_id: classId || null,
        student_id: studentId || null,
        created_at: new Date().toISOString(),
      });

    if (profileError) {
      // Clean up the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: `Failed to create profile: ${profileError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name,
        email,
        role,
        classId,
        studentId,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
