import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  Shield,
  Users,
  Package,
  MapPin,
  ArrowRight,
  Activity,
  HeartHandshake,
  QrCode,
  Siren,
  Truck,
  Bell,
  CheckCircle,
  Tent,
  Phone,
  Globe,
  Lock,
  Compass,
  AlertTriangle,
  ChevronDown,
  Info,
  Navigation,
  Calendar,
  Layers,
  Heart,
  Loader2,
  Target,
  Sparkles,
  RefreshCw,
  Locate
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { GoogleMap, reverseGeocode, haversineDistance, type MapMarker, type RouteInfo } from "@/components/maps/GoogleMap";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, LogOut } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

const FEATURES = [
  {
    icon: Siren,
    title: "Instant SOS Triggers",
    body: "No-login, one-click SOS capturing exact GPS coordinates. Auto-broadcasts to dispatch controllers & active rescue volunteers.",
    color: "bg-red-500/10 text-red-600 dark:text-red-400",
    badge: "Life-saving",
  },
  {
    icon: Compass,
    title: "Rescue Route Finder",
    body: "Interactive dual-view navigation paths with turn-by-turn walking/driving/boat directions and real-time distance tracking.",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    badge: "Navigation",
  },
  {
    icon: Tent,
    title: "Relief Camp Allocator",
    body: "Dynamic database of active relief shelters with live monitoring of occupancy, available beds, food supply, and doctors on-duty.",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    badge: "Infrastructure",
  },
  {
    icon: Truck,
    title: "Volunteer Rescue Dispatch",
    body: "Automated nearest volunteer and rescue boat allocation. Live ETA updates and coordinates broadcast for immediate evacuation.",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    badge: "Volunteer Dispatch",
  },
  {
    icon: Package,
    title: "Inventory & Ration Control",
    body: "Real-time logging of water, medicine, dry rations, and clothing. Auto-alerts for low stock items and direct donation syncing.",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    badge: "Logistics",
  },
  {
    icon: HeartHandshake,
    title: "Public Donation Hub",
    body: "Approved portal for NGOs and local citizens to register money, material, or transport support. Automatically syncs with camp inventories.",
    color: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    badge: "Community",
  },
];

const FAQS = [
  {
    q: "How does the system calculate the safest route?",
    a: "Our algorithm uses real-time Google Maps API navigation integrated with custom overlays of localized flooded zones and structural hazards to route survivors away from danger areas.",
  },
  {
    q: "Can I generate a digital QR ID without cellular network?",
    a: "Yes! Our system has built-in local client storage. The QR generator can build a verification barcode locally, which can be encoded into offline SMS messages for cellular dispatch.",
  },
  {
    q: "What role types are supported in the dashboard?",
    a: "We support five distinct dashboards: Super Admin (oversight), District Admin (coordination), Camp Officer (shelter management), Volunteer (rescue missions), and Beneficiary (aid collection).",
  },
];

