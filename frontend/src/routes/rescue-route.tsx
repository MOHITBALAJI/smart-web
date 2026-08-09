import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  Navigation,
  Compass,
  Tent,
  Siren,
  ArrowRight,
  Phone,
  QrCode,
  Shield,
  Loader2,
  CheckCircle,
  HelpCircle,
  Truck,
  AlertTriangle,
  RefreshCw,
  Anchor,
  Activity,
  Clock,
  MapPinned,
  Route as RouteIcon,
  ExternalLink,
  Zap,
  Target,
  Sparkles,
  ArrowLeft,
  LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GoogleMap, useGeolocation, reverseGeocode, haversineDistance, type MapMarker, type RouteInfo } from "@/components/maps/GoogleMap";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Speed estimates in km/h for different travel modes
const TRAVEL_SPEEDS = {
  WALKING: 5,    // Average walking speed
  DRIVING: 40,   // Disaster/flood area driving speed (slower than normal)
};

interface ComputedRoute {
  distanceKm: number;
  distanceText: string;
  durationMins: number;
  durationText: string;
  originLabel: string;
  destinationLabel: string;
  originCoords: { lat: number; lng: number };
  destCoords: { lat: number; lng: number };
  travelMode: "WALKING" | "DRIVING";
}

function computeRouteInfo(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  travelMode: "WALKING" | "DRIVING",
  originLabel: string,
  destinationLabel: string
): ComputedRoute {
  const distKm = haversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
  // Road distance is typically 1.3–1.5x straight-line distance
  const roadFactor = travelMode === "DRIVING" ? 1.35 : 1.25;
  const roadDistKm = distKm * roadFactor;
  const speed = TRAVEL_SPEEDS[travelMode];
  const durationHrs = roadDistKm / speed;
  const durationMins = Math.round(durationHrs * 60);

  let distanceText: string;
  if (roadDistKm < 1) {
    distanceText = `${Math.round(roadDistKm * 1000)} m`;
  } else {
    distanceText = `${roadDistKm.toFixed(1)} km`;
  }

  let durationText: string;
  if (durationMins < 60) {
    durationText = `${durationMins} min`;
  } else {
    const hrs = Math.floor(durationMins / 60);
    const mins = durationMins % 60;
    durationText = mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
  }

  return {
    distanceKm: roadDistKm,
    distanceText,
    durationMins,
    durationText,
    originLabel,
    destinationLabel,
    originCoords: origin,
    destCoords: destination,
    travelMode,
  };
}

function extractCityPrefix(addressStr?: string): string {
  if (!addressStr || addressStr.trim().length === 0) return "Sathyamangalam";
  const parts = addressStr.split(',').map(s => s.trim());
  for (const part of parts) {
    const clean = part
      .replace(/\d+/gi, '')
      .replace(/\b(sector|road|street|bypass|bridge|near|opp|block|flat|no|zone|area|main|cross|district|tn|tamil nadu|india|emergency|location|demo)\b/gi, '')
      .trim();
    if (clean.length > 2) {
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    }
  }
  return parts[0]?.replace(/\d+/g, '').trim() || "Sathyamangalam";
}

// Generator for 100 to 1000 camps spread every 2-3 km starting from baseCenter
function generate1000Camps(baseCenter?: { lat: number; lng: number }, count: number = 1000, cityPrefix?: string): any[] {
  const centerLat = baseCenter?.lat || 12.9780;
  const centerLng = baseCenter?.lng || 80.2210;
  
  const userCity = cityPrefix && cityPrefix.trim().length > 0 ? cityPrefix.trim() : "Sathyamangalam";
  
  const generatedCamps: any[] = [];
  let idCounter = 1;

  const sectorNames = [
    "Primary Relief Shelter", "Disaster Emergency Base", "Govt High School Camp",
    "Indoor Sports Safe Zone", "Community Academy Rescue Camp", "Primary Health Center Base",
    "Municipal Multipurpose Hall", "Rotary Club Disaster Shelter", "Public Auditorium Relief Station",
    "Red Cross Emergency Support Camp", "District Stadium Flood Base", "Railway Welfare Center Camp"
  ];

  // Immediate 10 local camps placed within 0.8km to 3.2km of baseCenter
  const localOffsets = [
    { dLat: 0.008, dLng: 0.006, name: "Rescue Shelter #1 (Nearest)" },
    { dLat: -0.010, dLng: 0.009, name: "Disaster Base #2" },
    { dLat: 0.014, dLng: -0.012, name: "High School Relief Camp #3" },
    { dLat: -0.016, dLng: -0.014, name: "Sports Complex Safe Camp #4" },
    { dLat: 0.020, dLng: 0.016, name: "Community Center #5" },
    { dLat: -0.022, dLng: 0.018, name: "Rotary Disaster Base #6" },
    { dLat: 0.025, dLng: -0.020, name: "Municipal Safe Hall #7" },
    { dLat: -0.028, dLng: -0.022, name: "Stadium Shelter #8" },
    { dLat: 0.030, dLng: 0.024, name: "Red Cross Camp #9" },
    { dLat: -0.032, dLng: 0.026, name: "District Base #10" },
  ];

  localOffsets.forEach((off, idx) => {
    if (generatedCamps.length >= count) return;
    const lat = centerLat + off.dLat;
    const lng = centerLng + off.dLng;
    generatedCamps.push({
      id: `local-camp-${idCounter}`,
      name: `${userCity} ${off.name}`,
      latitude: Number(lat.toFixed(5)),
      longitude: Number(lng.toFixed(5)),
      address: `${userCity} Emergency Sector #${idx + 1}`,
      current_occupancy: 120 + idx * 15,
      max_capacity: 300,
      status: "active",
      phone: `+91 944${Math.floor(1000000 + (idCounter * 71321) % 8999999)}`,
      supplies: ["Clean Water", "Medical First Aid", "Hot Meals", "Blankets", "Generator Power"]
    });
    idCounter++;
  });

  // Expand grid up to target count requested (100 - 1000)
  for (let ring = 1; generatedCamps.length < count; ring++) {
    const steps = ring * 8;
    for (let s = 0; s < steps && generatedCamps.length < count; s++) {
      const angle = (s / steps) * 2 * Math.PI;
      const distLat = ring * 0.014 + (Math.sin(s * 1.5) * 0.002);
      const distLng = ring * 0.016 + (Math.cos(s * 1.5) * 0.002);
      const lat = centerLat + Math.sin(angle) * distLat;
      const lng = centerLng + Math.cos(angle) * distLng;

      const sector = sectorNames[(idCounter * 13) % sectorNames.length];
      const cap = 150 + ((idCounter * 37) % 350);
      const occ = Math.floor(cap * (0.3 + ((idCounter * 17) % 55) / 100));

      generatedCamps.push({
        id: `camp-shelter-${idCounter}`,
        name: `${userCity} ${sector} #${idCounter}`,
        latitude: Number(lat.toFixed(5)),
        longitude: Number(lng.toFixed(5)),
        address: `${userCity} Emergency Relief Sector #${(idCounter % 50) + 1}`,
        current_occupancy: occ,
        max_capacity: cap,
        status: "active",
        phone: `+91 944${Math.floor(1000000 + (idCounter * 71321) % 8999999)}`,
        supplies: ["Clean Water", "Medical First Aid", "Hot Meals", "Blankets", "Generator Power"]
      });
      idCounter++;
    }
  }

  return generatedCamps;
}

