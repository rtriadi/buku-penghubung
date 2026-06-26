const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

let envUrl = '';
let envAnonKey = '';

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
      if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') envAnonKey = value.trim();
    }
  }
} catch (e) {
  console.error(e);
}

const supabase = createClient(envUrl, envAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function run() {
  console.log('Logging in as admin...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@darulkhairat.com',
    password: 'Bismillah2026',
  });

  if (authError) {
    console.error('Login error:', authError);
    return;
  }

  console.log('Login successful! User ID:', authData.user.id);
  console.log('User metadata:', authData.user.user_metadata);

  console.log('Fetching first student...');
  const { data: students, error: fetchError } = await supabase
    .from('students')
    .select('*')
    .limit(1);

  if (fetchError) {
    console.error('Fetch student error:', fetchError);
    return;
  }

  if (students.length === 0) {
    console.log('No students found.');
    return;
  }

  const student = students[0];
  console.log('Attempting to update student parent link (using anon client)...');
  const { data: updated, error: updateError } = await supabase
    .from('students')
    .update({ parent_id: authData.user.id })
    .eq('id', student.id)
    .select()
    .single();

  if (updateError) {
    console.error('Update error structure:', updateError);
    console.log('JSON.stringify(updateError):', JSON.stringify(updateError));
  } else {
    console.log('Update successful!', updated);
    // Revert it
    await supabase.from('students').update({ parent_id: null }).eq('id', student.id);
  }
}

run();
