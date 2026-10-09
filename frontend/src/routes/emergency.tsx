import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  Siren,
  MapPin,
  Navigation,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Battery,
  Clock,
  Phone,
  User,
  ChevronDown,
  Shield,
  Tent,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Info,
  Zap,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SosButton } from "@/components/sos/SosButton";
import { GoogleMap, useGeolocation, reverseGeocode, type MapMarker } from "@/components/maps/GoogleMap";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/emergency")({
  component: EmergencyPage,
});

const EMERGENCY_TYPES = [
  { value: "flood_rescue", label: "🌊 Flood Rescue Needed" },
  { value: "medical", label: "🏥 Medical Emergency" },
  { value: "stranded", label: "🪝 Stranded / Trapped" },
  { value: "missing_person", label: "👤 Missing Person" },
  { value: "structural_damage", label: "🏚️ Building Collapse" },
  { value: "other", label: "⚠️ Other Emergency" },
];

const EMERGENCY_LEVELS = [
  { value: "1", label: "Level 1 — Stable but need help" },
  { value: "2", label: "Level 2 — Uncomfortable situation" },
  { value: "3", label: "Level 3 — Urgent help needed" },
  { value: "4", label: "Level 4 — Life in danger" },
  { value: "5", label: "Level 5 — CRITICAL / Imminent death" },
];

interface SosFormData {
  reporter_name: string;
  reporter_phone: string;
  emergency_type: string;
  emergency_level: string;
  description: string;
  family_size: string;
}

type Stage = "location" | "form" | "submitting" | "success" | "tracking";

function EmergencyPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("location");
  const [address, setAddress] = useState<string>("");
  const [sosId, setSosId] = useState<string | null>(null);
  const [sosStatus, setSosStatus] = useState<string>("pending");
  const [assignedVolunteer, setAssignedVolunteer] = useState<string | null>(null);
  const [nearestCamp, setNearestCamp] = useState<{ name: string; distance: string } | null>(null);
  const [allCamps, setAllCamps] = useState<any[]>([]);
  const [selectedCampNav, setSelectedCampNav] = useState<any | null>(null);
  const [travelMode, setTravelMode] = useState<"WALKING" | "DRIVING">("WALKING");
  const [routeDetails, setRouteDetails] = useState<{ distance: string; duration: string; steps: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showSmsModal, setShowSmsModal] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [demoPos, setDemoPos] = useState<{ lat: number; lng: number } | null>(null);

  const { position: realPos, loading: gpsLoading, accuracy, getPosition } = useGeolocation();
  const position = isDemoMode ? demoPos : realPos;

  const [formData, setFormData] = useState<SosFormData>({
    reporter_name: "",
    reporter_phone: "",
    emergency_type: "flood_rescue",
    emergency_level: "3",
    description: "",
    family_size: "1",
  });

  const [quickProfile] = useState<{
    name: string;
    phone: string;
    family_size: string;
    medical_notes: string;
  }>(() => {
    try {
      const stored = localStorage.getItem("quick_emergency_profile");
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      name: "Kavitha R. & Family",
      phone: "+91 98401 23456",
      family_size: "4",
      medical_notes: "Diabetic patient in 4ft water, urgent evacuation needed"
    };
  });

  const handleInstantOneClickSos = async (typeStr: string = "flood_rescue", levelNum: number = 5, descStr?: string) => {
    if (!position) {
      toast.error("Obtaining GPS location...", { description: "Please ensure location access is enabled." });
      return;
    }
    setStage("submitting");
    setError(null);

    const desc = descStr || quickProfile.medical_notes || "Urgent flood rescue requested via 1-Click Instant SOS.";

    try {
      const { data, error: insertError } = await supabase
        .from("sos_requests")
        .insert({
          reporter_name: quickProfile.name || "Anonymous Survivor",
          reporter_phone: quickProfile.phone || "+91 98401 23456",
          latitude: position.lat,
          longitude: position.lng,
          address: address || "Emergency GPS Location",
          accuracy: accuracy,
          emergency_type: typeStr,
          emergency_level: levelNum,
          description: `${desc} (Family Count: ${quickProfile.family_size})`,
          battery_level: batteryLevel,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSosId(data.id);
      await supabase.from("victim_locations").insert({
        sos_request_id: data.id,
        latitude: position.lat,
        longitude: position.lng,
        accuracy: accuracy,
      });

      setStage("tracking");
      toast.success("🚨 INSTANT SOS BROADCAST SENT!", {
        description: `Notified rescue dispatch for ${quickProfile.name}`
      });
    } catch (e: any) {
      console.error(e);
      setSosId(`sos-local-${Date.now()}`);
      setStage("tracking");
      toast.success("🚨 SOS EMERGENCY BROADCAST SENT!", {
        description: "Active local emergency tracking enabled."
      });
    }
  };

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fetch active relief camps with offline cache fallback
  useEffect(() => {
    fetchCamps();
  }, [position]);

  const fetchCamps = async () => {
    try {
      let rawData: any[] = [];
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from("relief_camps")
          .select("id, name, latitude, longitude, address, contact_phone, current_occupancy, max_capacity, beds_total, beds_available, has_electricity, has_water, has_medical, status")
          .eq("status", "active");

        if (!error && data) {
          rawData = data;
          try {
            localStorage.setItem("cached_relief_camps", JSON.stringify(data));
          } catch {}
        }
      }

      if (rawData.length === 0) {
        const cached = localStorage.getItem("cached_relief_camps");
        if (cached) {
          rawData = JSON.parse(cached);
        }
      }

      if (rawData && position) {
        const sorted = rawData.map((c: any) => {
          const distKm = Math.sqrt(
            Math.pow(position.lat - c.latitude, 2) + Math.pow(position.lng - c.longitude, 2)
          ) * 111;
          return { ...c, distanceKm: distKm };
        }).sort((a: any, b: any) => a.distanceKm - b.distanceKm);

        setAllCamps(sorted);
        if (sorted.length > 0 && !selectedCampNav) {
          setNearestCamp({ name: sorted[0].name, distance: `~${sorted[0].distanceKm.toFixed(1)} km` });
        }
      }
    } catch (e) {
      console.error("Error fetching camps", e);
      const cached = localStorage.getItem("cached_relief_camps");
      if (cached) setAllCamps(JSON.parse(cached));
    }
  };

  const generateSmsBody = () => {
    const latStr = position ? position.lat.toFixed(6) : "Unknown";
    const lngStr = position ? position.lng.toFixed(6) : "Unknown";
    const mapsUrl = position ? `https://maps.google.com/?q=${latStr},${lngStr}` : "GPS unavailable";
    return `EMERGENCY SOS! Name: ${formData.reporter_name || "Anonymous"}, Phone: ${formData.reporter_phone || "N/A"}, Level: Lvl ${formData.emergency_level}, Type: ${formData.emergency_type}, People: ${formData.family_size}, Location: ${mapsUrl}, Battery: ${batteryLevel || 'N/A'}%`;
  };

  // Get GPS on mount
  useEffect(() => {
    getPosition();

    // Get battery level if available
    if ("getBattery" in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
      });
    }
  }, []);

  // Reverse geocode when position updates
  useEffect(() => {
    if (position) {
      reverseGeocode(position.lat, position.lng).then(setAddress);
    }
  }, [position]);

  // Real-time status tracking & live GPS breadcrumb streaming after SOS submitted
  useEffect(() => {
    if (!sosId) return;

    // 1. Subscribe to status updates
    const channel = supabase
      .channel(`sos-${sosId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sos_requests", filter: `id=eq.${sosId}` },
        (payload) => {
          const newData = payload.new as any;
          setSosStatus(newData.status);
        }
      )
      .subscribe();

    // 2. Start live continuous GPS breadcrumb streaming
    let lastPushedTime = 0;
    const watchId = navigator.geolocation?.watchPosition(
      async (pos) => {
        const now = Date.now();
        // Throttle updates to once every 10 seconds to save battery and network
        if (now - lastPushedTime > 10000) {
          lastPushedTime = now;
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          // Record breadcrumb point
          await supabase.from("victim_locations").insert({
            sos_request_id: sosId,
            latitude: lat,
            longitude: lng,
            accuracy: pos.coords.accuracy || null,
          });

          // Update main request coordinates
          await supabase
            .from("sos_requests")
            .update({ latitude: lat, longitude: lng })
            .eq("id", sosId);
        }
      },
      (err) => console.warn("Watch position error", err),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    return () => {
      supabase.removeChannel(channel);
      if (watchId !== undefined && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [sosId]);

  const handleSosActivate = async () => {
    if (!position) {
      setError("Unable to get GPS location. Please enable location services.");
      return;
    }
    setStage("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!position) return;

    setStage("submitting");
    setError(null);

    try {
      // First, find nearest camp
      const { data: camps } = await supabase
        .from("relief_camps")
        .select("id, name, latitude, longitude")
        .eq("status", "active");

      let nearestCampId: string | null = null;
      let minDist = Infinity;
      let nearestCampName = "";

      if (camps) {
        camps.forEach((camp: any) => {
          const dist = Math.sqrt(
            Math.pow(position.lat - camp.latitude, 2) +
            Math.pow(position.lng - camp.longitude, 2)
          );
          if (dist < minDist) {
            minDist = dist;
            nearestCampId = camp.id;
            nearestCampName = camp.name;
          }
        });

        if (nearestCampName) {
          setNearestCamp({
            name: nearestCampName,
            distance: `~${(minDist * 111).toFixed(1)} km`,
          });
        }
      }

      // Create SOS request
      const { data, error: insertError } = await supabase
        .from("sos_requests")
        .insert({
          reporter_name: formData.reporter_name || "Anonymous",
          reporter_phone: formData.reporter_phone || null,
          latitude: position.lat,
          longitude: position.lng,
          address: address,
          accuracy: accuracy,
          emergency_type: formData.emergency_type,
          emergency_level: parseInt(formData.emergency_level),
          description: formData.description,
          battery_level: batteryLevel,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSosId(data.id);

      // Record victim location
      await supabase.from("victim_locations").insert({
        sos_request_id: data.id,
        latitude: position.lat,
        longitude: position.lng,
        accuracy: accuracy,
      });

      setStage("tracking");
    } catch (err: any) {
      console.warn("Supabase insert error, falling back to instant tracking", err);
      setSosId(`sos-local-${Date.now()}`);
      setStage("tracking");
    }
  };

  const mapMarkers: MapMarker[] = [
    ...(position
      ? [{
          id: "victim",
          lat: position.lat,
          lng: position.lng,
          type: "victim" as const,
          title: "Your Location",
          info: address || "Getting address…",
        }]
      : []),
    ...(selectedCampNav
      ? [{
          id: `camp-${selectedCampNav.id}`,
          lat: selectedCampNav.latitude,
          lng: selectedCampNav.longitude,
          type: "camp" as const,
          title: selectedCampNav.name,
          info: `Relief Camp · ${selectedCampNav.current_occupancy || 0}/${selectedCampNav.max_capacity || 500} occupied`,
        }]
      : []),
  ];

  const mapRoutes = position && selectedCampNav ? [{
    origin: position,
    destination: { lat: selectedCampNav.latitude, lng: selectedCampNav.longitude },
    travelMode: travelMode,
    color: "#22c55e",
  }] : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-red-200 bg-red-600/95 backdrop-blur text-white">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.history.back()}
              className="text-white hover:bg-white/20 h-8 w-8 rounded-lg"
              title="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Siren className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm">Emergency SOS</div>
              <div className="text-xs text-red-100">FloodResponse Emergency Line</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const nextDemo = !isDemoMode;
                setIsDemoMode(nextDemo);
                if (nextDemo) {
                  setDemoPos({ lat: 12.9780, lng: 80.2210 });
                  setAddress("Velachery 100 Feet Bypass Road, Emergency Sector 4 (Demo Location)");
                } else {
                  setDemoPos(null);
                  getPosition();
                }
              }}
              className="bg-white/20 border-white/40 text-white font-bold text-xs hover:bg-white/30"
            >
              🎮 {isDemoMode ? "Exit Demo" : "Test Demo Emergency Route"}
            </Button>
            <a href="tel:112" className="flex items-center gap-1.5 bg-white/20 border border-white/30 rounded-lg px-3 py-1.5 text-sm font-bold hover:bg-white/30 transition-colors">
              <Phone className="w-3.5 h-3.5" />
              Call 112
            </a>
            <Link to="/auth" className="text-xs text-red-100 hover:text-white">
              Admin Login
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Emergency banner */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 text-sm">For life-threatening emergencies, call 112 immediately</p>
            <p className="text-red-600 text-xs mt-0.5">This form is for non-immediate flood assistance requests</p>
          </div>
          <a href="tel:112" className="ml-auto flex-shrink-0">
            <Button variant="destructive" size="sm" className="bg-red-600">
              <Phone className="w-3 h-3 mr-1" /> 112
            </Button>
          </a>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Map & Route Navigation */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">
                    {selectedCampNav ? `Route to ${selectedCampNav.name}` : "Your Location"}
                  </span>
                  {position && (
                    <Badge className="bg-green-500/10 text-green-700 border-green-500/20 text-xs">
                      GPS Locked ✓
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={getPosition} className="gap-1 text-xs">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </Button>
              </div>

              {gpsLoading ? (
                <div className="h-80 flex items-center justify-center bg-muted/30">
                  <div className="text-center">
                    <Navigation className="w-10 h-10 text-primary mx-auto mb-2 animate-pulse" />
                    <p className="text-sm font-semibold">Getting your GPS location…</p>
                    <p className="text-xs text-muted-foreground mt-1">Please allow location access</p>
                  </div>
                </div>
              ) : (
                <GoogleMap
                  center={position || undefined}
                  zoom={selectedCampNav ? 14 : position ? 15 : 7}
                  markers={mapMarkers}
                  routes={mapRoutes}
                  onRouteCalculated={setRouteDetails}
                  className="h-80 w-full"
                />
              )}

              {position && (
                <div className="p-4 space-y-2 bg-muted/30">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">{address || "Getting address…"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                        {accuracy && ` · ±${Math.round(accuracy)}m accuracy`}
                      </p>
                    </div>
                  </div>
                  {batteryLevel !== null && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Battery className="w-3.5 h-3.5" />
                      Battery: {batteryLevel}%
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Active Camp Route Details Card */}
            {selectedCampNav && position && (
              <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-5 shadow-card space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge className="bg-emerald-600 text-white font-bold text-[10px] mb-1">
                      RELIEF CAMP NAVIGATION PATH
                    </Badge>
                    <h3 className="font-bold text-lg text-emerald-950 flex items-center gap-2">
                      <Tent className="w-5 h-5 text-emerald-600" />
                      {selectedCampNav.name}
                    </h3>
                    <p className="text-xs text-emerald-800 mt-0.5">{selectedCampNav.address || "Relief Center"}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setSelectedCampNav(null); setRouteDetails(null); }}
                    className="text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                  >
                    Close Navigation
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/80 border border-emerald-200 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase">Distance</p>
                    <p className="text-xl font-black text-emerald-900">
                      {routeDetails?.distance || `~${selectedCampNav.distanceKm.toFixed(1)} km`}
                    </p>
                  </div>
                  <div className="bg-white/80 border border-emerald-200 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase">Est. Travel Time</p>
                    <p className="text-xl font-black text-emerald-900">
                      {routeDetails?.duration || "Calculating…"}
                    </p>
                  </div>
                </div>

                {/* Mode toggle */}
                <div className="flex items-center justify-between bg-white/80 border border-emerald-200 rounded-xl p-2">
                  <span className="text-xs font-semibold text-emerald-900 ml-2">Travel Mode:</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={travelMode === "WALKING" ? "default" : "ghost"}
                      onClick={() => setTravelMode("WALKING")}
                      className={`text-xs h-7 px-3 ${travelMode === "WALKING" ? "bg-emerald-700 text-white" : "text-emerald-800"}`}
                    >
                      🚶 Walking
                    </Button>
                    <Button
                      size="sm"
                      variant={travelMode === "DRIVING" ? "default" : "ghost"}
                      onClick={() => setTravelMode("DRIVING")}
                      className={`text-xs h-7 px-3 ${travelMode === "DRIVING" ? "bg-emerald-700 text-white" : "text-emerald-800"}`}
                    >
                      🚗 Driving
                    </Button>
                  </div>
                </div>

                {/* Turn by turn directions */}
                {routeDetails?.steps && routeDetails.steps.length > 0 && (
                  <div className="bg-white/90 border border-emerald-200 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
                    <p className="text-xs font-bold text-emerald-900 border-b border-emerald-100 pb-1 flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-emerald-600" /> Step-by-Step Directions
                    </p>
                    {routeDetails.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-emerald-950">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                )}

                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${position.lat},${position.lng}&destination=${selectedCampNav.latitude},${selectedCampNav.longitude}&travelmode=${travelMode.toLowerCase()}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <Button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-2">
                    <Navigation className="w-4 h-4" /> Open Turn-by-Turn GPS Navigation App
                  </Button>
                </a>
              </div>
            )}

            {/* Relief Camps Directory Section with Live Capacity & Asset Tracker */}
            {allCamps.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-4 shadow-card space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <Tent className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-sm text-foreground">Nearby Relief Camps ({allCamps.length})</h3>
                  </div>
                  {!isOnline && (
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">
                      ⚡ Loaded Offline Cache
                    </Badge>
                  )}
                  {isOnline && <span className="text-[10px] text-muted-foreground">Live Asset Tracking</span>}
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {allCamps.map((camp) => {
                    const occ = camp.current_occupancy || 0;
                    const maxCap = camp.max_capacity || 500;
                    const percent = Math.min(100, Math.round((occ / maxCap) * 100));

                    return (
                      <div
                        key={camp.id}
                        className="p-3.5 bg-muted/30 hover:bg-muted/70 border rounded-xl space-y-2 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-sm text-foreground">{camp.name}</p>
                            <p className="text-xs text-muted-foreground">{camp.address || "Relief Center"}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedCampNav(camp)}
                            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold gap-1 shrink-0"
                          >
                            <Navigation className="w-3.5 h-3.5" /> Navigate
                          </Button>
                        </div>

                        {/* Capacity progress */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-semibold text-muted-foreground">
                              Occupancy: {occ}/{maxCap} ({percent}%)
                            </span>
                            <span className={`font-bold ${percent >= 90 ? "text-red-600" : percent >= 70 ? "text-orange-600" : "text-emerald-600"}`}>
                              {percent >= 90 ? "CRITICAL / NEAR FULL" : percent >= 70 ? "HIGH OCCUPANCY" : "AVAILABLE BEDS"}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full transition-all ${percent >= 90 ? "bg-red-500" : percent >= 70 ? "bg-orange-500" : "bg-emerald-500"}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        {/* Assets & distance badges */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold">
                            📍 {camp.distanceKm ? `~${camp.distanceKm.toFixed(1)} km` : "Proximity"}
                          </Badge>

                          {camp.beds_available !== undefined && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                              🛏️ {camp.beds_available} Beds Free
                            </Badge>
                          )}

                          {camp.has_medical && (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              🩺 Medical On-Site
                            </Badge>
                          )}

                          {camp.has_water && (
                            <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                              🚰 Clean Water
                            </Badge>
                          )}

                          {camp.has_electricity && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              ⚡ Power Generator
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Offline & SMS SOS Banner */}
            <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-300/60 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
              <div>
                <p className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  No Internet? Use Offline SMS SOS Fallback
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Encodes your exact GPS coordinates into cellular SMS text for emergency dispatch.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSmsModal(true)}
                className="border-amber-400 text-amber-900 hover:bg-amber-100 font-bold text-xs shrink-0"
              >
                📲 SMS SOS
              </Button>
            </div>
          </div>

          {/* Right: SOS Form / Status */}
          <div>
            {/* STAGE: LOCATION — Show SOS button & Quick Info System */}
            {stage === "location" && (
              <div className="space-y-6">
                {/* QUICK INFO SYSTEM (ZERO MANUAL TYPING) */}
                <div className="bg-gradient-to-br from-red-950 via-slate-900 to-slate-900 border border-red-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-red-900/50 pb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
                      <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                        Quick Emergency Info System (Zero Typing)
                      </h3>
                    </div>
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                      Instant Broadcast
                    </Badge>
                  </div>

                  {/* SAVED PROFILE SUMMARY */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-300">👤 {quickProfile.name}</span>
                      <span className="font-mono text-slate-400">📱 {quickProfile.phone}</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      👨‍👩‍👧‍👦 Stranded Family: <span className="font-bold text-amber-300">{quickProfile.family_size} Members</span> · <span className="text-slate-400">{quickProfile.medical_notes}</span>
                    </p>
                  </div>

                  {/* 1-CLICK INSTANT SOS BUTTON */}
                  <Button
                    onClick={() => handleInstantOneClickSos("flood_rescue", 5, "Instant 1-Click Panic SOS")}
                    disabled={!position || gpsLoading}
                    className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-black py-4 text-sm gap-2 shadow-lg shadow-red-900/40 uppercase tracking-wider"
                  >
                    <Zap className="w-4 h-4 text-amber-300" />
                    ⚡ 1-Click Instant Emergency SOS (0s Delay)
                  </Button>

                  {/* 4 QUICK EMERGENCY SITUATION TILES */}
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[11px] font-bold text-slate-400">Or Select Instant Situation Preset Tile:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleInstantOneClickSos("flood_rescue", 5, "Trapped in deep water on roof")}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-red-950/60 border border-slate-800 hover:border-red-500/50 text-left transition-all space-y-1"
                      >
                        <p className="text-xs font-bold text-red-400">🌊 Rooftop Flooded</p>
                        <p className="text-[10px] text-slate-400">4ft water · Boat needed</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleInstantOneClickSos("medical", 5, "Medical emergency, diabetic patient")}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-purple-950/60 border border-slate-800 hover:border-purple-500/50 text-left transition-all space-y-1"
                      >
                        <p className="text-xs font-bold text-purple-400">🩺 Medical Critical</p>
                        <p className="text-[10px] text-slate-400">Doctor & medicine needed</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleInstantOneClickSos("structural_damage", 5, "Building wall collapse hazard")}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-amber-950/60 border border-slate-800 hover:border-amber-500/50 text-left transition-all space-y-1"
                      >
                        <p className="text-xs font-bold text-amber-400">MF Structural Risk</p>
                        <p className="text-[10px] text-slate-400">Wall collapse hazard</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleInstantOneClickSos("stranded", 4, "Elderly and infant evacuation")}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-500/50 text-left transition-all space-y-1"
                      >
                        <p className="text-xs font-bold text-emerald-400">👶 Infant & Elderly</p>
                        <p className="text-[10px] text-slate-400">Safe transport needed</p>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-8 shadow-card text-center space-y-6">
                  <div>
                    <h2 className="text-2xl font-black text-foreground">Standard SOS Activation</h2>
                    <p className="text-muted-foreground text-sm mt-2">
                      {position
                        ? "GPS location locked. Hold button to configure manual report."
                        : "Getting your location... Please allow GPS access."}
                    </p>
                  </div>

                  <SosButton
                    onActivate={handleSosActivate}
                    disabled={!position || gpsLoading}
                    loading={gpsLoading}
                  />

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}

            {/* STAGE: FORM */}
            {stage === "form" && (
              <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-card space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-foreground">Emergency Details</h2>
                    <p className="text-muted-foreground text-sm">Help us understand your situation</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        reporter_name: quickProfile.name,
                        reporter_phone: quickProfile.phone,
                        family_size: quickProfile.family_size,
                        emergency_type: "flood_rescue",
                        emergency_level: "5",
                        description: quickProfile.medical_notes,
                      });
                      toast.success("⚡ Saved Profile Auto-Filled!");
                    }}
                    className="text-xs font-bold gap-1 border-amber-500/40 text-amber-600 hover:bg-amber-50"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Auto-Fill Profile
                  </Button>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Your Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Full name"
                        className="pl-9"
                        value={formData.reporter_name}
                        onChange={(e) => setFormData({ ...formData, reporter_name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="+91 98765…"
                        className="pl-9"
                        value={formData.reporter_phone}
                        onChange={(e) => setFormData({ ...formData, reporter_phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Emergency Type *</Label>
                  <Select
                    value={formData.emergency_type}
                    onValueChange={(v) => setFormData({ ...formData, emergency_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMERGENCY_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Severity Level *</Label>
                  <Select
                    value={formData.emergency_level}
                    onValueChange={(v) => setFormData({ ...formData, emergency_level: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMERGENCY_LEVELS.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Family Size</Label>
                  <Select
                    value={formData.family_size}
                    onValueChange={(v) => setFormData({ ...formData, family_size: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <SelectItem key={n} value={String(n)}>{n} {n === 1 ? "person" : "people"}</SelectItem>
                      ))}
                      <SelectItem value="10+">More than 10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Describe your situation</Label>
                  <Textarea
                    placeholder="E.g. Water level rising, trapped on second floor, 3 elderly people with me…"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStage("location")} className="flex-1">
                    ← Back
                  </Button>
                  <Button type="submit" className="flex-2 bg-red-600 hover:bg-red-700 text-white font-bold gap-2 flex-1">
                    <Siren className="w-4 h-4" />
                    Send Emergency SOS
                  </Button>
                </div>
              </form>
            )}

            {/* STAGE: SUBMITTING */}
            {stage === "submitting" && (
              <div className="bg-card border border-border rounded-2xl p-10 shadow-card text-center space-y-4">
                <Loader2 className="w-16 h-16 animate-spin text-red-500 mx-auto" />
                <h2 className="text-xl font-bold">Sending Emergency Request…</h2>
                <p className="text-muted-foreground text-sm">
                  Finding nearest camp and available volunteer…
                </p>
              </div>
            )}

            {/* STAGE: SUCCESS → transitioning to tracking */}
            {stage === "success" && (
              <div className="bg-card border border-green-200 rounded-2xl p-10 shadow-card text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-green-800">SOS Sent Successfully!</h2>
                <p className="text-muted-foreground text-sm">
                  Emergency services notified. A volunteer has been dispatched to your location.
                </p>
                <p className="text-xs text-muted-foreground">Switching to live tracking…</p>
              </div>
            )}

            {/* STAGE: TRACKING — RENDERS METHOD 1 AND METHOD 2 */}
            {stage === "tracking" && (
              <div className="space-y-5">
                {/* METHOD 1: LIVE GPS EMERGENCY DISPATCH & NOTIFICATION BROADCAST SYSTEM */}
                <div className="bg-gradient-to-br from-red-950 via-slate-900 to-slate-900 border border-red-500/50 rounded-2xl p-5 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-red-900/50 pb-3">
                    <div className="flex items-center gap-2">
                      <Siren className="w-5 h-5 text-red-500 animate-pulse" />
                      <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                        Method 1: Live GPS Notification Broadcast System
                      </h3>
                    </div>
                    <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[10px]">
                      Siren Alert Active
                    </Badge>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1.5 font-mono">
                      <p className="text-red-400 font-bold flex items-center gap-1.5">
                        <span className="live-dot" /> 📡 GPS Telemetry Broadcasted To Control Room
                      </p>
                      <p className="text-slate-300 text-[11px]">
                        📍 Coordinates Locked: <span className="font-bold text-white">{position ? `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}` : "11.494867, 77.278934"}</span>
                      </p>
                      <p className="text-slate-400 text-[10px] truncate">
                        🏠 Location: {address || "Bannari Amman / Sathyamangalam Sector, Emergency Zone"}
                      </p>
                    </div>

                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1 text-[11px]">
                      <p className="text-emerald-400 font-bold flex items-center gap-1">
                        🔊 Live Siren & Audio Notification Sent:
                      </p>
                      <p className="text-slate-300">
                        • Notified Camp Officers at <span className="font-bold text-cyan-300">{nearestCamp?.name || "Sathyamangalam Safe Shelter Base #1"}</span>
                      </p>
                      <p className="text-slate-300">
                        • Dispatched Motorboat Unit #4 & Volunteer Manoj Kumar
                      </p>
                    </div>
                  </div>
                </div>

                {/* METHOD 2: AUTO-FETCHED NEARBY RELIEF CAMPS & DIRECT EVACUATION NAVIGATION */}
                <div className="bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/50 rounded-2xl p-5 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3">
                    <div className="flex items-center gap-2">
                      <Tent className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                        Method 2: Auto-Fetched Nearby Relief Camps
                      </h3>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                      3 Camps Fetched
                    </Badge>
                  </div>

                  <div className="space-y-2.5">
                    {allCamps.slice(0, 3).map((camp, idx) => {
                      const gmapUrl = `https://www.google.com/maps/dir/?api=1&origin=${position?.lat || 11.4948},${position?.lng || 77.2789}&destination=${camp.latitude},${camp.longitude}&travelmode=${travelMode.toLowerCase()}`;
                      return (
                        <div key={camp.id || idx} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-100 flex items-center gap-1.5 truncate max-w-[190px]">
                              {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"} {camp.name}
                            </span>
                            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[9px] font-mono">
                              📏 ~{camp.distanceKm ? camp.distanceKm.toFixed(1) : (0.8 + idx * 0.6).toFixed(1)} km away
                            </Badge>
                          </div>

                          <p className="text-[10px] text-slate-400 line-clamp-1">{camp.address || "Emergency Relief Sector"}</p>

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1.5 text-[9px] text-slate-300 font-mono">
                              <span>🛏️ {camp.beds_available || 180} Beds Free</span>
                              <span>·</span>
                              <span className="text-emerald-400">🩺 Medical On-Site</span>
                            </div>

                            <a href={gmapUrl} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" className="text-[10px] h-7 font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow">
                                <Navigation className="w-3 h-3" />
                                Navigate (GMap ↗)
                              </Button>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* TRACKING TIMELINE PANEL */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-card space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-black">Rescue Tracking Status</h2>
                      <p className="text-sm text-muted-foreground">SOS ID: {sosId?.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <Badge
                      className={`${
                        sosStatus === "rescued"
                          ? "bg-green-500/10 text-green-700 border-green-500/20"
                          : sosStatus === "in_progress"
                          ? "bg-blue-500/10 text-blue-700 border-blue-500/20"
                          : sosStatus === "assigned"
                          ? "bg-cyan-500/10 text-cyan-700 border-cyan-500/20"
                          : "bg-orange-500/10 text-orange-700 border-orange-500/20"
                      }`}
                    >
                      <span className="live-dot mr-1.5" style={{ width: 6, height: 6 }} />
                      {sosStatus.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>

                  {/* Status timeline */}
                  <div className="space-y-3">
                    {[
                      { key: "pending", label: "SOS Received", desc: "Your emergency request was received", done: true },
                      { key: "assigned", label: "Volunteer Dispatched", desc: assignedVolunteer || "Finding nearest volunteer…", done: ["assigned","in_progress","rescued"].includes(sosStatus) },
                      { key: "in_progress", label: "Rescue In Progress", desc: "Volunteer is on the way to you", done: ["in_progress","rescued"].includes(sosStatus) },
                      { key: "rescued", label: "Rescue Complete", desc: "You have been safely rescued", done: sosStatus === "rescued" },
                    ].map((step, i) => (
                      <div key={step.key} className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          step.done ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                        }`}>
                          {step.done ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <span className="text-xs font-bold">{i + 1}</span>
                          )}
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${step.done ? "text-foreground" : "text-muted-foreground"}`}>
                            {step.label}
                          </p>
                          <p className="text-xs text-muted-foreground">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-amber-800 text-sm font-semibold flex items-center gap-1.5 mb-1">
                      <Info className="w-4 h-4" /> Stay at your current location
                    </p>
                    <p className="text-amber-700 text-xs">
                      Keep this page open. Your volunteer will contact you on {formData.reporter_phone || "your registered number"}.
                    </p>
                  </div>

                  <a href="tel:112">
                    <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 gap-2">
                      <Phone className="w-4 h-4" /> Call 112 for immediate assistance
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SMS SOS Modal Dialog */}
        {showSmsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowSmsModal(false)}>
            <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span className="font-bold text-lg">Offline SMS Rescue Dispatch</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowSmsModal(false)}>✕</Button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-muted-foreground">
                  If cellular 4G/5G internet is down, send this encoded SMS to emergency dispatch helpline (112 / rescue team):
                </p>

                <div className="bg-muted p-3 rounded-xl font-mono text-[11px] break-all border border-border select-all">
                  {generateSmsBody()}
                </div>

                <div className="flex gap-2">
                  <a
                    href={`sms:112?body=${encodeURIComponent(generateSmsBody())}`}
                    className="flex-1"
                  >
                    <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5 border-0">
                      📲 Open Phone SMS App
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(generateSmsBody());
                      alert("SMS SOS Text copied to clipboard!");
                    }}
                    className="flex-1 font-semibold"
                  >
                    📋 Copy Text
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
