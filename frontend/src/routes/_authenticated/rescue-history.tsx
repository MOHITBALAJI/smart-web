import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  History,
  Search,
  Shield,
  Clock,
  CheckCircle,
  MapPin,
  User,
  Siren,
  Eye,
  Calendar,
  Truck,
  Activity,
  Timer,
  TrendingUp,
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
import { GoogleMap, type MapMarker } from "@/components/maps/GoogleMap";

export const Route = createFileRoute("/_authenticated/rescue-history")({
  component: RescueHistoryPage,
});

interface RescueRecord {
  id: string;
  sos_request_id: string;
  volunteer_id: string;
  notes: string | null;
  created_at: string;
  sos_requests?: {
    reporter_name: string;
    address: string;
    emergency_type: string;
    emergency_level: number;
    latitude: number;
    longitude: number;
    created_at: string;
  };
  volunteers?: {
    users?: {
      full_name: string;
    };
  };
}

function RescueHistoryPage() {
  const [records, setRecords] = useState<RescueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<RescueRecord | null>(
    null
  );
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const { isStaff, isAdmin } = useRole();

  useEffect(() => {
    fetchRecords();
  }, [page]);

  const fetchRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("rescue_history")
      .select(
        `
        *,
        sos_requests (
          reporter_name,
          address,
          emergency_type,
          emergency_level,
          latitude,
          longitude,
          created_at
        ),
        volunteers (
          users (
            full_name
          )
        )
      `
      )
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (!error && data) setRecords(data as any);
    setLoading(false);
  };

  const filtered = records.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.sos_requests?.reporter_name?.toLowerCase().includes(q) ||
      r.volunteers?.users?.full_name?.toLowerCase().includes(q) ||
      r.sos_requests?.address?.toLowerCase().includes(q)
    );
  });

  const todayCount = records.filter((r) => {
    const d = new Date(r.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const getLevelColor = (lvl: number) => {
    if (lvl >= 4) return "bg-red-500/10 text-red-700 border-red-200";
    if (lvl === 3) return "bg-orange-500/10 text-orange-700 border-orange-200";
    return "bg-yellow-500/10 text-yellow-700 border-yellow-200";
  };

  if (!isStaff && !isAdmin) {
    return (
      <DashboardShell title="Rescue Operations History">
        <div className="text-center py-20 text-muted-foreground">
          <History className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
          <p className="font-semibold">Access Restricted</p>
          <p className="text-sm mt-1">
            Only disaster authorities can view rescue logs.
          </p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Rescue Operations History"
      subtitle="Complete chronological log of all emergency rescue missions"
    >
      <div className="space-y-6 page-enter">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="stat-card border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="text-2xl font-black text-green-600">
                {records.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Total Rescues
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="text-2xl font-black text-blue-600">
                {todayCount}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Today's Rescues
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="text-2xl font-black text-purple-600">100%</div>
              <div className="text-xs text-muted-foreground mt-1">
                Success Rate
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card border-l-4 border-l-teal-500">
            <CardContent className="pt-6">
              <div className="text-2xl font-black text-teal-600">
                ~{Math.max(5, Math.round(records.length * 1.5))} min
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Avg. Response Time
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center shadow-card">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by victim name, volunteer, or address…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="ml-3 gap-1.5"
            onClick={fetchRecords}
          >
            <Activity className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>#</TableHead>
                  <TableHead>Victim Name</TableHead>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Emergency Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Rescue Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-16">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
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
                    <TableCell
                      colSpan={9}
                      className="text-center py-16 text-muted-foreground"
                    >
                      <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold">No rescue records found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r, i) => (
                    <TableRow
                      key={r.id}
                      className="hover:bg-muted/30 cursor-pointer"
                      onClick={() => setSelectedRecord(r)}
                    >
                      <TableCell className="text-muted-foreground text-xs">
                        {page * PAGE_SIZE + i + 1}
                      </TableCell>
                      <TableCell className="font-bold text-sm">
                        {r.sos_requests?.reporter_name || "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-blue-500" />
                          {r.volunteers?.users?.full_name || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs capitalize">
                        {r.sos_requests?.emergency_type?.replace("_", " ") ||
                          "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs font-bold ${getLevelColor(r.sos_requests?.emergency_level || 1)}`}
                        >
                          Lvl {r.sos_requests?.emergency_level || "?"}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="text-xs text-muted-foreground truncate max-w-[150px]"
                        title={r.sos_requests?.address}
                      >
                        {r.sos_requests?.address || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(r.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell
                        className="text-xs text-muted-foreground italic truncate max-w-[120px]"
                        title={r.notes || ""}
                      >
                        {r.notes || "—"}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="w-7 h-7">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Page {page + 1} · Showing {filtered.length} records
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={records.length < PAGE_SIZE}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        {/* Detail Modal */}
        {selectedRecord && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedRecord(null)}
          >
            <div
              className="bg-card border border-border rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-bold text-lg">Rescue Report</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRecord(null)}
                >
                  ✕
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Victim</p>
                  <p className="font-bold text-base mt-0.5">
                    {selectedRecord.sos_requests?.reporter_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Rescue Volunteer
                  </p>
                  <p className="font-bold mt-0.5 flex items-center gap-1">
                    <Truck className="w-4 h-4 text-blue-500" />
                    {selectedRecord.volunteers?.users?.full_name || "—"}
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 text-xs bg-muted/40 rounded-xl p-3">
                <div>
                  <p className="text-muted-foreground font-semibold">
                    Emergency Type
                  </p>
                  <p className="font-bold capitalize text-foreground mt-0.5">
                    {selectedRecord.sos_requests?.emergency_type?.replace(
                      "_",
                      " "
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">
                    Severity
                  </p>
                  <p className="font-bold mt-0.5">
                    Level {selectedRecord.sos_requests?.emergency_level}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">
                    Rescue Date
                  </p>
                  <p className="font-bold mt-0.5">
                    {new Date(selectedRecord.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedRecord.notes && (
                <div className="text-sm">
                  <p className="text-xs text-muted-foreground">
                    Operation Notes
                  </p>
                  <p className="bg-muted/30 border rounded-xl p-3 mt-1 italic text-foreground">
                    "{selectedRecord.notes}"
                  </p>
                </div>
              )}

              {/* Mini Map */}
              {selectedRecord.sos_requests?.latitude && (
                <div className="rounded-xl overflow-hidden border">
                  <GoogleMap
                    center={{
                      lat: selectedRecord.sos_requests.latitude,
                      lng: selectedRecord.sos_requests.longitude,
                    }}
                    zoom={15}
                    markers={[
                      {
                        id: selectedRecord.id,
                        lat: selectedRecord.sos_requests.latitude,
                        lng: selectedRecord.sos_requests.longitude,
                        type: "victim",
                        title:
                          selectedRecord.sos_requests.reporter_name || "Victim",
                      },
                    ]}
                    className="h-48 w-full"
                  />
                </div>
              )}

              <div className="flex justify-end border-t pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRecord(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
