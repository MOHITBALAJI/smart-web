-- ============================================================
-- Smart Flood Emergency Response and Relief Management System
-- Seed Data for Development & Testing
-- File: seed.sql
-- ============================================================
-- Run this AFTER schema.sql, policies.sql, triggers.sql
-- NOTE: All UUIDs use only valid hex characters (0-9, a-f).
-- ============================================================

-- ============================================================
-- ROLES
-- ============================================================
INSERT INTO public.roles (name, description) VALUES
    ('super_admin',    'Full system access — can manage all districts, camps, users'),
    ('district_admin', 'Manages all camps and resources within their assigned district'),
    ('camp_officer',   'Manages a single relief camp: inventory, beneficiaries, distributions'),
    ('volunteer',      'Field responder who handles SOS rescue assignments'),
    ('beneficiary',    'Flood-affected individual who receives relief services')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- DISTRICTS — 5 Tamil Nadu flood-prone districts
-- ============================================================
INSERT INTO public.districts (id, name, state, code, coordinates) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Chennai',       'Tamil Nadu', 'TN-CHN', '80.2707,13.0827'),
    ('22222222-2222-2222-2222-222222222222', 'Cuddalore',     'Tamil Nadu', 'TN-CDL', '79.7656,11.7447'),
    ('33333333-3333-3333-3333-333333333333', 'Nagapattinam',  'Tamil Nadu', 'TN-NGP', '79.8449,10.7672'),
    ('44444444-4444-4444-4444-444444444444', 'Thanjavur',     'Tamil Nadu', 'TN-TNJ', '79.1378,10.7870'),
    ('55555555-5555-5555-5555-555555555555', 'Tiruvallur',    'Tamil Nadu', 'TN-TVL', '79.9073,13.1432')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RELIEF CAMPS — 5 camps (one per district)
-- Camp IDs: aa11..., bb22..., cc33..., dd44..., ee55... (all valid hex)
-- ============================================================
INSERT INTO public.relief_camps (
    id, name, district_id, address,
    latitude, longitude,
    max_capacity, current_occupancy,
    beds_total, beds_available,
    has_electricity, has_water, has_medical,
    contact_name, contact_phone,
    status, established_date
) VALUES
(
    'aa111111-aa11-aa11-aa11-aa1111111111',
    'Chennai Flood Relief Camp — Kamarajar Salai',
    '11111111-1111-1111-1111-111111111111',
    'Kamarajar Salai, Marina Beach Side, Chennai - 600001',
    13.0627, 80.2800, 500, 320, 500, 180,
    TRUE, TRUE, TRUE,
    'S. Radhakrishnan', '+91-9840001234',
    'active', '2024-12-01'
),
(
    'bb222222-bb22-bb22-bb22-bb2222222222',
    'Cuddalore District Camp — Government Higher Secondary',
    '22222222-2222-2222-2222-222222222222',
    'Cuddalore Old Town, Near Collectorate, Cuddalore - 607001',
    11.7480, 79.7700, 300, 210, 300, 90,
    TRUE, TRUE, TRUE,
    'M. Anbalagan', '+91-9443005678',
    'active', '2024-11-28'
),
(
    'cc333333-cc33-cc33-cc33-cc3333333333',
    'Nagapattinam Relief Centre — Town Hall',
    '33333333-3333-3333-3333-333333333333',
    'Town Hall Road, Nagapattinam - 611001',
    10.7672, 79.8500, 400, 390, 400, 10,
    TRUE, TRUE, TRUE,
    'K. Selvam', '+91-9894007890',
    'full', '2024-11-25'
),
(
    'dd444444-dd44-dd44-dd44-dd4444444444',
    'Thanjavur Emergency Camp — Big Temple Area',
    '44444444-4444-4444-4444-444444444444',
    'Near Brihadeeswarar Temple, Thanjavur - 613001',
    10.7820, 79.1320, 250, 140, 250, 110,
    TRUE, TRUE, FALSE,
    'P. Subramaniam', '+91-9952009999',
    'active', '2024-12-03'
),
(
    'ee555555-ee55-ee55-ee55-ee5555555555',
    'Tiruvallur Camp — Ponneri Community Hall',
    '55555555-5555-5555-5555-555555555555',
    'Ponneri Main Road, Tiruvallur District - 601204',
    13.3416, 80.1950, 200, 95, 200, 105,
    FALSE, TRUE, TRUE,
    'R. Velmurugan', '+91-9710011111',
    'active', '2024-12-05'
);