// Function to generate 15 SOS requests strictly between 1.5 km and 4.5 km of baseCenter
function getDynamicSos(baseCenter: { lat: number; lng: number }): any[] {
  const cLat = baseCenter.lat;
  const cLng = baseCenter.lng;

  const sosTemplates = [
    { name: "Kavitha R. & Family (4 stranded)", type: "medical_flood_trapped", level: 5, details: "Diabetic patient needs insulin & immediate evacuation. Water level 4ft.", phone: "+91 98401 23456", dLat: 0.014, dLng: 0.012, batt: 18, addr: "Sector 4 Bypass Road (1.8 km away)" },
    { name: "Suresh Kumar (Roof Trapped)", type: "roof_top_trapped", level: 5, details: "Ground floor completely flooded. 2 seniors + 1 baby waiting on terrace.", phone: "+91 97890 87654", dLat: -0.016, dLng: 0.015, batt: 9, addr: "West Canal Bank Street (2.3 km away)" },
    { name: "Priya Dharshini & Group", type: "water_inundation", level: 4, details: "Power cut since 18 hrs, requesting drinking water & food packets.", phone: "+91 94440 11223", dLat: 0.021, dLng: -0.014, batt: 32, addr: "Lake View Avenue Sector 2 (2.7 km away)" },
    { name: "Manoj B. (Senior Citizen)", type: "medical_assistance", level: 4, details: "Wheelchair user stranded on 1st floor. Medical checkup needed.", phone: "+91 99620 33445", dLat: -0.012, dLng: -0.018, batt: 45, addr: "Railway Bridge Sector, Door 18 (2.4 km away)" },
    { name: "Anand V. & Infant", type: "food_water_shortage", level: 3, details: "Infant milk powder & emergency torch light required urgently.", phone: "+91 98840 55667", dLat: 0.026, dLng: 0.019, batt: 61, addr: "Main High Road, Block C (3.5 km away)" },
    { name: "Divya Dharshini", type: "structural_damage_danger", level: 5, details: "Adjacent old wall collapsed, 3 people trapped in corridor.", phone: "+91 97100 88990", dLat: -0.024, dLng: -0.022, batt: 14, addr: "Old Bus Stand Area (3.6 km away)" },
    { name: "Venkatesh S.", type: "snake_bite_emergency", level: 5, details: "Snake bite reported during evacuation! Need anti-venom team.", phone: "+91 95000 12345", dLat: 0.030, dLng: -0.020, batt: 22, addr: "North Lake Avenue (4.1 km away)" },
    { name: "Deepak Raj (Hill Slopes)", type: "landslide_hazard", level: 4, details: "Mudslide blocked road access. 8 workers waiting for rope rescue.", phone: "+91 94860 67890", dLat: -0.032, dLng: 0.024, batt: 55, addr: "Valley Road Sector 3 (4.4 km away)" },
    { name: "Revathi M. (Pregnant)", type: "maternity_emergency", level: 5, details: "Maternity labor pain emergency, needs immediate ambulance transport.", phone: "+91 93600 45678", dLat: 0.018, dLng: -0.025, batt: 40, addr: "Coastal Relief Sector (3.4 km away)" },
    { name: "Ganesh Nathan", type: "stranded_group", level: 4, details: "Group of 12 students & teachers safe on terrace, need food drop.", phone: "+91 91590 98765", dLat: -0.028, dLng: 0.018, batt: 28, addr: "High School Roof Terrace (3.7 km away)" },
    { name: "Saravanan P.", type: "water_inundation", level: 3, details: "Basement flooded with 5ft water, dewatering pump needed.", phone: "+91 98427 11223", dLat: 0.035, dLng: 0.012, batt: 75, addr: "Commercial Street Block A (4.2 km away)" },
    { name: "Karthikeyan K.", type: "wall_collapse_hazard", level: 5, details: "Wall cracked, family evacuated to street corner in heavy rain.", phone: "+91 99440 22334", dLat: -0.020, dLng: -0.030, batt: 11, addr: "Temple Street South (3.9 km away)" },
    { name: "Bhavani S.", type: "oxygen_medical_critical", level: 5, details: "Asthma patient running out of oxygen concentrator battery.", phone: "+91 97910 55443", dLat: 0.012, dLng: 0.032, batt: 30, addr: "Central Sector Block 4 (3.8 km away)" },
    { name: "Naveen Prasad", type: "bridge_survivors", level: 4, details: "Bridge submerged, 6 commuters stranded at high ground.", phone: "+91 94431 88776", dLat: -0.034, dLng: -0.015, batt: 50, addr: "River Bridge West End (4.3 km away)" },
    { name: "Zahir Ahmed", type: "rations_needed", level: 3, details: "Clean drinking water & biscuit packets needed for 30 residents.", phone: "+91 98424 99887", dLat: 0.025, dLng: -0.032, batt: 82, addr: "Community Hall Area (4.5 km away)" }
  ];

  return sosTemplates.map((t, idx) => ({
    id: `sos-${101 + idx}`,
    reporter_name: t.name,
    emergency_level: t.level,
    emergency_type: t.type,
    latitude: Number((cLat + t.dLat).toFixed(5)),
    longitude: Number((cLng + t.dLng).toFixed(5)),
    address: t.addr,
    battery_level: t.batt,
    phone: t.phone,
    status: "pending",
    details: t.details,
    created_at: new Date().toISOString()
  }));
}

export const Route = createFileRoute("/rescue-route")({
  component: RescueRoutePage,
});

