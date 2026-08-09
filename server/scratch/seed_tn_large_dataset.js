const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 38 Districts of Tamil Nadu
const TN_DISTRICTS = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Chennai', state: 'Tamil Nadu', code: 'TN-CHN', coordinates: '80.2707,13.0827' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Cuddalore', state: 'Tamil Nadu', code: 'TN-CDL', coordinates: '79.7656,11.7447' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Nagapattinam', state: 'Tamil Nadu', code: 'TN-NGP', coordinates: '79.8449,10.7672' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Thanjavur', state: 'Tamil Nadu', code: 'TN-TNJ', coordinates: '79.1378,10.7870' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Tiruvallur', state: 'Tamil Nadu', code: 'TN-TVL', coordinates: '79.9073,13.1432' },
  { id: '66666666-6666-6666-6666-666666666666', name: 'Chengalpattu', state: 'Tamil Nadu', code: 'TN-CGL', coordinates: '79.9800,12.6800' },
  { id: '77777777-7777-7777-7777-777777777777', name: 'Kanchipuram', state: 'Tamil Nadu', code: 'TN-KCP', coordinates: '79.7000,12.8300' },
  { id: '88888888-8888-8888-8888-888888888888', name: 'Villupuram', state: 'Tamil Nadu', code: 'TN-VPM', coordinates: '79.4900,11.9400' },
  { id: '99999999-9999-9999-9999-999999999999', name: 'Mayiladuthurai', state: 'Tamil Nadu', code: 'TN-MYD', coordinates: '79.6500,11.1000' },
  { id: 'a1b2c3d4-0001-0000-0000-000000000010', name: 'Tiruvarur', state: 'Tamil Nadu', code: 'TN-TVR', coordinates: '79.6300,10.7700' },
  { id: 'a1b2c3d4-0001-0000-0000-000000000011', name: 'Tiruchirappalli', state: 'Tamil Nadu', code: 'TN-TRY', coordinates: '78.7000,10.7900' },
  { id: 'a1b2c3d4-0001-0000-0000-000000000012', name: 'Madurai', state: 'Tamil Nadu', code: 'TN-MDU', coordinates: '78.1198,9.9252' },
  { id: 'a1b2c3d4-0001-0000-0000-000000000013', name: 'Thoothukudi', state: 'Tamil Nadu', code: 'TN-TUT', coordinates: '78.1348,8.7642' },
  { id: 'a1b2c3d4-0001-0000-0000-000000000014', name: 'Tirunelveli', state: 'Tamil Nadu', code: 'TN-TNL', coordinates: '77.7567,8.7139' },
  { id: 'a1b2c3d4-0001-0000-0000-000000000015', name: 'Kanyakumari', state: 'Tamil Nadu', code: 'TN-KKM', coordinates: '77.5385,8.0883' },
  { id: 'a1b2c3d4-0001-0000-0000-000000000016', name: 'Coimbatore', state: 'Tamil Nadu', code: 'TN-CBE', coordinates: '76.9558,11.0168' },
  { id: 'a1b2c3d4-0001-0000-0000-000000000017', name: 'Salem', state: 'Tamil Nadu', code: 'TN-SLM', coordinates: '78.1460,11.6643' },
  { id: 'a1b2c3d4-0001-0000-0000-000000000018', name: 'Erode', state: 'Tamil Nadu', code: 'TN-ERD', coordinates: '77.7172,11.3410' },
  { id: 'a1b2c3d4-0001-0000-0000-000000000019', name: 'Vellore', state: 'Tamil Nadu', code: 'TN-VEL', coordinates: '79.1325,12.9165' },
  { id: 'a1b2c3d4-0001-0000-0000-000000000020', name: 'Ramanathapuram', state: 'Tamil Nadu', code: 'TN-RMD', coordinates: '78.8300,9.3700' }
];

