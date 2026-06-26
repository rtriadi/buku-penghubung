// app/api/profile/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { fetch as undiciFetch } from 'undici';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing on server.' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('name, role')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }

    return NextResponse.json({ name: profile.name, role: profile.role });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { userId, name, password } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing on server.' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        fetch: undiciFetch as any,
      },
    });

    // 1. Update the profile name if provided
    if (name) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ name })
        .eq('id', userId);

      if (profileError) {
        return NextResponse.json({ error: `Gagal memperbarui nama profil: ${profileError.message}` }, { status: 400 });
      }
    }

    // 2. Update Auth metadata (name) and/or password if provided
    const updateData: any = {};
    if (name) {
      updateData.user_metadata = { name };
    }
    if (password) {
      updateData.password = password;
    }

    if (Object.keys(updateData).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData);
      if (authError) {
        return NextResponse.json({ error: `Gagal memperbarui akun: ${authError.message}` }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
