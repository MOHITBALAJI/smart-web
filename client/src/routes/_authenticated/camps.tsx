import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Tent,
  Plus,
  Edit,
  Trash,
  Phone,
  User,
  MapPin,
  Check,
  ChevronRight,
  TrendingUp,
  Shield,
  Activity,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { useRole } from "@/context/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/camps")({
  component: CampsPage,
});

interface ReliefCamp {
  id: string;
  name: string;
  district_id: string;
  address: string;
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
  districts?: {
    name: string;
  };
}

interface District {
  id: string;
  name: string;
}

function CampsPage() {
  const [camps, setCamps] = useState<ReliefCamp[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals / forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCamp, setEditingCamp] = useState<ReliefCamp | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    district_id: "",
    address: "",
    latitude: "13.0827",
    longitude: "80.2707",
    max_capacity: "200",
    current_occupancy: "0",
    beds_total: "200",
    has_electricity: true,
    has_water: true,
    has_medical: true,
    contact_name: "",
    contact_phone: "",
    status: "active"
  });

  const { isAdmin } = useRole();

  useEffect(() => {
    fetchCamps();
    fetchDistricts();
  }, []);

const MOCK_CAMPS: ReliefCamp[] = [
  { id: "c1", name: "Sathyamangalam Rescue Shelter #1", district_id: "d1", address: "BIT Campus Road, Sathyamangalam", latitude: 11.4948, longitude: 77.2789, max_capacity: 300, current_occupancy: 120, beds_total: 300, beds_available: 180, has_electricity: true, has_water: true, has_medical: true, contact_name: "Dr. K. Arumugam", contact_phone: "+91 98401 11223", status: "active", districts: { name: "Erode District" } },
  { id: "c2", name: "Sathyamangalam Disaster Base #2", district_id: "d1", address: "Bhavani Main Road, Sathyamangalam", latitude: 11.5012, longitude: 77.2845, max_capacity: 250, current_occupancy: 95, beds_total: 250, beds_available: 155, has_electricity: true, has_water: true, has_medical: true, contact_name: "R. Sundaram", contact_phone: "+91 98402 22334", status: "active", districts: { name: "Erode District" } },
  { id: "c3", name: "Velachery Central Relief Camp", district_id: "d2", address: "100ft Bypass Road, Velachery", latitude: 12.9815, longitude: 80.2180, max_capacity: 500, current_occupancy: 340, beds_total: 500, beds_available: 160, has_electricity: true, has_water: true, has_medical: true, contact_name: "M. Natesan", contact_phone: "+91 98403 33445", status: "active", districts: { name: "Chennai District" } },
  { id: "c4", name: "Erode Disaster Relief Base #3", district_id: "d1", address: "Bhavani Road, Erode Central", latitude: 11.3410, longitude: 77.7172, max_capacity: 400, current_occupancy: 210, beds_total: 400, beds_available: 190, has_electricity: true, has_water: true, has_medical: true, contact_name: "S. Murugan", contact_phone: "+91 98404 44556", status: "active", districts: { name: "Erode District" } },
  { id: "c5", name: "Mettupalayam Emergency Camp #4", district_id: "d3", address: "Nilgiri Highway, Mettupalayam", latitude: 11.3001, longitude: 76.9442, max_capacity: 200, current_occupancy: 80, beds_total: 200, beds_available: 120, has_electricity: true, has_water: true, has_medical: true, contact_name: "P. Velusamy", contact_phone: "+91 98405 55667", status: "active", districts: { name: "Coimbatore District" } },
  { id: "c6", name: "Gobichettipalayam Shelter #5", district_id: "d1", address: "Modachur Road, Gobichettipalayam", latitude: 11.4549, longitude: 77.4382, max_capacity: 180, current_occupancy: 65, beds_total: 180, beds_available: 115, has_electricity: true, has_water: true, has_medical: true, contact_name: "A. Ramasamy", contact_phone: "+91 98406 66778", status: "active", districts: { name: "Erode District" } },
  { id: "c7", name: "Coimbatore Disaster Base #6", district_id: "d3", address: "Avinashi Road, Peelamedu, Coimbatore", latitude: 11.0168, longitude: 76.9558, max_capacity: 600, current_occupancy: 410, beds_total: 600, beds_available: 190, has_electricity: true, has_water: true, has_medical: true, contact_name: "Dr. S. Priya", contact_phone: "+91 98407 77889", status: "active", districts: { name: "Coimbatore District" } },
  { id: "c8", name: "Tiruppur Relief Shelter #7", district_id: "d4", address: "Kangeyam Main Road, Tiruppur", latitude: 11.1085, longitude: 77.3411, max_capacity: 350, current_occupancy: 190, beds_total: 350, beds_available: 160, has_electricity: true, has_water: true, has_medical: true, contact_name: "V. Selvam", contact_phone: "+91 98408 88990", status: "active", districts: { name: "Tiruppur District" } },
  { id: "c9", name: "Bhavani River Disaster Base #8", district_id: "d1", address: "Kalingarayan Canal Road, Bhavani", latitude: 11.4468, longitude: 77.6833, max_capacity: 250, current_occupancy: 110, beds_total: 250, beds_available: 140, has_electricity: true, has_water: true, has_medical: true, contact_name: "G. Balakrishnan", contact_phone: "+91 98409 99001", status: "active", districts: { name: "Erode District" } },
  { id: "c10", name: "Perundurai High School Camp #9", district_id: "d1", address: "Chennimalai Road, Perundurai", latitude: 11.2750, longitude: 77.5833, max_capacity: 200, current_occupancy: 75, beds_total: 200, beds_available: 125, has_electricity: true, has_water: true, has_medical: true, contact_name: "K. Mohan", contact_phone: "+91 98410 00112", status: "active", districts: { name: "Erode District" } },
  { id: "c11", name: "Salem District Base Camp #10", district_id: "d5", address: "Omalur Main Road, Salem", latitude: 11.6643, longitude: 78.1460, max_capacity: 450, current_occupancy: 280, beds_total: 450, beds_available: 170, has_electricity: true, has_water: true, has_medical: true, contact_name: "T. Rajan", contact_phone: "+91 98411 11223", status: "active", districts: { name: "Salem District" } },
  { id: "c12", name: "Karur Emergency Camp #11", district_id: "d6", address: "Bypass Road, Karur Central", latitude: 10.9601, longitude: 78.0766, max_capacity: 250, current_occupancy: 105, beds_total: 250, beds_available: 145, has_electricity: true, has_water: true, has_medical: true, contact_name: "M. Ganesan", contact_phone: "+91 98412 22334", status: "active", districts: { name: "Karur District" } },
  { id: "c13", name: "Namakkal Welfare Center #12", district_id: "d7", address: "Tiruchengode Road, Namakkal", latitude: 11.2189, longitude: 78.1674, max_capacity: 300, current_occupancy: 130, beds_total: 300, beds_available: 170, has_electricity: true, has_water: true, has_medical: true, contact_name: "N. Palanisamy", contact_phone: "+91 98413 33445", status: "active", districts: { name: "Namakkal District" } },
  { id: "c14", name: "Annur Relief Base #13", district_id: "d3", address: "Mettupalayam Road, Annur", latitude: 11.2333, longitude: 77.1333, max_capacity: 220, current_occupancy: 90, beds_total: 220, beds_available: 130, has_electricity: true, has_water: true, has_medical: true, contact_name: "R. Krishnan", contact_phone: "+91 98414 44556", status: "active", districts: { name: "Coimbatore District" } },
  { id: "c15", name: "Sirumugai Emergency Shelter #15", district_id: "d3", address: "Bhavani Sagar Road, Sirumugai", latitude: 11.3250, longitude: 76.9850, max_capacity: 180, current_occupancy: 70, beds_total: 180, beds_available: 110, has_electricity: true, has_water: true, has_medical: true, contact_name: "S. Kannan", contact_phone: "+91 98415 55667", status: "active", districts: { name: "Coimbatore District" } },
];

  const fetchCamps = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("relief_camps")
        .select(`
          *,
          districts (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        setCamps(data as any[]);
      } else {
        setCamps(MOCK_CAMPS);
      }
    } catch {
      setCamps(MOCK_CAMPS);
    }
    setLoading(false);
  };

  const fetchDistricts = async () => {
    const { data, error } = await supabase.from("districts").select("id, name");
    if (!error && data) setDistricts(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.district_id || !formData.address) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        district_id: formData.district_id,
        address: formData.address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        max_capacity: parseInt(formData.max_capacity),
        current_occupancy: parseInt(formData.current_occupancy),
        beds_total: parseInt(formData.beds_total),
        beds_available: parseInt(formData.beds_total) - parseInt(formData.current_occupancy),
        has_electricity: formData.has_electricity,
        has_water: formData.has_water,
        has_medical: formData.has_medical,
        contact_name: formData.contact_name || null,
        contact_phone: formData.contact_phone || null,
        status: formData.status
      };

      if (editingCamp) {
        const { error } = await supabase
          .from("relief_camps")
          .update(payload)
          .eq("id", editingCamp.id);
        if (error) throw error;
        toast.success("Camp updated successfully!");
      } else {
        const { error } = await supabase
          .from("relief_camps")
          .insert(payload);
        if (error) throw error;
        toast.success("Camp created successfully!");
      }

      setShowAddModal(false);
      setEditingCamp(null);
      fetchCamps();
    } catch (err: any) {
      toast.error(err.message || "Operation failed.");
    }
  };

  const handleEdit = (camp: ReliefCamp) => {
    setEditingCamp(camp);
    setFormData({
      name: camp.name,
      district_id: camp.district_id,
      address: camp.address,
      latitude: String(camp.latitude),
      longitude: String(camp.longitude),
      max_capacity: String(camp.max_capacity),
      current_occupancy: String(camp.current_occupancy),
      beds_total: String(camp.beds_total),
      has_electricity: camp.has_electricity,
      has_water: camp.has_water,
      has_medical: camp.has_medical,
      contact_name: camp.contact_name || "",
      contact_phone: camp.contact_phone || "",
      status: camp.status
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this camp?")) return;
    try {
      const { error } = await supabase.from("relief_camps").delete().eq("id", id);
      if (error) throw error;
      toast.success("Camp deleted successfully.");
      fetchCamps();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete camp.");
    }
  };

  const getOccupancyColor = (curr: number, max: number) => {
    const ratio = curr / max;
    if (ratio >= 0.9) return "bg-red-500";
    if (ratio >= 0.7) return "bg-orange-500";
    return "bg-green-500";
  };

  return (
    <DashboardShell title="Relief Camps Management" subtitle="Create, edit, and monitor relief camps across districts">
      <div className="space-y-6 page-enter">
        {/* Header summary */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs">
              Total camps: {camps.length}
            </Badge>
            <Badge variant="outline" className="text-xs border-green-200 bg-green-50 text-green-700">
              Active: {camps.filter(c => c.status === "active").length}
            </Badge>
          </div>

          {isAdmin && (
            <Button
              className="gradient-hero text-white border-0 font-bold gap-1.5"
              onClick={() => {
                setEditingCamp(null);
                setFormData({
                  name: "",
                  district_id: districts[0]?.id || "",
                  address: "",
                  latitude: "13.0827",
                  longitude: "80.2707",
                  max_capacity: "200",
                  current_occupancy: "0",
                  beds_total: "200",
                  has_electricity: true,
                  has_water: true,
                  has_medical: true,
                  contact_name: "",
                  contact_phone: "",
                  status: "active"
                });
                setShowAddModal(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Add Camp
            </Button>
          )}
        </div>

        {/* Camps grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-card border rounded-2xl animate-shimmer" />
            ))}
          </div>
        ) : camps.length === 0 ? (
          <div className="text-center py-20 bg-card border rounded-2xl text-muted-foreground">
            <Tent className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
            <p className="font-semibold">No relief camps registered</p>
            <p className="text-sm mt-1">Register camps to begin digital check-in operations.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {camps.map((camp) => {
              const occupancyPct = Math.round((camp.current_occupancy / camp.max_capacity) * 100);
              return (
                <Card key={camp.id} className="hover:shadow-elegant transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base font-bold text-foreground">{camp.name}</CardTitle>
                        <CardDescription className="text-xs flex items-center gap-1 mt-0.5 text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          {camp.districts?.name || "District"}
                        </CardDescription>
                      </div>
                      <Badge className={`text-[10px] uppercase font-bold status-${camp.status}`}>
                        {camp.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 text-sm">
                    {/* Progress occupancy */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>Occupancy</span>
                        <span>{camp.current_occupancy} / {camp.max_capacity} beds ({occupancyPct}%)</span>
                      </div>
                      <Progress value={occupancyPct} className="h-2" />
                    </div>

                    {/* Features checklist */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {camp.has_water && (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 gap-1">
                          ✓ Water
                        </Badge>
                      )}
                      {camp.has_electricity && (
                        <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-100 gap-1">
                          ✓ Power
                        </Badge>
                      )}
                      {camp.has_medical && (
                        <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-100 gap-1">
                          ✓ Medical
                        </Badge>
                      )}
                    </div>

                    {/* Contact info */}
                    {(camp.contact_name || camp.contact_phone) && (
                      <div className="pt-2.5 border-t text-xs text-muted-foreground space-y-1">
                        {camp.contact_name && (
                          <p className="flex items-center gap-1.5 font-semibold text-foreground">
                            <User className="w-3.5 h-3.5" />
                            {camp.contact_name}
                          </p>
                        )}
                        {camp.contact_phone && (
                          <p className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" />
                            {camp.contact_phone}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    {isAdmin && (
                      <div className="flex justify-end gap-1.5 pt-3 border-t">
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEdit(camp)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(camp.id)}>
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
            <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-lg">{editingCamp ? "Edit Relief Camp" : "Create New Relief Camp"}</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>✕</Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                <div className="space-y-1.5">
                  <Label>Camp Name *</Label>
                  <Input
                    required
                    placeholder="E.g. Community Centre Camp A"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>District *</Label>
                    <Select
                      value={formData.district_id}
                      onValueChange={(v) => setFormData({ ...formData, district_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) => setFormData({ ...formData, status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="full">Full</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Address *</Label>
                  <Input
                    required
                    placeholder="Full street address details"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Latitude *</Label>
                    <Input
                      required
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Longitude *</Label>
                    <Input
                      required
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Max Capacity *</Label>
                    <Input
                      required
                      type="number"
                      value={formData.max_capacity}
                      onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Beds Total *</Label>
                    <Input
                      required
                      type="number"
                      value={formData.beds_total}
                      onChange={(e) => setFormData({ ...formData, beds_total: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Utilities Available</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.has_water}
                        onChange={(e) => setFormData({ ...formData, has_water: e.target.checked })}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      Clean Water
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.has_electricity}
                        onChange={(e) => setFormData({ ...formData, has_electricity: e.target.checked })}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      Electricity
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.has_medical}
                        onChange={(e) => setFormData({ ...formData, has_medical: e.target.checked })}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      Medical Clinic
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-3">
                  <div className="space-y-1.5">
                    <Label>Contact Officer Name</Label>
                    <Input
                      placeholder="Officer name"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contact Phone</Label>
                    <Input
                      placeholder="Officer phone"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end border-t pt-3">
                  <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary text-white border-0 font-bold">
                    {editingCamp ? "Save Changes" : "Create Camp"}
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