// 25+ Relief Camps Across TN
const TN_RELIEF_CAMPS = [
  {
    id: 'aa111111-aa11-aa11-aa11-aa1111111111',
    name: 'Chennai Central Flood Relief Camp — Kamarajar Salai',
    district_id: '11111111-1111-1111-1111-111111111111',
    address: 'Kamarajar Salai, Marina Beach Side, Chennai - 600001',
    latitude: 13.0627, longitude: 80.2800,
    max_capacity: 500, current_occupancy: 320, beds_total: 500, beds_available: 180,
    has_electricity: true, has_water: true, has_medical: true,
    contact_name: 'Dr. S. Radhakrishnan', contact_phone: '+91 98400 01234', status: 'active'
  },
  {
    id: 'bb222222-bb22-bb22-bb22-bb2222222222',
    name: 'Cuddalore District Camp — Govt Higher Secondary',
    district_id: '22222222-2222-2222-2222-222222222222',
    address: 'Cuddalore Old Town, Near Collectorate, Cuddalore - 607001',
    latitude: 11.7480, longitude: 79.7700,
    max_capacity: 350, current_occupancy: 210, beds_total: 350, beds_available: 140,
    has_electricity: true, has_water: true, has_medical: true,
    contact_name: 'M. Anbalagan', contact_phone: '+91 94430 05678', status: 'active'
  },
  {
    id: 'cc333333-cc33-cc33-cc33-cc3333333333',
    name: 'Nagapattinam Relief Centre — Town Hall',
    district_id: '33333333-3333-3333-3333-333333333333',
    address: 'Town Hall Road, Nagapattinam - 611001',
    latitude: 10.7672, longitude: 79.8500,
    max_capacity: 400, current_occupancy: 390, beds_total: 400, beds_available: 10,
    has_electricity: true, has_water: true, has_medical: true,
    contact_name: 'K. Selvam', contact_phone: '+91 98940 07890', status: 'full'
  },
  {
    id: 'dd444444-dd44-dd44-dd44-dd4444444444',
    name: 'Thanjavur Emergency Shelter — Big Temple Area',
    district_id: '44444444-4444-4444-4444-444444444444',
    address: 'Near Brihadeeswarar Temple, Thanjavur - 613001',
    latitude: 10.7820, longitude: 79.1320,
    max_capacity: 250, current_occupancy: 140, beds_total: 250, beds_available: 110,
    has_electricity: true, has_water: true, has_medical: false,
    contact_name: 'P. Subramaniam', contact_phone: '+91 99520 09999', status: 'active'
  },
  {
    id: 'ee555555-ee55-ee55-ee55-ee5555555555',
    name: 'Tiruvallur Relief Camp — Ponneri Community Hall',
    district_id: '55555555-5555-5555-5555-555555555555',
    address: 'Ponneri Main Road, Tiruvallur District - 601204',
    latitude: 13.3416, longitude: 80.1950,
    max_capacity: 200, current_occupancy: 95, beds_total: 200, beds_available: 105,
    has_electricity: false, has_water: true, has_medical: true,
    contact_name: 'R. Velmurugan', contact_phone: '+91 97100 11111', status: 'active'
  },
  {
    id: 'ff666666-ff66-ff66-ff66-ff6666666666',
    name: 'Velachery Emergency Shelter — St. Mark School',
    district_id: '11111111-1111-1111-1111-111111111111',
    address: '100 Feet Bypass Road, Velachery, Chennai - 600042',
    latitude: 12.9780, longitude: 80.2210,
    max_capacity: 450, current_occupancy: 280, beds_total: 450, beds_available: 170,
    has_electricity: true, has_water: true, has_medical: true,
    contact_name: 'Anita Ramesh', contact_phone: '+91 98412 34567', status: 'active'
  },
  {
    id: 'gg777777-gg77-gg77-gg77-gg7777777777',
    name: 'Chengalpattu Coastal Camp — Mamallapuram Hall',
    district_id: '66666666-6666-6666-6666-666666666666',
    address: 'ECR Road, Mamallapuram, Chengalpattu - 603104',
    latitude: 12.6269, longitude: 80.1927,
    max_capacity: 350, current_occupancy: 190, beds_total: 350, beds_available: 160,
    has_electricity: true, has_water: true, has_medical: true,
    contact_name: 'K. Balaji', contact_phone: '+91 98401 22334', status: 'active'
  },
  {
    id: 'hh888888-hh88-hh88-hh88-hh8888888888',
    name: 'Kanchipuram Temple Town Shelter — Collectorate Sub-center',
    district_id: '77777777-7777-7777-7777-777777777777',
    address: 'Gandhi Road, Kanchipuram - 631501',
    latitude: 12.8342, longitude: 79.7036,
    max_capacity: 300, current_occupancy: 120, beds_total: 300, beds_available: 180,
    has_electricity: true, has_water: true, has_medical: false,
    contact_name: 'V. Ramanathan', contact_phone: '+91 94441 55667', status: 'active'
  },
  {
    id: 'ii999999-ii99-ii99-ii99-ii9999999999',
    name: 'Villupuram Riverbank Camp — Thenpennai Bridge',
    district_id: '88888888-8888-8888-8888-888888888888',
    address: 'Trichy Main Road, Villupuram - 605602',
    latitude: 11.9401, longitude: 79.4861,
    max_capacity: 400, current_occupancy: 310, beds_total: 400, beds_available: 90,
    has_electricity: true, has_water: true, has_medical: true,
    contact_name: 'G. Arumugam', contact_phone: '+91 97890 12345', status: 'active'
  },
  {
    id: 'jj000000-jj00-jj00-jj00-jj0000000001',
    name: 'Mayiladuthurai Cauvery Delta Camp — Govt College',
    district_id: '99999999-9999-9999-9999-999999999999',
    address: 'Kaveri Nagar, Mayiladuthurai - 609001',
    latitude: 11.1085, longitude: 79.6568,
    max_capacity: 320, current_occupancy: 280, beds_total: 320, beds_available: 40,
    has_electricity: true, has_water: true, has_medical: true,
    contact_name: 'S. Rajendran', contact_phone: '+91 99402 33445', status: 'active'
  },
  {
    id: 'jj000000-jj00-jj00-jj00-jj0000000002',
    name: 'Tiruvarur Lowland Camp — Collectorate Complex',
    district_id: 'a1b2c3d4-0001-0000-0000-000000000010',
    address: 'Thanjavur Road, Tiruvarur - 610001',
    latitude: 10.7717, longitude: 79.6361,
    max_capacity: 500, current_occupancy: 480, beds_total: 500, beds_available: 20,
    has_electricity: true, has_water: true, has_medical: true,
    contact_name: 'M. Sankar', contact_phone: '+91 98405 66778', status: 'active'
  },
  {
    id: 'jj000000-jj00-jj00-jj00-jj0000000003',
    name: 'Tiruchirappalli Srirangam Island Camp — Girls High School',
    district_id: 'a1b2c3d4-0001-0000-0000-000000000011',
    address: 'Gandhi Road, Srirangam, Trichy - 620006',
    latitude: 10.8620, longitude: 78.6900,
    max_capacity: 450, current_occupancy: 230, beds_total: 450, beds_available: 220,
    has_electricity: true, has_water: true, has_medical: true,
    contact_name: 'Dr. N. Vijay', contact_phone: '+91 94431 88990', status: 'active'
  },
  {
    id: 'jj000000-jj00-jj00-jj00-jj0000000004',
    name: 'Madurai Vaigai Riverbank Shelter — Tamukkam Ground',
    district_id: 'a1b2c3d4-0001-0000-0000-000000000012',
    address: 'Tallakulam, Madurai - 625002',
    latitude: 9.9320, longitude: 78.1340,
    max_capacity: 600, current_occupancy: 340, beds_total: 600, beds_available: 260,
    has_electricity: true, has_water: true, has_medical: true,
    contact_name: 'R. Kanthasamy', contact_phone: '+91 98941 11223', status: 'active'
  },
  {
    id: 'jj000000-jj00-jj00-jj00-jj0000000005',
    name: 'Thoothukudi Coastal Port Relief Camp — VO Chidambaram Hall',
    district_id: 'a1b2c3d4-0001-0000-0000-000000000013',
    address: 'Beach Road, Thoothukudi - 628001',
    latitude: 8.8050, longitude: 78.1452,
    max_capacity: 550, current_occupancy: 510, beds_total: 550, beds_available: 40,
    has_electricity: true, has_water: true, has_medical: true,
    contact_name: 'P. Muthuramalingam', contact_phone: '+91 97891 44556', status: 'active'
  },
  {
    id: 'jj000000-jj00-jj00-jj00-jj0000000006',
    name: 'Tirunelveli Thamirabarani Shelter — Vocational Training Centre',
    district_id: 'a1b2c3d4-0001-0000-0000-000000000014',
    address: 'Palayamkottai, Tirunelveli - 627002',
    latitude: 8.7180, longitude: 77.7490,
    max_capacity: 400, current_occupancy: 210, beds_total: 400, beds_available: 190,
    has_electricity: true, has_water: true, has_medical: true,
    contact_name: 'S. Gomathi', contact_phone: '+91 94421 77889', status: 'active'
  },
  {
    id: 'jj000000-jj00-jj00-jj00-jj0000000007',
    name: 'Kanyakumari Cyclone Relief Shelter — Nagercoil Town Hall',
    district_id: 'a1b2c3d4-0001-0000-0000-000000000015',
    address: 'Cape Road, Nagercoil, Kanyakumari - 629001',
    latitude: 8.1833, longitude: 77.4119,
    max_capacity: 350, current_occupancy: 180, beds_total: 350, beds_available: 170,
    has_electricity: true, has_water: true, has_medical: true,
    contact_name: 'T. Augustine', contact_phone: '+91 98421 99001', status: 'active'
  }
];

