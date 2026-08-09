const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in server/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
  'users',
  'roles',
  'user_roles',
  'beneficiaries',
  'families',
  'volunteers',
  'volunteer_assignments',
  'districts',
  'relief_camps',
  'camp_capacity',
  'sos_requests',
  'victim_locations',
  'inventory',
  'resources',
  'resource_distribution',
  'donations',
  'rescue_history',
  'notifications',
  'reports',
  'audit_logs',
  'flood_zones',
  'camps',
  'profiles'
];

async function test() {
  console.log("Checking tables in database...");
  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.log(`❌ Table '${table}' error: ${error.message}`);
    } else {
      console.log(`✅ Table '${table}' exists!`);
    }
  }
}

test();
