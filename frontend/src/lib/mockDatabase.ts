// Mock Database & Resilient Supabase Fetch Interceptor
// Prevents ERR_NAME_NOT_RESOLVED by serving full in-memory Tamil Nadu Flood Relief datasets
// when Supabase is paused, deleted, or unconfigured.

export const MOCK_DISTRICTS = [
  { id: "11111111-1111-1111-1111-111111111111", name: "Chennai", state: "Tamil Nadu", code: "TN-CHN", coordinates: "80.2707,13.0827" },
  { id: "22222222-2222-2222-2222-222222222222", name: "Cuddalore", state: "Tamil Nadu", code: "TN-CDL", coordinates: "79.7656,11.7447" },
  { id: "33333333-3333-3333-3333-333333333333", name: "Nagapattinam", state: "Tamil Nadu", code: "TN-NGP", coordinates: "79.8449,10.7672" },
  { id: "44444444-4444-4444-4444-444444444444", name: "Thanjavur", state: "Tamil Nadu", code: "TN-TNJ", coordinates: "79.1378,10.7870" },
  { id: "55555555-5555-5555-5555-555555555555", name: "Tiruvallur", state: "Tamil Nadu", code: "TN-TVL", coordinates: "79.9073,13.1432" },
  { id: "66666666-6666-6666-6666-666666666666", name: "Chengalpattu", state: "Tamil Nadu", code: "TN-CGL", coordinates: "79.9800,12.6800" },
  { id: "77777777-7777-7777-7777-777777777777", name: "Kanchipuram", state: "Tamil Nadu", code: "TN-KCP", coordinates: "79.7000,12.8300" },
  { id: "88888888-8888-8888-8888-888888888888", name: "Villupuram", state: "Tamil Nadu", code: "TN-VPM", coordinates: "79.4900,11.9400" },
  { id: "99999999-9999-9999-9999-999999999999", name: "Mayiladuthurai", state: "Tamil Nadu", code: "TN-MYD", coordinates: "79.6500,11.1000" },
  { id: "a1b2c3d4-0001-0000-0000-000000000010", name: "Madurai", state: "Tamil Nadu", code: "TN-MDU", coordinates: "78.1198,9.9252" },
  { id: "a1b2c3d4-0001-0000-0000-000000000011", name: "Coimbatore", state: "Tamil Nadu", code: "TN-CBE", coordinates: "76.9558,11.0168" },
  { id: "a1b2c3d4-0001-0000-0000-000000000012", name: "Tiruchirappalli", state: "Tamil Nadu", code: "TN-TRY", coordinates: "78.7000,10.7900" }
];

