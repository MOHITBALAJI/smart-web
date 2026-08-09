import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { GoogleMap, type MapMarker, type RouteInfo } from "@/components/maps/GoogleMap";

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
  const [activeAlert, setActiveAlert] = useState(0);
  const [activePairIdx, setActivePairIdx] = useState(0);

  const [volunteers, setVolunteers] = useState(142);
  const [rescued, setRescued] = useState(1842);
  const [stranded, setStranded] = useState(8);

  const SAMPLE_PAIRS = [
    {
      rescuer: { name: "Manoj Kumar", vehicle: "Rescue Motor Boat ⛵", lat: 12.9810, lng: 80.2240 },
      victim: { name: "Kavitha R.", info: "Level 5 SOS · Diabetic Patient", lat: 12.9920, lng: 80.2330 },
      dist: "2.3 km · 12 min"
    },
    {
      rescuer: { name: "Karthik Raja", vehicle: "Heavy Duty Rescue Truck 🚛", lat: 12.9750, lng: 80.2150 },
      victim: { name: "Suresh Kumar", info: "Roof trapped with family", lat: 12.9880, lng: 80.2380 },
      dist: "3.1 km · 15 min"
    },
    {
      rescuer: { name: "Vigneshwaran R.", vehicle: "Emergency Ambulance 🚑", lat: 12.9650, lng: 80.2050 },
      victim: { name: "Priya Dharshini", info: "Food & water shortage", lat: 12.9820, lng: 80.2190 },
      dist: "2.8 km · 10 min"
    },
    {
      rescuer: { name: "Surya Prakash", vehicle: "Inflatable Lifeboat 🛶", lat: 12.9900, lng: 80.2450 },
      victim: { name: "Anand V.", info: "Infant milk powder needed", lat: 13.0020, lng: 80.2580 },
      dist: "1.9 km · 8 min"
    },
    {
      rescuer: { name: "Anitha Sekar", vehicle: "Disaster Relief SUV 🚙", lat: 12.9720, lng: 80.2290 },
      victim: { name: "Divya Dharshini", info: "Wall collapse danger", lat: 12.9850, lng: 80.2420 },
      dist: "2.2 km · 11 min"
    }
  ];

  const currentPair = SAMPLE_PAIRS[activePairIdx];

  const livePreviewMarkers: MapMarker[] = [
    {
      id: "active-rescuer-prev",
      lat: currentPair.rescuer.lat,
      lng: currentPair.rescuer.lng,
      type: "volunteer",
      title: `${currentPair.rescuer.name} (Rescuer)`,
      info: `Dispatched Rescuer · Vehicle: ${currentPair.rescuer.vehicle}`
    },
    {
      id: "active-victim-prev",
      lat: currentPair.victim.lat,
      lng: currentPair.victim.lng,
      type: "victim",
      title: `${currentPair.victim.name} (Victim)`,
      info: currentPair.victim.info
    },
    {
      id: "camp-velachery-prev",
      lat: 12.9860,
      lng: 80.2270,
      type: "camp",
      title: "Velachery Safe Shelter #1",
      info: "1000 Relief Shelters Online · Capacity: 120/300"
    },
    {
      id: "camp-adyar-prev",
      lat: 13.0010,
      lng: 80.2550,
      type: "camp",
      title: "Adyar Emergency Base #2",
      info: "Doctors & Ration Supplies Available"
    }
  ];

  const livePreviewRoutes: RouteInfo[] = [
    {
      origin: { lat: currentPair.rescuer.lat, lng: currentPair.rescuer.lng },
      destination: { lat: currentPair.victim.lat, lng: currentPair.victim.lng },
      travelMode: "DRIVING",
      color: "#38bdf8"
    }
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

  return (
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
            <Button asChild variant="ghost" size="sm" className="font-semibold text-xs">
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="gradient-hero text-white border-0 shadow-lg hover:opacity-90 font-semibold text-xs">
              <Link to="/auth">Get Started</Link>
            </Button>
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
                    <Compass className="w-5 h-5" /> Rescue Route Finder
                  </Link>
                </Button>
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
              <Card className="border border-border/80 shadow-elegant bg-slate-900/90 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-500 to-blue-600" />
                <CardHeader className="pb-3 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-cyan-400" /> Live Disaster Navigation Map
                      </span>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] uppercase font-bold">
                      1000 Shelters Online
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3 space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 h-[260px]">
                    <GoogleMap
                      center={{ lat: 12.9865, lng: 80.2285 }}
                      zoom={12}
                      markers={livePreviewMarkers}
                      routes={livePreviewRoutes}
                      className="h-full w-full"
                    />
                  </div>

                  {/* Rescuer & Shelter Status Bar */}
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-cyan-400 font-bold truncate">🔵 {currentPair.rescuer.name}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="text-red-400 font-bold truncate">🔴 {currentPair.victim.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">{currentPair.dist}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => setActivePairIdx((prev) => (prev + 1) % SAMPLE_PAIRS.length)}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs gap-1.5 py-2.5 shadow-md"
                    >
                      <span>🎲</span> Randomize Pair
                    </Button>
                    <Button asChild className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs gap-1.5 py-2.5 shadow-md">
                      <Link to="/rescue-route">
                        <Navigation className="w-3.5 h-3.5" /> Navigate Pair on GIS Map
                      </Link>
                    </Button>
                  </div>
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
  );
}