-- ============================================================
-- RESOURCES — 8 master resource types
-- ============================================================
INSERT INTO public.resources (id, name, category, unit, description) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Cooked Rice',         'food',     'kg',     'Freshly cooked rice for meal distribution'),
    ('00000000-0000-0000-0000-000000000002', 'Food Packets',        'food',     'packet', 'Pre-packed meal with rice, sambar and vegetables'),
    ('00000000-0000-0000-0000-000000000003', 'Drinking Water',      'water',    'litre',  '1-litre sealed water bottles'),
    ('00000000-0000-0000-0000-000000000004', 'Medicines (General)', 'medicine', 'box',    'General OTC medicines: paracetamol, antacids, antihistamines'),
    ('00000000-0000-0000-0000-000000000005', 'Blankets',            'clothing', 'piece',  'Woolen blankets for cold nights'),
    ('00000000-0000-0000-0000-000000000006', 'Baby Food',           'food',     'packet', 'Cerelac and baby formula sachets'),
    ('00000000-0000-0000-0000-000000000007', 'Sanitary Kits',       'hygiene',  'kit',    'Sanitary napkins, soap, toothbrush kit'),
    ('00000000-0000-0000-0000-000000000008', 'ORS Packets',         'medicine', 'packet', 'Oral Rehydration Salt sachets for dehydration')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- INVENTORY — 10 items per camp (50 rows total)
-- ============================================================

-- CAMP 1: Chennai
INSERT INTO public.inventory (camp_id, item_name, category, unit, total_received, total_distributed, current_stock, min_threshold) VALUES
    ('aa111111-aa11-aa11-aa11-aa1111111111', 'Rice',            'food',     'kg',     2000, 800,  1200, 200),
    ('aa111111-aa11-aa11-aa11-aa1111111111', 'Food Packets',    'food',     'packet', 3000, 1200, 1800, 300),
    ('aa111111-aa11-aa11-aa11-aa1111111111', 'Water Bottles',   'water',    'litre',  5000, 2000, 3000, 500),
    ('aa111111-aa11-aa11-aa11-aa1111111111', 'Medicines',       'medicine', 'box',    500,  200,  300,  50),
    ('aa111111-aa11-aa11-aa11-aa1111111111', 'Blankets',        'clothing', 'piece',  800,  320,  480,  100),
    ('aa111111-aa11-aa11-aa11-aa1111111111', 'Baby Food',       'food',     'packet', 400,  150,  250,  50),
    ('aa111111-aa11-aa11-aa11-aa1111111111', 'Sanitary Kits',   'hygiene',  'kit',    600,  240,  360,  60),
    ('aa111111-aa11-aa11-aa11-aa1111111111', 'Emergency Kits',  'other',    'kit',    200,  80,   120,  30),
    ('aa111111-aa11-aa11-aa11-aa1111111111', 'ORS Packets',     'medicine', 'packet', 1000, 400,  600,  100),
    ('aa111111-aa11-aa11-aa11-aa1111111111', 'First Aid Kits',  'medicine', 'kit',    150,  60,   90,   20);

-- CAMP 2: Cuddalore
INSERT INTO public.inventory (camp_id, item_name, category, unit, total_received, total_distributed, current_stock, min_threshold) VALUES
    ('bb222222-bb22-bb22-bb22-bb2222222222', 'Rice',            'food',     'kg',     1500, 630,  870,  150),
    ('bb222222-bb22-bb22-bb22-bb2222222222', 'Food Packets',    'food',     'packet', 2000, 840,  1160, 200),
    ('bb222222-bb22-bb22-bb22-bb2222222222', 'Water Bottles',   'water',    'litre',  3500, 1470, 2030, 350),
    ('bb222222-bb22-bb22-bb22-bb2222222222', 'Medicines',       'medicine', 'box',    350,  147,  203,  35),
    ('bb222222-bb22-bb22-bb22-bb2222222222', 'Blankets',        'clothing', 'piece',  600,  252,  348,  60),
    ('bb222222-bb22-bb22-bb22-bb2222222222', 'Baby Food',       'food',     'packet', 280,  117,  163,  30),
    ('bb222222-bb22-bb22-bb22-bb2222222222', 'Sanitary Kits',   'hygiene',  'kit',    420,  176,  244,  40),
    ('bb222222-bb22-bb22-bb22-bb2222222222', 'Emergency Kits',  'other',    'kit',    140,  58,   82,   20),
    ('bb222222-bb22-bb22-bb22-bb2222222222', 'ORS Packets',     'medicine', 'packet', 700,  294,  406,  70),
    ('bb222222-bb22-bb22-bb22-bb2222222222', 'First Aid Kits',  'medicine', 'kit',    100,  42,   58,   15);

