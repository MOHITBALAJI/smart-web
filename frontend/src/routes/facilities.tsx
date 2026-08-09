import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Tent,
  MapPin,
  Phone,
  Search,
  Navigation,
  RefreshCw,
  AlertTriangle,
  Compass,
  Siren,
  Filter,
  CheckCircle2,
  Users,
  Droplets,
  Zap,
  Stethoscope,
  ChevronRight,
  Waves,
  Shield,
  Activity,
  BedDouble,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGeolocation, reverseGeocode } from "@/components/maps/GoogleMap";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/facilities")({
  component: PublicFacilitiesPage,
});

interface ReliefCamp {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  max_capacity: number;
  current_occupancy: number;
  beds_total: number;
  beds_available: number;
  has_electricity: boolean;
  has_water: boolean;
  has_medical: boolean;
  contact_name: string | null;
  contact_phone: string | null;
  status: string;
  district_id?: string;
  distanceKm?: number;
}

interface FloodZone {
  id: string;
  zone_name: string;
  severity: string;
  water_level_meters: number | null;
  affected_population: number | null;
  status: string;
  districts?: { name: string };
}

function PublicFacilitiesPage() {
  const [camps, setCamps] = useState<ReliefCamp[]>([]);
  const [floodZones, setFloodZones] = useState<FloodZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAmenity, setFilterAmenity] = useState<string>("all");
  const [address, setAddress] = useState<string>("");

  const { position, loading: gpsLoading, getPosition } = useGeolocation();

  useEffect(() => {
    getPosition();
  }, []);

  useEffect(() => {
    if (position) {
      reverseGeocode(position.lat, position.lng).then(setAddress);
    }
  }, [position]);

  useEffect(() => {
    fetchPublicData();
  }, [position]);

  const fetchPublicData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Camps
      const { data: campsData } = await supabase
        .from("relief_camps")
        .select("*")
        .eq("status", "active");

      let rawCamps: ReliefCamp[] = campsData || [];

      // Save offline cache fallback
      if (rawCamps.length > 0) {
        try {
          localStorage.setItem("cached_public_camps", JSON.stringify(rawCamps));
        } catch (e) {}
      } else {
        const cached = localStorage.getItem("cached_public_camps");
        if (cached) rawCamps = JSON.parse(cached);
      }

      // Calculate distance if GPS available
      if (position && rawCamps.length > 0) {
        rawCamps = rawCamps.map((c) => {
          const dist =
            Math.sqrt(
              Math.pow(position.lat - c.latitude, 2) +
                Math.pow(position.lng - c.longitude, 2)
            ) * 111;
          return { ...c, distanceKm: dist };
        }).sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
      }

      setCamps(rawCamps);

      // 2. Fetch Flood Zones
      const { data: zoneData } = await supabase
        .from("flood_zones")
        .select("*, districts(name)")
        .order("created_at", { ascending: false });

      if (zoneData) setFloodZones(zoneData as FloodZone[]);
    } catch (err) {
      console.error("Error loading facilities:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter camps based on search query and amenity filter
  const filteredCamps = camps.filter((camp) => {
    const matchesSearch =
      camp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (camp.address && camp.address.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterAmenity === "medical") return camp.has_medical;
    if (filterAmenity === "beds") return (camp.beds_available || 0) > 0 || (camp.max_capacity - camp.current_occupancy) > 0;
    if (filterAmenity === "water") return camp.has_water;
    if (filterAmenity === "power") return camp.has_electricity;

    return true;
  });

  const totalBedsFree = camps.reduce((acc, c) => acc + Math.max(0, (c.max_capacity || 0) - (c.current_occupancy || 0)), 0);
  const totalCapacity = camps.reduce((acc, c) => acc + (c.max_capacity || 0), 0);
  const totalOccupancy = camps.reduce((acc, c) => acc + (c.current_occupancy || 0), 0);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* ALERTS TICKER BAR */}
      <div className="bg-red-600 text-white py-2 px-4 overflow-hidden relative border-b border-red-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs font-bold font-outfit">
          <div className="flex items-center gap-2">
            <span className="bg-white text-red-700 px-2 py-0.5 rounded text-[10px] animate-pulse">PUBLIC EMERGENCY ACCESS</span>
            <p>No login required to view relief shelters, beds, and navigation routes.</p>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <a href="tel:112" className="hover:underline flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> Emergency Hotline: 112
            </a>
          </div>
        </div>
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center shadow-lg">
              <Tent className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold font-outfit text-foreground flex items-center gap-1.5">
                Relief Facilities & Shelters
              </div>
              <div className="text-[10px] text-muted-foreground">Public Disaster Resource Portal</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
            <Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link>
            <Link to="/rescue-route" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" /> Route Finder
            </Link>
            <Link to="/helpline" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> Helplines
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="destructive" className="bg-red-600 hover:bg-red-700 font-bold gap-1 shadow-lg">
              <Link to="/emergency">
                <Siren className="w-3.5 h-3.5" /> Emergency SOS
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="font-semibold text-xs">
              <Link to="/auth">Admin Access</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="mx-auto max-w-7xl px-4 lg:px-6 py-8 space-y-8">
        
        {/* HERO TITLE & METRICS */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-bold">
                  🟢 Public Access Portal
                </Badge>
                {position && (
                  <Badge variant="outline" className="text-xs text-green-700 bg-green-50">
                    GPS Locked ✓
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight font-outfit text-foreground">
                Active Relief Camps & Shelters
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Locate nearby government and NGO flood relief camps, view live bed capacities, check available medical/water services, and get turn-by-turn safe routes.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" onClick={getPosition} disabled={gpsLoading} variant="outline" className="gap-1.5 text-xs font-semibold">
                <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? "animate-spin" : ""}`} />
                {gpsLoading ? "Getting Location..." : "Update GPS"}
              </Button>
              <Button size="sm" onClick={fetchPublicData} variant="outline" className="gap-1.5 text-xs font-semibold">
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="border border-border/80 bg-card/60 backdrop-blur-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                  <Tent className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-black font-outfit text-foreground">{camps.length}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Active Camps</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/80 bg-card/60 backdrop-blur-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <BedDouble className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-black font-outfit text-emerald-600">{totalBedsFree}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Available Beds</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/80 bg-card/60 backdrop-blur-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-black font-outfit text-foreground">{totalOccupancy} / {totalCapacity}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Occupancy</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/80 bg-card/60 backdrop-blur-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
                  <Waves className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-black font-outfit text-red-600">{floodZones.length}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Flood Warnings</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search camp by name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <Select value={filterAmenity} onValueChange={setFilterAmenity}>
              <SelectTrigger className="text-xs w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by amenity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Camps ({camps.length})</SelectItem>
                <SelectItem value="beds">Beds Available</SelectItem>
                <SelectItem value="medical">🩺 Medical On-site</SelectItem>
                <SelectItem value="water">🚰 Clean Water</SelectItem>
                <SelectItem value="power">⚡ Power Generator</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* RELIEF CAMPS GRID */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-outfit text-foreground flex items-center gap-2">
              <Tent className="w-5 h-5 text-primary" />
              Relief Shelters ({filteredCamps.length})
            </h2>
            {address && (
              <span className="text-xs text-muted-foreground truncate max-w-xs">
                📍 Showing distance from: {address}
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="text-sm font-semibold text-muted-foreground">Loading active relief camps...</p>
            </div>
          ) : filteredCamps.length === 0 ? (
            <Card className="border-border text-center py-12 p-6">
              <CardContent className="space-y-3">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                <h3 className="text-base font-bold">No relief camps match your search</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Try adjusting your search query or selecting "All Camps" in the filter menu.
                </p>
                <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); setFilterAmenity("all"); }} className="text-xs">
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCamps.map((camp) => {
                const occ = camp.current_occupancy || 0;
                const maxCap = camp.max_capacity || 500;
                const pct = Math.min(100, Math.round((occ / maxCap) * 100));
                const bedsFree = Math.max(0, maxCap - occ);

                return (
                  <Card
                    key={camp.id}
                    className="border border-border/80 bg-card hover:shadow-elegant transition-all duration-200 flex flex-col justify-between"
                  >
                    <CardHeader className="pb-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base font-bold font-outfit text-foreground leading-tight">
                            {camp.name}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                            {camp.address || "Relief Center"}
                          </p>
                        </div>
                        {camp.distanceKm !== undefined && (
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold shrink-0">
                            📍 ~{camp.distanceKm.toFixed(1)} km
                          </Badge>
                        )}
                      </div>

                      {/* Capacity Progress Bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-semibold text-muted-foreground">
                            Capacity: {occ} / {maxCap}
                          </span>
                          <span
                            className={`font-bold ${
                              pct >= 90
                                ? "text-red-600"
                                : pct >= 70
                                ? "text-orange-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {bedsFree} Beds Free
                          </span>
                        </div>
                        <Progress
                          value={pct}
                          className={`h-2 ${
                            pct >= 90
                              ? "[&>div]:bg-red-500"
                              : pct >= 70
                              ? "[&>div]:bg-orange-500"
                              : "[&>div]:bg-emerald-500"
                          }`}
                        />
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-1">
                      {/* Amenities Badges */}
                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        {camp.has_medical ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1 font-medium">
                            <Stethoscope className="w-3 h-3" /> Medical Doctors
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[9px]">
                            No Doctor
                          </Badge>
                        )}

                        {camp.has_water ? (
                          <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 gap-1 font-medium">
                            <Droplets className="w-3 h-3" /> Clean Water
                          </Badge>
                        ) : null}

                        {camp.has_electricity ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 font-medium">
                            <Zap className="w-3 h-3" /> Power Generator
                          </Badge>
                        ) : null}
                      </div>

                      {/* Contact Info */}
                      {(camp.contact_name || camp.contact_phone) && (
                        <div className="bg-muted/40 p-2.5 rounded-xl border border-border text-xs flex items-center justify-between">
                          <div className="truncate">
                            <p className="font-bold text-foreground truncate">{camp.contact_name || "Camp Incharge"}</p>
                            <p className="text-[10px] text-muted-foreground">{camp.contact_phone || "Contact via helpline"}</p>
                          </div>
                          {camp.contact_phone && (
                            <a href={`tel:${camp.contact_phone}`} className="shrink-0">
                              <Button size="sm" variant="outline" className="h-7 text-[10px] border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold gap-1">
                                <Phone className="w-3 h-3" /> Call
                              </Button>
                            </a>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        <Button
                          asChild
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
                        >
                          <Link to="/rescue-route">
                            <Compass className="w-3.5 h-3.5" /> Navigate Path
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* FLOOD ZONES & ACTIVE ADVISORY SECTION */}
        {floodZones.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-outfit text-foreground flex items-center gap-2">
                  <Waves className="w-5 h-5 text-red-500" />
                  Active Flood Zones & Water Level Alerts
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Monitored flood zones with live water height and affected population numbers.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {floodZones.map((zone) => (
                <Card key={zone.id} className="border border-red-200 bg-red-500/5 dark:bg-red-500/10">
                  <CardHeader className="pb-2 flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground">{zone.zone_name}</CardTitle>
                      <p className="text-[10px] text-muted-foreground">{zone.districts?.name || "District Zone"}</p>
                    </div>
                    <Badge
                      className={
                        zone.severity === "critical"
                          ? "bg-red-600 text-white text-[9px]"
                          : zone.severity === "high"
                          ? "bg-orange-600 text-white text-[9px]"
                          : "bg-amber-500 text-white text-[9px]"
                      }
                    >
                      {zone.severity.toUpperCase()}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2 bg-background/80 p-2 rounded-lg border border-border text-center">
                      <div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Water Level</p>
                        <p className="text-sm font-black text-red-600">{zone.water_level_meters ? `${zone.water_level_meters}m` : "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Affected People</p>
                        <p className="text-sm font-black text-foreground">{zone.affected_population ? zone.affected_population.toLocaleString() : "N/A"}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1">
                      <span>Status: <strong className="text-foreground capitalize">{zone.status}</strong></span>
                      <Link to="/rescue-route" className="text-primary font-bold hover:underline flex items-center gap-0.5">
                        View Safe Detour <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* EMERGENCY CALL FOOTER BANNER */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 rounded-3xl p-8 text-white shadow-2xl text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <Badge className="bg-white/20 text-white border-white/30 text-xs font-bold">
              🚨 24/7 Evacuation Support
            </Badge>
            <h2 className="text-2xl md:text-3xl font-black font-outfit">Stuck in rising water or need instant rescue?</h2>
            <p className="text-xs text-red-100 leading-relaxed">
              Submit a 1-click GPS SOS request or call the emergency response dispatcher directly.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Button asChild size="lg" className="bg-white text-red-700 hover:bg-red-50 font-bold gap-2 shadow-xl">
              <Link to="/emergency">
                <Siren className="w-5 h-5 animate-pulse" /> Trigger SOS Request
              </Link>
            </Button>
            <a href="tel:112">
              <Button size="lg" variant="outline" className="border-white/40 text-white bg-white/10 hover:bg-white/20 font-bold gap-2">
                <Phone className="w-5 h-5" /> Call 112
              </Button>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
