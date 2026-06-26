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
  const email = `test.duplicate@gmail.com`;
  const password = 'Lockhearttest5';
  
  console.log('1. Creating Auth User...');
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  
  console.log('First create result:', { authData: !!authData, authError });
  
  console.log('2. Creating Auth User with same email...');
  const { data: authData2, error: authError2 } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  
  console.log('Second create result:', { authData2: !!authData2, authError2 });
  console.log('AuthError2 fields:', Object.keys(authError2 || {}), JSON.stringify(authError2));
  
  if (authData) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
  }
}

run();
