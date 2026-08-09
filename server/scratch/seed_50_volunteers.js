const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const VOLUNTEER_NAMES = [
  "Manoj Kumar", "Karthik Raja", "Priya Dharshini", "Surya Prakash", "Anitha Sekar",
  "Ramesh Babu", "Vigneshwaran R.", "Deepika Srinivasan", "Saravanan P.", "Gokul Nath",
  "Naveen Raj", "Divya Bharati", "Vijay Anand", "Santhosh Kumar", "Abinaya V.",
  "Prabhu Deva", "Meenakshi Sundaram", "Dinesh Karthik", "Keerthana R.", "Aravind Samy",
  "Balamurugan K.", "Kavitha Murugesan", "Suresh Kumar", "Archana Devi", "Ganesh Moorthy",
  "Harish Ragav", "Ishwarya Lakshmi", "Janani V.", "Kishore Kumar", "Loganathan S.",
  "Mohan Raj", "Nandhini Priya", "Omprakash R.", "Pavithra S.", "Qadir Hussain",
  "Raghavan V.", "Sneha Parameswaran", "Thirunavukkarasu", "Udaya Kumar", "Vaishnavi R.",
  "Waseem Akram", "Xavier Prabhu", "Yogeshwaran", "Zahir Ahmed", "Ashok Sundaram",
  "Bhuvana Chandra", "Chitra Devi", "Dharani V.", "Elango K.", "Farhan Ali"
];

const VEHICLE_TYPES = [
  "Rescue Motor Boat ⛵", "Heavy Duty Truck (4x4) 🚛", "Emergency Medical Ambulance 🚑",
  "Off-Road Disaster SUV 🚙", "Inflatable Lifeboat 🛶", "Motorcycle Rapid Scout 🏍️"
];

async function seed50Volunteers() {
  console.log("🚑 Seeding 50 Active Disaster Rescue Volunteers across TN Districts...");

  // Fetch districts
  const { data: districts } = await supabase.from("districts").select("id");
  const districtIds = districts && districts.length > 0
    ? districts.map(d => d.id)
    : ["11111111-1111-1111-1111-111111111111"];

  // Base coordinates around Chennai & TN
  const baseLat = 13.0827;
  const baseLng = 80.2707;

  const volunteersToInsert = [];

  for (let i = 0; i < 50; i++) {
    const name = VOLUNTEER_NAMES[i % VOLUNTEER_NAMES.length];
    const phone = `+91 ${9840000000 + Math.floor(Math.random() * 999999)}`;
    const distId = districtIds[i % districtIds.length];
    const vehicle = VEHICLE_TYPES[i % VEHICLE_TYPES.length];
    const offsetLat = baseLat + (Math.random() - 0.5) * 0.4;
    const offsetLng = baseLng + (Math.random() - 0.5) * 0.4;

    volunteersToInsert.push({
      district_id: distId,
      current_lat: offsetLat,
      current_lng: offsetLng,
      is_available: true
    });
  }

  // Insert volunteers into public.volunteers table
  const { data, error } = await supabase.from("volunteers").insert(volunteersToInsert);

  if (error) {
    console.error("Volunteer insertion error:", error.message);
  } else {
    console.log("✅ Successfully seeded 50 Active Volunteers into Supabase!");
  }
}

seed50Volunteers().catch(console.error);
