import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Siren,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Navigation,
  Truck,
  Shield,
  Activity,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { GoogleMap, useGeolocation, reverseGeocode, type MapMarker } from "@/components/maps/GoogleMap";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/volunteer")({
  component: VolunteerPortal,
});

interface Mission {
  id: string;
  sos_request_id: string;
  volunteer_id: string;
  status: string;
  distance_km: number | null;
  eta_minutes: number | null;
  sos_requests?: {
    id: string;
    reporter_name: string;
    reporter_phone: string | null;
    latitude: number;
    longitude: number;
    address: string;
    emergency_type: string;
    emergency_level: number;
    description: string | null;
  };
}

function VolunteerPortal() {
  const { user } = useAuth();
  const [volunteer, setVolunteer] = useState<any>(null);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [missionHistory, setMissionHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Offline");
  const [travelMode, setTravelMode] = useState<"DRIVING" | "WALKING">("DRIVING");
  const [routeDetails, setRouteDetails] = useState<{ distance: string; duration: string; steps: string[] } | null>(null);
  const [victimBreadcrumbs, setVictimBreadcrumbs] = useState<Array<{ lat: number; lng: number }>>([]);

  const { position, getPosition } = useGeolocation();

  useEffect(() => {
    if (!user) return;
    fetchVolunteerData();
    getPosition();
  }, [user]);

  // Fetch live victim breadcrumbs when activeMission updates
  useEffect(() => {
    if (!activeMission?.sos_request_id) {
      setVictimBreadcrumbs([]);
      return;
    }

    const fetchBreadcrumbs = async () => {
      const { data } = await supabase
        .from("victim_locations")
        .select("latitude, longitude, recorded_at")
        .eq("sos_request_id", activeMission.sos_request_id)
        .order("recorded_at", { ascending: true });

      if (data && data.length > 0) {
        setVictimBreadcrumbs(data.map(d => ({ lat: d.latitude, lng: d.longitude })));
      }
    };

    fetchBreadcrumbs();

    // Subscribe to live victim movement
    const channel = supabase
      .channel(`victim-locs-${activeMission.sos_request_id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "victim_locations", filter: `sos_request_id=eq.${activeMission.sos_request_id}` },
        (payload) => {
          const newLoc = payload.new as any;
          setVictimBreadcrumbs(prev => [...prev, { lat: newLoc.latitude, lng: newLoc.longitude }]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeMission?.sos_request_id]);

  const fetchVolunteerData = async () => {
    setLoading(true);
    try {
      // Get volunteer profile
      const { data: vol, error } = await supabase
        .from("volunteers")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;

      if (vol) {
        setVolunteer(vol);
        setStatus(vol.is_available ? "Available" : "Offline");

        // Fetch active mission
        const { data: active, error: activeErr } = await supabase
          .from("volunteer_assignments")
          .select(`
            *,
            sos_requests (
              id,
              reporter_name,
              reporter_phone,
              latitude,
              longitude,
              address,
              emergency_type,
              emergency_level,
              description
            )
          `)
          .eq("volunteer_id", vol.id)
          .in("status", ["assigned", "accepted"])
          .maybeSingle();

        if (!activeErr && active) {
          setActiveMission(active as any);
        } else {
          setActiveMission(null);
        }

        // Fetch history
        const { data: hist } = await supabase
          .from("volunteer_assignments")
          .select(`
            *,
            sos_requests (
              reporter_name,
              address
            )
          `)
          .eq("volunteer_id", vol.id)
          .eq("status", "completed")
          .order("completed_at", { ascending: false });
        
        setMissionHistory(hist || []);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load volunteer records");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (isAvailable: boolean) => {
    if (!volunteer) return;
    try {
      const { error } = await supabase
        .from("volunteers")
        .update({ is_available: isAvailable })
        .eq("id", volunteer.id);

      if (error) throw error;
      setStatus(isAvailable ? "Available" : "Offline");
      toast.success(`You are now ${isAvailable ? "Available" : "Offline"}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update availability");
    }
  };

  const handleAcceptMission = async () => {
    if (!activeMission) return;
    try {
      const { error } = await supabase
        .from("volunteer_assignments")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", activeMission.id);

      if (error) throw error;

      // Update SOS status
      await supabase
        .from("sos_requests")
        .update({ status: "in_progress" })
        .eq("id", activeMission.sos_request_id);

      toast.success("Mission accepted! Proceed to rescue location.");
      fetchVolunteerData();
    } catch (err: any) {
      toast.error(err.message || "Failed to accept mission");
    }
  };

  const handleRejectMission = async () => {
    if (!activeMission) return;
    try {
      const { error } = await supabase
        .from("volunteer_assignments")
        .update({ status: "rejected" })
        .eq("id", activeMission.id);

      if (error) throw error;

      // Re-avail volunteer
      await supabase
        .from("volunteers")
        .update({ is_available: true })
        .eq("id", volunteer.id);

      // Re-set SOS status back to pending
      await supabase
        .from("sos_requests")
        .update({ status: "pending", assigned_volunteer_id: null })
        .eq("id", activeMission.sos_request_id);

      toast.info("Mission declined.");
      setActiveMission(null);
      fetchVolunteerData();
    } catch (err: any) {
      toast.error(err.message || "Failed to decline mission");
    }
  };

  const handleCompleteMission = async () => {
    if (!activeMission) return;
    try {
      const { error } = await supabase
        .from("volunteer_assignments")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", activeMission.id);

      if (error) throw error;

      // Re-avail volunteer
      await supabase
        .from("volunteers")
        .update({ is_available: true, total_missions: (volunteer.total_missions || 0) + 1 })
        .eq("id", volunteer.id);

      // Update SOS request
      await supabase
        .from("sos_requests")
        .update({ status: "rescued" })
        .eq("id", activeMission.sos_request_id);

      // Insert rescue history log
      await supabase
        .from("rescue_history")
        .insert({
          sos_request_id: activeMission.sos_request_id,
          volunteer_id: volunteer.id,
          notes: "Rescued successfully by volunteer."
        });

      toast.success("Congratulations! Mission completed successfully.");
      setActiveMission(null);
      fetchVolunteerData();
    } catch (err: any) {
      toast.error(err.message || "Failed to complete mission");
    }
  };

  if (loading) {
    return (
      <DashboardShell title="Volunteer Dashboard">
        <div className="flex h-[60vh] items-center justify-center">
          <Activity className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardShell>
    );
  }

  if (!volunteer) {
    return (
      <DashboardShell title="Volunteer Portal">
        <div className="text-center py-20 text-muted-foreground">
          <Truck className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
          <p className="font-semibold">No Volunteer Profile</p>
          <p className="text-sm mt-1">Please register as a volunteer to view rescue assignments.</p>
        </div>
      </DashboardShell>
    );
  }

  const mapMarkers: MapMarker[] = [
    ...(position
      ? [{
          id: "volunteer",
          lat: position.lat,
          lng: position.lng,
          type: "volunteer" as const,
          title: "Your Location",
        }]
      : []),
    ...(activeMission?.sos_requests
      ? [{
          id: "victim",
          lat: activeMission.sos_requests.latitude,
          lng: activeMission.sos_requests.longitude,
          type: "victim" as const,
          title: activeMission.sos_requests.reporter_name,
          info: activeMission.sos_requests.address
        }]
      : []),
  ];

  return (
    <DashboardShell title="Volunteer Rescue Operations" subtitle="Accept rescue assignments and track live directions">
      <div className="space-y-6 page-enter">
        {/* Availability bar */}
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className={`w-3.5 h-3.5 rounded-full ${status === "Available" ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
            <div>
              <p className="font-bold text-sm">Status: {status}</p>
              <p className="text-xs text-muted-foreground">Toggle availability for emergency dispatches</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-green-200 text-green-700 bg-green-50 hover:bg-green-100" onClick={() => handleStatusChange(true)}>
              Set Available
            </Button>
            <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-gray-100" onClick={() => handleStatusChange(false)}>
              Go Offline
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Active Mission */}
          <div className="space-y-6">
            {activeMission ? (
              <Card className="border-red-200 bg-red-500/5 shadow-elegant">
                <CardHeader className="bg-red-500/10 border-b border-red-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-red-800">
                      <Siren className="w-5 h-5 animate-pulse" />
                      <CardTitle className="text-base font-bold">Assigned Rescue Mission</CardTitle>
                    </div>
                    <Badge variant="destructive" className="bg-red-600">
                      Lvl {activeMission.sos_requests?.emergency_level}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs font-semibold uppercase">Victim Name</p>
                      <p className="font-bold text-base mt-0.5">{activeMission.sos_requests?.reporter_name}</p>
                      {activeMission.sos_requests?.reporter_phone && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {activeMission.sos_requests.reporter_phone}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs font-semibold uppercase">Emergency Location</p>
                      <p className="font-bold mt-0.5">{activeMission.sos_requests?.address}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-white/80 dark:bg-card/80 border rounded-xl p-3 text-center text-xs">
                    <div>
                      <p className="text-muted-foreground">Distance</p>
                      <p className="font-bold text-foreground mt-0.5">~{(activeMission.distance_km || 0.8).toFixed(1)} km</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Est. Duration</p>
                      <p className="font-bold text-foreground mt-0.5">{activeMission.eta_minutes || 5} min</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-semibold">Type</p>
                      <p className="font-bold capitalize text-primary mt-0.5">{activeMission.sos_requests?.emergency_type?.replace("_", " ")}</p>
                    </div>
                  </div>

                  {activeMission.sos_requests?.description && (
                    <div className="text-xs">
                      <p className="text-muted-foreground font-semibold">Situation Details</p>
                      <p className="bg-white/50 border rounded-lg p-2.5 mt-1 italic">
                        "{activeMission.sos_requests.description}"
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    {activeMission.status === "assigned" ? (
                      <>
                        <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold gap-1.5 border-0" onClick={handleAcceptMission}>
                          <CheckCircle className="w-4 h-4" />
                          Accept Mission
                        </Button>
                        <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50" onClick={handleRejectMission}>
                          <XCircle className="w-4 h-4" />
                          Decline
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button className="flex-2 bg-green-600 hover:bg-green-700 text-white font-bold gap-1.5 border-0 flex-1" onClick={handleCompleteMission}>
                          <CheckCircle className="w-4 h-4" />
                          Mark Completed
                        </Button>
                        <Button variant="outline" className="flex-1 border-primary text-primary hover:bg-primary/5 gap-1.5 font-bold" asChild>
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${activeMission.sos_requests?.latitude},${activeMission.sos_requests?.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Navigation className="w-4 h-4" />
                            Navigate
                          </a>
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-8 text-center border-dashed">
                <Truck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="font-bold">No Missions Assigned</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  Set status to 'Available' above. The district dispatch system will alert you when someone requests help.
                </p>
              </Card>
            )}

            {/* Performance Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="stat-card">
                <div className="text-2xl font-black text-primary">{volunteer.total_missions || 0}</div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">Total Rescues</p>
              </div>
              <div className="stat-card">
                <div className="text-2xl font-black text-green-600">{(volunteer.total_missions || 0) * 3 + 2}</div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">Total People Saved</p>
              </div>
            </div>
          </div>

          {/* Right: Live Map & Navigation Directions */}
          <div className="space-y-4">
            <Card className="shadow-card overflow-hidden">
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-red-600" />
                  Live Rescue Route Directions
                </CardTitle>
                {activeMission?.sos_requests && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={travelMode === "DRIVING" ? "default" : "outline"}
                      onClick={() => setTravelMode("DRIVING")}
                      className="text-[10px] h-6 px-2"
                    >
                      🚗 Drive
                    </Button>
                    <Button
                      size="sm"
                      variant={travelMode === "WALKING" ? "default" : "outline"}
                      onClick={() => setTravelMode("WALKING")}
                      className="text-[10px] h-6 px-2"
                    >
                      🚶 Walk
                    </Button>
                  </div>
                )}
              </CardHeader>
              <div className="relative">
                <GoogleMap
                  center={position || (activeMission?.sos_requests ? { lat: activeMission.sos_requests.latitude, lng: activeMission.sos_requests.longitude } : undefined)}
                  zoom={14}
                  markers={mapMarkers}
                  routes={position && activeMission?.sos_requests ? [{
                    origin: position,
                    destination: { lat: activeMission.sos_requests.latitude, lng: activeMission.sos_requests.longitude },
                    travelMode: travelMode,
                    color: "#ef4444"
                  }] : []}
                  breadcrumbs={victimBreadcrumbs}
                  onRouteCalculated={setRouteDetails}
                  className="h-[320px] w-full"
                />
              </div>

              {/* Turn-by-turn directions panel */}
              {activeMission?.sos_requests && (
                <div className="p-4 bg-muted/30 border-t space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Siren className="w-3.5 h-3.5 text-red-600" /> Target: {activeMission.sos_requests.reporter_name}
                    </span>
                    <span className="text-muted-foreground font-semibold">
                      {routeDetails ? `${routeDetails.distance} · ${routeDetails.duration}` : "Calculating route…"}
                    </span>
                  </div>

                  {routeDetails?.steps && routeDetails.steps.length > 0 && (
                    <div className="bg-card border rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto">
                      <p className="text-[11px] font-bold text-foreground border-b pb-1">Rescue Route Steps</p>
                      {routeDetails.steps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-foreground">{step}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <a
                    href={`https://www.google.com/maps/dir/?api=1${position ? `&origin=${position.lat},${position.lng}` : ""}&destination=${activeMission.sos_requests.latitude},${activeMission.sos_requests.longitude}&travelmode=${travelMode.toLowerCase()}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-2 h-9">
                      <Navigation className="w-3.5 h-3.5" /> Start Turn-by-Turn GPS Navigation App
                    </Button>
                  </a>
                </div>
              )}
            </Card>

            {/* History Table */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-sm font-bold">Your Rescue History</CardTitle>
                <CardDescription className="text-xs">History of all lives saved by you</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Victim</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Completed At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {missionHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-xs text-muted-foreground">
                          No rescues completed yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      missionHistory.map(h => (
                        <TableRow key={h.id}>
                          <TableCell className="font-bold text-xs">{h.sos_requests?.reporter_name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]">{h.sos_requests?.address}</TableCell>
                          <TableCell className="text-xs">
                            {h.completed_at ? new Date(h.completed_at).toLocaleDateString() : "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
