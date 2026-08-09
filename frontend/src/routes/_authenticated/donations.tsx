import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Heart,
  Plus,
  DollarSign,
  Package,
  Gift,
  CheckCircle,
  Clock,
  User,
  Shield,
  Activity,
  ArrowRight,
  TrendingUp,
  MapPin
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
import { Textarea } from "@/components/ui/textarea";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { supabase } from "@/lib/supabase";
import { useRole } from "@/context/AuthContext";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export const Route = createFileRoute("/_authenticated/donations")({
  component: DonationsPage,
});

interface Donation {
  id: string;
  donor_name: string;
  donor_email: string;
  donor_phone: string | null;
  donor_type: string;
  donation_type: string;
  amount: number | null;
  description: string | null;
  district_id: string | null;
  status: string;
  created_at: string;
  districts?: {
    name: string;
  };
}

const DONATION_TYPES = [
  { value: "cash", label: "💵 Cash Donation (INR)" },
  { value: "food", label: "🍚 Food packets / Rations" },
  { value: "water", label: "💧 Drinking Water" },
  { value: "medicines", label: "🏥 Medicines / Kits" },
  { value: "blankets", label: "🧥 Blankets / Clothes" },
  { value: "other", label: "🎁 Other Supplies" }
];

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899"];

function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  // Public form state
  const [formData, setFormData] = useState({
    donor_name: "",
    donor_email: "",
    donor_phone: "",
    donor_type: "individual",
    donation_type: "cash",
    amount: "",
    description: "",
    district_id: ""
  });

  const { isAdmin } = useRole();

  useEffect(() => {
    fetchDonations();
    fetchDistricts();
  }, []);

