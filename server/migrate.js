const fs = require('fs');
const path = require('path');
require('dotenv').config();

const schemaPath = path.resolve(__dirname, '../database/supabase/schema.sql');
const policiesPath = path.resolve(__dirname, '../database/supabase/policies.sql');
const triggersPath = path.resolve(__dirname, '../database/supabase/triggers.sql');
const seedPath = path.resolve(__dirname, '../database/supabase/seed.sql');

console.log("=============================================================");
console.log("📊 FLOOD EMERGENCY RESPONSE SYSTEM — DATABASE MIGRATION GUIDE");
console.log("=============================================================\n");

console.log("To fully set up the new 20-table schema, follow these options:\n");

console.log("👉 OPTION 1: Paste in Supabase Dashboard SQL Editor (Recommended)");
console.log("1. Open your Supabase Dashboard: https://supabase.com/dashboard");
console.log("2. Navigate to SQL Editor -> New Query.");
console.log("3. Copy the contents of the following files and execute them in order:\n");
console.log(`   📁 File 1 (Schema):   ${schemaPath}`);
console.log(`   📁 File 2 (Policies): ${policiesPath}`);
console.log(`   📁 File 3 (Triggers): ${triggersPath}`);
console.log(`   📁 File 4 (Demo Seed): ${seedPath}\n`);

console.log("-------------------------------------------------------------");
console.log("👉 OPTION 2: Run via PostgreSQL CLI (If you have access)");
console.log("If you have psql installed and database connection details, run:\n");
console.log(`   psql -h db.yugouljgwarsmkmhutke.supabase.co -U postgres -d postgres -f "${schemaPath}"`);
console.log(`   psql -h db.yugouljgwarsmkmhutke.supabase.co -U postgres -d postgres -f "${policiesPath}"`);
console.log(`   psql -h db.yugouljgwarsmkmhutke.supabase.co -U postgres -d postgres -f "${triggersPath}"`);
console.log(`   psql -h db.yugouljgwarsmkmhutke.supabase.co -U postgres -d postgres -f "${seedPath}"\n`);

console.log("=============================================================");