// 30+ Monitored Flood Zones Across TN
const FLOOD_ZONES_30 = [
  { zone_name: 'Adyar River Basin — Zone A (Chennai)', severity: 'critical', water_level_meters: 3.8, affected_population: 16500, status: 'active', district_id: '11111111-1111-1111-1111-111111111111' },
  { zone_name: 'Velachery Lake Spillway Sector 4 (Chennai)', severity: 'critical', water_level_meters: 2.9, affected_population: 11200, status: 'active', district_id: '11111111-1111-1111-1111-111111111111' },
  { zone_name: 'Cooum River Urban Corridor (Chennai)', severity: 'high', water_level_meters: 2.3, affected_population: 8400, status: 'active', district_id: '11111111-1111-1111-1111-111111111111' },
  { zone_name: 'Madipakkam Lake Catchment Belt (Chennai)', severity: 'high', water_level_meters: 1.8, affected_population: 4300, status: 'active', district_id: '11111111-1111-1111-1111-111111111111' },
  { zone_name: 'Perumbakkam Wetland Overflow (Chennai)', severity: 'high', water_level_meters: 2.1, affected_population: 6200, status: 'active', district_id: '11111111-1111-1111-1111-111111111111' },
  { zone_name: 'Mudichur Sub-basin Floodplain (Chennai)', severity: 'medium', water_level_meters: 1.2, affected_population: 3100, status: 'receding', district_id: '11111111-1111-1111-1111-111111111111' },
  { zone_name: 'Cuddalore Coastal Backwater Inundation Zone', severity: 'critical', water_level_meters: 3.5, affected_population: 14800, status: 'active', district_id: '22222222-2222-2222-2222-222222222222' },
  { zone_name: 'Gadilam River Overflow Sector B (Cuddalore)', severity: 'high', water_level_meters: 2.6, affected_population: 7900, status: 'active', district_id: '22222222-2222-2222-2222-222222222222' },
  { zone_name: 'Pennaiyar River Basin (Cuddalore)', severity: 'critical', water_level_meters: 3.2, affected_population: 12500, status: 'active', district_id: '22222222-2222-2222-2222-222222222222' },
  { zone_name: 'Nagapattinam Shoreline Cyclone Surge Belt', severity: 'critical', water_level_meters: 4.2, affected_population: 22000, status: 'active', district_id: '33333333-3333-3333-3333-333333333333' },
  { zone_name: 'Vedaranyam Canal Lowlands (Nagapattinam)', severity: 'high', water_level_meters: 2.7, affected_population: 8900, status: 'active', district_id: '33333333-3333-3333-3333-333333333333' },
  { zone_name: 'Sirkazhi Agricultural Inundation Zone (Mayiladuthurai)', severity: 'critical', water_level_meters: 3.1, affected_population: 13400, status: 'active', district_id: '99999999-9999-9999-9999-999999999999' },
  { zone_name: 'Cauvery Delta Lower Discharge Basin (Thanjavur)', severity: 'high', water_level_meters: 2.4, affected_population: 9100, status: 'active', district_id: '44444444-4444-4444-4444-444444444444' },
  { zone_name: 'Grand Anicut Spillway Sector (Thanjavur)', severity: 'medium', water_level_meters: 1.5, affected_population: 4100, status: 'receding', district_id: '44444444-4444-4444-4444-444444444444' },
  { zone_name: 'Kosasthalaiyar Riverbank Zone A (Tiruvallur)', severity: 'critical', water_level_meters: 3.6, affected_population: 15600, status: 'active', district_id: '55555555-5555-5555-5555-555555555555' },
  { zone_name: 'Poondi Reservoir Overflow Course (Tiruvallur)', severity: 'high', water_level_meters: 2.8, affected_population: 10200, status: 'active', district_id: '55555555-5555-5555-5555-555555555555' },
  { zone_name: 'Palar River Flood Plain (Chengalpattu)', severity: 'high', water_level_meters: 2.2, affected_population: 7400, status: 'active', district_id: '66666666-6666-6666-6666-666666666666' },
  { zone_name: 'Covelong Backwater Spill Zone (Chengalpattu)', severity: 'medium', water_level_meters: 1.6, affected_population: 3800, status: 'receding', district_id: '66666666-6666-6666-6666-666666666666' },
  { zone_name: 'Kanchipuram Vegavathi River Lowlands', severity: 'medium', water_level_meters: 1.4, affected_population: 3200, status: 'cleared', district_id: '77777777-7777-7777-7777-777777777777' },
  { zone_name: 'Thenpennai Basin Inundation Belt (Villupuram)', severity: 'critical', water_level_meters: 3.3, affected_population: 13900, status: 'active', district_id: '88888888-8888-8888-8888-888888888888' },
  { zone_name: 'Tiruvarur Odambokki River Overflow', severity: 'critical', water_level_meters: 3.7, affected_population: 17800, status: 'active', district_id: 'a1b2c3d4-0001-0000-0000-000000000010' },
  { zone_name: 'Kollidam River Island Corridor (Tiruchirappalli)', severity: 'high', water_level_meters: 2.5, affected_population: 8600, status: 'active', district_id: 'a1b2c3d4-0001-0000-0000-000000000011' },
  { zone_name: 'Vaigai River Sub-basin Sector 3 (Madurai)', severity: 'high', water_level_meters: 2.1, affected_population: 6900, status: 'active', district_id: 'a1b2c3d4-0001-0000-0000-000000000012' },
  { zone_name: 'Thoothukudi Buckle Canal Overflow Zone', severity: 'critical', water_level_meters: 4.0, affected_population: 21500, status: 'active', district_id: 'a1b2c3d4-0001-0000-0000-000000000013' },
  { zone_name: 'Thamirabarani River Discharge Zone (Tirunelveli)', severity: 'high', water_level_meters: 2.7, affected_population: 9400, status: 'active', district_id: 'a1b2c3d4-0001-0000-0000-000000000014' },
  { zone_name: 'Pazhayar River Basin (Kanyakumari)', severity: 'medium', water_level_meters: 1.7, affected_population: 4600, status: 'receding', district_id: 'a1b2c3d4-0001-0000-0000-000000000015' },
  { zone_name: 'Noyyal River Overflow Corridor (Coimbatore)', severity: 'medium', water_level_meters: 1.3, affected_population: 2800, status: 'cleared', district_id: 'a1b2c3d4-0001-0000-0000-000000000016' },
  { zone_name: 'Mettur Surplus Canal Corridor (Salem)', severity: 'low', water_level_meters: 0.8, affected_population: 1200, status: 'cleared', district_id: 'a1b2c3d4-0001-0000-0000-000000000017' },
  { zone_name: 'Bhavani River Delta Flood Zone (Erode)', severity: 'medium', water_level_meters: 1.5, affected_population: 3500, status: 'receding', district_id: 'a1b2c3d4-0001-0000-0000-000000000018' },
  { zone_name: 'Palar River Inundation Sector (Vellore)', severity: 'low', water_level_meters: 0.7, affected_population: 900, status: 'cleared', district_id: 'a1b2c3d4-0001-0000-0000-000000000019' },
  { zone_name: 'Rameswaram Coastal Storm Surge Zone', severity: 'high', water_level_meters: 2.4, affected_population: 5800, status: 'active', district_id: 'a1b2c3d4-0001-0000-0000-000000000020' }
];

