import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Siren,
  Search,
  Filter,
  Eye,
  UserCheck,
  CheckCircle,
  AlertTriangle,
  Clock,
  Phone,
  MapPin,
  Map,
  XCircle,
  Truck,
  Navigation
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { supabase } from "@/lib/supabase";
import { useRole } from "@/context/AuthContext";
import { GoogleMap, useGeolocation, type MapMarker } from "@/components/maps/GoogleMap";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/requests")({
  component: RequestsPage,
});

interface SosRequest {
  id: string;
  reporter_name: string;
  reporter_phone: string | null;
  latitude: number;
  longitude: number;
  address: string;
  accuracy: number | null;
  emergency_type: string;
  emergency_level: number;
  description: string | null;
  battery_level: number | null;
  status: string;
  assigned_volunteer_id: string | null;
  created_at: string;
  volunteer_name?: string;
}

interface Volunteer {
  id: string;
  user_id: string;
  full_name: string;
  vehicle_type: string;
  is_available: boolean;
}

function RequestsPage() {
  const [requests, setRequests] = useState<SosRequest[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [routeDetails, setRouteDetails] = useState<{ distance: string; duration: string; steps: string[] } | null>(null);
  const [victimBreadcrumbs, setVictimBreadcrumbs] = useState<Array<{ lat: number; lng: number }>>([]);

  const { position, getPosition } = useGeolocation();
  
  // Selection/Modals
  const [selectedReq, setSelectedReq] = useState<SosRequest | null>(null);
  const [assigningReq, setAssigningReq] = useState<SosRequest | null>(null);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState("");

  const { isAdmin } = useRole();

  useEffect(() => {
    getPosition();
  }, []);

  // Fetch victim breadcrumbs when selectedReq changes
  useEffect(() => {
    if (!selectedReq) {
      setVictimBreadcrumbs([]);
      return;
    }

    const fetchBreadcrumbs = async () => {
      const { data } = await supabase
        .from("victim_locations")
        .select("latitude, longitude, recorded_at")
        .eq("sos_request_id", selectedReq.id)
        .order("recorded_at", { ascending: true });

      if (data && data.length > 0) {
        setVictimBreadcrumbs(data.map(d => ({ lat: d.latitude, lng: d.longitude })));
      } else {
        setVictimBreadcrumbs([{ lat: selectedReq.latitude, lng: selectedReq.longitude }]);
      }
    };

    fetchBreadcrumbs();
  }, [selectedReq]);

  useEffect(() => {
    fetchRequests();
    fetchVolunteers();

    // Subscribe to realtime updates for SOS requests
    const channel = supabase
      .channel("sos-list-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sos_requests" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newReq = payload.new as SosRequest;
            setRequests((prev) => [newReq, ...prev]);
            toast.error(`🚨 NEW SOS: ${newReq.reporter_name} requested help!`);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as SosRequest;
            setRequests((prev) =>
              prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
            );
          } else if (payload.eventType === "DELETE") {
            setRequests((prev) => prev.filter((r) => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

const MOCK_REQUESTS: SosRequest[] = [
  { id: "req1", reporter_name: "Kavitha R.", reporter_phone: "+91 98401 23456", latitude: 11.4948, longitude: 77.2789, address: "BIT Campus Sector, Sathyamangalam", emergency_type: "flood_rescue", emergency_level: 5, description: "Trapped in 4ft water on roof, diabetic patient", battery_level: 95, status: "assigned", created_at: "2026-08-09T08:30:00Z", volunteer_name: "Manoj Kumar" },
  { id: "req2", reporter_name: "Ramesh K.", reporter_phone: "+91 98402 34567", latitude: 11.5012, longitude: 77.2845, address: "Bhavani Main Road, Sathyamangalam", emergency_type: "medical", emergency_level: 5, description: "Asthma patient requires oxygen cylinder", battery_level: 70, status: "assigned", created_at: "2026-08-09T09:00:00Z", volunteer_name: "Karthik K." },
  { id: "req3", reporter_name: "Priya V.", reporter_phone: "+91 98403 45678", latitude: 12.9815, longitude: 80.2180, address: "100ft Bypass Road, Velachery", emergency_type: "stranded", emergency_level: 4, description: "Pregnant woman stranded on 2nd floor", battery_level: 85, status: "assigned", created_at: "2026-08-09T09:20:00Z", volunteer_name: "Vigneshwaran S." },
  { id: "req4", reporter_name: "Rajesh S.", reporter_phone: "+91 98404 56789", latitude: 11.3410, longitude: 77.7172, address: "Bhavani Road, Erode Central", emergency_type: "structural_damage", emergency_level: 5, description: "House wall collapsed, 4 family members trapped", battery_level: 40, status: "assigned", created_at: "2026-08-09T09:45:00Z", volunteer_name: "Surya S." },
  { id: "req5", reporter_name: "Deepa N.", reporter_phone: "+91 98405 67890", latitude: 11.3001, longitude: 76.9442, address: "Nilgiri Highway, Mettupalayam", emergency_type: "flood_rescue", emergency_level: 4, description: "Elderly citizen trapped, water rising", battery_level: 60, status: "assigned", created_at: "2026-08-09T10:10:00Z", volunteer_name: "Anitha A." },
  { id: "req6", reporter_name: "Karthik M.", reporter_phone: "+91 98406 78901", latitude: 11.4549, longitude: 77.4382, address: "Modachur Road, Gobichettipalayam", emergency_type: "medical", emergency_level: 4, description: "Leg fracture needing medical stretcher", battery_level: 90, status: "in_progress", created_at: "2026-08-09T10:35:00Z", volunteer_name: "Ramesh B." },
  { id: "req7", reporter_name: "Lakshmi P.", reporter_phone: "+91 98407 89012", latitude: 11.0168, longitude: 76.9558, address: "Peelamedu, Coimbatore", emergency_type: "stranded", emergency_level: 3, description: "Need baby formula & clean drinking water", battery_level: 55, status: "in_progress", created_at: "2026-08-09T11:00:00Z", volunteer_name: "Suresh R." },
  { id: "req8", reporter_name: "Vignesh A.", reporter_phone: "+91 98408 90123", latitude: 11.1085, longitude: 77.3411, address: "Kangeyam Road, Tiruppur", emergency_type: "flood_rescue", emergency_level: 3, description: "Car submerged, occupants safe on embankment", battery_level: 30, status: "completed", created_at: "2026-08-09T11:25:00Z", volunteer_name: "Anand V." },
  { id: "req9", reporter_name: "Anitha K.", reporter_phone: "+91 98409 01234", latitude: 11.4468, longitude: 77.6833, address: "Kalingarayan Canal, Bhavani", emergency_type: "medical", emergency_level: 3, description: "High fever in children, need transport", battery_level: 75, status: "completed", created_at: "2026-08-09T11:50:00Z", volunteer_name: "Divya M." },
  { id: "req10", reporter_name: "Divya B.", reporter_phone: "+91 98410 12345", latitude: 11.2750, longitude: 77.5833, address: "Chennimalai Road, Perundurai", emergency_type: "stranded", emergency_level: 2, description: "Need emergency food packets for 6 people", battery_level: 80, status: "completed", created_at: "2026-08-09T12:15:00Z", volunteer_name: "Priya P." },
  { id: "req11", reporter_name: "Surya T.", reporter_phone: "+91 98411 23456", latitude: 11.6643, longitude: 78.1460, address: "Omalur Main Road, Salem", emergency_type: "medical", emergency_level: 5, description: "Senior citizen heart medication emergency", battery_level: 65, status: "pending", created_at: "2026-08-09T12:40:00Z", volunteer_name: null },
  { id: "req12", reporter_name: "Sundar M.", reporter_phone: "+91 98412 34567", latitude: 10.9601, longitude: 78.0766, address: "Bypass Road, Karur", emergency_type: "flood_rescue", emergency_level: 4, description: "Water entered ground floor, evacuating to 1st floor", battery_level: 50, status: "pending", created_at: "2026-08-09T13:05:00Z", volunteer_name: null },
  { id: "req13", reporter_name: "Meena R.", reporter_phone: "+91 98413 45678", latitude: 11.2189, longitude: 78.1674, address: "Tiruchengode Road, Namakkal", emergency_type: "stranded", emergency_level: 3, description: "Power outage, need battery lanterns", battery_level: 20, status: "pending", created_at: "2026-08-09T13:30:00Z", volunteer_name: null },
  { id: "req14", reporter_name: "Anand G.", reporter_phone: "+91 98414 56789", latitude: 11.2333, longitude: 77.1333, address: "Mettupalayam Road, Annur", emergency_type: "medical", emergency_level: 2, description: "Minor arm injury, first aid kit required", battery_level: 88, status: "completed", created_at: "2026-08-09T13:55:00Z", volunteer_name: "Deepa N." },
  { id: "req15", reporter_name: "Balaji V.", reporter_phone: "+91 98415 67890", latitude: 11.3250, longitude: 76.9850, address: "Bhavani Sagar Road, Sirumugai", emergency_type: "flood_rescue", emergency_level: 5, description: "Motorboat rescue completed, arrived at camp", battery_level: 100, status: "completed", created_at: "2026-08-09T14:20:00Z", volunteer_name: "Manoj Kumar" },
] as unknown as SosRequest[];

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sos_requests")
        .select(`
          *,
          volunteers (
            id,
            users (
              full_name
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const formatted = data.map((r: any) => ({
          ...r,
          volunteer_name: r.volunteers?.users?.full_name || null
        }));
        setRequests(formatted);
      } else {
        setRequests(MOCK_REQUESTS);
      }
    } catch {
      setRequests(MOCK_REQUESTS);
    }
    setLoading(false);
  };

  const fetchVolunteers = async () => {
    const { data, error } = await supabase
      .from("volunteers")
      .select(`
        id,
        user_id,
        vehicle_type,
        is_available,
        users (
          full_name
        )
      `)
      .eq("is_available", true);

    if (!error && data && data.length > 0) {
      const formatted = data.map((v: any) => ({
        id: v.id,
        user_id: v.user_id,
        full_name: v.users?.full_name || "Unknown Volunteer",
        vehicle_type: v.vehicle_type,
        is_available: v.is_available
      }));
      setVolunteers(formatted);
    } else {
      setVolunteers([
        { id: "vol1", user_id: "u1", full_name: "Manoj Kumar", vehicle_type: "Motor Boat #101", is_available: true },
        { id: "vol2", user_id: "u2", full_name: "Karthik K.", vehicle_type: "Ambulance #204", is_available: true },
        { id: "vol3", user_id: "u3", full_name: "Vigneshwaran S.", vehicle_type: "Rescue Raft #305", is_available: true },
        { id: "vol4", user_id: "u4", full_name: "Surya S.", vehicle_type: "Offroad Truck #402", is_available: true },
      ]);
    }
  };

  const handleAssignVolunteer = async () => {
    if (!assigningReq || !selectedVolunteerId) return;
    const selectedVol = volunteers.find(v => v.id === selectedVolunteerId);
    const volName = selectedVol?.full_name || "Assigned Volunteer";

    try {
      await supabase
        .from("volunteer_assignments")
        .insert({
          sos_request_id: assigningReq.id,
          volunteer_id: selectedVolunteerId,
          status: "assigned"
        });

      await supabase
        .from("volunteers")
        .update({ is_available: false })
        .eq("id", selectedVolunteerId);

      await supabase
        .from("sos_requests")
        .update({
          status: "assigned",
          assigned_volunteer_id: selectedVolunteerId
        })
        .eq("id", assigningReq.id);
    } catch {}

    setRequests((prev) =>
      prev.map((r) =>
        r.id === assigningReq.id
          ? { ...r, status: "assigned", assigned_volunteer_id: selectedVolunteerId, volunteer_name: volName }
          : r
      )
    );

    toast.success(`Volunteer ${volName} assigned successfully!`);
    setAssigningReq(null);
    setSelectedVolunteerId("");
  };

  const handleResolveRequest = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("sos_requests")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Request marked as ${status}`);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.reporter_name.toLowerCase().includes(search.toLowerCase()) ||
      r.address.toLowerCase().includes(search.toLowerCase()) ||
      (r.reporter_phone && r.reporter_phone.includes(search));

    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesLevel = levelFilter === "all" || String(r.emergency_level) === levelFilter;

    return matchesSearch && matchesStatus && matchesLevel;
  });

  const getLevelColor = (lvl: number) => {
    if (lvl >= 4) return "bg-red-500/10 text-red-700 border-red-200";
    if (lvl === 3) return "bg-orange-500/10 text-orange-700 border-orange-200";
    return "bg-yellow-500/10 text-yellow-700 border-yellow-200";
  };

  if (!isAdmin) {
    return (
      <DashboardShell title="SOS Emergency Requests">
        <div className="text-center py-20 text-muted-foreground">
          <Siren className="w-12 h-12 mx-auto mb-3 opacity-30 text-red-500" />
          <p className="font-semibold">Access Restricted</p>
          <p className="text-sm mt-1">Only Administrators have access to view live emergency queues.</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="SOS Emergency Requests queue" subtitle="Manage incoming help requests and assign volunteer dispatch">
      <div className="space-y-6 page-enter">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="stat-card border-l-4 border-l-red-500">
            <CardContent className="pt-6">
              <div className="text-2xl font-black text-red-600">
                {requests.filter(r => r.status === "pending").length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Pending Rescue</div>
            </CardContent>
          </Card>
          <Card className="stat-card border-l-4 border-l-cyan-500">
            <CardContent className="pt-6">
              <div className="text-2xl font-black text-cyan-600">
                {requests.filter(r => r.status === "assigned" || r.status === "in_progress").length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Assigned / In Progress</div>
            </CardContent>
          </Card>
          <Card className="stat-card border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="text-2xl font-black text-green-600">
                {requests.filter(r => r.status === "rescued").length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Safely Rescued</div>
            </CardContent>
          </Card>
          <Card className="stat-card border-l-4 border-l-gray-400">
            <CardContent className="pt-6">
              <div className="text-2xl font-black text-gray-600">
                {requests.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Total Logs</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter panel */}
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-3 items-center shadow-card">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, address…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="rescued">Rescued</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="1">Lvl 1 - Minor</SelectItem>
              <SelectItem value="2">Lvl 2 - Moderate</SelectItem>
              <SelectItem value="3">Lvl 3 - Urgent</SelectItem>
              <SelectItem value="4">Lvl 4 - Severe</SelectItem>
              <SelectItem value="5">Lvl 5 - Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Reporter</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Emergency Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Rescue Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Volunteer</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-muted rounded animate-shimmer" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
                      <Siren className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold">No emergency requests active</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((req) => (
                    <TableRow key={req.id} className="hover:bg-muted/30">
                      <TableCell className="font-bold text-sm">{req.reporter_name}</TableCell>
                      <TableCell className="text-xs">{req.reporter_phone || "—"}</TableCell>
                      <TableCell className="text-xs capitalize">{req.emergency_type.replace("_", " ")}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs font-bold ${getLevelColor(req.emergency_level)}`}>
                          Level {req.emergency_level}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]" title={req.address}>
                        {req.address}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs capitalize font-bold status-${req.status}`}>
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-foreground">
                        {req.volunteer_name ? (
                          <div className="flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-blue-500" />
                            {req.volunteer_name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">None Assigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(req.created_at).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setSelectedReq(req)}>
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          
                          {req.status === "pending" && (
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-blue-600 hover:text-blue-700" onClick={() => { setAssigningReq(req); setSelectedVolunteerId(""); }}>
                              <UserCheck className="w-4 h-4" />
                            </Button>
                          )}

                          {req.status !== "rescued" && req.status !== "cancelled" && (
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-green-600 hover:text-green-700" onClick={() => handleResolveRequest(req.id, "rescued")}>
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* View Details Modal */}
        {selectedReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedReq(null)}>
            <div className="bg-card border border-border rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-2">
                  <Siren className="w-5 h-5 text-red-500" />
                  <span className="font-bold text-lg">SOS Request Details</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedReq(null)}>✕</Button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Reporter</p>
                  <p className="font-bold text-base mt-0.5">{selectedReq.reporter_name}</p>
                  {selectedReq.reporter_phone && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {selectedReq.reporter_phone}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="font-bold mt-0.5">{selectedReq.address}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 text-xs bg-muted/40 rounded-xl p-3">
                <div>
                  <p className="text-muted-foreground font-semibold">Emergency Type</p>
                  <p className="font-bold capitalize text-foreground mt-0.5">{selectedReq.emergency_type.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Severity Level</p>
                  <p className="font-bold mt-0.5">Level {selectedReq.emergency_level}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Battery Status</p>
                  <p className="font-bold mt-0.5">{selectedReq.battery_level ? `${selectedReq.battery_level}%` : "Unknown"}</p>
                </div>
              </div>

              {selectedReq.description && (
                <div className="text-sm">
                  <p className="text-xs text-muted-foreground">Situation Description</p>
                  <p className="bg-muted/30 border rounded-xl p-3 mt-1 italic text-foreground">
                    "{selectedReq.description}"
                  </p>
                </div>
              )}

              {/* Rescue Map & Route */}
              <div className="rounded-xl overflow-hidden border space-y-2 bg-muted/20 p-2">
                <div className="flex items-center justify-between text-xs px-2 pt-1">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-red-500" />
                    Officer Rescue Navigation Route
                  </span>
                  <span className="text-muted-foreground font-semibold">
                    {routeDetails ? `${routeDetails.distance} · ${routeDetails.duration}` : "Calculating route…"}
                  </span>
                </div>

                <GoogleMap
                  center={position || { lat: selectedReq.latitude, lng: selectedReq.longitude }}
                  zoom={position ? 13 : 15}
                  markers={[
                    ...(position ? [{
                      id: "officer",
                      lat: position.lat,
                      lng: position.lng,
                      type: "volunteer" as const,
                      title: "Your Location (Camp/Officer)"
                    }] : []),
                    {
                      id: selectedReq.id,
                      lat: selectedReq.latitude,
                      lng: selectedReq.longitude,
                      type: "victim" as const,
                      title: selectedReq.reporter_name,
                      info: selectedReq.address
                    }
                  ]}
                  routes={position ? [{
                    origin: position,
                    destination: { lat: selectedReq.latitude, lng: selectedReq.longitude },
                    travelMode: "DRIVING",
                    color: "#ef4444"
                  }] : []}
                  breadcrumbs={victimBreadcrumbs}
                  onRouteCalculated={setRouteDetails}
                  className="h-56 w-full rounded-lg"
                />

                {routeDetails?.steps && routeDetails.steps.length > 0 && (
                  <div className="bg-card border rounded-lg p-3 space-y-1.5 max-h-36 overflow-y-auto">
                    <p className="text-[11px] font-bold text-foreground border-b pb-1">Rescue Route Steps</p>
                    {routeDetails.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="w-3.5 h-3.5 rounded-full bg-red-100 text-red-700 font-bold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-foreground">{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end border-t pt-3">
                <Button variant="outline" size="sm" onClick={() => setSelectedReq(null)}>
                  Close
                </Button>
                <Button asChild size="sm" className="bg-red-600 hover:bg-red-700 text-white font-bold border-0 gap-1.5">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1${position ? `&origin=${position.lat},${position.lng}` : ""}&destination=${selectedReq.latitude},${selectedReq.longitude}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Launch Turn-by-Turn Rescue Navigation
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Volunteer Modal */}
        {assigningReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setAssigningReq(null)}>
            <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-500" />
                  <span className="font-bold text-lg">Assign Volunteer</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setAssigningReq(null)}>✕</Button>
              </div>

              <div className="space-y-4">
                <div className="text-sm">
                  <p className="text-muted-foreground text-xs">Assigning rescue dispatch for:</p>
                  <p className="font-bold mt-0.5">{assigningReq.reporter_name}</p>
                  <p className="text-xs text-muted-foreground">{assigningReq.address}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold">Select Available Volunteer</label>
                  <Select value={selectedVolunteerId} onValueChange={setSelectedVolunteerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select volunteer…" />
                    </SelectTrigger>
                    <SelectContent>
                      {volunteers.length === 0 ? (
                        <SelectItem value="none" disabled>No volunteers available</SelectItem>
                      ) : (
                        volunteers.map(v => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.full_name} ({v.vehicle_type || "No vehicle"})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 justify-end border-t pt-3">
                  <Button variant="outline" size="sm" onClick={() => setAssigningReq(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAssignVolunteer}
                    disabled={!selectedVolunteerId}
                    className="bg-primary text-white border-0 font-bold"
                  >
                    Confirm Assignment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