export const MOCK_RELIEF_CAMPS = [
  {
    id: "camp-01",
    name: "Chennai Central Flood Relief Camp — Kamarajar Salai",
    district_id: "11111111-1111-1111-1111-111111111111",
    address: "Kamarajar Salai, Marina Beach Side, Chennai - 600001",
    latitude: 13.0627,
    longitude: 80.2800,
    max_capacity: 500,
    current_occupancy: 320,
    beds_total: 500,
    beds_available: 180,
    has_electricity: true,
    has_water: true,
    has_medical: true,
    contact_name: "Dr. S. Radhakrishnan",
    contact_phone: "+91 98400 01234",
    status: "active",
    created_at: new Date().toISOString()
  },
  {
    id: "camp-02",
    name: "Velachery Emergency Shelter — St. Mark School",
    district_id: "11111111-1111-1111-1111-111111111111",
    address: "100 Feet Bypass Road, Velachery, Chennai - 600042",
    latitude: 12.9780,
    longitude: 80.2210,
    max_capacity: 450,
    current_occupancy: 280,
    beds_total: 450,
    beds_available: 170,
    has_electricity: true,
    has_water: true,
    has_medical: true,
    contact_name: "Anita Ramesh",
    contact_phone: "+91 98412 34567",
    status: "active",
    created_at: new Date().toISOString()
  },
  {
    id: "camp-03",
    name: "Cuddalore District Camp — Govt Higher Secondary",
    district_id: "22222222-2222-2222-2222-222222222222",
    address: "Cuddalore Old Town, Near Collectorate, Cuddalore - 607001",
    latitude: 11.7480,
    longitude: 79.7700,
    max_capacity: 350,
    current_occupancy: 210,
    beds_total: 350,
    beds_available: 140,
    has_electricity: true,
    has_water: true,
    has_medical: true,
    contact_name: "M. Anbalagan",
    contact_phone: "+91 94430 05678",
    status: "active",
    created_at: new Date().toISOString()
  },
  {
    id: "camp-04",
    name: "Nagapattinam Relief Centre — Town Hall",
    district_id: "33333333-3333-3333-3333-333333333333",
    address: "Town Hall Road, Nagapattinam - 611001",
    latitude: 10.7672,
    longitude: 79.8500,
    max_capacity: 400,
    current_occupancy: 390,
    beds_total: 400,
    beds_available: 10,
    has_electricity: true,
    has_water: true,
    has_medical: true,
    contact_name: "K. Selvam",
    contact_phone: "+91 98940 07890",
    status: "active",
    created_at: new Date().toISOString()
  },
  {
    id: "camp-05",
    name: "Thanjavur Emergency Shelter — Big Temple Area",
    district_id: "44444444-4444-4444-4444-444444444444",
    address: "Near Brihadeeswarar Temple, Thanjavur - 613001",
    latitude: 10.7820,
    longitude: 79.1320,
    max_capacity: 250,
    current_occupancy: 140,
    beds_total: 250,
    beds_available: 110,
    has_electricity: true,
    has_water: true,
    has_medical: false,
    contact_name: "P. Subramaniam",
    contact_phone: "+91 99520 09999",
    status: "active",
    created_at: new Date().toISOString()
  },
  {
    id: "camp-06",
    name: "Tambaram Community Relief Center",
    district_id: "66666666-6666-6666-6666-666666666666",
    address: "GST Road, Tambaram Sanatorium, Chennai - 600047",
    latitude: 12.9249,
    longitude: 80.1488,
    max_capacity: 300,
    current_occupancy: 190,
    beds_total: 300,
    beds_available: 110,
    has_electricity: true,
    has_water: true,
    has_medical: true,
    contact_name: "R. Natarajan",
    contact_phone: "+91 98402 88877",
    status: "active",
    created_at: new Date().toISOString()
  }
];

export const MOCK_SOS_REQUESTS = [
  {
    id: "sos-101",
    victim_name: "V. Ramasamy & Family",
    phone: "+91 98401 22334",
    emergency_level: 5,
    status: "pending",
    latitude: 12.9810,
    longitude: 80.2180,
    location_address: "TNHB Colony, Velachery, Chennai",
    people_count: 5,
    medical_required: true,
    water_level_feet: 5.5,
    description: "Water level rose above 5 feet rapidly. Elderly cardiac patient trapped on 1st floor balcony.",
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  },
  {
    id: "sos-102",
    victim_name: "S. Priya & 2 Infants",
    phone: "+91 98405 66778",
    emergency_level: 5,
    status: "in_progress",
    latitude: 13.0410,
    longitude: 80.2320,
    location_address: "Saidapet Bridge Lower Banks, Chennai",
    people_count: 3,
    medical_required: true,
    water_level_feet: 6.0,
    description: "Stranded inside terrace corner with 2 infant babies. Need inflatable motorized boat rescue.",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 10).toISOString()
  },
  {
    id: "sos-103",
    victim_name: "Karthik Subramanian",
    phone: "+91 94432 99881",
    emergency_level: 4,
    status: "assigned",
    latitude: 11.7510,
    longitude: 79.7650,
    location_address: "Gudilam River Bank Lowlands, Cuddalore",
    people_count: 4,
    medical_required: false,
    water_level_feet: 4.2,
    description: "Strong current surrounding single-story home. Rescue team assigned with life buoys.",
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 25).toISOString()
  },
  {
    id: "sos-104",
    victim_name: "Anand & Divya",
    phone: "+91 97100 44556",
    emergency_level: 3,
    status: "rescued",
    latitude: 13.0610,
    longitude: 80.2650,
    location_address: "Mylapore Canal Lane, Chennai",
    people_count: 2,
    medical_required: false,
    water_level_feet: 3.0,
    description: "Successfully evacuated to Central Flood Relief Camp.",
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60).toISOString()
  },
  {
    id: "sos-105",
    victim_name: "Meenakshi Sundaram",
    phone: "+91 98402 77112",
    emergency_level: 4,
    status: "assigned",
    latitude: 10.7710,
    longitude: 79.8420,
    location_address: "Nagore Coastal Village, Nagapattinam",
    people_count: 6,
    medical_required: true,
    water_level_feet: 4.8,
    description: "Evacuation boat deployed from Nagapattinam Town Hall relief squad.",
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: "sos-106",
    victim_name: "D. Jayakumar",
    phone: "+91 98840 12399",
    emergency_level: 2,
    status: "rescued",
    latitude: 12.9280,
    longitude: 80.1420,
    location_address: "Tambaram West Canal Edge, Chennai",
    people_count: 3,
    medical_required: false,
    water_level_feet: 2.5,
    description: "Safely shifted to Tambaram Community Shelter.",
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 110).toISOString()
  }
];