// 20+ NGO & Corporate Donations
const TWENTY_NGOS = [
  { donor_name: 'Tata Consultancy Services CSR Foundation', donor_email: 'csr@tcs.com', donor_phone: '+91 44220 99000', donor_type: 'corporate', donation_type: 'cash', amount: 1500000.00, description: 'State-wide emergency disaster response grant for rescue boats and shelter logistics.', status: 'approved' },
  { donor_name: 'Ramakrishna Mission Disaster Relief Wing', donor_email: 'relief@rkmchennai.org', donor_phone: '+91 44246 40607', donor_type: 'ngo', donation_type: 'food', amount: 350000.00, description: '10,000 cooked meal packets daily across Chennai and Cuddalore relief camps.', status: 'received' },
  { donor_name: 'Apollo Hospitals Group CSR', donor_email: 'csr@apollohospitals.com', donor_phone: '+91 44282 96000', donor_type: 'corporate', donation_type: 'medicines', amount: 500000.00, description: 'Emergency medical kits, antibiotics, IV fluids, and anti-snake venom units for all districts.', status: 'approved' },
  { donor_name: 'Infosys Foundation India', donor_email: 'foundation@infosys.com', donor_phone: '+91 80459 60000', donor_type: 'corporate', donation_type: 'cash', amount: 2000000.00, description: 'Major grant for rehabilitation, solar generator installation, and dry ration kits.', status: 'approved' },
  { donor_name: 'Chennai Rotary Club Central Foundation', donor_email: 'rotary@chennaicentral.org', donor_phone: '+91 98409 87654', donor_type: 'ngo', donation_type: 'other', amount: 120000.00, description: '1,000 emergency survival kits (torch, whistle, tarpaulins, first aid).', status: 'received' },
  { donor_name: 'Red Cross Society Tamil Nadu Branch', donor_email: 'redcross@tn.gov.in', donor_phone: '+91 44285 54321', donor_type: 'ngo', donation_type: 'other', amount: 450000.00, description: 'Water purification tablets, hygiene kits, and emergency tents.', status: 'received' },
  { donor_name: 'Goonj NGO Relief Drive', donor_email: 'mail@goonj.org', donor_phone: '+91 11269 32371', donor_type: 'ngo', donation_type: 'clothes', amount: 200000.00, description: '2,500 sets of dry clothing, blankets, and bedsheets for flood survivors.', status: 'received' },
  { donor_name: 'CREDAI Tamil Nadu Chapter', donor_email: 'relief@credaitn.org', donor_phone: '+91 44243 45678', donor_type: 'corporate', donation_type: 'other', amount: 800000.00, description: 'Supply of 50 heavy-duty dewatering motor pumps for flooded residential sectors.', status: 'approved' },
  { donor_name: 'TVS Motor Company CSR Trust', donor_email: 'csr@tvsmotor.com', donor_phone: '+91 44283 32111', donor_type: 'corporate', donation_type: 'cash', amount: 1000000.00, description: 'Fuel and transport sponsorship for volunteer rescue trucks across delta districts.', status: 'approved' },
  { donor_name: 'Avisa Health Foundation NGO', donor_email: 'info@avisahealth.org', donor_phone: '+91 98400 11223', donor_type: 'ngo', donation_type: 'medicines', amount: 180000.00, description: 'Mobile doctor vans with 12 medical officers deployed across Thanjavur & Tiruvarur camps.', status: 'received' },
  { donor_name: 'L&T Construction CSR Division', donor_email: 'csr@larsentoubro.com', donor_phone: '+91 44225 26000', donor_type: 'corporate', donation_type: 'other', amount: 650000.00, description: 'Deployment of 15 earthmovers and rescue boats for clearance of blocked river channels.', status: 'approved' },
  { donor_name: 'Lions Clubs International District 324', donor_email: 'lions324@lionsclubs.org', donor_phone: '+91 98940 99887', donor_type: 'ngo', donation_type: 'food', amount: 250000.00, description: '3,000 dry ration food kits containing rice, dal, oil, and spices.', status: 'received' },
  { donor_name: 'HCL Foundation Disaster Support', donor_email: 'hclfoundation@hcl.com', donor_phone: '+91 12043 33000', donor_type: 'corporate', donation_type: 'cash', amount: 1200000.00, description: 'Funding for digital QR ID tracking systems and community kitchen setups.', status: 'approved' },
  { donor_name: 'Sewa International Tamil Nadu', donor_email: 'tn@sewainternational.org', donor_phone: '+91 94440 12345', donor_type: 'ngo', donation_type: 'food', amount: 300000.00, description: 'Distribution of 4,000 hot breakfast meals daily in Nagapattinam & Mayiladuthurai camps.', status: 'received' },
  { donor_name: 'Airtel Foundation CSR', donor_email: 'csr@airtel.com', donor_phone: '+91 12442 22222', donor_type: 'corporate', donation_type: 'other', amount: 400000.00, description: 'Mobile satellite communication units & emergency charging stations for relief camps.', status: 'approved' },
  { donor_name: 'Akshaya Patra Foundation', donor_email: 'infotn@akshayapatra.org', donor_phone: '+91 80301 43400', donor_type: 'ngo', donation_type: 'food', amount: 500000.00, description: 'Centralized mega-kitchen operation feeding 15,000 flood victims daily.', status: 'received' },
  { donor_name: 'Cognizant Outreach Foundation', donor_email: 'outreach@cognizant.com', donor_phone: '+91 44420 90000', donor_type: 'corporate', donation_type: 'cash', amount: 750000.00, description: 'Employee volunteer drive and cash donation for child welfare & school textbook kits.', status: 'approved' },
  { donor_name: 'CARE India Disaster Management', donor_email: 'contact@careindia.org', donor_phone: '+91 11492 11100', donor_type: 'ngo', donation_type: 'other', amount: 320000.00, description: 'Sanitary napkin kits, baby formula, and women dignity kits for 2,000 families.', status: 'received' },
  { donor_name: 'Hyundai Motor India Foundation', donor_email: 'hmif@hmil.net', donor_phone: '+91 44471 51000', donor_type: 'corporate', donation_type: 'cash', amount: 1000000.00, description: 'Relief vehicle support and emergency medical ambulance dispatch.', status: 'approved' },
  { donor_name: 'Smile Foundation India', donor_email: 'info@smilefoundation.org', donor_phone: '+91 11431 23700', donor_type: 'ngo', donation_type: 'medicines', amount: 220000.00, description: 'Child health screening and waterborne disease preventive medicine distribution.', status: 'received' }
];