function RescueRoutePage() {
  const [activeTab, setActiveTab] = useState<"victim" | "rescuer">("victim");
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [customStart, setCustomStart] = useState<string>("");
  const [customStartCoords, setCustomStartCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCamp, setSelectedCamp] = useState<any | null>(null);
  const [selectedSos, setSelectedSos] = useState<any | null>(null);
  
  const [shelterCountLimit, setShelterCountLimit] = useState<number>(1000);
  const [assignedRoutePreset, setAssignedRoutePreset] = useState<"manoj_to_kavitha" | "kavitha_to_camp" | "custom">("manoj_to_kavitha");

  // Dynamic Navigation Pair State (Default: Manoj Kumar & Kavitha R.)
  const [activeRescuer, setActiveRescuer] = useState<any>({
    name: "Manoj Kumar",
    phone: "+91 98765 43210",
    vehicle: "Rescue Motor Boat ⛵",
    unit: "Unit #101",
    lat: 12.9810,
    lng: 80.2240,
  });

  const [activeVictim, setActiveVictim] = useState<any>({
    name: "Kavitha R. & Family",
    phone: "+91 98401 23456",
    details: "Level 5 Emergency: Diabetic patient, trapped in 4ft floodwater",
    lat: 12.9920,
    lng: 80.2330,
    level: 5,
  });

  const [camps, setCamps] = useState<any[]>([]);
  const [sosRequests, setSosRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [travelMode, setTravelMode] = useState<"WALKING" | "DRIVING">("WALKING");
  const [routeDetails, setRouteDetails] = useState<{ distance: string; duration: string; steps: string[] } | null>(null);
  const [address, setAddress] = useState<string>("");
  const [showTracking, setShowTracking] = useState<boolean>(true);

  const [detailModal, setDetailModal] = useState<{ isOpen: boolean; type: "sos" | "camp"; data: any }>({
    isOpen: false,
    type: "sos",
    data: null,
  });

  const [assignModal, setAssignModal] = useState<{ isOpen: boolean; sos: any | null }>({
    isOpen: false,
    sos: null,
  });
  
  const { position: gpsPos, loading: gpsLoading, getPosition } = useGeolocation();

  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [volunteers, setVolunteers] = useState<any[]>([]);

  const DEMO_VOLUNTEERS_50 = Array.from({ length: 50 }, (_, i) => {
    const names = [
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
    const vehicles = [
      "Rescue Motor Boat ⛵", "Heavy Duty Truck (4x4) 🚛", "Emergency Ambulance 🚑",
      "Disaster Relief SUV 🚙", "Inflatable Lifeboat 🛶", "Rapid Scout Bike 🏍️"
    ];
    const statuses = ["On Rescue Mission", "Dispatched to Victim", "Ready at Camp Base", "On-Duty Patrol"];
    return {
      id: `vol-${i + 1}`,
      name: names[i % names.length],
      phone: `+91 9${Math.floor(800000000 + i * 372131) % 900000000}`,
      vehicle: vehicles[i % vehicles.length],
      status: statuses[i % statuses.length],
      eta: `${Math.floor(4 + (i % 12))} mins away`,
      unit: `Unit #${101 + i}`
    };
  });

  const ASSIGNED_MISSIONS = [
    {
      id: "mission-1",
      rescuer: { name: "Manoj Kumar", vehicle: "Rescue Motor Boat ⛵", phone: "+91 98765 43210", unit: "Unit #101", lat: 12.9810, lng: 80.2240 },
      victim: { name: "Kavitha R. & Family", address: "Sector 4 Bypass Road, Velachery", phone: "+91 98401 23456", details: "Diabetic patient in 4ft water", lat: 12.9920, lng: 80.2330, level: 5 },
      distance: "2.3 km",
      duration: "12 min",
      status: "🛥️ Boat En Route",
      statusColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
    },
    {
      id: "mission-2",
      rescuer: { name: "Karthik Raja", vehicle: "Heavy Duty Rescue Truck 🚛", phone: "+91 98765 11223", unit: "Unit #102", lat: 12.9750, lng: 80.2150 },
      victim: { name: "Suresh Kumar & Family", address: "West Canal Bank Road, Adyar", phone: "+91 97890 87654", details: "Trapped on roof with family", lat: 12.9880, lng: 80.2380, level: 5 },
      distance: "3.1 km",
      duration: "15 min",
      status: "🚛 Truck Dispatched",
      statusColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
    },
    {
      id: "mission-3",
      rescuer: { name: "Vigneshwaran R.", vehicle: "Emergency Ambulance 🚑", phone: "+91 98400 33445", unit: "Unit #103", lat: 12.9650, lng: 80.2050 },
      victim: { name: "Priya Dharshini", address: "Guindy Industrial Sector", phone: "+91 98844 55667", details: "Elderly person needs oxygen", lat: 12.9820, lng: 80.2190, level: 4 },
      distance: "2.8 km",
      duration: "10 min",
      status: "🚑 Ambulance Active",
      statusColor: "bg-purple-500/20 text-purple-300 border-purple-500/30"
    },
    {
      id: "mission-4",
      rescuer: { name: "Surya Prakash", vehicle: "Inflatable Lifeboat 🛶", phone: "+91 97100 66778", unit: "Unit #104", lat: 12.9900, lng: 80.2450 },
      victim: { name: "Anand V.", address: "Perungudi Lake View Road", phone: "+91 94440 11223", details: "Infant needs emergency milk powder", lat: 13.0020, lng: 80.2580, level: 5 },
      distance: "1.9 km",
      duration: "8 min",
      status: "🛶 Lifeboat Deployed",
      statusColor: "bg-amber-500/20 text-amber-300 border-amber-500/30"
    },
    {
      id: "mission-5",
      rescuer: { name: "Anitha Sekar", vehicle: "Disaster Relief SUV 🚙", phone: "+91 98411 99001", unit: "Unit #105", lat: 12.9720, lng: 80.2290 },
      victim: { name: "Divya Dharshini", address: "Saidapet Metro Station Area", phone: "+91 98402 77889", details: "Wall collapse risk area", lat: 12.9850, lng: 80.2420, level: 4 },
      distance: "2.2 km",
      duration: "11 min",
      status: "🚙 SUV Rescuer On Way",
      statusColor: "bg-blue-500/20 text-blue-300 border-blue-500/30"
    }
  ];

  const [liveLogs, setLiveLogs] = useState<string[]>([
    "🟢 Volunteer Manoj assigned to rescue Kavitha R. (Level 5 SOS)",
    "⛵ Rescue boat #4 dispatched to Kavitha location near Velachery",
    "📦 Rational supply distribution kit delivered to Camp West #2",
    "📡 SMS offline distress packet resolved for Adyar location",
  ]);

  // Load current location on load
  useEffect(() => {
    getPosition();
  }, []);

  useEffect(() => {
    const simLogsList = [
      "⛵ Rescue boat #4 assigned to waterlogged block near Velachery",
      "🟢 Volunteer Manoj cleared debris at sector 4 safe pathway",
      "🩺 Medical unit checked in 14 family members at Camp North-1",
      "📦 50 water cartons logged into relief camp #3 inventory",
      "📱 Battery alert: SOS request #8930 has critical 9% power left",
      "👤 Survivor FR-VIC-893021 checked in to safe zone room 12",
      "⚡ Local power generator activated successfully at Camp East #2",
    ];

    const timer = setInterval(() => {
      const randomMsg = simLogsList[Math.floor(Math.random() * simLogsList.length)];
      setLiveLogs((prev) => [randomMsg, ...prev.slice(0, 7)]);
      toast.info(randomMsg, {
        description: "Live Operations Dispatch Feed",
        duration: 3500,
      });
    }, 7000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (gpsPos) {
      setPosition(gpsPos);
      reverseGeocode(gpsPos.lat, gpsPos.lng).then(setAddress);

      // Automatically assign nearest relief shelter camp to exact live location!
      if (camps && camps.length > 0) {
        let nearest = camps[0];
        let minDist = Infinity;
        camps.forEach((camp) => {
          const dist = haversineDistance(gpsPos.lat, gpsPos.lng, camp.latitude, camp.longitude);
          if (dist < minDist) {
            minDist = dist;
            nearest = camp;
          }
        });
        setSelectedCamp(nearest);
        setMapCenter({ lat: (gpsPos.lat + nearest.latitude) / 2, lng: (gpsPos.lng + nearest.longitude) / 2 });
        setAssignedRoutePreset("custom");
        setShowTracking(true);
        toast.success(`📍 Live GPS Fetched & Nearest Camp Assigned!`, {
          description: `Assigned: ${nearest.name} (${minDist < 1 ? Math.round(minDist * 1000) + 'm' : minDist.toFixed(1) + 'km'} away)`
        });
      }
    }
  }, [gpsPos]);

  // Dynamically re-seed camps & SOS relative to active position (strictly up to shelterCountLimit 100-1000!)
  useEffect(() => {
    const base = position || { lat: 12.9780, lng: 80.2210 };
    const city = extractCityPrefix(address);
    const denseCamps = generate1000Camps(base, shelterCountLimit, city);
    const dynamicSos = getDynamicSos(base);
    setCamps(denseCamps);
    setSosRequests(dynamicSos);

    // Re-center activeVictim & activeRescuer to local position so distance is realistic (1 - 2.5 km)
    const baseLat = base.lat;
    const baseLng = base.lng;

    setActiveVictim((prev: any) => ({
      ...prev,
      address: `${city} Sector 4, Emergency Zone`,
      lat: Number((baseLat + 0.010).toFixed(5)),
      lng: Number((baseLng + 0.008).toFixed(5)),
    }));

    setActiveRescuer((prev: any) => ({
      ...prev,
      lat: Number((baseLat - 0.008).toFixed(5)),
      lng: Number((baseLng - 0.006).toFixed(5)),
    }));

    if (denseCamps.length > 0) {
      setSelectedCamp(denseCamps[0]);
    }
    if (dynamicSos.length > 0) {
      setSelectedSos(dynamicSos[0]);
    }
  }, [position, address, shelterCountLimit]);

  // Load camps and SOS requests from database
  useEffect(() => {
    fetchCampsAndSos();
  }, [shelterCountLimit]);

  const fetchCampsAndSos = async () => {
    setLoading(true);
    try {
      // Fetch relief camps
      const { data: campsData } = await supabase
        .from("relief_camps")
        .select("*")
        .eq("status", "active");
      
      let allCamps = campsData && campsData.length > 0 ? campsData : [];
      if (allCamps.length < shelterCountLimit) {
        const city = extractCityPrefix(address);
        const denseCamps = generate1000Camps(position || { lat: 12.9780, lng: 80.2210 }, shelterCountLimit, city);
        allCamps = [...allCamps, ...denseCamps];
      }
      setCamps(allCamps);

      // Fetch active SOS requests
      const { data: sosData } = await supabase
        .from("sos_requests")
        .select("*")
        .in("status", ["pending", "assigned", "in_progress"])
        .order("created_at", { ascending: false });
      
      let allSos = sosData && sosData.length > 0 ? sosData : [];
      if (allSos.length < 10) {
        const dynamicFallbackSos = getDynamicSos(position || { lat: 12.9780, lng: 80.2210 });
        allSos = [...allSos, ...dynamicFallbackSos];
      }
      setSosRequests(allSos);
    } catch (error) {
      console.error("Error fetching data:", error);
      const city = extractCityPrefix(address);
      setCamps(generate1000Camps(position || { lat: 12.9780, lng: 80.2210 }, shelterCountLimit, city));
      setSosRequests(getDynamicSos(position || { lat: 12.9780, lng: 80.2210 }));
    } finally {
      setLoading(false);
    }
  };

  // Find nearest camp based on haversine distance
  const getNearestCamp = () => {
    if (!position || camps.length === 0) return null;
    let nearest = camps[0];
    let minDist = Infinity;
    camps.forEach((camp) => {
      const dist = haversineDistance(position.lat, position.lng, camp.latitude, camp.longitude);
      if (dist < minDist) {
        minDist = dist;
        nearest = camp;
      }
    });
    return nearest;
  };

  const nearestCamp = getNearestCamp();

  const getTop3NearestCamps = () => {
    const userLoc = position || { lat: 12.9810, lng: 80.2240 };
    if (!camps || camps.length === 0) return [];

    return [...camps]
      .map((camp) => {
        const dist = haversineDistance(userLoc.lat, userLoc.lng, camp.latitude, camp.longitude);
        const etaWalkMins = Math.round((dist * 1.35) / TRAVEL_SPEEDS["WALKING"] * 60);
        const etaDriveMins = Math.round((dist * 1.35) / TRAVEL_SPEEDS["DRIVING"] * 60);
        return {
          ...camp,
          distKm: dist,
          distText: dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`,
          etaWalkMins,
          etaDriveMins,
          bedsAvailable: (camp.max_capacity || 300) - (camp.current_occupancy || 120),
        };
      })
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, 3);
  };

  const handleRandomizePair = () => {
    // Pick random volunteer from 50 volunteers
    const randVol = DEMO_VOLUNTEERS_50[Math.floor(Math.random() * DEMO_VOLUNTEERS_50.length)];
    const baseLat = position?.lat || 12.9780;
    const baseLng = position?.lng || 80.2210;

    const volLat = Number((baseLat + (Math.random() - 0.5) * 0.05).toFixed(5));
    const volLng = Number((baseLng + (Math.random() - 0.5) * 0.05).toFixed(5));

    // Pick random SOS request or generate dynamic victim
    let randSos: any;
    if (sosRequests.length > 0) {
      const pick = sosRequests[Math.floor(Math.random() * sosRequests.length)];
      randSos = {
        name: pick.reporter_name,
        phone: pick.phone || "+91 98401 99887",
        details: pick.details || pick.address || "Emergency rescue required",
        lat: pick.latitude,
        lng: pick.longitude,
        level: pick.emergency_level || 4,
      };
    } else {
      const names = ["Suresh Kumar", "Priya Dharshini", "Anand V.", "Divya Dharshini", "Venkatesh S.", "Revathi M."];
      const pickName = names[Math.floor(Math.random() * names.length)];
      randSos = {
        name: `${pickName} (Stranded Victim)`,
        phone: "+91 97890 87654",
        details: "Stranded on rooftop, water level rising",
        lat: Number((baseLat + (Math.random() - 0.5) * 0.05).toFixed(5)),
        lng: Number((baseLng + (Math.random() - 0.5) * 0.05).toFixed(5)),
        level: 5,
      };
    }

    const newRescuer = {
      name: randVol.name,
      phone: randVol.phone,
      vehicle: randVol.vehicle,
      unit: randVol.unit,
      lat: volLat,
      lng: volLng,
    };

    setActiveRescuer(newRescuer);
    setActiveVictim(randSos);
    setAssignedRoutePreset("manoj_to_kavitha");
    setMapCenter({
      lat: (volLat + randSos.lat) / 2,
      lng: (volLng + randSos.lng) / 2,
    });
    setShowTracking(true);
    toast.success(`🎲 Pair Assigned: ${randVol.name} ➔ ${randSos.name}`, {
      description: "Showing live navigation route path between rescuer and victim."
    });
  };

  // Compute route info whenever origin/destination/mode changes
  const computedRoute = useMemo<ComputedRoute | null>(() => {
    if (assignedRoutePreset === "manoj_to_kavitha") {
      return computeRouteInfo(
        { lat: activeRescuer.lat, lng: activeRescuer.lng },
        { lat: activeVictim.lat, lng: activeVictim.lng },
        travelMode,
        `${activeRescuer.name} (Rescuer Base)`,
        `${activeVictim.name} (Victim Location)`
      );
    } else if (assignedRoutePreset === "kavitha_to_camp") {
      const camp = selectedCamp || nearestCamp || (camps.length > 0 ? camps[0] : { latitude: 12.9860, longitude: 80.2270, name: "Safe Shelter #1" });
      return computeRouteInfo(
        { lat: activeVictim.lat, lng: activeVictim.lng },
        { lat: camp.latitude, lng: camp.longitude },
        travelMode,
        `${activeVictim.name} (Victim)`,
        camp.name || "Relief Shelter Camp"
      );
    } else if (activeTab === "victim") {
      const camp = selectedCamp || nearestCamp;
      if (position && camp) {
        return computeRouteInfo(
          position,
          { lat: camp.latitude, lng: camp.longitude },
          travelMode,
          address || "Your Location",
          camp.name || "Relief Camp"
        );
      }
    } else if (activeTab === "rescuer" && selectedSos) {
      const startPoint = position || (camps.length > 0 ? { lat: camps[0].latitude, lng: camps[0].longitude } : null);
      if (startPoint) {
        return computeRouteInfo(
          startPoint,
          { lat: selectedSos.latitude, lng: selectedSos.longitude },
          travelMode,
          address || "Camp Base",
          selectedSos.reporter_name || "Victim Location"
        );
      }
    }
    return null;
  }, [assignedRoutePreset, activeTab, position, selectedCamp, nearestCamp, selectedSos, travelMode, address, camps, activeRescuer, activeVictim]);

  // Auto-show tracking panel when a route is available
  useEffect(() => {
    if (computedRoute) {
      setShowTracking(true);
    }
  }, [computedRoute]);

  // Markers to display on the map
  const getMapMarkers = (): MapMarker[] => {
    const markers: MapMarker[] = [];
    
    // Add current position marker
    if (position) {
      markers.push({
        id: "current-pos",
        lat: position.lat,
        lng: position.lng,
        type: "user",
        title: "Your Location",
        info: address || "Danger Area / Current Position",
      });
    }

    // Explicitly add active Rescuer & Victim markers when navigation preset active
    if (assignedRoutePreset === "manoj_to_kavitha") {
      markers.push({
        id: "active-rescuer-marker",
        lat: activeRescuer.lat,
        lng: activeRescuer.lng,
        type: "volunteer",
        title: `${activeRescuer.name} (Rescuer)`,
        info: `Rescuer Base · Vehicle: ${activeRescuer.vehicle} · Phone: ${activeRescuer.phone}`,
      });
      markers.push({
        id: "active-victim-marker",
        lat: activeVictim.lat,
        lng: activeVictim.lng,
        type: "victim",
        title: `${activeVictim.name} (Victim)`,
        info: `Victim Location · ${activeVictim.details || "Emergency SOS"} · Phone: ${activeVictim.phone}`,
      });
    } else if (assignedRoutePreset === "kavitha_to_camp") {
      const camp = selectedCamp || nearestCamp || (camps.length > 0 ? camps[0] : { latitude: 12.9860, longitude: 80.2270, name: "Safe Shelter #1" });
      markers.push({
        id: "active-victim-marker-camp",
        lat: activeVictim.lat,
        lng: activeVictim.lng,
        type: "victim",
        title: `${activeVictim.name} (Victim)`,
        info: `Evacuation Point · Contact: ${activeVictim.phone}`,
      });
      markers.push({
        id: "camp-shelter-active",
        lat: camp.latitude,
        lng: camp.longitude,
        type: "camp",
        title: camp.name || "Velachery Safe Shelter Camp #1",
        info: `Relief Shelter Destination · Occupancy: ${camp.current_occupancy || 120}/${camp.max_capacity || 300}`,
      });
    }

    // Dense Camp markers up to 200 closest camps for map view performance
    const activeCenter = position || { lat: 12.9780, lng: 80.2210 };
    const sortedCamps = [...camps].sort((a, b) => {
      const dA = haversineDistance(activeCenter.lat, activeCenter.lng, a.latitude, a.longitude);
      const dB = haversineDistance(activeCenter.lat, activeCenter.lng, b.latitude, b.longitude);
      return dA - dB;
    }).slice(0, 200);

    sortedCamps.forEach((camp) => {
      markers.push({
        id: `camp-${camp.id}`,
        lat: camp.latitude,
        lng: camp.longitude,
        type: "camp",
        title: camp.name,
        info: `Capacity: ${camp.current_occupancy}/${camp.max_capacity} · Phone: ${camp.phone || "N/A"}`,
        onClick: () => {
          setSelectedCamp(camp);
          setDetailModal({ isOpen: true, type: "camp", data: camp });
          setMapCenter({ lat: camp.latitude, lng: camp.longitude });
        }
      });
    });

    // Add active SOS markers
    sosRequests.forEach((sos) => {
      markers.push({
        id: `sos-${sos.id}`,
        lat: sos.latitude,
        lng: sos.longitude,
        type: "victim",
        title: `SOS: ${sos.reporter_name}`,
        info: `Level ${sos.emergency_level} · ${sos.address || "Emergency Location"}`,
        onClick: () => {
          setSelectedSos(sos);
          setDetailModal({ isOpen: true, type: "sos", data: sos });
          setMapCenter({ lat: sos.latitude, lng: sos.longitude });
        }
      });
    });

    return markers;
  };

  // Map route config
  const getMapRoutes = (): RouteInfo[] => {
    const routes: RouteInfo[] = [];

    if (assignedRoutePreset === "manoj_to_kavitha") {
      routes.push({
        origin: { lat: activeRescuer.lat, lng: activeRescuer.lng },
        destination: { lat: activeVictim.lat, lng: activeVictim.lng },
        travelMode: travelMode,
        color: "#38bdf8",
      });
    } else if (assignedRoutePreset === "kavitha_to_camp") {
      const camp = selectedCamp || nearestCamp || (camps.length > 0 ? camps[0] : { latitude: 12.9860, longitude: 80.2270 });
      routes.push({
        origin: { lat: activeVictim.lat, lng: activeVictim.lng },
        destination: { lat: camp.latitude, lng: camp.longitude },
        travelMode: travelMode,
        color: "#22c55e",
      });
    } else if (activeTab === "victim") {
      const destinationCamp = selectedCamp || nearestCamp;
      if (position && destinationCamp) {
        routes.push({
          origin: position,
          destination: { lat: destinationCamp.latitude, lng: destinationCamp.longitude },
          travelMode: travelMode,
          color: "#22c55e",
        });
      }
    } else if (activeTab === "rescuer" && selectedSos) {
      const startPoint = position || (camps.length > 0 ? { lat: camps[0].latitude, lng: camps[0].longitude } : null);
      if (startPoint) {
        routes.push({
          origin: startPoint,
          destination: { lat: selectedSos.latitude, lng: selectedSos.longitude },
          travelMode: travelMode,
          color: "#ef4444",
        });
      }
    }

    return routes;
  };

  const handleUseCustomStart = async () => {
    if (!customStart) return;
    setLoading(true);
    try {
      const city = extractCityPrefix(customStart);
      const basePos = position || { lat: 11.5034, lng: 77.2444 }; // e.g. Sathyamangalam coords fallback
      const offsetLat = basePos.lat + (Math.random() - 0.5) * 0.03;
      const offsetLng = basePos.lng + (Math.random() - 0.5) * 0.03;
      
      const newPos = { lat: offsetLat, lng: offsetLng };
      setPosition(newPos);
      setAddress(`${customStart}, Emergency Relief Sector`);
      
      const freshCamps = generate1000Camps(newPos, shelterCountLimit, city);
      setCamps(freshCamps);
      if (freshCamps.length > 0) {
        setSelectedCamp(freshCamps[0]);
        setMapCenter({ lat: freshCamps[0].latitude, lng: freshCamps[0].longitude });
      }
      toast.success(`📍 Location Set: ${city}`, {
        description: `Generated local relief shelter camps for ${city}!`
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectionsCalculated = (info: { distance: string; duration: string; steps: string[] }) => {
    setRouteDetails(info);
  };

  const getGoogleMapsNavUrl = () => {
    if (!computedRoute) return "#";
    const { originCoords, destCoords, travelMode: mode } = computedRoute;
    return `https://www.google.com/maps/dir/?api=1&origin=${originCoords.lat},${originCoords.lng}&destination=${destCoords.lat},${destCoords.lng}&travelmode=${mode.toLowerCase()}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm" className="gap-1.5 font-bold text-xs border-primary/30 text-primary hover:bg-primary/10">
              <Link to="/dashboard">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Link>
            </Button>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center shadow-lg">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div className="leading-tight hidden sm:block">
                <div className="text-sm font-bold font-outfit text-foreground">Rescue Route Finder</div>
                <div className="text-[10px] text-muted-foreground">Disaster Navigation Portal</div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="default" size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold text-xs gap-1.5 shadow-md">
              <Link to="/dashboard">
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1.5 border-border hover:bg-muted/80 font-semibold text-xs">
              <Link to="/facilities">
                <Tent className="w-4 h-4 text-emerald-600" />
                <span>Relief Facilities</span>
              </Link>
            </Button>
            <Button asChild variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700 font-bold gap-1 shadow-lg">
              <Link to="/emergency">
                <Siren className="w-3.5 h-3.5" /> SOS Emergency
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="mx-auto max-w-7xl px-4 lg:px-6 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline mb-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Command Dashboard
            </Link>
            <h1 className="text-3xl font-black tracking-tight font-outfit">Route Finder & Danger Search</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Find safe paths to active relief camps or route rescuers directly to victims in need.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={isDemoMode ? "default" : "outline"}
              onClick={() => {
                const nextDemo = !isDemoMode;
                setIsDemoMode(nextDemo);
                if (nextDemo) {
                  setPosition({ lat: 12.9780, lng: 80.2210 });
                  setAddress("Velachery 100 Feet Bypass Road, Emergency Sector 4 (Demo Location)");
                  toast.success("🎮 Demo Emergency Mode Active!", {
                    description: "Loaded test victim coordinates & nearest camp rescue route path."
                  });
                } else {
                  getPosition();
                }
              }}
              className={`gap-1.5 text-xs font-bold ${
                isDemoMode ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-emerald-500/40 text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              🎮 {isDemoMode ? "Exit Demo Mode" : "Test Demo Emergency Route"}
            </Button>
            <Button size="sm" onClick={fetchCampsAndSos} variant="outline" className="gap-1 text-xs font-semibold">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
            </Button>
          </div>
        </div>



        {/* TABS CONTAINER */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as any); setRouteDetails(null); setShowTracking(false); }} className="space-y-6">
          <TabsList className="grid grid-cols-1 sm:grid-cols-2 w-full max-w-2xl bg-card border border-border rounded-2xl p-1.5 shadow-md h-auto gap-1.5">
            <TabsTrigger
              value="victim"
              className="h-11 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md text-muted-foreground hover:text-foreground"
            >
              <span className="text-base">🏃</span>
              <span className="truncate">Victim Perspective (To Relief Camp)</span>
            </TabsTrigger>
            <TabsTrigger
              value="rescuer"
              className="h-11 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md text-muted-foreground hover:text-foreground"
            >
              <span className="text-base">🛥️</span>
              <span className="truncate">Camp Rescuer (To Victim SOS)</span>
            </TabsTrigger>
          </TabsList>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* LEFT: PANEL */}
            <div className="space-y-5 lg:col-span-1">
              {/* TABS CONTENT: VICTIM */}
              <TabsContent value="victim" className="space-y-4 mt-0">
                <Card className="border border-border shadow-card bg-card/60 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      1. Define Starting Position
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Set where you are located to find nearest safe shelter camps.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Button
                        onClick={getPosition}
                        disabled={gpsLoading}
                        className="w-full bg-primary/10 text-primary hover:bg-primary/25 border-0 text-xs font-semibold gap-1.5"
                      >
                        {gpsLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Compass className="w-3.5 h-3.5" />
                        )}
                        Use Current GPS Location
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Custom Starting Location Address</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g. Adyar Bridge, Chennai"
                          value={customStart}
                          onChange={(e) => setCustomStart(e.target.value)}
                          className="text-xs"
                        />
                        <Button size="sm" onClick={handleUseCustomStart} className="text-xs shrink-0 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                          Set
                        </Button>
                      </div>
                    </div>

                    {position && (
                      <div className="bg-muted/40 p-3 rounded-xl border border-border text-xs space-y-1">
                        <p className="font-semibold text-foreground">Current GPS coordinates:</p>
                        <p className="font-mono text-muted-foreground">{position.lat.toFixed(5)}, {position.lng.toFixed(5)}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{address}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-border shadow-card bg-card/60 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Tent className="w-4 h-4 text-green-600" />
                      2. Choose Relief Camp
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {camps.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No active relief camps found.</p>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Select Camp</Label>
                          <Select
                            value={selectedCamp ? String(selectedCamp.id) : nearestCamp ? String(nearestCamp.id) : ""}
                            onValueChange={(v) => {
                              const found = camps.find((c) => String(c.id) === v);
                              if (found) {
                                setSelectedCamp(found);
                                setMapCenter({ lat: found.latitude, lng: found.longitude });
                                setDetailModal({ isOpen: true, type: "camp", data: found });
                              }
                            }}
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue placeholder="Choose relief camp" />
                            </SelectTrigger>
                            <SelectContent>
                              {camps.map((camp) => (
                                <SelectItem key={camp.id} value={String(camp.id)}>
                                  {camp.name} ({camp.current_occupancy}/{camp.max_capacity})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* TOP 3 GPS RECOMMENDED SHELTERS LIST */}
                        <div className="space-y-3 pt-2 border-t border-border/50">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              Top 3 Recommended Safe Shelters
                            </p>
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                              GPS Ranked
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            {getTop3NearestCamps().map((camp, idx) => {
                              const isSelected = selectedCamp?.id === camp.id;
                              const rankBadge = idx === 0 ? "🥇 #1 Nearest" : idx === 1 ? "🥈 #2 Nearest" : "🥉 #3 Nearest";

                              return (
                                <div
                                  key={camp.id}
                                  onClick={() => {
                                    setSelectedCamp(camp);
                                    setAssignedRoutePreset("kavitha_to_camp");
                                    setMapCenter({ lat: camp.latitude, lng: camp.longitude });
                                    setShowTracking(true);
                                    
                                    // Direct Google Maps navigation popup
                                    const originLat = position?.lat || 12.9810;
                                    const originLng = position?.lng || 80.2240;
                                    const gmapUrl = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${camp.latitude},${camp.longitude}&travelmode=${travelMode.toLowerCase()}`;
                                    window.open(gmapUrl, "_blank");

                                    toast.success(`Opening Google Maps for ${camp.name}!`, {
                                      description: `Navigating to ${camp.name} (${camp.distText} · ${travelMode === "WALKING" ? camp.etaWalkMins : camp.etaDriveMins} mins)`
                                    });
                                  }}
                                  className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                                    isSelected
                                      ? "bg-emerald-950/60 border-emerald-400 shadow-lg shadow-emerald-500/10"
                                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-xs text-slate-100 flex items-center gap-1.5 truncate max-w-[170px]">
                                      {camp.name}
                                    </span>
                                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[9px] shrink-0">
                                      {rankBadge}
                                    </Badge>
                                  </div>

                                  <p className="text-[10px] text-slate-400 line-clamp-1">{camp.address || "Emergency Relief Sector"}</p>

                                  {/* Distance, ETA, Capacity */}
                                  <div className="grid grid-cols-3 gap-1.5 bg-slate-950/60 p-2 rounded-lg text-center font-mono">
                                    <div>
                                      <p className="text-[9px] text-slate-500">Distance</p>
                                      <p className="text-xs font-bold text-cyan-300">{camp.distText}</p>
                                    </div>
                                    <div>
                                      <p className="text-[9px] text-slate-500">Est. Time</p>
                                      <p className="text-xs font-bold text-emerald-300">
                                        {travelMode === "WALKING" ? `${camp.etaWalkMins}m 🚶` : `${camp.etaDriveMins}m 🚗`}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[9px] text-slate-500">Beds Free</p>
                                      <p className="text-xs font-bold text-amber-300">{camp.bedsAvailable} / {camp.max_capacity || 300}</p>
                                    </div>
                                  </div>

                                  {/* Amenities & Action */}
                                  <div className="flex items-center justify-between pt-1">
                                    <div className="flex items-center gap-1 text-[9px] text-slate-400">
                                      <span className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-400">🩺 Doctors</span>
                                      <span className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400">⚡ Power</span>
                                    </div>

                                    <Button
                                      size="sm"
                                      className={`text-[10px] h-7 font-bold gap-1 shadow ${
                                        isSelected ? "bg-emerald-500 text-slate-950" : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                                      }`}
                                    >
                                      <Navigation className="w-3 h-3" />
                                      {isSelected ? "Navigating ➔" : "Evacuate Here"}
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TABS CONTENT: RESCUER */}
              <TabsContent value="rescuer" className="space-y-4 mt-0">
                <Card className="border border-border shadow-card bg-card/60 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Siren className="w-4 h-4 text-red-500" />
                      1. Select Active Victim SOS
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Pick an emergency request to view route & distance.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : sosRequests.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No active emergency SOS requests found.</p>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {sosRequests.map((sos) => {
                          const startPt = position || (camps.length > 0 ? { lat: camps[0].latitude, lng: camps[0].longitude } : null);
                          const distToSos = startPt ? haversineDistance(startPt.lat, startPt.lng, sos.latitude, sos.longitude) : null;
                          const distText = distToSos !== null
                            ? distToSos < 1 ? `${Math.round(distToSos * 1000)} m` : `${distToSos.toFixed(1)} km`
                            : null;
                          const etaMins = distToSos !== null ? Math.round((distToSos * 1.35) / TRAVEL_SPEEDS[travelMode] * 60) : null;

                          return (
                          <div
                            key={sos.id}
                            onClick={() => {
                              setSelectedSos(sos);
                              setMapCenter({ lat: sos.latitude, lng: sos.longitude });
                              setDetailModal({ isOpen: true, type: "sos", data: sos });
                            }}
                            className={`p-3 rounded-xl border cursor-pointer transition-all text-xs space-y-2 ${
                              selectedSos?.id === sos.id
                                ? "bg-red-500/10 border-red-500 shadow-md shadow-red-500/10"
                                : "bg-muted/50 border-border hover:bg-muted hover:border-red-500/30"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground truncate max-w-[120px]">
                                {sos.reporter_name}
                              </span>
                              <Badge className="bg-red-600 text-white text-[9px] scale-90">
                                Lvl {sos.emergency_level}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground line-clamp-1">{sos.address || `${sos.latitude}, ${sos.longitude}`}</p>
                            <div className="flex items-center justify-between pt-1 border-t border-border/40">
                              <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                                <span>Battery: {sos.battery_level || "N/A"}%</span>
                              </div>
                              {distText && (
                                <div className="flex items-center gap-1.5 text-[9px]">
                                  <span className="font-mono font-bold text-cyan-400">📍 {distText}</span>
                                  <span className="text-slate-500">·</span>
                                  <span className="font-mono font-bold text-emerald-400">⏱ {etaMins} min</span>
                                </div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAssignModal({ isOpen: true, sos });
                              }}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] h-7 gap-1 shadow"
                            >
                              <Truck className="w-3 h-3" />
                              Assign Person / Unit to Help
                            </Button>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 50 Active Rescue Volunteers List */}
                <Card className="border border-border shadow-card bg-card/60 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-emerald-600" />
                        Dispatched Volunteers & Units (50)
                      </span>
                      <Badge className="bg-emerald-500/10 text-emerald-700 border-0 text-[10px]">
                        50 On-Duty
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Live list of assigned volunteer rescue teams & boat operators.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {DEMO_VOLUNTEERS_50.map((vol) => (
                        <div key={vol.id} className="p-2.5 rounded-xl border border-border/80 bg-muted/30 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground">{vol.name}</span>
                            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {vol.eta}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>{vol.vehicle}</span>
                            <a href={`tel:${vol.phone}`} className="text-primary font-bold hover:underline">
                              {vol.phone}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ROUTE CONFIGURATION */}
              <Card className="border border-border shadow-card bg-card/60 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary" />
                    Route Navigation Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Transport Mode</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant={travelMode === "WALKING" ? "default" : "outline"}
                        onClick={() => setTravelMode("WALKING")}
                        className="text-xs"
                      >
                        🚶 Walking
                      </Button>
                      <Button
                        size="sm"
                        variant={travelMode === "DRIVING" ? "default" : "outline"}
                        onClick={() => setTravelMode("DRIVING")}
                        className="text-xs"
                      >
                        🚗 Driving / Rescue Vehicle
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* === ROUTE TRACKING PANEL === */}
              {computedRoute && showTracking && (
                <Card className="border-2 border-cyan-500/40 shadow-lg shadow-cyan-500/10 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="pb-2 border-b border-cyan-800/30">
                    <CardTitle className="text-sm font-bold flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
                        </span>
                        <RouteIcon className="w-4 h-4 text-cyan-400" />
                        Route Tracking
                      </span>
                      <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px]">
                        {travelMode === "WALKING" ? "🚶 Walking" : "🚗 Driving"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {/* Distance & Time Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <MapPinned className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Distance</span>
                        </div>
                        <p className="text-2xl font-black text-cyan-300 font-mono">{computedRoute.distanceText}</p>
                      </div>
                      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Est. Time</span>
                        </div>
                        <p className="text-2xl font-black text-emerald-300 font-mono">{computedRoute.durationText}</p>
                      </div>
                    </div>

                    {/* Route Waypoints Visualization */}
                    <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 space-y-3">
                      {/* Origin */}
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-7 h-7 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center">
                            <Target className="w-3.5 h-3.5 text-cyan-400" />
                          </div>
                          <div className="w-0.5 h-8 bg-gradient-to-b from-cyan-400 to-emerald-400 my-1" />
                        </div>
                        <div className="pt-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">From</p>
                          <p className="text-xs font-bold text-slate-200 truncate max-w-[180px]">{computedRoute.originLabel}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {computedRoute.originCoords.lat.toFixed(4)}, {computedRoute.originCoords.lng.toFixed(4)}
                          </p>
                        </div>
                      </div>

                      {/* Route info line */}
                      <div className="flex items-center gap-3 pl-[10px]">
                        <div className="flex flex-col items-center">
                          <div className="w-5 h-5 rounded-md bg-slate-700 border border-slate-600 flex items-center justify-center">
                            <Zap className="w-3 h-3 text-amber-400" />
                          </div>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg px-3 py-1.5 text-[10px]">
                          <span className="text-amber-300 font-bold">{computedRoute.distanceText}</span>
                          <span className="text-slate-400 mx-1.5">·</span>
                          <span className="text-emerald-300 font-bold">{computedRoute.durationText}</span>
                          <span className="text-slate-400 mx-1.5">·</span>
                          <span className="text-slate-400">{travelMode === "WALKING" ? "On foot" : "Vehicle"}</span>
                        </div>
                      </div>

                      {/* Destination */}
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-7 h-7 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                        </div>
                        <div className="pt-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">To</p>
                          <p className="text-xs font-bold text-slate-200 truncate max-w-[180px]">{computedRoute.destinationLabel}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {computedRoute.destCoords.lat.toFixed(4)}, {computedRoute.destCoords.lng.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      <a
                        href={getGoogleMapsNavUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-lg shadow-emerald-900/30">
                          <Navigation className="w-4 h-4" />
                          Navigate in Google Maps
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </a>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTracking(false)}
                        className="text-xs text-slate-400 hover:text-slate-200 border-slate-700 hover:bg-slate-800"
                      >
                        Collapse Tracking Panel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Collapsed tracking summary */}
              {computedRoute && !showTracking && (
                <button
                  type="button"
                  onClick={() => setShowTracking(true)}
                  className="w-full p-3 rounded-xl border border-cyan-500/30 bg-slate-900/80 flex items-center justify-between text-xs hover:bg-slate-800/80 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <RouteIcon className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-slate-200">Route Active</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-cyan-300">{computedRoute.distanceText}</span>
                    <span className="text-slate-500">·</span>
                    <span className="font-mono font-bold text-emerald-300">{computedRoute.durationText}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </div>
                </button>
              )}

              {/* LIVE DISPATCH TICKER */}
              <Card className="border border-border shadow-card bg-card/60 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                    Live Operations Dispatch Feed
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {liveLogs.map((log, idx) => (
                      <div key={idx} className="p-2 rounded bg-muted/30 border border-border/30 text-[10px] leading-relaxed transition-all">
                        {log}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT: MAP AND DIRECTIONS */}
            <div className="space-y-5 lg:col-span-2">
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card relative">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Compass className="w-4 h-4 text-primary" />
                    <span>Disaster Navigation Map View</span>
                  </div>
                  {position && (
                    <Badge className="bg-green-500/10 text-green-700 border-green-500/20 text-xs">
                      GPS Active ✓
                    </Badge>
                  )}
                </div>

                <GoogleMap
                  center={mapCenter || position || undefined}
                  zoom={13}
                  markers={getMapMarkers()}
                  routes={getMapRoutes()}
                  onRouteCalculated={handleDirectionsCalculated}
                  className="h-[450px] w-full"
                />
              </div>

              {/* Turn-by-Turn Steps (from Google Directions API) */}
              {routeDetails && routeDetails.steps.length > 0 && (
                <Card className="border border-border shadow-card">
                  <CardHeader className="pb-3 border-b border-border">
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-green-600" />
                      Turn-by-Turn Safe Path Directions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {routeDetails.steps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-xs text-foreground/90 pb-2 border-b border-border/40 last:border-b-0">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span dangerouslySetInnerHTML={{ __html: step }} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* CONDITIONAL DASHBOARD: RESCUER MISSIONS LIST OR VICTIM EVACUATION SUMMARY */}
              {activeTab === "rescuer" || assignedRoutePreset === "manoj_to_kavitha" ? (
                /* ALL ASSIGNED RESCUE LOCATIONS & MISSIONS DASHBOARD (RESCUER MODE ONLY) */
                <Card className="border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-md">
                  <CardHeader className="pb-3 border-b border-slate-800 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-cyan-400" />
                        All Active Assigned Rescue Locations ({ASSIGNED_MISSIONS.length} Active Missions)
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-400">
                        Click any assigned rescue location below to view its live map route & navigation coordinates.
                      </CardDescription>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                      5 Units Active
                    </Badge>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-1 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {ASSIGNED_MISSIONS.map((mission) => {
                        const isSelected = activeRescuer.name === mission.rescuer.name && activeVictim.name === mission.victim.name;
                        return (
                          <div
                            key={mission.id}
                            onClick={() => {
                              if (isSelected) {
                                const gmapUrl = `https://www.google.com/maps/dir/?api=1&origin=${mission.rescuer.lat},${mission.rescuer.lng}&destination=${mission.victim.lat},${mission.victim.lng}&travelmode=${travelMode.toLowerCase()}`;
                                window.open(gmapUrl, "_blank");
                                toast.success(`Opening Google Maps for ${mission.rescuer.name} ➔ ${mission.victim.name}!`);
                              } else {
                                setActiveRescuer(mission.rescuer);
                                setActiveVictim(mission.victim);
                                setAssignedRoutePreset("manoj_to_kavitha");
                                setMapCenter({
                                  lat: (mission.rescuer.lat + mission.victim.lat) / 2,
                                  lng: (mission.rescuer.lng + mission.victim.lng) / 2,
                                });
                                setShowTracking(true);
                                toast.info(`Active View Updated: ${mission.rescuer.name} ➔ ${mission.victim.name}`);
                              }
                            }}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isSelected
                                ? "bg-cyan-950/60 border-cyan-400 shadow-lg shadow-cyan-500/10"
                                : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50"
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-cyan-400">🔵 {mission.rescuer.name}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-xs font-bold text-red-400">🔴 {mission.victim.name}</span>
                                <Badge className={`text-[10px] ${mission.statusColor}`}>
                                  {mission.status}
                                </Badge>
                              </div>

                              <p className="text-[11px] text-slate-300 line-clamp-1">
                                📍 {mission.victim.address} · <span className="text-slate-400">{mission.victim.details}</span>
                              </p>

                              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                                <span>Vehicle: {mission.rescuer.vehicle}</span>
                                <span>·</span>
                                <span>Phone: {mission.rescuer.phone}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right font-mono">
                                <p className="text-xs font-bold text-cyan-300">📏 {mission.distance}</p>
                                <p className="text-[10px] font-bold text-emerald-400">⏱ {mission.duration}</p>
                              </div>

                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isSelected) {
                                    const gmapUrl = `https://www.google.com/maps/dir/?api=1&origin=${mission.rescuer.lat},${mission.rescuer.lng}&destination=${mission.victim.lat},${mission.victim.lng}&travelmode=${travelMode.toLowerCase()}`;
                                    window.open(gmapUrl, "_blank");
                                    toast.success(`Opening Google Maps for ${mission.rescuer.name} ➔ ${mission.victim.name}!`);
                                  } else {
                                    setActiveRescuer(mission.rescuer);
                                    setActiveVictim(mission.victim);
                                    setAssignedRoutePreset("manoj_to_kavitha");
                                    setMapCenter({
                                      lat: (mission.rescuer.lat + mission.victim.lat) / 2,
                                      lng: (mission.rescuer.lng + mission.victim.lng) / 2,
                                    });
                                    setShowTracking(true);
                                    toast.info(`Active View Updated: ${mission.rescuer.name} ➔ ${mission.victim.name}`);
                                  }
                                }}
                                className={`text-xs font-bold gap-1 shadow transition-all ${
                                  isSelected
                                    ? "bg-cyan-500 hover:bg-cyan-600 text-slate-950 shadow-cyan-500/20"
                                    : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                                }`}
                              >
                                <Navigation className="w-3 h-3" />
                                {isSelected ? "Active View (GMap ↗)" : "View Route"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* VICTIM EVACUATION SHELTER DIRECT NAVIGATION CARD */
                <Card className="border border-emerald-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 shadow-2xl backdrop-blur-md">
                  <CardHeader className="pb-3 border-b border-emerald-800/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tent className="w-5 h-5 text-emerald-400" />
                        <CardTitle className="text-sm font-bold text-slate-100">
                          Active Evacuation Target: {selectedCamp?.name || nearestCamp?.name || "Relief Shelter Camp"}
                        </CardTitle>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                        Safe Zone
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
                      <p className="text-xs text-slate-300">
                        📍 Destination: <span className="font-bold text-white">{selectedCamp?.address || nearestCamp?.address || "Emergency Relief Sector #1"}</span>
                      </p>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="text-cyan-400 font-bold">
                          📏 Distance: {computedRoute ? computedRoute.distanceText : "1.2 km"}
                        </span>
                        <span className="text-emerald-400 font-bold">
                          ⏱ Est. Evacuation Time: {computedRoute ? computedRoute.durationText : "14 mins"} ({travelMode === "WALKING" ? "🚶 Walking" : "🚗 Vehicle"})
                        </span>
                      </div>
                    </div>

                    <a
                      href={getGoogleMapsNavUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-lg shadow-emerald-900/40 py-3 text-sm">
                        <Navigation className="w-4 h-4" />
                        Open Google Maps Turn-by-Turn Navigation ↗
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </Tabs>
      </main>

      {/* NEAT EMERGENCY & RELIEF CAMP DETAIL MODAL */}
      <Dialog open={detailModal.isOpen} onOpenChange={(open) => setDetailModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100 shadow-2xl">
          {detailModal.data && detailModal.type === "sos" && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <Badge className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 flex items-center gap-1">
                    <Siren className="w-3.5 h-3.5" />
                    EMERGENCY LEVEL {detailModal.data.emergency_level}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {detailModal.data.id}
                  </span>
                </div>
                <DialogTitle className="text-xl font-bold text-slate-100 mt-2 flex items-center gap-2">
                  <span>🚨</span> {detailModal.data.reporter_name}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Stranded Emergency Victim Alert
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2 text-xs">
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Emergency Details</p>
                  <p className="font-semibold text-slate-200">{detailModal.data.details || detailModal.data.emergency_type}</p>
                  <p className="text-slate-400 text-[11px] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-400" />
                    {detailModal.data.address}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                    <span className="text-slate-400 block text-[10px]">Battery Level</span>
                    <span className="font-bold text-amber-400 font-mono">{detailModal.data.battery_level || "N/A"}%</span>
                  </div>
                  <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                    <span className="text-slate-400 block text-[10px]">GPS Coordinates</span>
                    <span className="font-mono text-cyan-300 font-bold">{detailModal.data.latitude.toFixed(4)}, {detailModal.data.longitude.toFixed(4)}</span>
                  </div>
                </div>

                {position && (
                  <div className="bg-cyan-950/40 border border-cyan-700/50 p-3 rounded-xl flex items-center justify-between text-cyan-200">
                    <div>
                      <span className="text-[10px] text-cyan-400 font-bold block uppercase">Distance to Victim</span>
                      <span className="text-base font-black font-mono">
                        {haversineDistance(position.lat, position.lng, detailModal.data.latitude, detailModal.data.longitude).toFixed(1)} km
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 font-bold block uppercase">Est. Rescuer ETA</span>
                      <span className="text-base font-black font-mono text-emerald-300">
                        {Math.round((haversineDistance(position.lat, position.lng, detailModal.data.latitude, detailModal.data.longitude) * 1.35 / 40) * 60)} min
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
                <Button
                  onClick={() => {
                    const sosToAssign = detailModal.data;
                    setDetailModal(prev => ({ ...prev, isOpen: false }));
                    setAssignModal({ isOpen: true, sos: sosToAssign });
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-lg shadow-emerald-900/30"
                >
                  <Truck className="w-3.5 h-3.5" />
                  Assign Person / Unit to Help
                </Button>
                <Button
                  onClick={() => {
                    setSelectedSos(detailModal.data);
                    setMapCenter({ lat: detailModal.data.latitude, lng: detailModal.data.longitude });
                    setActiveTab("rescuer");
                    setDetailModal(prev => ({ ...prev, isOpen: false }));
                    toast.success(`Rescue Route set to ${detailModal.data.reporter_name}`);
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold gap-1.5 shadow-lg shadow-red-900/30"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Locate & Dispatch Rescue Route
                </Button>
              </DialogFooter>
            </>
          )}

          {detailModal.data && detailModal.type === "camp" && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 flex items-center gap-1">
                    <Tent className="w-3.5 h-3.5" />
                    RELIEF SHELTER
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Capacity: {detailModal.data.current_occupancy}/{detailModal.data.max_capacity}
                  </span>
                </div>
                <DialogTitle className="text-xl font-bold text-slate-100 mt-2 flex items-center gap-2">
                  <span>⛺</span> {detailModal.data.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Disaster Relief Shelter Facility
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2 text-xs">
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Address & Location</p>
                  <p className="font-semibold text-slate-200">{detailModal.data.address}</p>
                  <p className="text-slate-400 text-[11px]">
                    GPS: {detailModal.data.latitude.toFixed(4)}, {detailModal.data.longitude.toFixed(4)}
                  </p>
                </div>

                {detailModal.data.supplies && (
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Available Disaster Supplies</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {detailModal.data.supplies.map((s: string, i: number) => (
                        <span key={i} className="bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded text-[10px]">
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {position && (
                  <div className="bg-emerald-950/40 border border-emerald-700/50 p-3 rounded-xl flex items-center justify-between text-emerald-200">
                    <div>
                      <span className="text-[10px] text-emerald-400 font-bold block uppercase">Distance from You</span>
                      <span className="text-base font-black font-mono">
                        {haversineDistance(position.lat, position.lng, detailModal.data.latitude, detailModal.data.longitude).toFixed(1)} km
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-cyan-400 font-bold block uppercase">Walking Time</span>
                      <span className="text-base font-black font-mono text-cyan-300">
                        {Math.round((haversineDistance(position.lat, position.lng, detailModal.data.latitude, detailModal.data.longitude) * 1.25 / 5) * 60)} min
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
                {detailModal.data.phone && (
                  <a href={`tel:${detailModal.data.phone}`} className="w-full">
                    <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-bold gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      Call Camp ({detailModal.data.phone})
                    </Button>
                  </a>
                )}
                <Button
                  onClick={() => {
                    setSelectedCamp(detailModal.data);
                    setMapCenter({ lat: detailModal.data.latitude, lng: detailModal.data.longitude });
                    setActiveTab("victim");
                    setDetailModal(prev => ({ ...prev, isOpen: false }));
                    toast.success(`Route set to shelter ${detailModal.data.name}`);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-lg shadow-emerald-900/30"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Route to this Shelter
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* VOLUNTEER RESCUE ASSIGNMENT MODAL */}
      <Dialog open={assignModal.isOpen} onOpenChange={(open) => setAssignModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-800 text-slate-100 shadow-2xl">
          {assignModal.sos && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <Badge className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 flex items-center gap-1">
                    <Siren className="w-3.5 h-3.5" />
                    RESCUE ASSIGNMENT COMMAND
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-mono">
                    SOS #{assignModal.sos.id}
                  </span>
                </div>
                <DialogTitle className="text-xl font-bold text-slate-100 mt-2 flex items-center gap-2">
                  <span>🛥️</span> Assign Rescue Unit to {assignModal.sos.reporter_name}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Select an available volunteer team to dispatch to the victim's location.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                {/* Victim & Camp Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-red-500/30 space-y-1">
                    <p className="text-[10px] font-bold text-red-400 uppercase">🚨 Victim Location</p>
                    <p className="font-bold text-slate-100 truncate">{assignModal.sos.reporter_name}</p>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{assignModal.sos.address}</p>
                    <p className="text-[10px] text-cyan-300 font-mono">
                      Distance: {position ? haversineDistance(position.lat, position.lng, assignModal.sos.latitude, assignModal.sos.longitude).toFixed(1) : "1.8"} km
                    </p>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-emerald-500/30 space-y-1">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase">⛺ Target Shelter</p>
                    <p className="font-bold text-slate-100 truncate">{selectedCamp?.name || camps[0]?.name || "Safe Shelter #1"}</p>
                    <p className="text-[10px] text-slate-400 line-clamp-1">Capacity: 120/300</p>
                    <p className="text-[10px] text-emerald-300 font-mono">Nearest Distance: 1.2 km</p>
                  </div>
                </div>

                {/* Available Volunteers Selection */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Available On-Duty Volunteers (5)</span>
                    <span className="text-[10px] text-emerald-400">Ready to Dispatch</span>
                  </p>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {DEMO_VOLUNTEERS_50.slice(0, 5).map((vol) => (
                      <div
                        key={vol.id}
                        className="p-3 rounded-xl border border-slate-700/80 bg-slate-800/60 flex items-center justify-between hover:border-cyan-500/50 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-100">{vol.name}</span>
                            <Badge className="bg-emerald-950 text-emerald-300 border-emerald-800 text-[9px]">
                              {vol.unit}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-slate-400">{vol.vehicle}</p>
                          <p className="text-[10px] text-cyan-400 font-mono">📱 {vol.phone} · {vol.eta}</p>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedSos(assignModal.sos);
                            setAssignedRoutePreset("manoj_to_kavitha");
                            setShowTracking(true);
                            setMapCenter({ lat: 12.9865, lng: 80.2285 });
                            setLiveLogs(prev => [`🛥️ ${vol.name} assigned to rescue ${assignModal.sos.reporter_name}! Navigation path active.`, ...prev.slice(0, 6)]);
                            toast.success(`Rescue Unit Dispatched!`, {
                              description: `${vol.name} (${vol.vehicle}) assigned to rescue ${assignModal.sos.reporter_name}. Showing both on live route.`
                            });
                            setAssignModal({ isOpen: false, sos: null });
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1 shrink-0"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          Assign & Dispatch
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
