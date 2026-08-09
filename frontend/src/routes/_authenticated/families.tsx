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

function FamiliesPage() {
  const [families, setFamilies] = useState<FamilyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

    if (!error && data) {
      const formatted = data.map((f: any) => ({
        ...f,
        head_name: f.beneficiaries?.users?.full_name || "Unknown",
        camp_name: f.beneficiaries?.relief_camps?.name || "Unassigned"
      }));
      setFamilies(formatted);
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

  const filtered = families.filter(f =>
    f.member_name.toLowerCase().includes(search.toLowerCase()) ||
    f.head_name?.toLowerCase().includes(search.toLowerCase()) ||
    f.relationship.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardShell title="Family Group Management" subtitle="Monitor family units, priority members, and check-in camps">
      <div className="space-y-6 page-enter">
        {/* Summary header */}
        <div className="flex justify-between items-center">
          <Badge variant="secondary" className="text-xs">
            Total Family Members Registered: {families.length}
          </Badge>
        </div>

        {/* Filter bar */}
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center shadow-card">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by member name, head name, or relationship…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
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
                  <TableHead>Medical Notes</TableHead>
                  <TableHead className="w-16 text-right">Action</TableHead>
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
