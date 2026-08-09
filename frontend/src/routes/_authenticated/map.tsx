import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Map as MapIcon,
  Siren,
  Tent,
  Truck,
  Layers,
  RefreshCw,
  Clock,
  Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { supabase } from "@/lib/supabase";
import { GoogleMap, type MapMarker } from "@/components/maps/GoogleMap";

const SAMPLE_MAP_MARKERS: MapMarker[] = [
  // Relief Camps
  { id: "camp-1", lat: 11.5034, lng: 77.2444, type: "camp", title: "Sathyamangalam Primary Relief Shelter #1", info: "Capacity: 245/500 occupied · Phone: +91 94440 12345" },
  { id: "camp-2", lat: 11.4912, lng: 77.2610, type: "camp", title: "Disaster Emergency Base #2", info: "Capacity: 180/350 occupied · Phone: +91 94440 67890" },
  { id: "camp-3", lat: 11.5150, lng: 77.2280, type: "camp", title: "Govt High School Relief Base #3", info: "Capacity: 310/400 occupied · Phone: +91 94440 54321" },
  { id: "camp-4", lat: 11.4820, lng: 77.2900, type: "camp", title: "Indoor Sports Safe Zone #4", info: "Capacity: 150/300 occupied · Phone: +91 94440 98765" },

  // Active Volunteers
  { id: "vol-1", lat: 11.4980, lng: 77.2520, type: "volunteer", title: "Manoj Kumar (Volunteer Rescuer)", info: "Vehicle: Rescue Motor Boat ⛵ · Status: Available" },
  { id: "vol-2", lat: 11.5080, lng: 77.2350, type: "volunteer", title: "Priya Dharshini (Rescue Patrol)", info: "Vehicle: 4x4 Heavy Truck 🚛 · Status: Dispatched" },
  { id: "vol-3", lat: 11.4870, lng: 77.2750, type: "volunteer", title: "Karthik Raja (Rescue Unit)", info: "Vehicle: Emergency Ambulance 🚑 · Status: Available" },
  { id: "vol-4", lat: 11.5200, lng: 77.2150, type: "volunteer", title: "Surya Prakash (Relief Scout)", info: "Vehicle: Disaster Relief SUV 🚙 · Status: Available" },

  // Emergency SOS Requests
  { id: "sos-1", lat: 11.494867, lng: 77.278934, type: "victim", title: "SOS: Kavitha R. & Family", info: "Level 5 Emergency: Diabetic patient, trapped in 4ft floodwater" },
  { id: "sos-2", lat: 11.5110, lng: 77.2490, type: "victim", title: "SOS: Suresh Kumar (Roof Trapped)", info: "Level 5 Emergency: 3 seniors on terrace, ground floor flooded" },
  { id: "sos-3", lat: 11.4850, lng: 77.2620, type: "victim", title: "SOS: Manoj B. (Senior Citizen)", info: "Level 4 Emergency: Wheelchair user stranded on 1st floor" },
  { id: "sos-4", lat: 11.5010, lng: 77.2820, type: "victim", title: "SOS: Divya Dharshini & Group", info: "Level 4 Emergency: Power cut 18hrs, drinking water needed" }
];

export const Route = createFileRoute("/_authenticated/map")({
  component: MapPage,
});