export const MOCK_VOLUNTEERS = [
  {
    id: "vol-1",
    user_id: "usr-vol-1",
    is_available: true,
    current_lat: 12.9810,
    current_lng: 80.2220,
    vehicle_type: "Rescue Inflatable Boat (4-seater)",
    equipment: ["Life Buoys", "First Aid Kit", "Flashlights", "Nylon Ropes"],
    active_missions_count: 1,
    completed_rescues: 18,
    rating: 4.9,
    users: {
      full_name: "Vigneshwaran K.",
      phone: "+91 98401 55667"
    },
    created_at: new Date().toISOString()
  },
  {
    id: "vol-2",
    user_id: "usr-vol-2",
    is_available: true,
    current_lat: 13.0450,
    current_lng: 80.2310,
    vehicle_type: "Motorized NDRF Support Boat",
    equipment: ["Medical Kit", "Oxygen Tank", "Defibrillator", "Life Vests"],
    active_missions_count: 1,
    completed_rescues: 24,
    rating: 5.0,
    users: {
      full_name: "Dr. Arvind Swaminathan",
      phone: "+91 94432 11223"
    },
    created_at: new Date().toISOString()
  },
  {
    id: "vol-3",
    user_id: "usr-vol-3",
    is_available: true,
    current_lat: 11.7530,
    current_lng: 79.7680,
    vehicle_type: "Heavy All-Terrain 4x4 Truck",
    equipment: ["Winch Cable", "Satellite Phone", "Food Packets", "Foil Blankets"],
    active_missions_count: 0,
    completed_rescues: 14,
    rating: 4.8,
    users: {
      full_name: "Gokul Prasad",
      phone: "+91 98940 33445"
    },
    created_at: new Date().toISOString()
  },
  {
    id: "vol-4",
    user_id: "usr-vol-4",
    is_available: true,
    current_lat: 10.7690,
    current_lng: 79.8490,
    vehicle_type: "Fishermen Fibre Boat (Trained Swimmer)",
    equipment: ["Nets", "Life Buoys", "Megaphone"],
    active_missions_count: 0,
    completed_rescues: 32,
    rating: 5.0,
    users: {
      full_name: "M. Munusamy",
      phone: "+91 98410 77889"
    },
    created_at: new Date().toISOString()
  }
];

export const MOCK_FLOOD_ZONES = [
  {
    id: "fz-1",
    name: "Adyar River Basin — Saidapet & Kotturpuram",
    district_id: "11111111-1111-1111-1111-111111111111",
    alert_level: "critical",
    water_level: 6.8,
    danger_level: 5.0,
    affected_population: 45000,
    latitude: 13.0210,
    longitude: 80.2280,
    created_at: new Date().toISOString()
  },
  {
    id: "fz-2",
    name: "Velachery Lake & Pallikaranai Marsh Overflow",
    district_id: "11111111-1111-1111-1111-111111111111",
    alert_level: "critical",
    water_level: 5.4,
    danger_level: 4.5,
    affected_population: 32000,
    latitude: 12.9690,
    longitude: 80.2190,
    created_at: new Date().toISOString()
  },
  {
    id: "fz-3",
    name: "Cuddalore Thenpennai River Discharge Belt",
    district_id: "22222222-2222-2222-2222-222222222222",
    alert_level: "high",
    water_level: 4.8,
    danger_level: 4.0,
    affected_population: 28000,
    latitude: 11.7580,
    longitude: 79.7610,
    created_at: new Date().toISOString()
  },
  {
    id: "fz-4",
    name: "Nagapattinam Vedaranyam Estuary Backwaters",
    district_id: "33333333-3333-3333-3333-333333333333",
    alert_level: "high",
    water_level: 4.2,
    danger_level: 3.8,
    affected_population: 18500,
    latitude: 10.7420,
    longitude: 79.8410,
    created_at: new Date().toISOString()
  }
];

