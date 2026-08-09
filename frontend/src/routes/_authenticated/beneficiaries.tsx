import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  QrCode,
  Download,
  Eye,
  Activity,
  Heart,
  Phone,
  Trash,
  ChevronRight,
  Shield,
  Clock,
  Printer
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
import { QrGenerator } from "@/components/qr/QrGenerator";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/beneficiaries")({
  component: BeneficiariesPage,
});

interface Beneficiary {
  id: string;
  user_id: string;
  aadhaar_number: string | null;
  blood_group: string | null;
  medical_conditions: string | null;
  current_camp_id: string | null;
  shelter_status: string;
  registration_date: string;
  qr_code_data: string | null;
  users?: {
    full_name: string;
    phone: string | null;
  };
  relief_camps?: {
    name: string;
  };
}

function BeneficiariesPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [camps, setCamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [campFilter, setCampFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selection / Modal
  const [selectedB, setSelectedB] = useState<Beneficiary | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New beneficiary form state
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    aadhaar_number: "",
    blood_group: "O+",
    medical_conditions: "",
    current_camp_id: "",
    shelter_status: "at_camp"
  });

  useEffect(() => {
    fetchBeneficiaries();
    fetchCamps();
  }, []);

const MOCK_BENEFICIARIES: Beneficiary[] = [
  { id: "b1", user_id: "u1", aadhaar_number: "XXXX-XXXX-4921", blood_group: "O+", medical_conditions: "Diabetic patient, needs insulin twice daily", shelter_status: "at_camp", registration_date: "2026-08-09T08:30:00Z", qr_code_data: "FLOOD-B001-SATHY", users: { full_name: "Kavitha R.", phone: "+91 98401 23456" }, relief_camps: { name: "Sathyamangalam Rescue Shelter #1" } },
  { id: "b2", user_id: "u2", aadhaar_number: "XXXX-XXXX-8812", blood_group: "A+", medical_conditions: "Asthma, requires inhaler", shelter_status: "at_camp", registration_date: "2026-08-09T09:15:00Z", qr_code_data: "FLOOD-B002-SATHY", users: { full_name: "Ramesh K.", phone: "+91 98402 34567" }, relief_camps: { name: "Sathyamangalam Disaster Base #2" } },
  { id: "b3", user_id: "u3", aadhaar_number: "XXXX-XXXX-3341", blood_group: "B+", medical_conditions: "Pregnancy 7th month, regular checkup required", shelter_status: "medical_evac", registration_date: "2026-08-09T09:40:00Z", qr_code_data: "FLOOD-B003-VEL", users: { full_name: "Priya V.", phone: "+91 98403 45678" }, relief_camps: { name: "Velachery Central Relief Camp" } },
  { id: "b4", user_id: "u4", aadhaar_number: "XXXX-XXXX-7102", blood_group: "AB+", medical_conditions: "Hypertension, blood pressure monitoring", shelter_status: "at_camp", registration_date: "2026-08-09T10:05:00Z", qr_code_data: "FLOOD-B004-ERODE", users: { full_name: "Rajesh S.", phone: "+91 98404 56789" }, relief_camps: { name: "Erode Disaster Relief Base #3" } },
  { id: "b5", user_id: "u5", aadhaar_number: "XXXX-XXXX-9923", blood_group: "O-", medical_conditions: "Elderly citizen (74 yrs), mobility aid needed", shelter_status: "at_camp", registration_date: "2026-08-09T10:30:00Z", qr_code_data: "FLOOD-B005-METTU", users: { full_name: "Deepa N.", phone: "+91 98405 67890" }, relief_camps: { name: "Mettupalayam Emergency Camp #4" } },
  { id: "b6", user_id: "u6", aadhaar_number: "XXXX-XXXX-1144", blood_group: "A-", medical_conditions: "Minor leg fracture, bandaged", shelter_status: "medical_evac", registration_date: "2026-08-09T11:00:00Z", qr_code_data: "FLOOD-B006-GOBI", users: { full_name: "Karthik M.", phone: "+91 98406 78901" }, relief_camps: { name: "Gobichettipalayam Shelter #5" } },
  { id: "b7", user_id: "u7", aadhaar_number: "XXXX-XXXX-5566", blood_group: "B-", medical_conditions: "Infant (8 months), baby milk powder needed", shelter_status: "at_camp", registration_date: "2026-08-09T11:25:00Z", qr_code_data: "FLOOD-B007-COIMB", users: { full_name: "Lakshmi P.", phone: "+91 98407 89012" }, relief_camps: { name: "Coimbatore Disaster Base #6" } },
  { id: "b8", user_id: "u8", aadhaar_number: "XXXX-XXXX-2277", blood_group: "O+", medical_conditions: "Dehydration, ORS solution provided", shelter_status: "discharged", registration_date: "2026-08-09T11:50:00Z", qr_code_data: "FLOOD-B008-TIRU", users: { full_name: "Vignesh A.", phone: "+91 98408 90123" }, relief_camps: { name: "Tiruppur Relief Shelter #7" } },
  { id: "b9", user_id: "u9", aadhaar_number: "XXXX-XXXX-6688", blood_group: "A+", medical_conditions: "Mild fever, paracetamol prescribed", shelter_status: "at_camp", registration_date: "2026-08-09T12:15:00Z", qr_code_data: "FLOOD-B009-BHAV", users: { full_name: "Anitha K.", phone: "+91 98409 01234" }, relief_camps: { name: "Bhavani River Disaster Base #8" } },
  { id: "b10", user_id: "u10", aadhaar_number: "XXXX-XXXX-4499", blood_group: "AB-", medical_conditions: "Eye allergy due to flood water exposure", shelter_status: "at_camp", registration_date: "2026-08-09T12:40:00Z", qr_code_data: "FLOOD-B010-PERUN", users: { full_name: "Divya B.", phone: "+91 98410 12345" }, relief_camps: { name: "Perundurai High School Camp #9" } },
  { id: "b11", user_id: "u11", aadhaar_number: "XXXX-XXXX-8800", blood_group: "O+", medical_conditions: "Heart condition, daily medication", shelter_status: "medical_evac", registration_date: "2026-08-09T13:00:00Z", qr_code_data: "FLOOD-B011-SALEM", users: { full_name: "Surya T.", phone: "+91 98411 23456" }, relief_camps: { name: "Salem District Base Camp #10" } },
  { id: "b12", user_id: "u12", aadhaar_number: "XXXX-XXXX-1122", blood_group: "B+", medical_conditions: "Clean water & ration kit recipient", shelter_status: "at_camp", registration_date: "2026-08-09T13:20:00Z", qr_code_data: "FLOOD-B012-KARUR", users: { full_name: "Sundar M.", phone: "+91 98412 34567" }, relief_camps: { name: "Karur Emergency Camp #11" } },
  { id: "b13", user_id: "u13", aadhaar_number: "XXXX-XXXX-3344", blood_group: "A+", medical_conditions: "Hypothermia recovery, warm blankets provided", shelter_status: "at_camp", registration_date: "2026-08-09T13:45:00Z", qr_code_data: "FLOOD-B013-NAMAK", users: { full_name: "Meena R.", phone: "+91 98413 45678" }, relief_camps: { name: "Namakkal Welfare Center #12" } },
  { id: "b14", user_id: "u14", aadhaar_number: "XXXX-XXXX-5577", blood_group: "O-", medical_conditions: "Minor arm abrasion, treated by army medic", shelter_status: "at_camp", registration_date: "2026-08-09T14:10:00Z", qr_code_data: "FLOOD-B014-ANNUR", users: { full_name: "Anand G.", phone: "+91 98414 56789" }, relief_camps: { name: "Annur Relief Base #13" } },
  { id: "b15", user_id: "u15", aadhaar_number: "XXXX-XXXX-9988", blood_group: "B+", medical_conditions: "Rooftop rescue survivor, safe at camp", shelter_status: "at_camp", current_camp_id: "c1", registration_date: "2026-08-09T14:30:00Z", qr_code_data: "FLOOD-B015-SIRU", users: { full_name: "Balaji V.", phone: "+91 98415 67890" }, relief_camps: { name: "Sirumugai Emergency Shelter #15" } },
] as unknown as Beneficiary[];

  const fetchBeneficiaries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("beneficiaries")
        .select(`
          *,
          users (
            full_name,
            phone
          ),
          relief_camps (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        setBeneficiaries(data as any[]);
      } else {
        setBeneficiaries(MOCK_BENEFICIARIES);
      }
    } catch {
      setBeneficiaries(MOCK_BENEFICIARIES);
    }
    setLoading(false);
  };

  const fetchCamps = async () => {
    const { data, error } = await supabase.from("relief_camps").select("id, name");
    if (!error && data) setCamps(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      toast.error("Full Name and Email are required.");
      return;
    }

    try {
      // 1. Create a user profile in Supabase Auth (or public users for simulation)
      // For simulation, we insert to public.users directly with a new uuid
      const userUuid = crypto.randomUUID();
      const { error: userError } = await supabase
        .from("users")
        .insert({
          id: userUuid,
          full_name: formData.fullName,
          phone: formData.phone || null,
          role: "beneficiary",
          is_active: true
        });

      if (userError) throw userError;

      // 2. Generate unique QR Data format: FLOOD-{id}-{camp_id}
      const qrData = `FLOOD-${userUuid.slice(0, 8)}-${formData.current_camp_id || "none"}`;

      // 3. Create Beneficiary record
      const { error: bError } = await supabase
        .from("beneficiaries")
        .insert({
          user_id: userUuid,
          aadhaar_number: formData.aadhaar_number || null,
          blood_group: formData.blood_group,
          medical_conditions: formData.medical_conditions || null,
          current_camp_id: formData.current_camp_id || null,
          shelter_status: formData.shelter_status,
          qr_code_data: qrData,
          registration_date: new Date().toISOString()
        });

      if (bError) throw bError;

      toast.success("Beneficiary registered successfully!");
      setShowAddModal(false);
      fetchBeneficiaries();
    } catch (err: any) {
      toast.error(err.message || "Registration failed.");
    }
  };

  const filtered = beneficiaries.filter(b => {
    const name = b.users?.full_name?.toLowerCase() || "";
    const phone = b.users?.phone || "";
    const aadhaar = b.aadhaar_number || "";
    const matchSearch = name.includes(search.toLowerCase()) || phone.includes(search) || aadhaar.includes(search);
    
    const matchCamp = campFilter === "all" || b.current_camp_id === campFilter;
    const matchStatus = statusFilter === "all" || b.shelter_status === statusFilter;

    return matchSearch && matchCamp && matchStatus;
  });

  return (
    <DashboardShell title="Beneficiaries Registry" subtitle="Manage registered flood victims, profile detail logs, and ID QR generation">
      <div className="space-y-6 page-enter">
        {/* Header stats & Action */}
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs">
              Total Beneficiaries: {beneficiaries.length}
            </Badge>
            <Badge variant="outline" className="text-xs border-green-200 bg-green-50 text-green-700">
              At Camp: {beneficiaries.filter(b => b.shelter_status === "at_camp").length}
            </Badge>
          </div>

          <Button className="gradient-hero text-white border-0 font-bold gap-1.5" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Register Beneficiary
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-3 items-center shadow-card">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, Aadhaar…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={campFilter} onValueChange={setCampFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Camps" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Camps</SelectItem>
              {camps.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="at_camp">At Camp</SelectItem>
              <SelectItem value="at_home">At Home</SelectItem>
              <SelectItem value="rescued">Rescued</SelectItem>
              <SelectItem value="missing">Missing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Beneficiary ID</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Blood Group</TableHead>
                  <TableHead>Relief Camp Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered Date</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-muted rounded animate-shimmer" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold">No beneficiaries registered</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((b) => (
                    <TableRow key={b.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {b.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="font-bold text-sm">{b.users?.full_name}</TableCell>
                      <TableCell className="text-xs">{b.users?.phone || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-bold bg-muted/40">
                          {b.blood_group || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-foreground">
                        {b.relief_camps?.name || "Unassigned"}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs capitalize font-bold status-${b.shelter_status}`}>
                          {b.shelter_status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(b.registration_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setSelectedB(b)}>
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* View profile + QR Modal */}
        {selectedB && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedB(null)}>
            <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-lg">Beneficiary Pass</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedB(null)}>✕</Button>
              </div>

              {selectedB.qr_code_data ? (
                <QrGenerator
                  data={selectedB.qr_code_data}
                  beneficiaryId={selectedB.id.slice(0, 8)}
                  beneficiaryName={selectedB.users?.full_name}
                  campName={selectedB.relief_camps?.name}
                />
              ) : (
                <p className="text-center text-xs text-red-500">QR code not generated yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Register Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
            <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-lg">Register Beneficiary</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>✕</Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                <div className="space-y-1.5">
                  <Label>Full Name *</Label>
                  <Input
                    required
                    placeholder="Enter full name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Email address *</Label>
                  <Input
                    required
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Phone number</Label>
                    <Input
                      placeholder="98765…"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Aadhaar Number</Label>
                    <Input
                      placeholder="12 digit Aadhaar"
                      maxLength={12}
                      value={formData.aadhaar_number}
                      onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Blood Group</Label>
                    <Select
                      value={formData.blood_group}
                      onValueChange={(v) => setFormData({ ...formData, blood_group: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(bg => (
                          <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Shelter Status</Label>
                    <Select
                      value={formData.shelter_status}
                      onValueChange={(v) => setFormData({ ...formData, shelter_status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="at_camp">At Camp</SelectItem>
                        <SelectItem value="at_home">At Home</SelectItem>
                        <SelectItem value="rescued">Rescued</SelectItem>
                        <SelectItem value="missing">Missing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Assigned Camp</Label>
                  <Select
                    value={formData.current_camp_id}
                    onValueChange={(v) => setFormData({ ...formData, current_camp_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select camp location" />
                    </SelectTrigger>
                    <SelectContent>
                      {camps.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Medical Conditions / Comments</Label>
                  <Input
                    placeholder="E.g. Diabetes, pregnancy, physical injury…"
                    value={formData.medical_conditions}
                    onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 justify-end border-t pt-3">
                  <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary text-white border-0 font-bold">
                    Register & Generate Pass
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