-- CAMP 3: Nagapattinam (near-critical stock due to high occupancy)
INSERT INTO public.inventory (camp_id, item_name, category, unit, total_received, total_distributed, current_stock, min_threshold) VALUES
    ('cc333333-cc33-cc33-cc33-cc3333333333', 'Rice',            'food',     'kg',     2500, 2350, 150,  200),
    ('cc333333-cc33-cc33-cc33-cc3333333333', 'Food Packets',    'food',     'packet', 3500, 3290, 210,  300),
    ('cc333333-cc33-cc33-cc33-cc3333333333', 'Water Bottles',   'water',    'litre',  6000, 5640, 360,  500),
    ('cc333333-cc33-cc33-cc33-cc3333333333', 'Medicines',       'medicine', 'box',    600,  564,  36,   50),
    ('cc333333-cc33-cc33-cc33-cc3333333333', 'Blankets',        'clothing', 'piece',  1000, 940,  60,   100),
    ('cc333333-cc33-cc33-cc33-cc3333333333', 'Baby Food',       'food',     'packet', 500,  470,  30,   50),
    ('cc333333-cc33-cc33-cc33-cc3333333333', 'Sanitary Kits',   'hygiene',  'kit',    700,  658,  42,   60),
    ('cc333333-cc33-cc33-cc33-cc3333333333', 'Emergency Kits',  'other',    'kit',    250,  235,  15,   30),
    ('cc333333-cc33-cc33-cc33-cc3333333333', 'ORS Packets',     'medicine', 'packet', 1200, 1128, 72,   100),
    ('cc333333-cc33-cc33-cc33-cc3333333333', 'First Aid Kits',  'medicine', 'kit',    180,  169,  11,   20);

-- CAMP 4: Thanjavur
INSERT INTO public.inventory (camp_id, item_name, category, unit, total_received, total_distributed, current_stock, min_threshold) VALUES
    ('dd444444-dd44-dd44-dd44-dd4444444444', 'Rice',            'food',     'kg',     1200, 420,  780,  120),
    ('dd444444-dd44-dd44-dd44-dd4444444444', 'Food Packets',    'food',     'packet', 1600, 560,  1040, 160),
    ('dd444444-dd44-dd44-dd44-dd4444444444', 'Water Bottles',   'water',    'litre',  2800, 980,  1820, 280),
    ('dd444444-dd44-dd44-dd44-dd4444444444', 'Medicines',       'medicine', 'box',    280,  98,   182,  30),
    ('dd444444-dd44-dd44-dd44-dd4444444444', 'Blankets',        'clothing', 'piece',  500,  175,  325,  50),
    ('dd444444-dd44-dd44-dd44-dd4444444444', 'Baby Food',       'food',     'packet', 220,  77,   143,  25),
    ('dd444444-dd44-dd44-dd44-dd4444444444', 'Sanitary Kits',   'hygiene',  'kit',    320,  112,  208,  35),
    ('dd444444-dd44-dd44-dd44-dd4444444444', 'Emergency Kits',  'other',    'kit',    110,  38,   72,   15),
    ('dd444444-dd44-dd44-dd44-dd4444444444', 'ORS Packets',     'medicine', 'packet', 550,  192,  358,  55),
    ('dd444444-dd44-dd44-dd44-dd4444444444', 'First Aid Kits',  'medicine', 'kit',    80,   28,   52,   12);

-- CAMP 5: Tiruvallur
INSERT INTO public.inventory (camp_id, item_name, category, unit, total_received, total_distributed, current_stock, min_threshold) VALUES
    ('ee555555-ee55-ee55-ee55-ee5555555555', 'Rice',            'food',     'kg',     800,  285,  515,  80),
    ('ee555555-ee55-ee55-ee55-ee5555555555', 'Food Packets',    'food',     'packet', 1100, 392,  708,  110),
    ('ee555555-ee55-ee55-ee55-ee5555555555', 'Water Bottles',   'water',    'litre',  2000, 713,  1287, 200),
    ('ee555555-ee55-ee55-ee55-ee5555555555', 'Medicines',       'medicine', 'box',    200,  71,   129,  20),
    ('ee555555-ee55-ee55-ee55-ee5555555555', 'Blankets',        'clothing', 'piece',  350,  125,  225,  35),
    ('ee555555-ee55-ee55-ee55-ee5555555555', 'Baby Food',       'food',     'packet', 160,  57,   103,  16),
    ('ee555555-ee55-ee55-ee55-ee5555555555', 'Sanitary Kits',   'hygiene',  'kit',    230,  82,   148,  23),
    ('ee555555-ee55-ee55-ee55-ee5555555555', 'Emergency Kits',  'other',    'kit',    80,   28,   52,   10),
    ('ee555555-ee55-ee55-ee55-ee5555555555', 'ORS Packets',     'medicine', 'packet', 400,  142,  258,  40),
    ('ee555555-ee55-ee55-ee55-ee5555555555', 'First Aid Kits',  'medicine', 'kit',    60,   21,   39,   10);

