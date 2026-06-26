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
} catch (e) {
  console.error(e);
}

const supabaseAdmin = createClient(envUrl, envServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function run() {
  console.log('Fetching students...');
  const { data: students, error: studentError } = await supabaseAdmin
    .from('students')
    .select('*')
    .limit(1);
    
  if (studentError) {
    console.error('Error fetching students:', studentError);
    return;
  }
  
  if (students.length === 0) {
    console.log('No students found in the database. Please add a student first.');
    return;
  }
  
  const student = students[0];
  console.log('Selected student:', student);
  
  const email = `test.parent.real.${Date.now()}@gmail.com`;
  const password = 'Lockhearttest5';
  const name = 'Test Parent Real';
  const role = 'parent';
  
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
      student_id: student.id,
      created_at: new Date().toISOString(),
    });

  if (profileError) {
    console.error('Profile Upsert Error:', profileError);
    console.log('Cleaning up auth user...');
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return;
  }
  console.log('Profile Upsert Succeeded!');
  
  // Cleanup
  console.log('Cleaning up...');
  await supabaseAdmin.from('profiles').delete().eq('id', userId);
  await supabaseAdmin.auth.admin.deleteUser(userId);
  console.log('Done!');
}

run();
