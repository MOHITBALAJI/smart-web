import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Waves,
  MapPin,
  AlertTriangle,
  Shield,
  Plus,
  Edit,
  Trash,
  Activity,
  Users,
  Loader2,
  Eye,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { supabase } from "@/lib/supabase";
import { useRole } from "@/context/AuthContext";
import { GoogleMap } from "@/components/maps/GoogleMap";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/flood-zones")({
  component: FloodZonesPage,
});

interface FloodZone {
  id: string;
  zone_name: string;
  severity: string;
  coordinates: any;
  water_level_meters: number | null;
  affected_population: number | null;
  district_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  districts?: { name: string };
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/10 text-red-700 border-red-200",
  high: "bg-orange-500/10 text-orange-700 border-orange-200",
  medium: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  low: "bg-blue-500/10 text-blue-700 border-blue-200",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-red-500/10 text-red-700",
  receding: "bg-amber-500/10 text-amber-700",
  cleared: "bg-green-500/10 text-green-700",
};

const MOCK_FLOOD_ZONES: FloodZone[] = [
  { id: '1', zone_name: 'Erode - Bhavani River Basin', severity: 'critical', water_level_meters: 4.2, affected_population: 12500, status: 'active', coordinates: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString(), districts: { name: 'Erode' }, district_id: null },
  { id: '2', zone_name: 'Salem - Thirumanimuthar Catchment', severity: 'high', water_level_meters: 3.1, affected_population: 8700, status: 'active', coordinates: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString(), districts: { name: 'Salem' }, district_id: null },
  { id: '3', zone_name: 'Coimbatore - Noyyal River Zone', severity: 'medium', water_level_meters: 2.0, affected_population: 4200, status: 'active', coordinates: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString(), districts: { name: 'Coimbatore' }, district_id: null },
  { id: '4', zone_name: 'Tiruchirappalli - Cauvery Delta', severity: 'critical', water_level_meters: 5.8, affected_population: 22000, status: 'active', coordinates: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString(), districts: { name: 'Tiruchirappalli' }, district_id: null },
  { id: '5', zone_name: 'Cuddalore - Coastal Flood Plain', severity: 'high', water_level_meters: 3.5, affected_population: 15600, status: 'active', coordinates: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString(), districts: { name: 'Cuddalore' }, district_id: null },
  { id: '6', zone_name: 'Nagapattinam - Bay of Bengal Coast', severity: 'critical', water_level_meters: 4.8, affected_population: 18900, status: 'active', coordinates: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString(), districts: { name: 'Nagapattinam' }, district_id: null },
  { id: '7', zone_name: 'Thanjavur - Grand Anicut Basin', severity: 'medium', water_level_meters: 2.3, affected_population: 6100, status: 'receding', coordinates: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString(), districts: { name: 'Thanjavur' }, district_id: null },
  { id: '8', zone_name: 'Madurai - Vaigai River Zone', severity: 'low', water_level_meters: 1.2, affected_population: 2800, status: 'receding', coordinates: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString(), districts: { name: 'Madurai' }, district_id: null },
  { id: '9', zone_name: 'Kanyakumari - Southern Tip Coast', severity: 'medium', water_level_meters: 2.1, affected_population: 3500, status: 'active', coordinates: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString(), districts: { name: 'Kanyakumari' }, district_id: null },
  { id: '10', zone_name: 'Villupuram - Gingee River Basin', severity: 'high', water_level_meters: 3.8, affected_population: 11200, status: 'active', coordinates: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString(), districts: { name: 'Villupuram' }, district_id: null },
  { id: '11', zone_name: 'Ramanathapuram - Gulf of Mannar', severity: 'medium', water_level_meters: 1.9, affected_population: 4800, status: 'receding', coordinates: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString(), districts: { name: 'Ramanathapuram' }, district_id: null },
  { id: '12', zone_name: 'Nilgiris - Western Ghats Landslide Zone', severity: 'critical', water_level_meters: 6.2, affected_population: 9400, status: 'active', coordinates: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString(), districts: { name: 'Nilgiris' }, district_id: null },
];

