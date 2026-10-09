import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Trash,
  Eye,
  Tent,
  Activity,
  Phone,
  User,
  Heart,
  Calendar,
  ShieldAlert
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
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/families")({
  component: FamiliesPage,
});

interface FamilyGroup {
  id: string;
  family_head_id: string;
  member_name: string;
  age: number;
  gender: string;
  relationship: string;
  medical_notes: string | null;
  created_at: string;
  head_name?: string;
  camp_name?: string;
}

const MOCK_FAMILIES: FamilyGroup[] = [
  {
    id: "f1",
    family_head_id: "h1",
    member_name: "Rajesh Kumar",
    age: 45,
    gender: "Male",
    relationship: "Head",
    medical_notes: null,
    created_at: new Date().toISOString(),
    head_name: "Rajesh Kumar",
    camp_name: "Sathyamangalam Relief Camp"
  },
  {
    id: "f2",
    family_head_id: "h1",
    member_name: "Lakshmi Devi",
    age: 40,
    gender: "Female",
    relationship: "Wife",
    medical_notes: "Diabetic - needs insulin",
    created_at: new Date().toISOString(),
    head_name: "Rajesh Kumar",
    camp_name: "Sathyamangalam Relief Camp"
  },
  {
    id: "f3",
    family_head_id: "h1",
    member_name: "Arun Kumar",
    age: 18,
    gender: "Male",
    relationship: "Son",
    medical_notes: null,
    created_at: new Date().toISOString(),
    head_name: "Rajesh Kumar",
    camp_name: "Sathyamangalam Relief Camp"
  },
  {
    id: "f4",
    family_head_id: "h1",
    member_name: "Meenakshi",
    age: 68,
    gender: "Female",
    relationship: "Mother",
    medical_notes: "High BP medication",
    created_at: new Date().toISOString(),
    head_name: "Rajesh Kumar",
    camp_name: "Sathyamangalam Relief Camp"
  },
  {
    id: "f5",
    family_head_id: "h2",
    member_name: "Murugan S.",
    age: 38,
    gender: "Male",
    relationship: "Head",
    medical_notes: null,
    created_at: new Date().toISOString(),
    head_name: "Murugan S.",
    camp_name: "Erode Govt School Shelter"
  },
  {
    id: "f6",
    family_head_id: "h2",
    member_name: "Priya R.",
    age: 35,
    gender: "Female",
    relationship: "Wife",
    medical_notes: "Pregnant - 7 months",
    created_at: new Date().toISOString(),
    head_name: "Murugan S.",
    camp_name: "Erode Govt School Shelter"
  },
  {
    id: "f7",
    family_head_id: "h2",
    member_name: "Kavitha",
    age: 2,
    gender: "Female",
    relationship: "Daughter",
    medical_notes: "Infant - needs formula",
    created_at: new Date().toISOString(),
    head_name: "Murugan S.",
    camp_name: "Erode Govt School Shelter"
  },
  {
    id: "f8",
    family_head_id: "h3",
    member_name: "Selvam K.",
    age: 50,
    gender: "Male",
    relationship: "Head",
    medical_notes: null,
    created_at: new Date().toISOString(),
    head_name: "Selvam K.",
    camp_name: "Bhavani Community Hall"
  },
  {
    id: "f9",
    family_head_id: "h3",
    member_name: "Kannan",
    age: 75,
    gender: "Male",
    relationship: "Father",
    medical_notes: "Asthma patient",
    created_at: new Date().toISOString(),
    head_name: "Selvam K.",
    camp_name: "Bhavani Community Hall"
  },
  {
    id: "f10",
    family_head_id: "h3",
    member_name: "Saraswathi",
    age: 72,
    gender: "Female",
    relationship: "Mother",
    medical_notes: "Wheelchair user",
    created_at: new Date().toISOString(),
    head_name: "Selvam K.",
    camp_name: "Bhavani Community Hall"
  },
  {
    id: "f11",
    family_head_id: "h3",
    member_name: "Karthik",
    age: 25,
    gender: "Male",
    relationship: "Son",
    medical_notes: null,
    created_at: new Date().toISOString(),
    head_name: "Selvam K.",
    camp_name: "Bhavani Community Hall"
  },
  {
    id: "f12",
    family_head_id: "h4",
    member_name: "Anitha M.",
    age: 32,
    gender: "Female",
    relationship: "Head",
    medical_notes: null,
    created_at: new Date().toISOString(),
    head_name: "Anitha M.",
    camp_name: "Sathyamangalam Relief Camp"
  },
  {
    id: "f13",
    family_head_id: "h4",
    member_name: "Vijay",
    age: 10,
    gender: "Male",
    relationship: "Son",
    medical_notes: null,
    created_at: new Date().toISOString(),
    head_name: "Anitha M.",
    camp_name: "Sathyamangalam Relief Camp"
  },
  {
    id: "f14",
    family_head_id: "h4",
    member_name: "Divya",
    age: 8,
    gender: "Female",
    relationship: "Daughter",
    medical_notes: null,
    created_at: new Date().toISOString(),
    head_name: "Anitha M.",
    camp_name: "Sathyamangalam Relief Camp"
  },
  {
    id: "f15",
    family_head_id: "h5",
    member_name: "Venkatesh P.",
    age: 42,
    gender: "Male",
    relationship: "Head",
    medical_notes: "Diabetic",
    created_at: new Date().toISOString(),
    head_name: "Venkatesh P.",
    camp_name: "Erode Govt School Shelter"
  },
  {
    id: "f16",
    family_head_id: "h5",
    member_name: "Radhika",
    age: 39,
    gender: "Female",
    relationship: "Wife",
    medical_notes: null,
    created_at: new Date().toISOString(),
    head_name: "Venkatesh P.",
    camp_name: "Erode Govt School Shelter"
  },
  {
    id: "f17",
    family_head_id: "h5",
    member_name: "Ganesh",
    age: 15,
    gender: "Male",
    relationship: "Son",
    medical_notes: null,
    created_at: new Date().toISOString(),
    head_name: "Venkatesh P.",
    camp_name: "Erode Govt School Shelter"
  }
];

