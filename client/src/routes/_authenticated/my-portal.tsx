import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  User,
  Phone,
  Heart,
  QrCode,
  Download,
  Users,
  Clock,
  Printer,
  Siren,
  Activity,
  Plus,
  Trash,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useAuth } from "@/context/AuthContext";
import { QrGenerator } from "@/components/qr/QrGenerator";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/my-portal")({
  component: BeneficiaryPortalPage,
});

interface FamilyMember {
  id: string;
  member_name: string;
  age: number;
  gender: string;
  relationship: string;
  medical_notes: string | null;
}

function BeneficiaryPortalPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add family member modal state
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberForm, setMemberForm] = useState({
    member_name: "",
    age: "30",
    gender: "male",
    relationship: "spouse",
    medical_notes: ""
  });

  useEffect(() => {
    if (!user) return;
    fetchPortalData();
  }, [user]);

  const fetchPortalData = async () => {
    setLoading(true);
    try {
      // Fetch beneficiary profile
      const { data: prof, error: profErr } = await supabase
        .from("beneficiaries")
        .select(`
          *,
          relief_camps (
            name
          )
        `)
        .eq("user_id", user?.id)
        .maybeSingle();

      if (profErr) throw profErr;

      if (prof) {
        setProfile(prof);

        // Fetch family members
        const { data: fam } = await supabase
          .from("families")
          .select("*")
          .eq("family_head_id", prof.id);
        setFamily(fam || []);

        // Fetch distribution history
        const { data: hist } = await supabase
          .from("resource_distribution")
          .select("*")
          .eq("beneficiary_id", prof.id)
          .order("created_at", { ascending: false });
        setHistory(hist || []);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load profile records");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!memberForm.member_name) {
      toast.error("Family member name is required.");
      return;
    }

    try {
      const { error } = await supabase
        .from("families")
        .insert({
          family_head_id: profile.id,
          member_name: memberForm.member_name,
          age: parseInt(memberForm.age),
          gender: memberForm.gender,
          relationship: memberForm.relationship,
          medical_notes: memberForm.medical_notes || null
        });

      if (error) throw error;
      toast.success("Family member added successfully!");
      setShowAddMember(false);
      setMemberForm({
        member_name: "",
        age: "30",
        gender: "male",
        relationship: "spouse",
        medical_notes: ""
      });
      fetchPortalData();
    } catch (err: any) {
      toast.error(err.message || "Failed to add member");
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!window.confirm("Remove this family member?")) return;
    try {
      const { error } = await supabase.from("families").delete().eq("id", id);
      if (error) throw error;
      toast.success("Member removed.");
      fetchPortalData();
    } catch (err: any) {
      toast.error(err.message || "Operation failed.");
    }
  };

  if (loading) {
    return (
      <DashboardShell title="My Safety Portal">
        <div className="flex h-[60vh] items-center justify-center">
          <Activity className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardShell>
    );
  }

  if (!profile) {
    return (
      <DashboardShell title="My Safety Portal">
        <div className="text-center py-20 bg-card border rounded-2xl text-muted-foreground">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
          <p className="font-semibold">No Beneficiary Profile</p>
          <p className="text-sm mt-1">Please register as a beneficiary or request SOS help first.</p>
          <Button asChild className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold border-0">
            <Link to="/emergency">Go to Emergency Desk</Link>
          </Button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Beneficiary Safety Pass & Portal" subtitle={`Welcome, ${user?.full_name}`}>
      <div className="space-y-6 page-enter">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left panel: QR pass */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">Your Digital Relief Pass</CardTitle>
                <CardDescription className="text-xs">Scan this pass at camp depots to claim ration kits</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {profile.qr_code_data ? (
                  <QrGenerator
                    data={profile.qr_code_data}
                    beneficiaryId={profile.id.slice(0, 8)}
                    beneficiaryName={user?.full_name}
                    campName={profile.relief_camps?.name}
                  />
                ) : (
                  <p className="text-xs text-red-500 text-center font-bold">QR not generated</p>
                )}
              </CardContent>
            </Card>

            {/* Profile Overview */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-sm font-bold">Profile Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-semibold">Blood Group</span>
                  <span className="font-bold">{profile.blood_group || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-semibold">Shelter Status</span>
                  <span className="font-bold capitalize">{profile.shelter_status.replace("_", " ")}</span>
                </div>
                {profile.medical_conditions && (
                  <div className="pt-2 border-t">
                    <p className="text-muted-foreground font-semibold">Medical Conditions</p>
                    <p className="mt-1 font-medium bg-muted/40 p-2 rounded-lg italic">"{profile.medical_conditions}"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right panel: Family & distributions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Family registry card */}
            <Card className="shadow-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold">Family Members</CardTitle>
                  <CardDescription className="text-xs">Members included in your relief kit allocations</CardDescription>
                </div>
                <Button className="gradient-hero text-white border-0 font-bold size-sm h-8 py-1.5" onClick={() => setShowAddMember(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Member
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Relationship</TableHead>
                      <TableHead className="w-16 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {family.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                          No family members registered yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      family.map(m => (
                        <TableRow key={m.id}>
                          <TableCell className="font-bold text-xs">{m.member_name}</TableCell>
                          <TableCell className="text-xs">{m.age}</TableCell>
                          <TableCell className="text-xs capitalize">{m.gender}</TableCell>
                          <TableCell className="text-xs capitalize">{m.relationship}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="w-7 h-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteMember(m.id)}>
                              <Trash className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Distribution history */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-sm font-bold">Your Distribution History</CardTitle>
                <CardDescription className="text-xs">Ration kits and medical packages claimed at depots</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Distribution Date</TableHead>
                      <TableHead>Claimed Supplies</TableHead>
                      <TableHead>Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-xs text-muted-foreground">
                          No resources distributed yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.map(h => (
                        <TableRow key={h.id}>
                          <TableCell className="text-xs">
                            {new Date(h.distribution_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs font-bold truncate max-w-[200px]">
                            {Array.isArray(h.items) ? h.items.map((it: any) => `${it.quantity}x ${it.item_name}`).join(", ") : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] ${h.qr_scanned ? "bg-green-50 text-green-700 border-green-200" : "bg-muted"}`}>
                              {h.qr_scanned ? "QR Scanned" : "Manual"}
                            </Badge>
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

        {/* Add Family Member Modal */}
        {showAddMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddMember(false)}>
            <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-lg">Add Family Member</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAddMember(false)}>✕</Button>
              </div>

              <form onSubmit={handleAddMemberSubmit} className="space-y-4 text-sm">
                <div className="space-y-1.5">
                  <Label>Member Full Name *</Label>
                  <Input
                    required
                    placeholder="Enter full name"
                    value={memberForm.member_name}
                    onChange={(e) => setMemberForm({ ...memberForm, member_name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Age *</Label>
                    <Input
                      required
                      type="number"
                      value={memberForm.age}
                      onChange={(e) => setMemberForm({ ...memberForm, age: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Gender</Label>
                    <Select value={memberForm.gender} onValueChange={(v: string) => setMemberForm({ ...memberForm, gender: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Relationship *</Label>
                  <Select value={memberForm.relationship} onValueChange={(v: string) => setMemberForm({ ...memberForm, relationship: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="other">Other Relative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Medical Notes / Chronic Illness</Label>
                  <Input
                    placeholder="E.g. Asthma, physically challenged, none"
                    value={memberForm.medical_notes}
                    onChange={(e) => setMemberForm({ ...memberForm, medical_notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 justify-end border-t pt-3">
                  <Button variant="outline" type="button" onClick={() => setShowAddMember(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary text-white border-0 font-bold">
                    Add Member
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
