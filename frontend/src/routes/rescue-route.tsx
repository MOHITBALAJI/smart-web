import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
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
  LayoutDashboard,
  Home
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
import { useAuth } from "@/context/AuthContext";


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
    durationText = `${hrs} hr ${mins} min`;
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

// Generate realistic grid camps around user position
function generateGridCamps(centerLat: number, centerLng: number, userCity: string, count: number) {
  const sectorNames = [
    "Emergency Sector", "Relief Hub", "Disaster Base", "High School Shelter",
    "Indoor Stadium Camp", "Primary School Safe Zone", "Community Hall Camp",
    "Government College Base", "Parish Hall Shelter", "Sports Complex Camp"
  ];

  const generatedCamps: any[] = [];
  let idCounter = 1;

  const innerOffsets = [
    { lat: 0.007, lng: 0.009 },
    { lat: -0.009, lng: 0.012 },
    { lat: 0.013, lng: -0.008 },
    { lat: -0.011, lng: -0.014 }
  ];

  innerOffsets.forEach((off, idx) => {
    const lat = centerLat + off.lat;
    const lng = centerLng + off.lng;
    const sector = sectorNames[idx % sectorNames.length];
    generatedCamps.push({
      id: `camp-shelter-${idCounter}`,
      name: `${userCity} ${sector} #${idx + 1}`,
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

const AVAILABLE_VOLUNTEERS = [
  {
    id: "vol-1",
    full_name: "Manoj Kumar",
    phone: "+91 98765 43210",
    vehicle_type: "Rescue Motor Boat #101",
    is_available: true,
  },
  {
    id: "vol-2",
    full_name: "Karthik K.",
    phone: "+91 98765 12345",
    vehicle_type: "Emergency Ambulance #204",
    is_available: true,
  },
  {
    id: "vol-3",
    full_name: "Vigneshwaran S.",
    phone: "+91 98765 67890",
    vehicle_type: "Inflatable Water Rescue Raft #305",
    is_available: true,
  },
  {
    id: "vol-4",
    full_name: "Surya S.",
    phone: "+91 98765 99887",
    vehicle_type: "High-Clearance Offroad Truck #402",
    is_available: true,
  },
];

const getMockSosList = (userLat: number, userLng: number) => [
  {
    id: "mock-sos-1",
    reporter_name: "Kavitha R. & Family",
    reporter_phone: "+91 94440 12345",
    latitude: userLat + 0.008,
    longitude: userLng + 0.005,
    address: "No 42, River View Street, Adyar, Chennai",
    emergency_type: "flood_rescue",
    emergency_level: 5,
    description: "4 family members stranded on terrace, 5ft flood water rising",
    battery_level: 95,
    status: "pending",
    assigned_volunteer_id: null,
    volunteer_name: null,
  },
  {
    id: "mock-sos-2",
    reporter_name: "Ramesh K. (Asthma Emergency)",
    reporter_phone: "+91 98402 34567",
    latitude: userLat - 0.006,
    longitude: userLng + 0.011,
    address: "100ft Bypass Road, Sector 3",
    emergency_type: "medical",
    emergency_level: 5,
    description: "Senior citizen with severe asthma needs oxygen cylinder transport",
    battery_level: 70,
    status: "pending",
    assigned_volunteer_id: null,
    volunteer_name: null,
  },
  {
    id: "mock-sos-3",
    reporter_name: "Priya V. & Toddler",
    reporter_phone: "+91 98403 45678",
    latitude: userLat + 0.012,
    longitude: userLng - 0.007,
    address: "Main Canal Road, Sector 12",
    emergency_type: "stranded",
    emergency_level: 4,
    description: "Pregnant woman stranded on 2nd floor, needs food & water",
    battery_level: 82,
    status: "pending",
    assigned_volunteer_id: null,
    volunteer_name: null,
  },
  {
    id: "mock-sos-4",
    reporter_name: "Rajesh S. & Family",
    reporter_phone: "+91 98404 56789",
    latitude: userLat - 0.010,
    longitude: userLng - 0.012,
    address: "East Coast Road Crossing",
    emergency_type: "structural_damage",
    emergency_level: 5,
    description: "House wall collapsed due to severe water logging, 4 people trapped",
    battery_level: 45,
    status: "pending",
    assigned_volunteer_id: null,
    volunteer_name: null,
  },
];

export const Route = createFileRoute("/rescue-route")({
  component: PublicRescueRoutePage,
});

function PublicRescueRoutePage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-background/95 backdrop-blur-md border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.history.back()}
          className="shrink-0 text-muted-foreground hover:text-foreground h-8 w-8 rounded-lg"
          title="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <RouteIcon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">Rescue Route Finder</h1>
            <p className="text-xs text-muted-foreground">Disaster Navigation & Safe Path Finder</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <Home className="w-3.5 h-3.5" /> Home
          </Link>
          <Link to="/facilities" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <Tent className="w-3.5 h-3.5" /> Shelters
          </Link>
          <Link to="/helpline" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" /> Helplines
          </Link>
        </div>
      </header>
      {/* Main Content */}
      <main className="p-4 md:p-6">
        <RescueRouteFinderComponent />
      </main>
    </div>
  );
}

function RescueRouteFinderComponent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"victim" | "rescuer">("victim");
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [customStart, setCustomStart] = useState<string>("");
  const [customStartCoords, setCustomStartCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCamp, setSelectedCamp] = useState<any | null>(null);
  const [selectedSos, setSelectedSos] = useState<any | null>(null);
  
  const [shelterCountLimit, setShelterCountLimit] = useState<number>(1000);
  const [assignedRoutePreset, setAssignedRoutePreset] = useState<"manoj_to_kavitha" | "kavitha_to_camp" | "custom">("kavitha_to_camp");

  const [activeRescuer, setActiveRescuer] = useState({
    name: "Manoj Kumar (Volunteer Rescuer)",
    phone: "+91 98765 43210",
    vehicle: "Rescue Motor Boat Unit #101",
    lat: 12.9750,
    lng: 80.2200,
    status: "En Route to Victim"
  });

  const [activeVictim, setActiveVictim] = useState({
    name: "Kavitha R. & Family",
    phone: "+91 94440 12345",
    address: "No 42, River View Street, Adyar, Chennai",
    lat: 12.9810,
    lng: 80.2240,
    details: "4 members stranded on terrace, flood level 5ft"
  });

  const [travelMode, setTravelMode] = useState<"WALKING" | "DRIVING">("WALKING");
  const [loading, setLoading] = useState(false);
  const [camps, setCamps] = useState<any[]>([]);
  const [sosRequests, setSosRequests] = useState<any[]>([]);
  const [userAddress, setUserAddress] = useState<string>("");
  const [showTracking, setShowTracking] = useState(true);
  const [routeDetails, setRouteDetails] = useState<{ distance: string; duration: string; steps: string[] } | null>(null);
  const [detailModal, setDetailModal] = useState<{ isOpen: boolean; type: "camp" | "sos" | null; data: any }>({ isOpen: false, type: null, data: null });
  const [assignModal, setAssignModal] = useState<{ isOpen: boolean; sos: any | null }>({ isOpen: false, sos: null });
  const [selectedVolId, setSelectedVolId] = useState<string>("vol-1");
  const [missionStage, setMissionStage] = useState<"dispatched" | "en_route" | "at_victim" | "evacuating" | "completed">("en_route");
  const [etaSeconds, setEtaSeconds] = useState<number>(870);

  useEffect(() => {
    if (missionStage !== "en_route" && missionStage !== "evacuating") return;
    const interval = setInterval(() => {
      setEtaSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [missionStage]);

  const formatEtaTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const { position: geoPos, accuracy: geoAccuracy, getPosition: fetchGps } = useGeolocation();

  useEffect(() => {
    fetchGps();
  }, [fetchGps]);

  useEffect(() => {
    if (geoPos) {
      setPosition(geoPos);
      if (!mapCenter) setMapCenter(geoPos);
      reverseGeocode(geoPos.lat, geoPos.lng).then((addr) => {
        if (addr) setUserAddress(addr);
      });
    }
  }, [geoPos]);

  useEffect(() => {
    loadData();
  }, [position, shelterCountLimit]);

  const loadData = async () => {
    setLoading(true);

    const userLat = position?.lat || 12.9810;
    const userLng = position?.lng || 80.2240;
    let city = "Emergency Sector";
    if (userAddress) {
      const parts = userAddress.split(",");
      if (parts.length > 2) city = parts[parts.length - 3].trim();
      else if (parts.length > 0) city = parts[0].trim();
    }

    const mockGrid = generateGridCamps(userLat, userLng, city, shelterCountLimit);
    const mockSos = getMockSosList(userLat, userLng);

    try {
      const { data: dbCamps } = await supabase
        .from("relief_camps")
        .select("*")
        .eq("status", "active")
        .limit(20);

      const combined = dbCamps && dbCamps.length > 0
        ? [...dbCamps, ...mockGrid.slice(dbCamps.length)]
        : mockGrid;

      setCamps(combined);
      if (combined.length > 0 && !selectedCamp) {
        setSelectedCamp(combined[0]);
      }

      const { data: dbSos } = await supabase
        .from("sos_requests")
        .select("*")
        .in("status", ["pending", "assigned", "in_progress"])
        .order("emergency_level", { ascending: false })
        .limit(10);

      const sosList = dbSos && dbSos.length > 0 ? dbSos : mockSos;
      setSosRequests(sosList);
      if (!selectedSos && sosList.length > 0) {
        setSelectedSos(sosList[0]);
      }
    } catch {
      setCamps(mockGrid);
      setSosRequests(mockSos);
      if (!selectedCamp && mockGrid.length > 0) setSelectedCamp(mockGrid[0]);
      if (!selectedSos && mockSos.length > 0) setSelectedSos(mockSos[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignVolunteer = async (sosId: string, volunteerId: string) => {
    const volunteer = AVAILABLE_VOLUNTEERS.find(v => v.id === volunteerId);
    if (!volunteer) {
      toast.error("Please select a valid volunteer");
      return;
    }

    const userLat = position?.lat || 12.9810;
    const userLng = position?.lng || 80.2240;

    try {
      await supabase
        .from("sos_requests")
        .update({
          status: "assigned",
          assigned_volunteer_id: volunteerId
        })
        .eq("id", sosId);
    } catch {}

    setSosRequests(prev => prev.map(s => {
      if (s.id === sosId) {
        return {
          ...s,
          status: "assigned",
          assigned_volunteer_id: volunteerId,
          volunteer_name: volunteer.full_name,
          volunteer_phone: volunteer.phone,
          volunteer_vehicle: volunteer.vehicle_type,
        };
      }
      return s;
    }));

    if (selectedSos?.id === sosId) {
      setSelectedSos((prev: any) => ({
        ...prev,
        status: "assigned",
        assigned_volunteer_id: volunteerId,
        volunteer_name: volunteer.full_name,
        volunteer_phone: volunteer.phone,
        volunteer_vehicle: volunteer.vehicle_type,
      }));
    }

    setActiveRescuer({
      name: `${volunteer.full_name} (${volunteer.vehicle_type})`,
      phone: volunteer.phone,
      vehicle: volunteer.vehicle_type,
      lat: (selectedSos?.latitude || userLat) - 0.005,
      lng: (selectedSos?.longitude || userLng) - 0.005,
      status: "En Route to Victim"
    });

    setAssignedRoutePreset("manoj_to_kavitha");

    toast.success(`✅ Volunteer Assigned!`, {
      description: `${volunteer.full_name} (${volunteer.vehicle_type}) assigned to emergency request.`
    });

    setAssignModal({ isOpen: false, sos: null });
  };

  const getTop3NearestCamps = () => {
    if (!camps || camps.length === 0) return [];
    const startPt = customStartCoords || position || { lat: 12.9810, lng: 80.2240 };
    return camps
      .map(c => {
        const d = haversineDistance(startPt.lat, startPt.lng, c.latitude, c.longitude);
        const roadDist = d * (travelMode === "DRIVING" ? 1.35 : 1.25);
        const etaWalk = Math.round((roadDist / TRAVEL_SPEEDS.WALKING) * 60);
        const etaDrive = Math.round((roadDist / TRAVEL_SPEEDS.DRIVING) * 60);
        const distText = roadDist < 1 ? `${Math.round(roadDist * 1000)} m` : `${roadDist.toFixed(1)} km`;
        return {
          ...c,
          distKm: roadDist,
          distText,
          etaWalkMins: etaWalk,
          etaDriveMins: etaDrive,
          bedsAvailable: (c.max_capacity || 300) - (c.current_occupancy || 120)
        };
      })
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, 3);
  };

  const nearestCamp = useMemo(() => {
    const top3 = getTop3NearestCamps();
    return top3.length > 0 ? top3[0] : null;
  }, [camps, position, customStartCoords, travelMode]);

  const computedRoute = useMemo((): ComputedRoute | null => {
    if (assignedRoutePreset === "manoj_to_kavitha") {
      return computeRouteInfo(
        { lat: activeRescuer.lat, lng: activeRescuer.lng },
        { lat: activeVictim.lat, lng: activeVictim.lng },
        travelMode,
        `Rescuer: ${activeRescuer.name}`,
        `Victim: ${activeVictim.name}`
      );
    }

    if (activeTab === "rescuer" && selectedSos) {
      const startPt = position || (camps.length > 0 ? { lat: camps[0].latitude, lng: camps[0].longitude } : { lat: 12.9810, lng: 80.2240 });
      return computeRouteInfo(
        startPt,
        { lat: selectedSos.latitude, lng: selectedSos.longitude },
        travelMode,
        "Rescuer Location",
        `Victim: ${selectedSos.reporter_name || "Emergency Request"}`
      );
    }

    const startPt = customStartCoords || position || { lat: 12.9810, lng: 80.2240 };
    const startLabel = customStart ? `Custom: ${customStart}` : (userAddress || "My Current Location");
    const targetCamp = selectedCamp || nearestCamp;

    if (!targetCamp) return null;

    return computeRouteInfo(
      startPt,
      { lat: targetCamp.latitude, lng: targetCamp.longitude },
      travelMode,
      startLabel,
      targetCamp.name
    );
  }, [activeTab, selectedSos, position, customStartCoords, customStart, userAddress, selectedCamp, nearestCamp, travelMode, assignedRoutePreset, activeRescuer, activeVictim]);

  const getMapMarkers = (): MapMarker[] => {
    const markersList: MapMarker[] = [];

    if (assignedRoutePreset === "manoj_to_kavitha") {
      markersList.push({
        id: "rescuer-manoj",
        lat: activeRescuer.lat,
        lng: activeRescuer.lng,
        type: "volunteer",
        title: `🔵 ${activeRescuer.name}`,
        info: `Vehicle: ${activeRescuer.vehicle} · Status: ${activeRescuer.status}`
      });
      markersList.push({
        id: "victim-kavitha",
        lat: activeVictim.lat,
        lng: activeVictim.lng,
        type: "victim",
        title: `🔴 ${activeVictim.name}`,
        info: `Address: ${activeVictim.address} · Details: ${activeVictim.details}`
      });
    }

    if (position) {
      markersList.push({
        id: "my-location",
        lat: position.lat,
        lng: position.lng,
        type: "user",
        title: "📍 My Current Location",
        info: userAddress || `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`
      });
    }

    camps.slice(0, 10).forEach(c => {
      const isTarget = (selectedCamp?.id === c.id || nearestCamp?.id === c.id);
      markersList.push({
        id: `camp-${c.id}`,
        lat: c.latitude,
        lng: c.longitude,
        type: "camp",
        title: `${isTarget ? "🟢 [TARGET] " : "🏫 "}${c.name}`,
        info: `Capacity: ${c.current_occupancy}/${c.max_capacity} · Phone: ${c.phone || "N/A"}`
      });
    });

    sosRequests.forEach(s => {
      markersList.push({
        id: `sos-${s.id}`,
        lat: s.latitude,
        lng: s.longitude,
        type: "victim",
        title: `🚨 Emergency SOS: ${s.reporter_name || "Unknown"}`,
        info: `Level ${s.emergency_level} · Status: ${s.status} · Address: ${s.address || "N/A"}`
      });
    });

    return markersList;
  };

  const getMapRoutes = (): RouteInfo[] => {
    if (!computedRoute) return [];
    return [{
      origin: computedRoute.originCoords,
      destination: computedRoute.destCoords,
      color: assignedRoutePreset === "manoj_to_kavitha" ? "#06b6d4" : "#22c55e",
      travelMode: computedRoute.travelMode
    }];
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
    <div className="space-y-6 text-foreground">
      {/* HEADER BAR INSIDE DASHBOARD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight font-outfit">Route Finder & Danger Search</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Find safe paths to active relief camps or route rescuers directly to victims in need.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchGps}
            className="gap-1.5 text-xs font-semibold"
          >
            <Compass className="w-3.5 h-3.5 text-primary" />
            <span>Refetch GPS</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setAssignedRoutePreset("manoj_to_kavitha");
              setActiveTab("rescuer");
              setMapCenter({ lat: 12.9780, lng: 80.2220 });
              toast.info("Switched to Rescuer Mission View: Manoj ➔ Kavitha R.");
            }}
            className="bg-cyan-600 hover:bg-cyan-700 text-white gap-1.5 text-xs font-bold shadow"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>View Manoj ➔ Kavitha Mission</span>
          </Button>

          <a href={getGoogleMapsNavUrl()} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 text-xs shadow">
              <Navigation className="w-3.5 h-3.5" />
              <span>Google Maps ↗</span>
            </Button>
          </a>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/60 p-1">
          <TabsTrigger value="victim" className="gap-2 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Tent className="w-4 h-4" />
            Victim Mode (Evacuate to Camp)
          </TabsTrigger>
          <TabsTrigger value="rescuer" className="gap-2 text-xs font-bold data-[state=active]:bg-red-600 data-[state=active]:text-white">
            <Siren className="w-4 h-4" />
            Rescuer Mode (Route to Victims)
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT SIDEBAR CONTROLS */}
          <div className="lg:col-span-4 space-y-6">
            <TabsContent value="victim" className="space-y-4 mt-0">
              <Card className="border border-border shadow-card bg-card/60 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    1. Starting Point
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Current Location</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={userAddress || (position ? `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}` : "Acquiring GPS...")}
                        className="text-xs bg-muted/50 font-mono"
                      />
                      <Button size="sm" variant="outline" onClick={fetchGps} className="shrink-0">
                        <Compass className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/50 space-y-2">
                    <Label className="text-xs font-semibold">Or Enter Custom Address</Label>
                    <Input
                      placeholder="e.g. Adyar Signal, Chennai"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* CAMP SELECTOR */}
              <Card className="border border-border shadow-card bg-card/60 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Tent className="w-4 h-4 text-emerald-500" />
                    2. Choose Relief Camp
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Select Camp</Label>
                    <Select
                      value={selectedCamp?.id ? String(selectedCamp.id) : ""}
                      onValueChange={(val) => {
                        const found = camps.find(c => String(c.id) === val);
                        if (found) {
                          setSelectedCamp(found);
                          setAssignedRoutePreset("kavitha_to_camp");
                          setMapCenter({ lat: found.latitude, lng: found.longitude });
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

                  {/* TOP 3 RECOMMENDED SHELTERS */}
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

                              toast.info(`Selected ${camp.name}`, {
                                description: `Target set to ${camp.name} (${camp.distText} · ${travelMode === "WALKING" ? camp.etaWalkMins : camp.etaDriveMins} mins)`
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

                            <div className="flex items-center justify-between pt-1">
                              <div className="flex items-center gap-1 text-[9px] text-slate-400">
                                <span className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-400">🩺 Doctors</span>
                                <span className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400">⚡ Power</span>
                              </div>

                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCamp(camp);
                                  setAssignedRoutePreset("kavitha_to_camp");
                                  setMapCenter({ lat: camp.latitude, lng: camp.longitude });
                                  setShowTracking(true);

                                  const originLat = position?.lat || 12.9810;
                                  const originLng = position?.lng || 80.2240;
                                  const gmapUrl = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${camp.latitude},${camp.longitude}&travelmode=${travelMode.toLowerCase()}`;
                                  window.open(gmapUrl, "_blank");

                                  toast.success(`Opening Google Maps for ${camp.name}!`, {
                                    description: `Navigating to ${camp.name} (${camp.distText})`
                                  });
                                }}
                                className={`text-[10px] h-7 font-bold gap-1 shadow ${
                                  isSelected ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400" : "bg-slate-800 hover:bg-slate-700 text-slate-200"
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* RESCUER TAB CONTENT */}
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
                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                      {sosRequests.map((sos) => {
                        const startPt = position || (camps.length > 0 ? { lat: camps[0].latitude, lng: camps[0].longitude } : null);
                        const distToSos = startPt ? haversineDistance(startPt.lat, startPt.lng, sos.latitude, sos.longitude) : null;
                        const distText = distToSos !== null
                          ? distToSos < 1 ? `${Math.round(distToSos * 1000)} m` : `${distToSos.toFixed(1)} km`
                          : null;
                        const etaMins = distToSos !== null ? Math.round((distToSos * 1.35) / TRAVEL_SPEEDS[travelMode] * 60) : null;
                        const isAssigned = sos.status === "assigned" || sos.assigned_volunteer_id || sos.volunteer_name;

                        return (
                          <div
                            key={sos.id}
                            onClick={() => {
                              setSelectedSos(sos);
                              setMapCenter({ lat: sos.latitude, lng: sos.longitude });
                            }}
                            className={`p-3 rounded-xl border cursor-pointer transition-all text-xs space-y-2 ${
                              selectedSos?.id === sos.id
                                ? "bg-red-500/10 border-red-500 shadow-md shadow-red-500/10"
                                : "bg-muted/50 border-border hover:bg-muted hover:border-red-500/30"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <span className="font-bold text-foreground truncate max-w-[130px]">
                                {sos.reporter_name}
                              </span>
                              <div className="flex items-center gap-1">
                                {isAssigned ? (
                                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[9px]">
                                    ✓ {sos.volunteer_name || "Assigned"}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[9px]">
                                    Unassigned
                                  </Badge>
                                )}
                                <Badge className="bg-red-600 text-white text-[9px] shrink-0">
                                  Lvl {sos.emergency_level}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground line-clamp-1">{sos.address || `${sos.latitude}, ${sos.longitude}`}</p>
                            <p className="text-[10px] text-slate-400 italic line-clamp-1">"{sos.description || "Evacuation requested"}"</p>

                            <div className="flex items-center justify-between pt-1 border-t border-border/40 gap-2">
                              {distText ? (
                                <div className="flex items-center gap-1 text-[9px]">
                                  <span className="font-mono font-bold text-cyan-400">📍 {distText}</span>
                                  <span className="text-slate-500">·</span>
                                  <span className="font-mono font-bold text-emerald-400">⏱ {etaMins}m</span>
                                </div>
                              ) : (
                                <span className="text-[9px] text-slate-500">Battery: {sos.battery_level || "90"}%</span>
                              )}

                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSos(sos);
                                  setAssignModal({ isOpen: true, sos });
                                }}
                                className="h-6 text-[10px] px-2 bg-blue-600 hover:bg-blue-500 text-white font-bold gap-1 shadow"
                              >
                                <Truck className="w-3 h-3" />
                                {isAssigned ? "Re-assign" : "Assign Volunteer"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>

          {/* RIGHT SIDE MAP VIEW & NAVIGATION DASHBOARD */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border overflow-hidden shadow-card p-4 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
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
                className="h-[420px] w-full"
              />
            </div>

            {/* LIVE MISSION PROGRESS STEPPER & ETA COUNTDOWN */}
            <Card className="border border-blue-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 shadow-2xl backdrop-blur-md">
              <CardHeader className="pb-3 border-b border-blue-800/40">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-400 animate-pulse" />
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        Live Rescue Mission Tracker: {activeRescuer.name}
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px] uppercase font-mono">
                          {missionStage.replace("_", " ")}
                        </Badge>
                      </CardTitle>
                      <p className="text-[11px] text-slate-400">Vehicle: {activeRescuer.vehicle} · Target Victim: {activeVictim.name}</p>
                    </div>
                  </div>

                  <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-blue-500/30 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400 animate-spin" />
                    <div className="text-right font-mono">
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider">Live Dynamic ETA</p>
                      <p className="text-sm font-black text-emerald-400">{formatEtaTime(etaSeconds)} mins</p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {/* STAGE PROGRESS BAR */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>Rescue Mission Lifecycle</span>
                    <span className="text-cyan-400">
                      {missionStage === "dispatched" ? "20%" : missionStage === "en_route" ? "40%" : missionStage === "at_victim" ? "60%" : missionStage === "evacuating" ? "80%" : "100% Complete"}
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 h-full transition-all duration-500 rounded-full"
                      style={{
                        width: missionStage === "dispatched" ? "20%" : missionStage === "en_route" ? "40%" : missionStage === "at_victim" ? "60%" : missionStage === "evacuating" ? "80%" : "100%"
                      }}
                    />
                  </div>
                </div>

                {/* STAGE STEPPER BUTTONS */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[10px]">
                  <Button
                    size="sm"
                    variant={missionStage === "dispatched" ? "default" : "outline"}
                    onClick={() => { setMissionStage("dispatched"); toast.info("Stage 1: Rescuer Dispatched & Vehicle Prepped"); }}
                    className={`h-8 font-bold ${missionStage === "dispatched" ? "bg-blue-600 text-white" : "border-slate-800 text-slate-400"}`}
                  >
                    1. Dispatched
                  </Button>
                  <Button
                    size="sm"
                    variant={missionStage === "en_route" ? "default" : "outline"}
                    onClick={() => { setMissionStage("en_route"); setAssignedRoutePreset("manoj_to_kavitha"); toast.info("Stage 2: En Route to Victim"); }}
                    className={`h-8 font-bold ${missionStage === "en_route" ? "bg-cyan-600 text-white" : "border-slate-800 text-slate-400"}`}
                  >
                    2. En Route 🚤
                  </Button>
                  <Button
                    size="sm"
                    variant={missionStage === "at_victim" ? "default" : "outline"}
                    onClick={() => { setMissionStage("at_victim"); toast.success("Stage 3: Arrived at Victim Location!"); }}
                    className={`h-8 font-bold ${missionStage === "at_victim" ? "bg-amber-600 text-white" : "border-slate-800 text-slate-400"}`}
                  >
                    3. At Victim 📍
                  </Button>
                  <Button
                    size="sm"
                    variant={missionStage === "evacuating" ? "default" : "outline"}
                    onClick={() => { setMissionStage("evacuating"); setAssignedRoutePreset("kavitha_to_camp"); toast.info("Stage 4: Evacuating Survivors to Camp"); }}
                    className={`h-8 font-bold ${missionStage === "evacuating" ? "bg-purple-600 text-white" : "border-slate-800 text-slate-400"}`}
                  >
                    4. Evacuating 🌊
                  </Button>
                  <Button
                    size="sm"
                    variant={missionStage === "completed" ? "default" : "outline"}
                    onClick={() => { setMissionStage("completed"); toast.success("🎉 Rescue Mission Completed & Survivors Safe!"); }}
                    className={`h-8 font-bold col-span-2 sm:col-span-1 ${missionStage === "completed" ? "bg-emerald-600 text-white" : "border-slate-800 text-slate-400"}`}
                  >
                    5. Safe ✅
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* EVACUATION TARGET SUMMARY BANNER */}
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

                <a href={getGoogleMapsNavUrl()} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-lg shadow-emerald-900/40 py-3 text-sm">
                    <Navigation className="w-4 h-4" />
                    Open Google Maps Turn-by-Turn Navigation ↗
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>

      {/* ASSIGN VOLUNTEER DIALOG MODAL */}
      <Dialog open={assignModal.isOpen} onOpenChange={(open) => !open && setAssignModal({ isOpen: false, sos: null })}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-100">
              <Truck className="w-5 h-5 text-blue-400" />
              Assign Volunteer Rescuer to Victim
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Dispatch an active rescue boat, ambulance, or volunteer team to this emergency location.
            </DialogDescription>
          </DialogHeader>

          {assignModal.sos && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100">{assignModal.sos.reporter_name}</span>
                  <Badge className="bg-red-600 text-white text-[9px]">
                    Emergency Lvl {assignModal.sos.emergency_level}
                  </Badge>
                </div>
                <p className="text-slate-300 text-[11px]">📍 {assignModal.sos.address || "Location pinned"}</p>
                <p className="text-slate-400 text-[11px]">⚠️ Details: {assignModal.sos.description || "Immediate evacuation requested"}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200">Select Available Rescue Unit:</label>
                <Select value={selectedVolId} onValueChange={setSelectedVolId}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-xs text-slate-100">
                    <SelectValue placeholder="Choose volunteer rescuer" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 text-xs">
                    {AVAILABLE_VOLUNTEERS.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.full_name} ({v.vehicle_type}) - {v.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setAssignModal({ isOpen: false, sos: null })} className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => assignModal.sos && handleAssignVolunteer(assignModal.sos.id, selectedVolId || AVAILABLE_VOLUNTEERS[0].id)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-lg"
            >
              <Truck className="w-3.5 h-3.5" />
              Confirm & Dispatch Volunteer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