function FamiliesPage() {
  const [families, setFamilies] = useState<FamilyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [campFilter, setCampFilter] = useState("all");

  useEffect(() => {
    fetchFamilies();
  }, []);

  const fetchFamilies = async () => {
    setLoading(true);
    // Fetch all family members
    const { data, error } = await supabase
      .from("families")
      .select(`
        *,
        beneficiaries!family_head_id (
          id,
          current_camp_id,
          users (
            full_name
          ),
          relief_camps (
            name
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      const formatted = data.map((f: any) => ({
        ...f,
        head_name: f.beneficiaries?.users?.full_name || "Unknown",
        camp_name: f.beneficiaries?.relief_camps?.name || "Unassigned"
      }));
      setFamilies(formatted);
    } else {
      setFamilies(MOCK_FAMILIES);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this family record?")) return;
    try {
      const { error } = await supabase.from("families").delete().eq("id", id);
      if (error) throw error;
      toast.success("Family member removed.");
      fetchFamilies();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete record");
    }
  };

  const filtered = families.filter(f => {
    const matchesSearch = f.member_name.toLowerCase().includes(search.toLowerCase()) ||
      f.head_name?.toLowerCase().includes(search.toLowerCase()) ||
      f.relationship.toLowerCase().includes(search.toLowerCase());
    const matchesCamp = campFilter === "all" || f.camp_name === campFilter;
    return matchesSearch && matchesCamp;
  });

  const totalFamilies = new Set(families.map(f => f.family_head_id)).size;
  const totalMembers = families.length;
  const priorityMembers = families.filter(f => f.medical_notes).length;
  const campsAssigned = new Set(families.map(f => f.camp_name).filter(Boolean)).size;

  return (
    <DashboardShell title="Family Group Management" subtitle="Monitor family units, priority members, and check-in camps">
      <div className="space-y-6 page-enter">
        {/* Summary stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Families</p>
                <p className="text-2xl font-bold">{totalFamilies}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">{totalMembers}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Priority Members</p>
                <p className="text-2xl font-bold">{priorityMembers}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <Tent className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Camps Assigned</p>
                <p className="text-2xl font-bold">{campsAssigned}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter bar */}
        <div className="bg-card border border-border rounded-2xl p-4 shadow-card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by member name, head name, or relationship…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={campFilter} onValueChange={setCampFilter}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Filter by camp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Camps</SelectItem>
                {Array.from(new Set(families.map(f => f.camp_name).filter(Boolean))).map(camp => (
                  <SelectItem key={camp as string} value={camp as string}>{camp}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Family Member</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Family Head</TableHead>
                  <TableHead>Relief Camp Assigned</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Medical Notes</TableHead>
                  <TableHead className="w-16 text-right">Action</TableHead>
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
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold">No family members registered</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((f) => (
                    <TableRow key={f.id} className="hover:bg-muted/30">
                      <TableCell className="font-bold text-sm">{f.member_name}</TableCell>
                      <TableCell className="text-xs">{f.age}</TableCell>
                      <TableCell className="text-xs capitalize">{f.gender}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize text-xs">
                          {f.relationship}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-foreground">
                        {f.head_name}
                      </TableCell>
                      <TableCell className="text-xs font-semibold">
                        <div className="flex items-center gap-1">
                          <Tent className="w-3.5 h-3.5 text-primary" />
                          {f.camp_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {f.medical_notes ? (
                          <Badge variant="destructive" className="text-[10px] uppercase font-bold tracking-wider">High</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">Normal</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground italic truncate max-w-[150px]" title={f.medical_notes || ""}>
                        {f.medical_notes || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(f.id)}>
                          <Trash className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
