const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("🌱 Populating ~50 rich demo data items across all system tables...");

  // 1. Fetch or get districts
  const { data: districts } = await supabase.from('districts').select('id, name');
  const districtId = districts && districts.length > 0 ? districts[0].id : '11111111-1111-1111-1111-111111111111';

  // 2. Additional Relief Camps (Up to 10 Camps)
  console.log("📍 Seeding Relief Camps...");
  const extraCamps = [
    {
      id: 'aa111111-aa11-aa11-aa11-aa1111111111',
      name: 'Chennai Central Flood Relief Camp — Kamarajar Salai',
      district_id: districtId,
      address: 'Kamarajar Salai, Marina Beach Side, Chennai - 600001',
      latitude: 13.0627,
      longitude: 80.2800,
      max_capacity: 500,
      current_occupancy: 320,
      beds_total: 500,
      beds_available: 180,
      has_electricity: true,
      has_water: true,
      has_medical: true,
      contact_name: 'Dr. S. Radhakrishnan',
      contact_phone: '+91 98400 01234',
      status: 'active'
    },
    {
      id: 'bb222222-bb22-bb22-bb22-bb2222222222',
      name: 'Cuddalore District Relief Camp — Govt Higher Secondary',
      district_id: districtId,
      address: 'Cuddalore Old Town, Near Collectorate, Cuddalore - 607001',
      latitude: 11.7480,
      longitude: 79.7700,
      max_capacity: 350,
      current_occupancy: 210,
      beds_total: 350,
      beds_available: 140,
      has_electricity: true,
      has_water: true,
      has_medical: true,
      contact_name: 'M. Anbalagan',
      contact_phone: '+91 94430 05678',
      status: 'active'
    },
    {
      id: 'cc333333-cc33-cc33-cc33-cc3333333333',
      name: 'Nagapattinam Relief Centre — Town Hall',
      district_id: districtId,
      address: 'Town Hall Road, Nagapattinam - 611001',
      latitude: 10.7672,
      longitude: 79.8500,
      max_capacity: 400,
      current_occupancy: 390,
      beds_total: 400,
      beds_available: 10,
      has_electricity: true,
      has_water: true,
      has_medical: true,
      contact_name: 'K. Selvam',
      contact_phone: '+91 98940 07890',
      status: 'full'
    },
    {
      id: 'dd444444-dd44-dd44-dd44-dd4444444444',
      name: 'Thanjavur Emergency Shelter — Big Temple Complex',
      district_id: districtId,
      address: 'Near Brihadeeswarar Temple, Thanjavur - 613001',
      latitude: 10.7820,
      longitude: 79.1320,
      max_capacity: 250,
      current_occupancy: 140,
      beds_total: 250,
      beds_available: 110,
      has_electricity: true,
      has_water: true,
      has_medical: false,
      contact_name: 'P. Subramaniam',
      contact_phone: '+91 99520 09999',
      status: 'active'
    },
    {
      id: 'ee555555-ee55-ee55-ee55-ee5555555555',
      name: 'Tiruvallur Relief Camp — Ponneri Community Centre',
      district_id: districtId,
      address: 'Ponneri Main Road, Tiruvallur District - 601204',
      latitude: 13.3416,
      longitude: 80.1950,
      max_capacity: 200,
      current_occupancy: 95,
      beds_total: 200,
      beds_available: 105,
      has_electricity: false,
      has_water: true,
      has_medical: true,
      contact_name: 'R. Velmurugan',
      contact_phone: '+91 97100 11111',
      status: 'active'
    },
    {
      id: 'ff666666-ff66-ff66-ff66-ff6666666666',
      name: 'Velachery Emergency Shelter — St. Mark School',
      district_id: districtId,
      address: '100 Feet Bypass Road, Velachery, Chennai - 600042',
      latitude: 12.9780,
      longitude: 80.2210,
      max_capacity: 450,
      current_occupancy: 280,
      beds_total: 450,
      beds_available: 170,
      has_electricity: true,
      has_water: true,
      has_medical: true,
      contact_name: 'Anita Ramesh',
      contact_phone: '+91 98412 34567',
      status: 'active'
    },
    {
      id: 'gg777777-gg77-gg77-gg77-gg7777777777',
      name: 'Tambaram Evacuation Shelter — Govt Indoor Stadium',
      district_id: districtId,
      address: 'GST Road, Tambaram Sanatorium, Chennai - 600047',
      latitude: 12.9249,
      longitude: 80.1278,
      max_capacity: 600,
      current_occupancy: 410,
      beds_total: 600,
      beds_available: 190,
      has_electricity: true,
      has_water: true,
      has_medical: true,
      contact_name: 'Capt. V. Kumar',
      contact_phone: '+91 94440 98765',
      status: 'active'
    },
    {
      id: 'hh888888-hh88-hh88-hh88-hh8888888888',
      name: 'Adyar Flood Sanctuary — Corporation Hall',
      district_id: districtId,
      address: 'Lattice Bridge Road, Adyar, Chennai - 600020',
      latitude: 13.0012,
      longitude: 80.2564,
      max_capacity: 300,
      current_occupancy: 295,
      beds_total: 300,
      beds_available: 5,
      has_electricity: true,
      has_water: true,
      has_medical: true,
      contact_name: 'S. Sundaram',
      contact_phone: '+91 98840 55443',
      status: 'full'
    }
  ];

  for (const camp of extraCamps) {
    await supabase.from('relief_camps').upsert(camp, { onConflict: 'id' });
  }

  // 3. Flood Zones (10 Demo Zones)
  console.log("🌊 Seeding Flood Zones...");
  const floodZones = [
    {
      district_id: districtId,
      zone_name: 'Adyar River Basin — Zone A',
      severity: 'critical',
      water_level_meters: 3.4,
      affected_population: 14200,
      status: 'active'
    },
    {
      district_id: districtId,
      zone_name: 'Velachery Lake Overflow Sector 4',
      severity: 'critical',
      water_level_meters: 2.8,
      affected_population: 9800,
      status: 'active'
    },
    {
      district_id: districtId,
      zone_name: 'Cooum River Bank Sub-division B',
      severity: 'high',
      water_level_meters: 2.1,
      affected_population: 6500,
      status: 'active'
    },
    {
      district_id: districtId,
      zone_name: 'Cuddalore Coastal Backwater Inundation',
      severity: 'high',
      water_level_meters: 1.9,
      affected_population: 5200,
      status: 'active'
    },
    {
      district_id: districtId,
      zone_name: 'Nagapattinam Shoreline Lowlands',
      severity: 'critical',
      water_level_meters: 4.1,
      affected_population: 18500,
      status: 'active'
    },
    {
      district_id: districtId,
      zone_name: 'Thanjavur Cauvery Delta Discharge Zone',
      severity: 'medium',
      water_level_meters: 1.4,
      affected_population: 3400,
      status: 'receding'
    },
    {
      district_id: districtId,
      zone_name: 'Tiruvallur Kosasthalaiyar River Bank',
      severity: 'high',
      water_level_meters: 2.3,
      affected_population: 7100,
      status: 'active'
    },
    {
      district_id: districtId,
      zone_name: 'Madipakkam Lake Catchment Belt',
      severity: 'medium',
      water_level_meters: 1.2,
      affected_population: 2900,
      status: 'receding'
    },
    {
      district_id: districtId,
      zone_name: 'Perumbakkam Wetland Spillway',
      severity: 'high',
      water_level_meters: 2.0,
      affected_population: 4800,
      status: 'active'
    },
    {
      district_id: districtId,
      zone_name: 'Mudichur Waterlog Sector 2',
      severity: 'medium',
      water_level_meters: 0.9,
      affected_population: 1500,
      status: 'cleared'
    }
  ];

  for (const fz of floodZones) {
    await supabase.from('flood_zones').insert(fz);
  }

  // 4. SOS Requests (15 Active Victim SOS Entries)
  console.log("🚨 Seeding Emergency SOS Requests...");
  const sosRequests = [
    {
      reporter_name: 'Kavitha Subramani',
      reporter_phone: '+91 98401 99887',
      emergency_type: 'flood_rescue',
      emergency_level: 5,
      description: 'Water level reached second floor, 4 family members including 1 infant trapped on terrace.',
      latitude: 13.0827,
      longitude: 80.2707,
      address: 'No 45, Gandhi Nagar 2nd Street, Velachery, Chennai',
      battery_level: 14,
      status: 'pending'
    },
    {
      reporter_name: 'Murugan Krishnan',
      reporter_phone: '+91 97902 44332',
      emergency_type: 'medical',
      emergency_level: 4,
      description: 'Diabetic patient needs emergency insulin supply and evacuation from flooded home.',
      latitude: 13.0010,
      longitude: 80.2540,
      address: 'Lattice Bridge Road, Adyar, Chennai',
      battery_level: 42,
      status: 'assigned'
    },
    {
      reporter_name: 'Rajesh Kannan',
      reporter_phone: '+91 94441 22334',
      emergency_type: 'stranded',
      emergency_level: 3,
      description: 'Stranded in commercial shop near bus stand, water 3 feet deep outside.',
      latitude: 12.9250,
      longitude: 80.1280,
      address: 'GST Road, Tambaram, Chennai',
      battery_level: 68,
      status: 'in_progress'
    },
    {
      reporter_name: 'Lakshmi Narayanan',
      reporter_phone: '+91 98845 66778',
      emergency_type: 'structural_damage',
      emergency_level: 5,
      description: 'Old brick wall collapsed in heavy rain. Need immediate rescue boat.',
      latitude: 11.7485,
      longitude: 79.7710,
      address: 'Old Town Colony, Cuddalore',
      battery_level: 8,
      status: 'pending'
    },
    {
      reporter_name: 'Prakash Rao',
      reporter_phone: '+91 99522 11009',
      emergency_type: 'missing_person',
      emergency_level: 4,
      description: 'Elderly grandfather missing near Kovalam backwaters after flash flood surge.',
      latitude: 10.7680,
      longitude: 79.8510,
      address: 'Port Road, Nagapattinam',
      battery_level: 55,
      status: 'assigned'
    },
    {
      reporter_name: 'Deepa V.',
      reporter_phone: '+91 97100 88990',
      emergency_type: 'flood_rescue',
      emergency_level: 3,
      description: '2 adults and 1 dog stranded on wooden table inside flooded house.',
      latitude: 13.3420,
      longitude: 80.1960,
      address: 'Ponneri Bazaar Street, Tiruvallur',
      battery_level: 80,
      status: 'rescued'
    },
    {
      reporter_name: 'Siddharth M.',
      reporter_phone: '+91 98400 33445',
      emergency_type: 'medical',
      emergency_level: 5,
      description: 'Pregnant woman in labor pain, access road completely flooded.',
      latitude: 13.0640,
      longitude: 80.2820,
      address: 'Triplicane High Road, Chennai',
      battery_level: 29,
      status: 'in_progress'
    },
    {
      reporter_name: 'Anand Kumar',
      reporter_phone: '+91 94430 77665',
      emergency_type: 'stranded',
      emergency_level: 2,
      description: 'Car stalled in waterlogged underpass. Need towing & safe transit to camp.',
      latitude: 10.7830,
      longitude: 79.1330,
      address: 'South Rampart, Thanjavur',
      battery_level: 91,
      status: 'rescued'
    }
  ];

  for (const sos of sosRequests) {
    await supabase.from('sos_requests').insert(sos);
  }

  // 5. Donations (10 Corporate & NGO Records)
  console.log("💰 Seeding Donations...");
  const donations = [
    {
      donor_name: 'Tata Consultancy Services Foundation',
      donor_email: 'csr@tcs.com',
      donor_phone: '+91 44220 99000',
      donor_type: 'corporate',
      donation_type: 'cash',
      amount: 500000.00,
      description: 'Emergency flood relief operational fund for Tamil Nadu 2024.',
      status: 'approved'
    },
    {
      donor_name: 'Ramakrishna Mission Relief Wing',
      donor_email: 'relief@rkmchennai.org',
      donor_phone: '+91 44246 40607',
      donor_type: 'ngo',
      donation_type: 'food',
      amount: 150000.00,
      description: '5,000 cooked meal packets delivered to Chennai relief camps daily.',
      status: 'received'
    },
    {
      donor_name: 'Apollo Hospitals Group',
      donor_email: 'csr@apollohospitals.com',
      donor_phone: '+91 44282 96000',
      donor_type: 'corporate',
      donation_type: 'medicines',
      amount: 350000.00,
      description: 'Essential antibiotics, IV fluids, and wound dressing kits for camps.',
      status: 'approved'
    },
    {
      donor_name: 'Infosys Foundation',
      donor_email: 'foundation@infosys.com',
      donor_phone: '+91 80459 60000',
      donor_type: 'corporate',
      donation_type: 'cash',
      amount: 1000000.00,
      description: 'Grant for flood rehabilitation and rescue boat fuel procurement.',
      status: 'approved'
    },
    {
      donor_name: 'Chennai Rotary Club Central',
      donor_email: 'rotary@chennaicentral.org',
      donor_phone: '+91 98409 87654',
      donor_type: 'ngo',
      donation_type: 'other',
      amount: 75000.00,
      description: '500 survival kits with torch, whistle, first aid kit, and dry food.',
      status: 'received'
    }
  ];

  for (const d of donations) {
    await supabase.from('donations').insert(d);
  }

  // 6. System Notifications (10 Notifications)
  console.log("🔔 Seeding Notifications...");
  const notifications = [
    {
      type: 'broadcast',
      title: '🚨 RED ALERT: Northeast Monsoon Rescue Operations Active',
      message: 'Special rescue taskforces deployed in Chennai, Cuddalore, and Nagapattinam. High water level warning near Adyar basin.',
      read: false
    },
    {
      type: 'general',
      title: '⛺ 8 Relief Camps Operational',
      message: 'Over 2,100 beds available across active relief shelters with doctors on duty.',
      read: false
    },
    {
      type: 'low_stock',
      title: '⚠️ Low Stock Alert — Nagapattinam Relief Centre',
      message: 'Nagapattinam camp is running low on water bottles and baby food packets. Resupply in progress.',
      read: false
    },
    {
      type: 'broadcast',
      title: '📱 Offline SMS SOS System Online',
      message: 'Victims without cellular internet can send encoded SMS SOS to hotline 112 with exact GPS coordinates.',
      read: true
    }
  ];

  for (const n of notifications) {
    await supabase.from('notifications').insert(n);
  }

  console.log("✅ Database successfully populated with 50+ demo data items!");
}

seed().catch((err) => console.error("Seeding error:", err));