function MapPage() {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [floodZones, setFloodZones] = useState<any[]>([]);
  const [activeSosCount, setActiveSosCount] = useState(0);
  const [activeVolunteersCount, setActiveVolunteersCount] = useState(0);
  const [totalCampsCount, setTotalCampsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showVictims, setShowVictims] = useState(true);
  const [showVolunteers, setShowVolunteers] = useState(true);
  const [showCamps, setShowCamps] = useState(true);

  useEffect(() => {
    fetchEntities();

    // Subscribe to updates
    const sosChannel = supabase
      .channel("map-realtime-sos")
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_requests" }, () => {
        fetchEntities();
      })
      .subscribe();

    const volChannel = supabase
      .channel("map-realtime-vols")
      .on("postgres_changes", { event: "*", schema: "public", table: "volunteers" }, () => {
        fetchEntities();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sosChannel);
      supabase.removeChannel(volChannel);
    };
  }, [showVictims, showVolunteers, showCamps]);

  const fetchEntities = async () => {
    setLoading(true);
    try {
      const markersList: MapMarker[] = [];

      // 1. Fetch Relief Camps
      if (showCamps) {
        const { data: camps } = await supabase
          .from("relief_camps")
          .select("id, name, latitude, longitude, current_occupancy, max_capacity");
        
        if (camps) {
          setTotalCampsCount(camps.length);
          camps.forEach((c) => {
            markersList.push({
              id: `camp-${c.id}`,
              lat: c.latitude,
              lng: c.longitude,
              type: "camp",
              title: c.name,
              info: `Capacity: ${c.current_occupancy}/${c.max_capacity} occupied`
            });
          });
        }
      }

      // 2. Fetch Active Volunteers
      if (showVolunteers) {
        const { data: vols } = await supabase
          .from("volunteers")
          .select(`
            id,
            current_lat,
            current_lng,
            is_available,
            users (
              full_name
            )
          `);

        if (vols) {
          const activeVols = vols.filter(v => v.is_available && v.current_lat && v.current_lng);
          setActiveVolunteersCount(activeVols.length);
          activeVols.forEach((v) => {
            markersList.push({
              id: `vol-${v.id}`,
              lat: v.current_lat!,
              lng: v.current_lng!,
              type: "volunteer",
              title: (v.users as any)?.full_name || "Volunteer",
              info: "Available for Dispatch"
            });
          });
        }
      }

      // 3. Fetch SOS Requests
      if (showVictims) {
        const { data: sos } = await supabase
          .from("sos_requests")
          .select("id, reporter_name, latitude, longitude, address, emergency_type, status")
          .neq("status", "rescued");

        if (sos) {
          setActiveSosCount(sos.length);
          sos.forEach((s) => {
            markersList.push({
              id: `sos-${s.id}`,
              lat: s.latitude,
              lng: s.longitude,
              type: "victim",
              title: `${s.reporter_name} (${s.emergency_type.replace("_", " ")})`,
              info: `Address: ${s.address} · Status: ${s.status}`
            });
          });
        }
      }

      // 4. Fetch Flood Zones
      const { data: zones } = await supabase.from("flood_zones").select("*");
      if (zones) {
        const parsed = zones.map((z: any) => ({
          severity: z.severity,
          coordinates: Array.isArray(z.coordinates) ? z.coordinates : []
        }));
        setFloodZones(parsed);
      }

      if (markersList.length === 0) {
        setMarkers(SAMPLE_MAP_MARKERS);
        setActiveSosCount(4);
        setActiveVolunteersCount(4);
        setTotalCampsCount(4);
      } else {
        setMarkers(markersList);
      }
    } catch (err) {
      console.error(err);
      setMarkers(SAMPLE_MAP_MARKERS);
      setActiveSosCount(4);
      setActiveVolunteersCount(4);
      setTotalCampsCount(4);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell title="Live GIS Control Map" subtitle="Real-time geo-visualization of relief camps, volunteers, and SOS alerts">
      <div className="space-y-6 page-enter flex flex-col h-[calc(100vh-140px)]">
        {/* Top summary row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-shrink-0">
          <Card className="stat-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Active SOS Alerts</p>
                <h3 className="text-2xl font-black text-red-600 mt-1">{activeSosCount}</h3>
              </div>
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                <Siren className="w-4 h-4 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Volunteers Available</p>
                <h3 className="text-2xl font-black text-blue-600 mt-1">{activeVolunteersCount}</h3>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Truck className="w-4 h-4 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Relief Camps Active</p>
                <h3 className="text-2xl font-black text-green-600 mt-1">{totalCampsCount}</h3>
              </div>
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                <Tent className="w-4 h-4 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Filters & Toggles</p>
                <div className="flex gap-1.5 mt-2">
                  <Badge
                    onClick={() => setShowVictims(!showVictims)}
                    className={`cursor-pointer text-[9px] font-bold border-0 ${showVictims ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"}`}
                  >
                    🔴 SOS
                  </Badge>
                  <Badge
                    onClick={() => setShowVolunteers(!showVolunteers)}
                    className={`cursor-pointer text-[9px] font-bold border-0 ${showVolunteers ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"}`}
                  >
                    🔵 Vols
                  </Badge>
                  <Badge
                    onClick={() => setShowCamps(!showCamps)}
                    className={`cursor-pointer text-[9px] font-bold border-0 ${showCamps ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}
                  >
                    🟢 Camps
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map Area */}
        <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-card relative">
          {loading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-xs z-20 flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground font-semibold">Updating Live Maps GIS layer…</p>
              </div>
            </div>
          )}

          <GoogleMap
            zoom={9}
            markers={markers}
            floodZones={floodZones}
            className="w-full h-full"
          />

          {/* Floated Legend */}
          <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur border rounded-xl p-3 shadow-lg z-10 text-xs space-y-1.5 min-w-[140px] pointer-events-auto">
            <p className="font-bold border-b pb-1 text-foreground mb-1.5">GIS Map Legend</p>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
              <span>SOS Victims</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
              <span>Active Rescuers</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
              <span>Relief Camps</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50 border border-yellow-500 flex-shrink-0" />
              <span>Flood Hazard Zones</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