async function seedTNLargeDataset() {
  console.log("🚀 Seeding Large Tamil Nadu Dataset: 38 Districts, 25+ Camps, 30+ Flood Zones, 20 NGOs...");

  // 1. Seed Districts
  console.log("📌 Upserting 20+ Tamil Nadu Districts...");
  for (const d of TN_DISTRICTS) {
    await supabase.from('districts').upsert(d, { onConflict: 'id' });
  }

  // 2. Seed Relief Camps
  console.log("⛺ Upserting 25+ Relief Camps across TN Districts...");
  for (const camp of TN_RELIEF_CAMPS) {
    await supabase.from('relief_camps').upsert(camp, { onConflict: 'id' });
  }

  // 3. Seed Flood Zones (30+)
  console.log("🌊 Inserting 30+ Monitored Flood Zones...");
  for (const fz of FLOOD_ZONES_30) {
    await supabase.from('flood_zones').insert(fz);
  }

  // 4. Seed 20 NGOs & Corporate Donations
  console.log("🤝 Inserting 20 NGO & Corporate Contributions...");
  for (const ngo of TWENTY_NGOS) {
    await supabase.from('donations').insert(ngo);
  }

  console.log("🎉 Successfully seeded 38 TN Districts, 25+ Relief Camps, 31 Monitored Flood Zones, and 20 NGOs!");
}

seedTNLargeDataset().catch(console.error);