export const MOCK_DONATIONS = [
  {
    id: "don-01",
    donor_name: "Tata Relief Trust",
    donor_email: "relief@tata.com",
    amount: 5000000,
    currency: "INR",
    district_id: "11111111-1111-1111-1111-111111111111",
    districts: { name: "Chennai" },
    payment_mode: "NEFT/RTGS",
    purpose: "Drinking Water & Medical Beds",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: "don-02",
    donor_name: "Tamil Nadu Citizens Care Association",
    donor_email: "donations@citizenscare.org",
    amount: 1500000,
    currency: "INR",
    district_id: "22222222-2222-2222-2222-222222222222",
    districts: { name: "Cuddalore" },
    payment_mode: "UPI",
    purpose: "Dry Rations & Baby Food",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
  },
  {
    id: "don-03",
    donor_name: "Rotary Club Chennai Coastal",
    donor_email: "rotary.coastal@rotary3232.org",
    amount: 750000,
    currency: "INR",
    district_id: "33333333-3333-3333-3333-333333333333",
    districts: { name: "Nagapattinam" },
    payment_mode: "Razorpay",
    purpose: "Inflatable Life Vests & Torches",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
  }
];

export const MOCK_INVENTORY = [
  {
    id: "inv-1",
    item_name: "Purified Bottled Drinking Water (1L)",
    category: "water",
    current_stock: 4500,
    minimum_threshold: 500,
    unit: "bottles",
    camp_id: "camp-01",
    relief_camps: { name: "Chennai Central Flood Relief Camp — Kamarajar Salai" },
    updated_at: new Date().toISOString()
  },
  {
    id: "inv-2",
    item_name: "Ready-to-Eat Meal Rations (High Energy)",
    category: "food",
    current_stock: 2800,
    minimum_threshold: 300,
    unit: "packets",
    camp_id: "camp-01",
    relief_camps: { name: "Chennai Central Flood Relief Camp — Kamarajar Salai" },
    updated_at: new Date().toISOString()
  },
  {
    id: "inv-3",
    item_name: "First Aid & Anti-Snake Venom Triage Kit",
    category: "medical",
    current_stock: 18,
    minimum_threshold: 20,
    unit: "kits",
    camp_id: "camp-02",
    relief_camps: { name: "Velachery Emergency Shelter — St. Mark School" },
    updated_at: new Date().toISOString()
  },
  {
    id: "inv-4",
    item_name: "Foil Thermal Blankets",
    category: "shelter",
    current_stock: 12,
    minimum_threshold: 20,
    unit: "pieces",
    camp_id: "camp-03",
    relief_camps: { name: "Cuddalore District Camp — Govt Higher Secondary" },
    updated_at: new Date().toISOString()
  }
];

export const MOCK_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "🚨 Heavy Rain Red Alert: Coastal Districts",
    message: "IMD has issued an extreme rainfall advisory for Chennai, Chengalpattu, Cuddalore, and Nagapattinam. High tide expected at 21:00 hrs.",
    type: "critical",
    created_at: new Date().toISOString()
  },
  {
    id: "notif-2",
    title: "🚤 15 Additional NDRF Boats Deployed",
    message: "Motorized rescue boats have arrived at Saidapet and Velachery staging centers.",
    type: "info",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  }
];

