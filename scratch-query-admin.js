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
  console.log('Querying auth.users for admin...');
  const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
  if (usersError) {
    console.error('listUsers error:', usersError);
    return;
  }
  
  const adminUser = usersData.users.find(u => u.email === 'admin@darulkhairat.com');
  console.log('Admin Auth User:', adminUser ? { id: adminUser.id, email: adminUser.email } : 'Not found');
  
  if (adminUser) {
    console.log('Querying profile for admin...');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*, classes!fk_profile_class(name)')
      .eq('id', adminUser.id)
      .single();
      
    console.log('Admin Profile:', profile);
    console.log('Profile error:', profileError);
    
    // Check if plain select without classes join works
    const { data: profileSimple, error: profileSimpleError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', adminUser.id)
      .single();
    console.log('Simple Admin Profile:', profileSimple);
    console.log('Simple Profile error:', profileSimpleError);
  }
}

run();