function FloodZonesPage() {
  const [zones, setZones] = useState<FloodZone[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingZone, setEditingZone] = useState<FloodZone | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { isAdmin, isStaff } = useRole();

  // Form state
  const [form, setForm] = useState({
    zone_name: "",
    severity: "medium",
    water_level_meters: "",
    affected_population: "",
    district_id: "",
    status: "active",
    coordinates: "[]",
  });

  useEffect(() => {
    fetchZones();
    fetchDistricts();
  }, []);

  const fetchZones = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("flood_zones")
      .select("*, districts(name)")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      setZones(data as FloodZone[]);
    } else {
      setZones(MOCK_FLOOD_ZONES);
    }
    setLoading(false);
  };

  const fetchDistricts = async () => {
    const { data } = await supabase.from("districts").select("id, name");
    if (data) setDistricts(data);
  };

  const openAddModal = () => {
    setEditingZone(null);
    setForm({
      zone_name: "",
      severity: "medium",
      water_level_meters: "",
      affected_population: "",
      district_id: districts[0]?.id || "",
      status: "active",
      coordinates: "[]",
    });
    setShowModal(true);
  };

  const openEditModal = (zone: FloodZone) => {
    setEditingZone(zone);
    setForm({
      zone_name: zone.zone_name,
      severity: zone.severity,
      water_level_meters: String(zone.water_level_meters || ""),
      affected_population: String(zone.affected_population || ""),
      district_id: zone.district_id || "",
      status: zone.status,
      coordinates: JSON.stringify(zone.coordinates || [], null, 2),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.zone_name) {
      toast.error("Zone name is required.");
      return;
    }

    let parsedCoords: any[] = [];
    try {
      parsedCoords = JSON.parse(form.coordinates);
    } catch {
      toast.error("Invalid coordinates JSON format.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        zone_name: form.zone_name,
        severity: form.severity,
        water_level_meters: form.water_level_meters
          ? parseFloat(form.water_level_meters)
          : null,
        affected_population: form.affected_population
          ? parseInt(form.affected_population)
          : null,
        district_id: form.district_id || null,
        status: form.status,
        coordinates: parsedCoords,
      };

      if (editingZone) {
        const { error } = await supabase
          .from("flood_zones")
          .update(payload)
          .eq("id", editingZone.id);
        if (error) throw error;
        toast.success("Flood zone updated.");
      } else {
        const { error } = await supabase.from("flood_zones").insert(payload);
        if (error) throw error;
        toast.success("Flood zone created.");
      }

      setShowModal(false);
      fetchZones();
    } catch (err: any) {
      toast.error(err.message || "Failed to save flood zone.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this flood zone?")) return;
    try {
      const { error } = await supabase.from("flood_zones").delete().eq("id", id);
      if (error) throw error;
      toast.success("Flood zone deleted.");
      fetchZones();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete.");
    }
  };

  // Stats
  const activeZones = zones.filter((z) => z.status === "active").length;
  const criticalZones = zones.filter((z) => z.severity === "critical").length;
  const totalAffected = zones.reduce(
    (sum, z) => sum + (z.affected_population || 0),
    0
  );
  const avgWaterLevel =
    zones.length > 0
      ? (
          zones.reduce((sum, z) => sum + (z.water_level_meters || 0), 0) /
          zones.filter((z) => z.water_level_meters).length || 0
        ).toFixed(1)
      : "0";

  // Map flood zones for GoogleMap
  const floodZonesForMap = zones
    .filter((z) => z.status === "active" && Array.isArray(z.coordinates))
    .map((z) => ({
      severity: z.severity,
      coordinates: z.coordinates,
    }));

  if (!isStaff && !isAdmin) {
    return (
      <DashboardShell title="Flood Zone Management">
        <div className="text-center py-20 text-muted-foreground">
          <Waves className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-500" />
          <p className="font-semibold">Access Restricted</p>
          <p className="text-sm mt-1">
            Only authorized staff can manage flood zones.
          </p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Flood Zone Management"
      subtitle="Monitor, create, and manage flood hazard zones displayed on the GIS map"
    >
      <div className="space-y-6 page-enter">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="stat-card border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="text-2xl font-black text-blue-600">
                {zones.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Total Zones Monitored
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card border-l-4 border-l-red-500">
            <CardContent className="pt-6">
              <div className="text-2xl font-black text-red-600">
                {criticalZones}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Critical Zones
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card border-l-4 border-l-orange-500">
            <CardContent className="pt-6">
              <div className="text-2xl font-black text-orange-600">
                {totalAffected.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Total Affected Population
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card border-l-4 border-l-cyan-500">
            <CardContent className="pt-6">
              <div className="text-2xl font-black text-cyan-600">
                {activeZones}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Active Alerts
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <Card className="shadow-card overflow-hidden">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Flood Hazard Map
            </CardTitle>
          </CardHeader>
          <GoogleMap
            zoom={8}
            floodZones={floodZonesForMap}
            className="h-[350px] w-full"
          />
        </Card>

        {/* Action bar */}
        <div className="flex justify-between items-center">
          <Badge variant="secondary" className="text-xs">
            Total Zones: {zones.length}
          </Badge>
          {isAdmin && (
            <Button
              className="gradient-hero text-white border-0 font-bold gap-1.5"
              onClick={openAddModal}
            >
              <Plus className="w-4 h-4" />
              Add Flood Zone
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Zone Name</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Water Level</TableHead>
                  <TableHead>Affected Pop.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  {isAdmin && (
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: isAdmin ? 8 : 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-muted rounded animate-shimmer" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : zones.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 8 : 7}
                      className="text-center py-16 text-muted-foreground"
                    >
                      <Waves className="w-10 h-10 mx-auto mb-2 opacity-30 text-blue-500" />
                      <p className="font-semibold">
                        No flood zones registered
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  zones.map((z) => (
                    <TableRow key={z.id} className="hover:bg-muted/30">
                      <TableCell className="font-bold text-sm">
                        {z.zone_name}
                      </TableCell>
                      <TableCell className="text-xs">
                        {z.districts?.name || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs font-bold capitalize ${SEVERITY_COLORS[z.severity] || "bg-muted"}`}
                        >
                          {z.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-bold">
                        {z.water_level_meters
                          ? `${z.water_level_meters}m`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {z.affected_population?.toLocaleString() || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] capitalize font-bold ${STATUS_COLORS[z.status] || "bg-muted"}`}
                        >
                          {z.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(
                          z.updated_at || z.created_at
                        ).toLocaleDateString()}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 text-blue-600 hover:text-blue-700"
                              onClick={() => openEditModal(z)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(z.id)}
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <div
              className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-lg">
                  {editingZone ? "Edit Flood Zone" : "Add Flood Zone"}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                  ✕
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                <div className="space-y-1.5">
                  <Label>Zone Name *</Label>
                  <Input
                    required
                    value={form.zone_name}
                    onChange={(e) =>
                      setForm({ ...form, zone_name: e.target.value })
                    }
                    placeholder="E.g. Kochi Coastal Belt"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Severity</Label>
                    <Select
                      value={form.severity}
                      onValueChange={(v) => setForm({ ...form, severity: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">🟢 Low</SelectItem>
                        <SelectItem value="medium">🟡 Medium</SelectItem>
                        <SelectItem value="high">🟠 High</SelectItem>
                        <SelectItem value="critical">🔴 Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) => setForm({ ...form, status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="receding">Receding</SelectItem>
                        <SelectItem value="cleared">Cleared</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Water Level (meters)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={form.water_level_meters}
                      onChange={(e) =>
                        setForm({ ...form, water_level_meters: e.target.value })
                      }
                      placeholder="E.g. 2.5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Affected Population</Label>
                    <Input
                      type="number"
                      value={form.affected_population}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          affected_population: e.target.value,
                        })
                      }
                      placeholder="E.g. 15000"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>District</Label>
                  <Select
                    value={form.district_id}
                    onValueChange={(v) => setForm({ ...form, district_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>
                    Polygon Coordinates (JSON array of {`{lat, lng}`})
                  </Label>
                  <Textarea
                    rows={4}
                    value={form.coordinates}
                    onChange={(e) =>
                      setForm({ ...form, coordinates: e.target.value })
                    }
                    placeholder='[{"lat": 10.0, "lng": 76.0}, {"lat": 10.1, "lng": 76.1}]'
                    className="font-mono text-xs"
                  />
                </div>

                <div className="flex gap-2 justify-end border-t pt-3">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-primary text-white border-0 font-bold gap-1.5"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {editingZone ? "Update Zone" : "Create Zone"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
