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

      setMarkers(markersList);
    } catch (err) {
      console.error(err);
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