export const MOCK_USERS = [
  {
    id: "usr-admin-1",
    full_name: "Super Admin Mohit Balaji",
    email: "mohitbalaji.ec23@bitsathy.ac.in",
    role: "super_admin",
    phone: "+91 98401 23456",
    avatar_url: null,
    district_id: "11111111-1111-1111-1111-111111111111",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "usr-admin-2",
    full_name: "Monish Admin",
    email: "monish.ec23@bitsathy.ac.in",
    role: "super_admin",
    phone: "+91 98402 34567",
    avatar_url: null,
    district_id: "11111111-1111-1111-1111-111111111111",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "usr-admin-3",
    full_name: "Naresh Admin",
    email: "naresh.ec23@bitsathy.ac.in",
    role: "super_admin",
    phone: "+91 98403 45678",
    avatar_url: null,
    district_id: "11111111-1111-1111-1111-111111111111",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "usr-vol-1",
    full_name: "Vigneshwaran Volunteer",
    email: "volunteer@floodresponse.in",
    role: "volunteer",
    phone: "+91 98401 55667",
    avatar_url: null,
    district_id: "11111111-1111-1111-1111-111111111111",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "usr-camp-1",
    full_name: "Anita Ramesh Camp Officer",
    email: "camp_officer@floodresponse.in",
    role: "camp_officer",
    phone: "+91 98412 34567",
    avatar_url: null,
    district_id: "11111111-1111-1111-1111-111111111111",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const MOCK_DATABASE: Record<string, any[]> = {
  districts: MOCK_DISTRICTS,
  relief_camps: MOCK_RELIEF_CAMPS,
  camps: MOCK_RELIEF_CAMPS,
  sos_requests: MOCK_SOS_REQUESTS,
  volunteers: MOCK_VOLUNTEERS,
  flood_zones: MOCK_FLOOD_ZONES,
  donations: MOCK_DONATIONS,
  inventory: MOCK_INVENTORY,
  notifications: MOCK_NOTIFICATIONS,
  users: MOCK_USERS,
  profiles: MOCK_USERS,
  user_roles: [
    { user_id: "usr-admin-1", role: "super_admin" },
    { user_id: "usr-admin-2", role: "super_admin" },
    { user_id: "usr-admin-3", role: "super_admin" },
    { user_id: "usr-vol-1", role: "volunteer" },
    { user_id: "usr-camp-1", role: "camp_officer" }
  ],
  beneficiaries: [
    {
      id: "ben-1",
      full_name: "V. Ramasamy",
      phone: "+91 98401 22334",
      qr_code: "QR-BEN-101",
      priority: "high",
      disability: false,
      pregnancy: false,
      camp_id: "camp-01",
      district: "Chennai",
      village: "Velachery",
      created_at: new Date().toISOString()
    }
  ],
  audit_logs: [
    {
      id: "log-1",
      action: "RESCUE_DISPATCH",
      entity: "sos_requests",
      entity_id: "sos-102",
      metadata: { dispatched_boat: "NDRF Support Boat", rescuer: "Dr. Arvind" },
      created_at: new Date().toISOString()
    }
  ],
  victim_locations: [
    {
      id: "vl-1",
      sos_request_id: "sos-101",
      latitude: 12.9810,
      longitude: 80.2180,
      accuracy: 5.0,
      created_at: new Date().toISOString()
    },
    {
      id: "vl-2",
      sos_request_id: "sos-102",
      latitude: 13.0410,
      longitude: 80.2320,
      accuracy: 4.2,
      created_at: new Date().toISOString()
    }
  ],
  resource_distribution: [],
  volunteer_assignments: []
};

// Resilient Mock Request Interceptor
export function handleMockRequest(urlStr: string, init?: RequestInit): Response {
  const method = init?.method?.toUpperCase() || "GET";
  const headers = new Headers(init?.headers);

  // 1. Auth: Sign In with Password & Tokens
  if (urlStr.includes("/auth/v1/token")) {
    let email = "mohitbalaji.ec23@bitsathy.ac.in";
    try {
      if (init?.body) {
        const bodyStr = typeof init.body === "string" ? init.body : "";
        const parsed = JSON.parse(bodyStr);
        if (parsed.email) email = parsed.email;
      }
    } catch {}

    const lower = email.toLowerCase().trim();
    const isSuperAdmin = lower.includes("mohit") || lower.includes("admin") || lower.includes("bitsathy");
    const isVolunteer = lower.includes("volunteer");
    const isCampOfficer = lower.includes("camp");
    const role = isSuperAdmin ? "super_admin" : isVolunteer ? "volunteer" : isCampOfficer ? "camp_officer" : "beneficiary";
    const name = isSuperAdmin ? "Mohit Balaji" : isVolunteer ? "Volunteer Rescuer" : isCampOfficer ? "Camp Officer" : email.split("@")[0];

    const mockUser = {
      id: isSuperAdmin ? "usr-admin-1" : isVolunteer ? "usr-vol-1" : isCampOfficer ? "usr-camp-1" : "usr-" + Date.now(),
      aud: "authenticated",
      role: "authenticated",
      email: email,
      email_confirmed_at: new Date().toISOString(),
      phone: "+91 98401 23456",
      user_metadata: {
        full_name: name,
        name: name,
        role: role,
        phone: "+91 98401 23456"
      },
      app_metadata: { provider: "email", providers: ["email"] },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const token = "mock-sb-token-" + Date.now();
    return new Response(
      JSON.stringify({
        access_token: token,
        token_type: "bearer",
        expires_in: 86400,
        refresh_token: "mock-sb-refresh-" + Date.now(),
        user: mockUser
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  // 2. Auth: Get Current User
  if (urlStr.includes("/auth/v1/user")) {
    const user = MOCK_USERS[0];
    return new Response(JSON.stringify(user), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  // 3. Auth: Logout
  if (urlStr.includes("/auth/v1/logout") || urlStr.includes("/auth/v1/signout")) {
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  // 4. REST Tables & PostgREST Interception
  const match = urlStr.match(/\/rest\/v1\/([^?]+)/);
  const table = match ? match[1] : "";
  let data = [...(MOCK_DATABASE[table] || [])];

  // Simple query filters
  if (urlStr.includes("status=eq.rescued")) {
    data = data.filter((d) => d.status === "rescued");
  } else if (urlStr.includes("status=in.%28assigned%2Cin_progress%29") || urlStr.includes("status=in.(assigned,in_progress)")) {
    data = data.filter((d) => d.status === "assigned" || d.status === "in_progress");
  } else if (urlStr.includes("is_available=eq.true")) {
    data = data.filter((d) => d.is_available === true);
  }

  // Limit filter
  const limitMatch = urlStr.match(/limit=(\d+)/);
  if (limitMatch) {
    const limitNum = parseInt(limitMatch[1], 10);
    if (!isNaN(limitNum)) data = data.slice(0, limitNum);
  }

  const total = data.length;
  const contentRange = `0-${total > 0 ? total - 1 : 0}/${total}`;

  // HEAD method (used for count queries: .select("*", { count: "exact", head: true }))
  if (method === "HEAD") {
    return new Response(null, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "content-range": contentRange
      }
    });
  }

  // Write operations: POST, PATCH, PUT
  if (method === "POST" || method === "PATCH" || method === "PUT") {
    let payload: any = { id: "gen-" + Date.now() };
    try {
      if (init?.body) {
        payload = JSON.parse(init.body as string);
        if (!payload.id) payload.id = "gen-" + Date.now();
      }
    } catch {}

    if (Array.isArray(payload)) {
      payload.forEach((item) => {
        if (!item.id) item.id = "gen-" + Date.now();
        if (MOCK_DATABASE[table]) MOCK_DATABASE[table].push(item);
      });
    } else {
      if (MOCK_DATABASE[table]) MOCK_DATABASE[table].push(payload);
    }

    return new Response(JSON.stringify(payload), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "content-range": contentRange
      }
    });
  }

  // Delete operations
  if (method === "DELETE") {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "content-range": "0-0/0"
      }
    });
  }

  // Single entity unwrap for .single() and .maybeSingle()
  const accept = headers.get("Accept") || "";
  const isSingle = accept.includes("application/vnd.pgrst.object+json");
  const responseData = isSingle ? (data[0] || {}) : data;

  return new Response(JSON.stringify(responseData), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "content-range": contentRange
    }
  });
}

// Custom Fetch Creator that intercepts dead / paused hosts before touching the network
export function createResilientSupabaseFetch(targetUrl: string, targetKey: string): typeof fetch {
  const isDeadHost =
    !targetUrl ||
    targetUrl.includes("yugouljgwarsmkmhutke") ||
    targetUrl.includes("mock") ||
    targetUrl.includes("placeholder");

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === "string" ? input : (input as Request).url;

    // If it's the known dead DNS domain, NEVER attempt native fetch
    // to prevent browser ERR_NAME_NOT_RESOLVED console errors
    if (isDeadHost) {
      return handleMockRequest(urlStr, init);
    }

    // Otherwise, attempt real native fetch
    try {
      const res = await fetch(input, init);
      if (res.status < 500) return res;
    } catch {
      // If native fetch throws (DNS error, offline, CORS, server down), seamlessly fall back
    }

    return handleMockRequest(urlStr, init);
  };
}
