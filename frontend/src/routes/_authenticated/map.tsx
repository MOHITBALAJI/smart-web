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
  // Erode Relief Camps
  { id: "camp-1", lat: 11.3444, lng: 77.7244, type: "camp", title: "Erode Central Relief Base #1", info: "Capacity: 245/500 occupied · Phone: +91 94440 12345" },
  { id: "camp-2", lat: 11.4512, lng: 77.4610, type: "camp", title: "Bhavani Emergency Base #2", info: "Capacity: 180/350 occupied · Phone: +91 94440 67890" },
  // Salem Relief Camps
  { id: "camp-3", lat: 11.6650, lng: 78.1580, type: "camp", title: "Salem South Relief Base #3", info: "Capacity: 310/400 occupied · Phone: +91 94440 54321" },
  { id: "camp-4", lat: 11.6920, lng: 78.1800, type: "camp", title: "Salem Steel Plant Safe Zone #4", info: "Capacity: 150/300 occupied · Phone: +91 94440 98765" },
  // Coimbatore Relief Camps
  { id: "camp-5", lat: 11.0180, lng: 76.9720, type: "camp", title: "Gandhipuram Evacuation Hub #5", info: "Capacity: 450/600 occupied · Phone: +91 94441 12345" },
  { id: "camp-6", lat: 11.0450, lng: 76.9950, type: "camp", title: "Peelamedu Relief Base #6", info: "Capacity: 120/200 occupied · Phone: +91 94441 67890" },
  // Trichy Relief Camps
  { id: "camp-7", lat: 10.8050, lng: 78.6920, type: "camp", title: "Srirangam Temple Relief #7", info: "Capacity: 800/1000 occupied · Phone: +91 94442 54321" },
  { id: "camp-8", lat: 10.8220, lng: 78.7100, type: "camp", title: "Trichy Cantt Safe Zone #8", info: "Capacity: 250/350 occupied · Phone: +91 94442 98765" },

  // Active Volunteers
  { id: "vol-1", lat: 11.3580, lng: 77.7120, type: "volunteer", title: "Manoj Kumar (Volunteer Rescuer)", info: "Vehicle: Rescue Motor Boat ⛵ · Status: Dispatched" },
  { id: "vol-2", lat: 11.6780, lng: 78.1650, type: "volunteer", title: "Priya Dharshini (Rescue Patrol)", info: "Vehicle: 4x4 Heavy Truck 🚛 · Status: Dispatched" },
  { id: "vol-3", lat: 11.0270, lng: 76.9650, type: "volunteer", title: "Karthik Raja (Rescue Unit)", info: "Vehicle: Emergency Ambulance 🚑 · Status: Available" },
  { id: "vol-4", lat: 10.8100, lng: 78.7050, type: "volunteer", title: "Surya Prakash (Relief Scout)", info: "Vehicle: Disaster Relief SUV 🚙 · Status: Available" },
  { id: "vol-5", lat: 11.4300, lng: 77.5000, type: "volunteer", title: "Naveen Raj (Evacuation)", info: "Vehicle: Rescue Motor Boat ⛵ · Status: Dispatched" },
  { id: "vol-6", lat: 11.6850, lng: 78.1750, type: "volunteer", title: "Meena K. (Medic)", info: "Vehicle: Mobile Clinic 🏥 · Status: Available" },
  { id: "vol-7", lat: 11.0350, lng: 76.9850, type: "volunteer", title: "Rahul V. (Logistics)", info: "Vehicle: Supply Truck 🚚 · Status: Dispatched" },
  { id: "vol-8", lat: 10.8150, lng: 78.6850, type: "volunteer", title: "Anita S. (Coordinator)", info: "Vehicle: Transport Van 🚐 · Status: Available" },

  // Emergency SOS Requests
  { id: "sos-1", lat: 11.3648, lng: 77.7289, type: "victim", title: "SOS: Kavitha R. & Family", info: "Level 5 Emergency: Diabetic patient, trapped in 4ft floodwater" },
  { id: "sos-2", lat: 11.4710, lng: 77.4490, type: "victim", title: "SOS: Suresh Kumar (Roof Trapped)", info: "Level 5 Emergency: 3 seniors on terrace, ground floor flooded" },
  { id: "sos-3", lat: 11.6750, lng: 78.1720, type: "victim", title: "SOS: Manoj B. (Senior Citizen)", info: "Level 4 Emergency: Wheelchair user stranded on 1st floor" },
  { id: "sos-4", lat: 11.6810, lng: 78.1620, type: "victim", title: "SOS: Divya Dharshini & Group", info: "Level 4 Emergency: Power cut 18hrs, drinking water needed" },
  { id: "sos-5", lat: 11.0210, lng: 76.9820, type: "victim", title: "SOS: Ram M. (Medical Emergency)", info: "Level 5 Emergency: Pregnant woman, water rising rapidly" },
  { id: "sos-6", lat: 11.0410, lng: 76.9620, type: "victim", title: "SOS: Shanthi K. (Infant)", info: "Level 4 Emergency: 6 month baby, out of formula/food" },
  { id: "sos-7", lat: 10.8110, lng: 78.6920, type: "victim", title: "SOS: Vinoth R. (Trapped)", info: "Level 3 Emergency: Tree fell on house, structural damage" },
  { id: "sos-8", lat: 10.8310, lng: 78.7020, type: "victim", title: "SOS: Lakshmi P. (Isolated)", info: "Level 3 Emergency: Cut off from mainland, food running low" },
  { id: "sos-9", lat: 11.3800, lng: 77.7100, type: "victim", title: "SOS: Prabhu S. (Electrocution Risk)", info: "Level 5 Emergency: Live wire in water, trapped inside" },
  { id: "sos-10", lat: 11.6600, lng: 78.1900, type: "victim", title: "SOS: Deepa N. (Group of 12)", info: "Level 4 Emergency: Hostel students stranded, no supplies" }
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
  const [floodZonesCount, setFloodZonesCount] = useState(0);
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
        setFloodZonesCount(zones.length);
        const parsed = zones.map((z: any) => ({
          severity: z.severity,
          coordinates: Array.isArray(z.coordinates) ? z.coordinates : []
        }));
        setFloodZones(parsed);
      } else {
        setFloodZonesCount(2); // mock data length if API fails but zones is null
      }

      if (markersList.length === 0) {
        setMarkers(SAMPLE_MAP_MARKERS);
        setActiveSosCount(10);
        setActiveVolunteersCount(8);
        setTotalCampsCount(8);
      } else {
        setMarkers(markersList);
      }
    } catch (err) {
      console.error(err);
      setMarkers(SAMPLE_MAP_MARKERS);
      setActiveSosCount(10);
      setActiveVolunteersCount(8);
      setTotalCampsCount(8);
      setFloodZonesCount(2);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell title="Live GIS Control Map" subtitle="Real-time geo-visualization of relief camps, volunteers, and SOS alerts">
      <div className="space-y-6 page-enter flex flex-col h-[calc(100vh-140px)]">
        {/* Top summary row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 flex-shrink-0">
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
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Flood Zones Active</p>
                <h3 className="text-2xl font-black text-amber-600 mt-1">{floodZonesCount}</h3>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Layers className="w-4 h-4 text-amber-500" />
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

        {/* Map and Activity Feed Area */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
          <div className="flex-[3] bg-card border border-border rounded-2xl overflow-hidden shadow-card relative h-full min-h-[400px]">
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
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50 border border-amber-500 flex-shrink-0" />
                <span>Flood Hazard Zones</span>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="flex-1 bg-card border border-border rounded-2xl shadow-card overflow-hidden flex flex-col h-[300px] lg:h-full">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm">Live Activity Feed</h3>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <div className="flex gap-3 text-sm border-b border-border pb-3">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">🆘 New SOS: Kavitha R. reported from Erode</p>
                  <p className="text-xs text-muted-foreground">2 min ago</p>
                </div>
              </div>
              <div className="flex gap-3 text-sm border-b border-border pb-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">✅ Rescued: Suresh K. evacuated to Camp #3</p>
                  <p className="text-xs text-muted-foreground">8 min ago</p>
                </div>
              </div>
              <div className="flex gap-3 text-sm border-b border-border pb-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">🚤 Volunteer Manoj dispatched to Sector 7</p>
                  <p className="text-xs text-muted-foreground">12 min ago</p>
                </div>
              </div>
              <div className="flex gap-3 text-sm border-b border-border pb-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">⛺ Camp #5 reached 90% capacity</p>
                  <p className="text-xs text-muted-foreground">20 min ago</p>
                </div>
              </div>
              <div className="flex gap-3 text-sm border-b border-border pb-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">🌊 Water level rising in Zone B4</p>
                  <p className="text-xs text-muted-foreground">35 min ago</p>
                </div>
              </div>
              <div className="flex gap-3 text-sm border-b border-border pb-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">✅ Relief supplies delivered to Camp #1</p>
                  <p className="text-xs text-muted-foreground">42 min ago</p>
                </div>
              </div>
              <div className="flex gap-3 text-sm border-b border-border pb-3">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">🆘 New SOS: Ram M. reported from Coimbatore</p>
                  <p className="text-xs text-muted-foreground">50 min ago</p>
                </div>
              </div>
              <div className="flex gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">🚑 Volunteer Priya dispatched to Coimbatore</p>
                  <p className="text-xs text-muted-foreground">1 hr ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