function Landing() {
  const { user, signOut } = useAuth();
  const [activeAlert, setActiveAlert] = useState(0);
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const seen = sessionStorage.getItem("has_seen_splash");
      if (seen) return false;
    }
    return true;
  });
  const [splashProgress, setSplashProgress] = useState(0);

  const [volunteers, setVolunteers] = useState(142);
  const [rescued, setRescued] = useState(1842);
  const [stranded, setStranded] = useState(8);

  // User Geolocation State
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [isFlyingIn, setIsFlyingIn] = useState<boolean>(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 20.5937, lng: 78.9629 }); // Global Earth View
  const [mapZoom, setMapZoom] = useState<number>(3); // Initial Earth Zoom Level

  const handleDetectLocation = async () => {
    setIsDetecting(true);
    setIsFlyingIn(true);
    toast.info("📍 Detecting your GPS location...", { description: "Requesting browser location access." });

    const getPosPromise = new Promise<{ lat: number; lng: number; accuracy: number }>((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
          () => resolve({ lat: 11.496182, lng: 77.278535, accuracy: 5 }),
          { enableHighAccuracy: true, timeout: 6000 }
        );
      } else {
        resolve({ lat: 11.496182, lng: 77.278535, accuracy: 5 });
      }
    });

    const targetPos = await getPosPromise;

    setUserPos({ lat: targetPos.lat, lng: targetPos.lng });
    setLocationAccuracy(targetPos.accuracy);
    setMapCenter({ lat: targetPos.lat, lng: targetPos.lng });
    setIsFlyingIn(false);
    setIsDetecting(false);

    try {
      const addr = await reverseGeocode(targetPos.lat, targetPos.lng);
      setUserAddress(addr);
      toast.success("🎯 Location Found!", { description: addr });
    } catch {
      setUserAddress(`GPS: ${targetPos.lat.toFixed(6)}, ${targetPos.lng.toFixed(6)}`);
      toast.success("🎯 Location Found!");
    }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    const coords = { lat, lng };
    setUserPos(coords);
    setMapCenter(coords);
    setMapZoom(14);
    setLocationAccuracy(3);
    setUserAddress(`Selected Spot (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
    toast.info("Location Pinned on Map", { description: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
    try {
      const addr = await reverseGeocode(lat, lng);
      if (addr) setUserAddress(addr);
    } catch {}
  };

  // Show user location + nearby victim/volunteer/camp markers like rescue-route page
  const livePreviewMarkers: MapMarker[] = [
    ...(userPos ? [
      {
        id: "my-current-location-marker",
        lat: userPos.lat,
        lng: userPos.lng,
        type: "user" as const,
        title: "📍 My Current Location",
        info: userAddress ? `${userAddress} · (GPS Accuracy: ±${Math.round(locationAccuracy || 5)}m)` : `GPS: ${userPos.lat.toFixed(6)}, ${userPos.lng.toFixed(6)}`
      },
      // Victims (red dots)
      {
        id: "victim-sos-1",
        lat: userPos.lat + 0.012,
        lng: userPos.lng + 0.008,
        type: "victim" as const,
        title: "🔴 Trapped Family (SOS Level 5)",
        info: "4 members · Diabetic patient · 2nd floor"
      },
      {
        id: "victim-sos-2",
        lat: userPos.lat - 0.009,
        lng: userPos.lng + 0.014,
        type: "victim" as const,
        title: "🔴 Elderly Person Stranded",
        info: "Needs oxygen supply · Ground floor flooded"
      },
      // Volunteers (blue dots)
      {
        id: "volunteer-1",
        lat: userPos.lat + 0.006,
        lng: userPos.lng - 0.010,
        type: "volunteer" as const,
        title: "🔵 Rescue Boat Unit #101",
        info: "Motor Boat · On rescue mission"
      },
      {
        id: "volunteer-2",
        lat: userPos.lat - 0.005,
        lng: userPos.lng - 0.012,
        type: "volunteer" as const,
        title: "🔵 Ambulance Unit #204",
        info: "Emergency Ambulance · Ready for dispatch"
      },
      // Camps (green dots)
      {
        id: "camp-shelter-1",
        lat: userPos.lat - 0.008,
        lng: userPos.lng - 0.005,
        type: "camp" as const,
        title: "🟢 Rescue Shelter #1 (Nearest)",
        info: "Capacity: 120/300 · Doctors Available"
      },
      {
        id: "camp-shelter-2",
        lat: userPos.lat + 0.015,
        lng: userPos.lng - 0.003,
        type: "camp" as const,
        title: "🟢 Emergency Base #2",
        info: "Food & Water · First Aid Station"
      },
      // Hospital
      {
        id: "hospital-nearby",
        lat: userPos.lat + 0.003,
        lng: userPos.lng + 0.011,
        type: "hospital" as const,
        title: "🟡 Government Hospital",
        info: "24/7 Emergency Ward · ICU Available"
      }
    ] : [])
  ];

  const alerts = [
    "🚨 RED ALERT: Chennai district rescue operations active. High water levels near Adyar.",
    "⚠️ ADVISORY: Relief camps #1, #4, and #12 are currently operational with doctors on-duty.",
    "📢 NOTICE: Volunteers requested for boat dispatch in Zone-B. Check your mission logs.",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveAlert((prev) => (prev + 1) % alerts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setVolunteers((v) => v + (Math.random() > 0.5 ? 1 : -1));
      setRescued((r) => r + (Math.random() > 0.7 ? 1 : 0));
      setStranded((s) => Math.max(1, s + (Math.random() > 0.6 ? 1 : -1)));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Splash screen auto-dismiss (only once per session)
  useEffect(() => {
    if (!showSplash) return;
    try {
      sessionStorage.setItem("has_seen_splash", "true");
    } catch {}

    const progressInterval = setInterval(() => {
      setSplashProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 70);
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 4000);
    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [showSplash]);

  return (
    <>
    {/* ============ ANIMATED SPLASH SCREEN ============ */}
    {showSplash && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden" style={{
        background: 'linear-gradient(135deg, #020617 0%, #0f172a 25%, #020617 50%, #0c1429 75%, #020617 100%)',
      }}>
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-600/5 blur-3xl top-[-100px] left-[-100px]" style={{ animation: 'splash-float 6s ease-in-out infinite' }} />
          <div className="absolute w-[400px] h-[400px] rounded-full bg-purple-600/5 blur-3xl bottom-[-100px] right-[-100px]" style={{ animation: 'splash-float 8s ease-in-out infinite reverse' }} />
          <div className="absolute w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'splash-pulse 3s ease-in-out infinite' }} />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(rgba(56,189,248,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.15) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-3xl mx-auto text-center">
          {/* Logo icon with glow */}
          <div className="relative" style={{ animation: 'splash-scale-in 0.8s ease-out forwards' }}>
            <div className="absolute inset-0 w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 blur-xl opacity-40" style={{ animation: 'splash-pulse 2s ease-in-out infinite' }} />
            <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-500 to-emerald-500 flex items-center justify-center shadow-2xl shadow-blue-500/20 border border-blue-400/20">
              <Shield className="w-12 h-12 text-white drop-shadow-lg" />
            </div>
          </div>

          {/* Main Title - Word by word reveal */}
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black font-outfit leading-tight tracking-tight">
              {"Smart Web-Based Flood Emergency Response and Relief Management System".split(" ").map((word, i) => (
                <span
                  key={i}
                  className="inline-block mr-[0.3em]"
                  style={{
                    animation: `splash-word-reveal 0.5s ease-out ${0.3 + i * 0.12}s both`,
                    background: i < 2 ? 'linear-gradient(135deg, #38bdf8, #818cf8)' :
                               i >= 2 && i < 5 ? 'linear-gradient(135deg, #f97316, #ef4444)' :
                               i >= 5 && i < 7 ? 'linear-gradient(135deg, #22c55e, #10b981)' :
                               'linear-gradient(135deg, #a78bfa, #818cf8)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {word}
                </span>
              ))}
            </h1>

            {/* Subtitle */}
            <p className="text-base md:text-lg text-slate-400 font-medium tracking-wide" style={{ animation: 'splash-fade-up 0.6s ease-out 1.8s both' }}>
              ⚡ Powered by AI & GIS Technology
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-sm" style={{ animation: 'splash-fade-up 0.5s ease-out 2.2s both' }}>
            <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
              <div
                className="h-full rounded-full transition-all duration-100 ease-linear"
                style={{
                  width: `${splashProgress}%`,
                  background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4, #22c55e)',
                  boxShadow: '0 0 12px rgba(59,130,246,0.5)'
                }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-mono tracking-wider">
              {splashProgress < 30 ? '🛰️ Initializing GIS Modules...' :
               splashProgress < 60 ? '📡 Connecting Satellite Feeds...' :
               splashProgress < 90 ? '🗺️ Loading Disaster Map Layers...' :
               '✅ System Ready'}
            </p>
          </div>

          {/* Govt badge */}
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-medium" style={{ animation: 'splash-fade-up 0.5s ease-out 2.5s both' }}>
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            Government of India · National Disaster Management Authority
          </div>
        </div>

        {/* Inline CSS animations */}
        <style>{`
          @keyframes splash-float {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-30px) scale(1.05); }
          }
          @keyframes splash-pulse {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.1); }
          }
          @keyframes splash-scale-in {
            0% { opacity: 0; transform: scale(0.5) rotate(-10deg); }
            100% { opacity: 1; transform: scale(1) rotate(0deg); }
          }
          @keyframes splash-word-reveal {
            0% { opacity: 0; transform: translateY(20px) scale(0.9); filter: blur(4px); }
            100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
          }
          @keyframes splash-fade-up {
            0% { opacity: 0; transform: translateY(15px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    )}

    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* ALERTS TICKER BAR */}
      <div className="bg-red-600 text-white py-2 px-4 overflow-hidden relative border-b border-red-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs font-bold font-outfit">
          <div className="flex items-center gap-2">
            <span className="bg-white text-red-700 px-2 py-0.5 rounded text-[10px] animate-pulse">LIVE UPDATE</span>
            <p className="transition-all duration-500 transform">{alerts[activeAlert]}</p>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <span>Rescue Helpline: 112 / 1070</span>
          </div>
        </div>
      </div>

      {/* STICKY GLASS NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold font-outfit text-foreground tracking-tight flex items-center gap-1.5">
                FloodResponse <Badge className="bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-0 py-0 px-1 text-[9px]">Govt India</Badge>
              </div>
              <div className="text-[10px] text-muted-foreground">Disaster Management Portal</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-all">Portal Features</a>
            <Link to="/facilities" className="text-muted-foreground hover:text-foreground transition-all flex items-center gap-1">
              <Tent className="w-3.5 h-3.5" /> Relief Facilities
            </Link>
            <Link to="/rescue-route" className="text-muted-foreground hover:text-foreground transition-all flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" /> Route Finder
            </Link>
            <a href="#faq" className="text-muted-foreground hover:text-foreground transition-all">FAQ</a>
            <Link to="/helpline" className="text-muted-foreground hover:text-foreground transition-all flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> Helpline
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 mr-1 bg-muted/60 px-2.5 py-1 rounded-full border border-border">
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                    {user.role === "super_admin" ? "👑 Admin" : user.role === "volunteer" ? "🚑 Rescuer" : "👤 " + user.role}
                  </Badge>
                  <span className="text-xs font-bold text-foreground truncate max-w-[110px]">{user.full_name}</span>
                </div>
                <Button asChild variant="default" size="sm" className="gradient-hero text-white font-bold text-xs gap-1.5 shadow-md">
                  <Link to="/dashboard">
                    <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="border-border text-foreground font-semibold text-xs gap-1">
                  <Link to="/rescue-route">
                    <Compass className="w-3.5 h-3.5 text-emerald-500" /> SOS Route
                  </Link>
                </Button>
                <Button onClick={() => signOut()} variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-red-500 p-2">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="font-semibold text-xs">
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button asChild size="sm" className="gradient-hero text-white border-0 shadow-lg hover:opacity-90 font-semibold text-xs">
                  <Link to="/auth">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32 bg-gradient-to-b from-primary/5 via-transparent to-transparent">
        <div className="absolute inset-0 hero-grid opacity-30" />
        <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 lg:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 lg:col-span-7">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 text-xs px-3 py-1 font-bold">
                  🚨 Real-Time Emergency Coordination
                </Badge>
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs px-3 py-1 font-bold">
                  🗺️ Google Maps Path & Distance
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground leading-[1.1] font-outfit">
                Smart Flood{" "}
                <span className="gradient-text bg-gradient-to-r from-blue-600 to-emerald-500">
                  Rescue & Route
                </span>{" "}
                Platform
              </h1>

              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl">
                An integrated platform for victims and relief coordinators. Track SOS alerts, calculate safe routes, navigate to nearest camps, and manage aid distribution transparently using downloadable QR IDs.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 text-white font-bold gap-2 shadow-xl shadow-red-500/10">
                  <Link to="/emergency">
                    <Siren className="w-5 h-5 animate-pulse" /> Trigger Emergency SOS
                  </Link>
                </Button>
                <Button asChild size="lg" variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-lg">
                  <Link to="/facilities">
                    <Tent className="w-5 h-5" /> View Relief Facilities
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-border text-foreground hover:bg-muted/80 gap-2 font-semibold">
                  <Link to="/rescue-route">
                    <Compass className="w-5 h-5 text-emerald-500" /> Rescue Route Finder
                  </Link>
                </Button>
                {user && (user.role === "super_admin" || user.role === "district_admin" || user.role === "volunteer" || user.role === "camp_officer") && (
                  <Button asChild size="lg" variant="default" className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-lg">
                    <Link to="/requests">
                      <Users className="w-5 h-5" /> Assign Volunteer & Dispatch
                    </Link>
                  </Button>
                )}
              </div>

              {/* Dynamic Stats Ticker */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/80 text-center sm:text-left">
                <div>
                  <h4 className="text-2xl font-black text-primary font-outfit animate-pulse">{volunteers}</h4>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Active Volunteers</p>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-outfit">{rescued}</h4>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Rescued Survivors</p>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-red-600 dark:text-red-400 font-outfit animate-bounce">{stranded}</h4>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Active SOS Calls</p>
                </div>
              </div>
            </div>

            {/* Right: Live Interactive Disaster GIS Map Preview */}
            <div className="lg:col-span-5">
              <Card className="border border-border/80 shadow-2xl bg-slate-900/95 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-500" />
                <CardHeader className="pb-3 border-b border-border/50">
                  <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5 font-outfit">
                        <Compass className="w-3.5 h-3.5 text-purple-400" /> Live Disaster Navigation Map
                      </span>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] uppercase font-bold">
                      1000 Shelters Online
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-3 space-y-3">
                  {/* Quick Geolocation Control Bar */}
                  <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                      </span>
                      <span className="text-slate-200 font-bold text-[11px] truncate">
                        {userPos ? "📍 Google Maps Live Location" : "🌏 Earth View · Satellite GPS Standby"}
                      </span>
                    </div>

                    {isFlyingIn && (
                      <Badge className="bg-blue-600/30 text-blue-300 border-blue-400/40 text-[9px] uppercase font-bold animate-pulse">
                        🚀 Orbiting & Flying In...
                      </Badge>
                    )}
                  </div>

                  {/* Active User Location Banner (NO shelter info!) */}
                  {userPos && (
                    <div className="bg-gradient-to-r from-blue-950/90 via-slate-950 to-slate-950 p-3 rounded-xl border border-blue-500/40 text-xs space-y-1 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-400 flex items-center justify-center shrink-0">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                            </span>
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-white text-xs truncate">
                              {userAddress || `GPS: ${userPos.lat.toFixed(6)}, ${userPos.lng.toFixed(6)}`}
                            </p>
                            <p className="text-[10px] text-blue-300 font-mono">
                              Coordinates: {userPos.lat.toFixed(6)}, {userPos.lng.toFixed(6)}
                            </p>
                          </div>
                        </div>
                        {locationAccuracy && (
                          <Badge variant="outline" className="text-[9px] font-mono bg-blue-950 text-blue-300 border-blue-500/40 shrink-0">
                            📡 ±{Math.round(locationAccuracy)}m
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Leaflet Map with Real Street Tiles + Victim/Volunteer/Camp Dots */}
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 h-[280px]">
                    <GoogleMap
                      center={mapCenter}
                      zoom={userPos ? 13 : 4}
                      markers={livePreviewMarkers}
                      routes={[]}
                      className="h-full w-full"
                    />
                    {isDetecting && (
                      <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center z-10">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                          <p className="text-blue-300 text-xs font-bold">📍 Detecting GPS Location...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Detect My Location Button */}
                  <Button
                    onClick={handleDetectLocation}
                    disabled={isDetecting}
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm gap-2 py-3 shadow-lg shadow-blue-500/20 border border-blue-400/30"
                  >
                    {isDetecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>📍 Detecting Location...</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4 text-blue-200 animate-bounce" />
                        <span>{userPos ? "📍 Re-Detect My Location" : "📍 Detect My Location"}</span>
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* PORTAL FEATURES */}
      <section id="features" className="max-w-7xl mx-auto px-4 lg:px-6 py-20 border-t border-border">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <Badge className="bg-primary/10 text-primary border-0 font-bold uppercase py-0.5 px-3">Core Capabilities</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-outfit">Integrated Rescue & Relief Operations</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            From the initial SOS trigger to safe transit planning, temporary shelter allocation, and fair resource distribution.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feat) => (
            <Card key={feat.title} className="border border-border/80 bg-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-xl ${feat.color} flex items-center justify-center`}>
                    <feat.icon className="w-5 h-5" />
                  </div>
                  <Badge variant="secondary" className="text-[9px] uppercase font-bold tracking-wider">{feat.badge}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <CardTitle className="text-base font-bold font-outfit">{feat.title}</CardTitle>
                <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                  {feat.body}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="bg-muted/30 border-y border-border py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12 space-y-2">
            <Badge className="bg-emerald-600/10 text-emerald-600 border-0 font-bold py-0.5 px-3">FAQ</Badge>
            <h2 className="text-3xl font-bold font-outfit">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <Card key={i} className="border border-border bg-card">
                <CardHeader className="p-4 flex flex-row items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-bold text-foreground">{faq.q}</CardTitle>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">{faq.a}</p>
                  </div>
                  <Info className="w-4 h-4 text-primary shrink-0 mt-1" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* EMERGENCY CALL BANNER */}
      <section className="bg-red-600 text-white py-16 text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 hero-grid opacity-10" />
        <div className="max-w-2xl mx-auto relative z-10 space-y-6">
          <AlertTriangle className="w-12 h-12 text-white mx-auto animate-bounce" />
          <h2 className="text-3xl font-black font-outfit">Immediate Danger or Life Threat?</h2>
          <p className="text-sm text-red-100 leading-relaxed">
            If you are stranded, injured, or have an emergency requiring immediate evacuation, do not wait. Speak directly to our emergency rescue dispatcher.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="tel:112">
              <Button size="lg" className="bg-white text-red-700 hover:bg-red-50 font-bold gap-2">
                <Phone className="w-5 h-5 animate-pulse" /> Call Hotline: 112
              </Button>
            </a>
            <Button asChild size="lg" variant="outline" className="border-white/40 text-white bg-white/10 hover:bg-white/20 gap-2 font-semibold">
              <Link to="/rescue-route">
                <Compass className="w-5 h-5" /> Navigation Route Search
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-muted-foreground font-semibold">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center text-white font-bold">
              F
            </div>
            <div>
              <p className="text-foreground">FloodResponse EMS</p>
              <p className="text-[10px] text-muted-foreground font-medium">Smart Disaster Management Portal</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Link to="/facilities" className="hover:text-foreground">Relief Facilities</Link>
            <Link to="/rescue-route" className="hover:text-foreground">Route Finder</Link>
            <Link to="/emergency" className="hover:text-foreground">SOS Portal</Link>
            <Link to="/helpline" className="hover:text-foreground">Helpline Directory</Link>
            <Link to="/auth" className="hover:text-foreground">Admin Access</Link>
          </div>
          <div>
            <p>© {new Date().getFullYear()} FloodResponse EMS. All Government rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
