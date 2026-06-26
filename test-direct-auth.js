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
  const email = `test.simple.${Date.now()}@gmail.com`;
  const password = 'Lockhearttest5';

  console.log('Creating auth user with no user_metadata...');
  const { data: authData1, error: authError1 } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError1) {
    console.error('Test 1 Error:', authError1);
  } else {
    console.log('Test 1 Succeeded! User ID:', authData1.user.id);
    await supabaseAdmin.auth.admin.deleteUser(authData1.user.id);
  }
}

run();