-- ============================================================
-- FLOOD ZONES — 5 zones with varying severity
-- ============================================================
INSERT INTO public.flood_zones (id, district_id, name, severity, coordinates, description) VALUES
(
    'f0000001-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'Adyar River Basin — Zone A',
    'critical',
    '[
        {"lat": 13.0050, "lng": 80.2250},
        {"lat": 13.0100, "lng": 80.2400},
        {"lat": 12.9950, "lng": 80.2500},
        {"lat": 12.9880, "lng": 80.2300},
        {"lat": 13.0050, "lng": 80.2250}
    ]'::jsonb,
    'Adyar River flood plain — high inundation risk during northeast monsoon.'
),
(
    'f0000001-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'Cuddalore Coastal Belt',
    'high',
    '[
        {"lat": 11.7350, "lng": 79.7550},
        {"lat": 11.7500, "lng": 79.7700},
        {"lat": 11.7600, "lng": 79.7650},
        {"lat": 11.7450, "lng": 79.7450},
        {"lat": 11.7350, "lng": 79.7550}
    ]'::jsonb,
    'Coastal strip of Cuddalore prone to storm surge and sea inundation.'
),
(
    'f0000001-0000-0000-0000-000000000003',
    '33333333-3333-3333-3333-333333333333',
    'Nagapattinam Tsunami-Prone Shore',
    'critical',
    '[
        {"lat": 10.7550, "lng": 79.8350},
        {"lat": 10.7700, "lng": 79.8500},
        {"lat": 10.7800, "lng": 79.8450},
        {"lat": 10.7650, "lng": 79.8300},
        {"lat": 10.7550, "lng": 79.8350}
    ]'::jsonb,
    'Low-lying coastal zone with historic vulnerability to tsunami and cyclone surges.'
),
(
    'f0000001-0000-0000-0000-000000000004',
    '44444444-4444-4444-4444-444444444444',
    'Cauvery Delta Lowlands — Thanjavur',
    'medium',
    '[
        {"lat": 10.7700, "lng": 79.1200},
        {"lat": 10.7900, "lng": 79.1450},
        {"lat": 10.8000, "lng": 79.1350},
        {"lat": 10.7800, "lng": 79.1100},
        {"lat": 10.7700, "lng": 79.1200}
    ]'::jsonb,
    'Cauvery delta agricultural lowlands affected by heavy monsoon dam releases.'
),
(
    'f0000001-0000-0000-0000-000000000005',
    '55555555-5555-5555-5555-555555555555',
    'Kosasthalaiyar River — Tiruvallur',
    'high',
    '[
        {"lat": 13.3300, "lng": 80.1800},
        {"lat": 13.3500, "lng": 80.2000},
        {"lat": 13.3600, "lng": 80.1950},
        {"lat": 13.3400, "lng": 80.1750},
        {"lat": 13.3300, "lng": 80.1800}
    ]'::jsonb,
    'Kosasthalaiyar river banks experience annual flooding during northeast monsoon.'
);

-- ============================================================
-- CAMP CAPACITY — daily snapshot for today
-- ============================================================
INSERT INTO public.camp_capacity (camp_id, date, beds_available, food_packets, water_liters, medical_kits, blankets) VALUES
    ('aa111111-aa11-aa11-aa11-aa1111111111', CURRENT_DATE, 180, 1800, 3000, 300, 480),
    ('bb222222-bb22-bb22-bb22-bb2222222222', CURRENT_DATE, 90,  1160, 2030, 203, 348),
    ('cc333333-cc33-cc33-cc33-cc3333333333', CURRENT_DATE, 10,  210,  360,  36,  60),
    ('dd444444-dd44-dd44-dd44-dd4444444444', CURRENT_DATE, 110, 1040, 1820, 182, 325),
    ('ee555555-ee55-ee55-ee55-ee5555555555', CURRENT_DATE, 105, 708,  1287, 129, 225);

