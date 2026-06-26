const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

let envUrl = '';
let envServiceKey = '';

try {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') envUrl = value.trim();
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') envServiceKey = value.trim();
    }
  }
} catch (e) {}

const supabaseAdmin = createClient(envUrl, envServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function run() {
  const email = `test.parent.${Date.now()}@gmail.com`;
  const password = 'Lockhearttest5';
  const name = 'Test Parent';
  const role = 'parent';
  const studentId = '2840cb00-c7e2-4367-855b-079a8111408d'; // Khalifa Harith Alhafidz

  console.log('1. Creating Auth User...');
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  });

  if (authError) {
    console.error('Auth Error:', authError);
    return;
  }

  const userId = authData.user.id;
  console.log('Auth User Created with ID:', userId);

  console.log('2. Upserting Profile...');
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      name,
      role,
      email,
      class_id: null,
      student_id: studentId,
      created_at: new Date().toISOString(),
    });

  if (profileError) {
    console.error('Profile Upsert Error:', profileError);
    console.log('Cleaning up auth user...');
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return;
  }
  console.log('Profile Upsert Succeeded!');

  console.log('3. Updating Student parent link...');
  const { data: updatedStudent, error: studentError } = await supabaseAdmin
    .from('students')
    .update({ parent_id: userId })
    .eq('id', studentId)
    .select()
    .single();

  if (studentError) {
    console.error('Student Update Error:', studentError);
    return;
  }

  console.log('All steps completed successfully!', updatedStudent);
}

run();
