// app/api/admin/set-principal/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase URL or Service Role Key is not configured on the server.' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Find the current principal (if any)
    const { data: currentPrincipal, error: findError } = await supabaseAdmin
      .from('profiles')
      .select('id, name')
      .eq('role', 'principal')
      .maybeSingle();

    if (findError) {
      return NextResponse.json({ error: findError.message }, { status: 400 });
    }

    // 2. Demote current principal to teacher
    if (currentPrincipal) {
      // Demote in auth metadata
      const { error: demoteAuthError } = await supabaseAdmin.auth.admin.updateUserById(
        currentPrincipal.id,
        { user_metadata: { role: 'teacher' } }
      );
      if (demoteAuthError) {
        return NextResponse.json({ error: `Gagal demote auth Kepala Sekolah lama: ${demoteAuthError.message}` }, { status: 500 });
      }

      // Demote in profiles
      const { error: demoteProfileError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'teacher' })
        .eq('id', currentPrincipal.id);

      if (demoteProfileError) {
        return NextResponse.json({ error: `Gagal demote profil Kepala Sekolah lama: ${demoteProfileError.message}` }, { status: 500 });
      }
    }

    // 3. Promote the new principal
    // Promote in auth metadata
    const { error: promoteAuthError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: { role: 'principal' } }
    );
    if (promoteAuthError) {
      return NextResponse.json({ error: `Gagal promote auth Kepala Sekolah baru: ${promoteAuthError.message}` }, { status: 500 });
    }

    // Promote in profiles (and clear their class_id)
    const { error: promoteProfileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'principal', class_id: null })
      .eq('id', userId);

    if (promoteProfileError) {
      return NextResponse.json({ error: `Gagal promote profil Kepala Sekolah baru: ${promoteProfileError.message}` }, { status: 500 });
    }

    // 4. Remove this teacher from being Wali Kelas in any class
    const { error: clearWaliError } = await supabaseAdmin
      .from('classes')
      .update({ teacher_id: null })
      .eq('teacher_id', userId);

    if (clearWaliError) {
      console.error('Warning: failed to clear Wali Kelas assignment for promoted teacher:', clearWaliError);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
