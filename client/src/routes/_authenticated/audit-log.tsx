import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ScrollText, Search, Filter, Eye, User, Clock } from "lucide-react";
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
import { DashboardShell } from "@/components/layout/DashboardShell";
import { supabase } from "@/lib/supabase";
import { useRole } from "@/context/AuthContext";

export const Route = createFileRoute("/_authenticated/audit-log")({
  component: AuditLogPage,
});

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
  user?: { full_name: string; email?: string; role: string };
}

const ACTION_COLORS: Record<string, string> = {
  INSERT: "bg-green-500/10 text-green-700 border-green-500/20",
  UPDATE: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  DELETE: "bg-red-500/10 text-red-700 border-red-500/20",
  SELECT: "bg-gray-500/10 text-gray-700 border-gray-500/20",
  LOGIN: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  LOGOUT: "bg-orange-500/10 text-orange-700 border-orange-500/20",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [page, setPage] = useState(0);
  const { isAdmin } = useRole();

  const PAGE_SIZE = 25;

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, tableFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from("audit_logs")
      .select(
        `*, user:users!user_id(full_name, role)`
      )
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (actionFilter !== "all") query = query.eq("action", actionFilter);
    if (tableFilter !== "all") query = query.eq("table_name", tableFilter);

    const { data, error } = await query;
    if (!error && data) setLogs(data as any);
    setLoading(false);
  };

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.action?.toLowerCase().includes(q) ||
      log.table_name?.toLowerCase().includes(q) ||
      log.user?.full_name?.toLowerCase().includes(q) ||
      log.record_id?.toLowerCase().includes(q)
    );
  });

  const uniqueTables = [...new Set(logs.map((l) => l.table_name).filter(Boolean))];

  if (!isAdmin) {
    return (
      <DashboardShell title="Audit Log" subtitle="System activity history">
        <div className="text-center py-20 text-muted-foreground">
          <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Access Restricted</p>
          <p className="text-sm mt-1">Only administrators can view the audit log.</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Audit Log" subtitle="Complete system activity history for compliance">
      <div className="space-y-5 page-enter">
        {/* Filters */}
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-3 items-center shadow-card">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search actions, tables, users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {["INSERT", "UPDATE", "DELETE", "LOGIN", "LOGOUT"].map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tableFilter} onValueChange={setTableFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Table" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tables</SelectItem>
              {uniqueTables.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Events", value: logs.length, color: "text-foreground" },
            { label: "Inserts", value: logs.filter(l => l.action === "INSERT").length, color: "text-green-600" },
            { label: "Updates", value: logs.filter(l => l.action === "UPDATE").length, color: "text-blue-600" },
            { label: "Deletes", value: logs.filter(l => l.action === "DELETE").length, color: "text-red-600" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Record ID</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="w-16">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-muted rounded animate-shimmer" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                      <ScrollText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold">No audit logs found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log, i) => (
                    <TableRow
                      key={log.id}
                      className="hover:bg-muted/30 cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <TableCell className="text-muted-foreground text-xs">{page * PAGE_SIZE + i + 1}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${ACTION_COLORS[log.action] || "bg-muted"}`}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.table_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm">{(log as any).user?.full_name || "System"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.record_id ? log.record_id.slice(0, 8) + "…" : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.ip_address || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {timeAgo(log.created_at)}
                        </div>
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
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, logs.length)} of {logs.length} events
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={logs.length < PAGE_SIZE} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </div>

        {/* Detail modal */}
        {selectedLog && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedLog(null)}
          >
            <div
              className="bg-card border border-border rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge className={ACTION_COLORS[selectedLog.action]}>
                    {selectedLog.action}
                  </Badge>
                  <span className="font-mono text-sm text-muted-foreground">{selectedLog.table_name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>✕</Button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-muted-foreground text-xs">User</p>
                    <p className="font-semibold">{(selectedLog as any).user?.full_name || "System"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Timestamp</p>
                    <p className="font-semibold">{new Date(selectedLog.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Record ID</p>
                    <p className="font-mono text-xs">{selectedLog.record_id || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">IP Address</p>
                    <p className="font-semibold">{selectedLog.ip_address || "—"}</p>
                  </div>
                </div>

                {selectedLog.old_values && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Previous Values</p>
                    <pre className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs overflow-auto max-h-40 text-red-800">
                      {JSON.stringify(selectedLog.old_values, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.new_values && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">New Values</p>
                    <pre className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs overflow-auto max-h-40 text-green-800">
                      {JSON.stringify(selectedLog.new_values, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