-- ============================================================
-- NOTIFICATIONS — sample system notifications (broadcast)
-- ============================================================
INSERT INTO public.notifications (user_id, type, title, message, data, is_read) VALUES
(
    NULL,
    'broadcast',
    'System Activated: Northeast Monsoon Flood Relief 2024',
    'The Smart Flood Emergency Response System has been activated for the 2024 Northeast Monsoon season. All districts are on HIGH ALERT.',
    jsonb_build_object('event', 'system_activation', 'season', 'NE Monsoon 2024', 'alert_level', 'HIGH'),
    FALSE
),
(
    NULL,
    'broadcast',
    'Relief Camps Operational — 5 Districts Ready',
    'Relief camps are now operational in Chennai, Cuddalore, Nagapattinam, Thanjavur, and Tiruvallur. Total capacity: 1,650 beds.',
    jsonb_build_object('total_camps', 5, 'total_capacity', 1650, 'total_occupancy', 1155),
    FALSE
),
(
    NULL,
    'low_stock',
    'Critical Low Stock — Nagapattinam Camp',
    'Multiple items at Nagapattinam Relief Centre are critically low. Immediate resupply required for Rice, Water, and Medicines.',
    jsonb_build_object('camp_id', 'cc333333-cc33-cc33-cc33-cc3333333333', 'camp_name', 'Nagapattinam Relief Centre — Town Hall'),
    FALSE
),
(
    NULL,
    'camp_full',
    'Camp Full — Nagapattinam Relief Centre',
    'Nagapattinam Relief Centre has reached maximum capacity (400/400 beds). Please redirect new arrivals to Thanjavur or Tiruvallur camps.',
    jsonb_build_object('camp_id', 'cc333333-cc33-cc33-cc33-cc3333333333', 'max_capacity', 400, 'current_occupancy', 390),
    FALSE
),
(
    NULL,
    'general',
    'Helpline Numbers — Flood Emergency Tamil Nadu',
    'State Disaster Management: 1070 | NDRF Helpline: 011-24363260 | Police Emergency: 100 | Ambulance: 108',
    jsonb_build_object('helplines', jsonb_build_object('state_dm', '1070', 'ndrf', '011-24363260', 'police', '100', 'ambulance', '108')),
    FALSE
);

-- ============================================================
-- DONATIONS — sample donation records
-- ============================================================
INSERT INTO public.donations (donor_name, donor_email, donor_phone, donor_type, donation_type, amount, description, district_id, status) VALUES
(
    'Tata Consultancy Services Foundation',
    'csr@tcs.com',
    '+91-4422099000',
    'corporate', 'cash', 500000.00,
    'Emergency flood relief fund for Tamil Nadu 2024.',
    '11111111-1111-1111-1111-111111111111',
    'approved'
),
(
    'Ramakrishna Mission, Chennai',
    'relief@rkmchennai.org',
    '+91-4424640607',
    'ngo', 'food', NULL,
    '5000 food packets to be delivered to Chennai relief camps daily for 7 days.',
    '11111111-1111-1111-1111-111111111111',
    'received'
),
(
    'Senthil Kumar R.',
    'senthil.kumar@gmail.com',
    '+91-9876543210',
    'individual', 'blankets', NULL,
    'Donating 200 woolen blankets collected from local drive in Cuddalore district.',
    '22222222-2222-2222-2222-222222222222',
    'received'
),
(
    'Apollo Hospitals Group',
    'csr@apollohospitals.com',
    '+91-4428296000',
    'corporate', 'medicines', 200000.00,
    'Medical supplies including antibiotics, IV fluids, wound dressing kits for all 5 district camps.',
    NULL,
    'approved'
),
(
    'Sri Murugan Ladies Sangam — Nagapattinam',
    NULL,
    '+91-9952112233',
    'ngo', 'clothes', NULL,
    '500 sets of clothing for distribution at Nagapattinam camp.',
    '33333333-3333-3333-3333-333333333333',
    'delivered'
),
(
    'Infosys Foundation',
    'infosys.foundation@infosys.com',
    '+91-8045960000',
    'corporate', 'cash', 1000000.00,
    'One-time grant to Tamil Nadu State Disaster Management Authority for flood rehabilitation 2024.',
    NULL,
    'approved'
),
(
    'Meenakshisundaram P.',
    'meenu.p@yahoo.com',
    '+91-9445567890',
    'individual', 'food', NULL,
    'Sponsoring 300 food packets from local hotel for Thanjavur camp residents.',
    '44444444-4444-4444-4444-444444444444',
    'delivered'
),
(
    'Chennai City Rotary Club',
    'secretary@rotarychennai.org',
    '+91-9840987654',
    'ngo', 'other', 75000.00,
    'Purchase and supply of 500 emergency survival kits including torch, whistle, first aid and dry rations.',
    '11111111-1111-1111-1111-111111111111',
    'pending'
);