const MOCK_DONATIONS: Donation[] = [
  { id: "don1", donor_name: "TVS Motor Foundation", donor_email: "", donor_phone: null, donor_type: "organization", donation_type: "cash", amount: 500000, description: "Flood Relief Financial Support Fund", status: "completed", created_at: "2026-08-09T08:00:00Z", districts: { name: "Erode District" } },
  { id: "don2", donor_name: "Apollo Pharmacy CSR", donor_email: "", donor_phone: null, donor_type: "corporate", donation_type: "medicines", amount: 250000, description: "Essential Medicines & Insulin Kits", status: "completed", created_at: "2026-08-09T08:30:00Z", districts: { name: "Chennai District" } },
  { id: "don3", donor_name: "Rotary Club Coimbatore", donor_email: "", donor_phone: null, donor_type: "organization", donation_type: "food", amount: 180000, description: "5,000 Dry Food Ration Packs", status: "completed", created_at: "2026-08-09T09:00:00Z", districts: { name: "Coimbatore District" } },
  { id: "don4", donor_name: "L&T Construction Cares", donor_email: "", donor_phone: null, donor_type: "corporate", donation_type: "equipment", amount: 350000, description: "10 High Capacity Diesel Generators", status: "completed", created_at: "2026-08-09T09:30:00Z", districts: { name: "Tiruppur District" } },
  { id: "don5", donor_name: "Dr. S. K. Radhakrishnan", donor_email: "", donor_phone: null, donor_type: "individual", donation_type: "cash", amount: 50000, description: "Personal Emergency Relief Fund", status: "completed", created_at: "2026-08-09T10:00:00Z", districts: { name: "Erode District" } },
  { id: "don6", donor_name: "Aachi Masala CSR Trust", donor_email: "", donor_phone: null, donor_type: "corporate", donation_type: "food", amount: 120000, description: "Ready to Eat Meal Kits", status: "completed", created_at: "2026-08-09T10:30:00Z", districts: { name: "Salem District" } },
  { id: "don7", donor_name: "NLC India Officers Assoc.", donor_email: "", donor_phone: null, donor_type: "organization", donation_type: "cash", amount: 300000, description: "Disaster Victim Assistance", status: "completed", created_at: "2026-08-09T11:00:00Z", districts: { name: "Karur District" } },
  { id: "don8", donor_name: "Sri Krishna Sweets Trust", donor_email: "", donor_phone: null, donor_type: "corporate", donation_type: "water", amount: 90000, description: "10,000 Water Bottles 1L", status: "completed", created_at: "2026-08-09T11:30:00Z", districts: { name: "Coimbatore District" } },
  { id: "don9", donor_name: "Mrs. Meenakshi Sundaram", donor_email: "", donor_phone: null, donor_type: "individual", donation_type: "blankets", amount: 25000, description: "200 Woolen Warm Blankets", status: "completed", created_at: "2026-08-09T12:00:00Z", districts: { name: "Namakkal District" } },
  { id: "don10", donor_name: "Bannari Amman Sugars CSR", donor_email: "", donor_phone: null, donor_type: "corporate", donation_type: "cash", amount: 750000, description: "Sathyamangalam Flood Relief", status: "completed", created_at: "2026-08-09T12:30:00Z", districts: { name: "Erode District" } },
  { id: "don11", donor_name: "Lions Club Erode", donor_email: "", donor_phone: null, donor_type: "organization", donation_type: "medicines", amount: 150000, description: "First Aid & Hygiene Kits", status: "completed", created_at: "2026-08-09T13:00:00Z", districts: { name: "Erode District" } },
  { id: "don12", donor_name: "Mr. K. Vigneshwar", donor_email: "", donor_phone: null, donor_type: "individual", donation_type: "cash", amount: 15000, description: "Direct Victim Relief Donation", status: "completed", created_at: "2026-08-09T13:30:00Z", districts: { name: "Chennai District" } },
  { id: "don13", donor_name: "Textile Exporters Assoc.", donor_email: "", donor_phone: null, donor_type: "organization", donation_type: "blankets", amount: 400000, description: "1,500 Waterproof Tarpaulin Tents", status: "completed", created_at: "2026-08-09T14:00:00Z", districts: { name: "Tiruppur District" } },
  { id: "don14", donor_name: "Ramco Cements Foundation", donor_email: "", donor_phone: null, donor_type: "corporate", donation_type: "cash", amount: 600000, description: "Reconstruction & Infrastructure Support", status: "completed", created_at: "2026-08-09T14:30:00Z", districts: { name: "Salem District" } },
  { id: "don15", donor_name: "Alumni Association BIT", donor_email: "", donor_phone: null, donor_type: "organization", donation_type: "other", amount: 200000, description: "Solar Power Banks & LED Torches", status: "completed", created_at: "2026-08-09T15:00:00Z", district_id: "d1", districts: { name: "Erode District" } },
] as unknown as Donation[];

  const processChartData = (data: any[]) => {
    const groups: Record<string, number> = {};
    data.forEach(d => {
      const type = d.donation_type;
      groups[type] = (groups[type] || 0) + 1;
    });

    const formatted = Object.entries(groups).map(([name, value]) => ({
      name: name.toUpperCase(),
      value
    }));
    setChartData(formatted);
  };

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("donations")
        .select(`
          *,
          districts (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        setDonations(data as Donation[]);
        processChartData(data);
      } else {
        setDonations(MOCK_DONATIONS);
        processChartData(MOCK_DONATIONS);
      }
    } catch {
      setDonations(MOCK_DONATIONS);
      processChartData(MOCK_DONATIONS);
    }
    setLoading(false);
  };

  const fetchDistricts = async () => {
    const { data } = await supabase.from("districts").select("id, name");
    if (data) setDistricts(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.donor_name || !formData.donor_email) {
      toast.error("Please fill in donor name and email.");
      return;
    }

    try {
      const payload = {
        donor_name: formData.donor_name,
        donor_email: formData.donor_email,
        donor_phone: formData.donor_phone || null,
        donor_type: formData.donor_type,
        donation_type: formData.donation_type,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        description: formData.description || null,
        district_id: formData.district_id || null,
        status: "pending"
      };

      const { error } = await supabase.from("donations").insert(payload);
      if (error) throw error;

      toast.success("Thank you! Your donation proposal has been submitted.");
      setFormData({
        donor_name: "",
        donor_email: "",
        donor_phone: "",
        donor_type: "individual",
        donation_type: "cash",
        amount: "",
        description: "",
        district_id: districts[0]?.id || ""
      });
      fetchDonations();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit donation.");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from("donations")
        .update({ status: "approved" })
        .eq("id", id);
      if (error) throw error;
      toast.success("Donation approved successfully.");
      fetchDonations();
    } catch (err: any) {
      toast.error(err.message || "Approval failed.");
    }
  };

  return (
    <DashboardShell title="Emergency Donation Portal" subtitle="Propose supply donations or approve incoming relief contributions">
      <div className="space-y-6 page-enter">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left panel: Donation Proposal Form */}
          <Card className="shadow-card">
            <CardHeader className="bg-primary/5 pb-4 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                Supply & Cash Donation Proposal Form
              </CardTitle>
              <CardDescription className="text-xs">Individuals, Corporates, and NGOs can register relief offers</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Donor Name / Organization *</Label>
                    <Input
                      required
                      placeholder="Your full name"
                      value={formData.donor_name}
                      onChange={(e) => setFormData({ ...formData, donor_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Donor Type</Label>
                    <Select value={formData.donor_type} onValueChange={(v) => setFormData({ ...formData, donor_type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">🙋 Individual Citizen</SelectItem>
                        <SelectItem value="ngo">🤝 Non-Profit / NGO</SelectItem>
                        <SelectItem value="corporate">🏢 Corporate Partner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Email address *</Label>
                    <Input
                      required
                      type="email"
                      placeholder="email@example.com"
                      value={formData.donor_email}
                      onChange={(e) => setFormData({ ...formData, donor_email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Phone number</Label>
                    <Input
                      placeholder="10 digit phone"
                      value={formData.donor_phone}
                      onChange={(e) => setFormData({ ...formData, donor_phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Donation Type</Label>
                    <Select value={formData.donation_type} onValueChange={(v) => setFormData({ ...formData, donation_type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DONATION_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Cash Amount (INR) / Quantity</Label>
                    <Input
                      type="number"
                      placeholder="Optional"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Preferred Allocation District</Label>
                  <Select value={formData.district_id} onValueChange={(v) => setFormData({ ...formData, district_id: v })}>
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
                  <Label>Item Specification / Details</Label>
                  <Textarea
                    placeholder="E.g. 50 woollen blankets, expiry dates of medicines, etc."
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full gradient-hero text-white border-0 font-bold">
                  Submit Donation Offer
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Right panel: Analytics PieChart */}
          <Card className="shadow-card flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-primary" />
                Donations Categorization Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center h-64 min-h-[250px]">
              {chartData.length === 0 ? (
                <p className="text-xs text-muted-foreground">No donation records recorded.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
            {/* Color key */}
            <div className="p-4 border-t flex flex-wrap gap-3 justify-center text-xs">
              {chartData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground uppercase font-bold">{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Admin approval list (only visible to administrators) */}
        {isAdmin && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Manage Incoming Donation Proposals</CardTitle>
              <CardDescription className="text-xs">Approve civilian and NGO relief proposals to dispatch allocations</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Donor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Donation</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>District Allocation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                        No donation offers proposed yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    donations.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-bold text-xs">
                          <div>
                            <p>{d.donor_name}</p>
                            <p className="text-[9px] text-muted-foreground capitalize">{d.donor_type}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{d.donor_email}</TableCell>
                        <TableCell className="text-xs capitalize font-bold">
                          {d.donation_type} {d.amount ? `(${d.amount})` : ""}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]" title={d.description || ""}>
                          {d.description || "—"}
                        </TableCell>
                        <TableCell className="text-xs">{d.districts?.name || "State-wide"}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] capitalize font-bold status-${d.status}`}>
                            {d.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {d.status === "pending" && (
                            <Button variant="outline" size="sm" className="text-[10px] font-bold h-7 border-green-200 text-green-700 bg-green-50 hover:bg-green-100" onClick={() => handleApprove(d.id)}>
                              Approve
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
