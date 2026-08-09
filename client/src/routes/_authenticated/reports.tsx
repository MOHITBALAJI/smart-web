import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Calendar,
  Users,
  Tent,
  Truck,
  Package,
  Activity,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Clock,
  Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useRole } from "@/context/AuthContext";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

const REPORT_TYPES = [
  { id: "victim", title: "Victims Registration Report", desc: "List of all flood victims, profiles, and shelter check-in status.", icon: Users, color: "bg-red-500/10 text-red-600" },
  { id: "volunteer", title: "Volunteer Performance Log", desc: "Available rescue volunteers, metrics, and vehicle classes.", icon: Truck, color: "bg-blue-500/10 text-blue-600" },
  { id: "camp", title: "Relief Camp Occupancy Report", desc: "Current bed spaces, utilities, and occupancy rates.", icon: Tent, color: "bg-green-500/10 text-green-600" },
  { id: "inventory", title: "Inventory Stock Sheet", desc: "Supplies current levels, critical lows, and distributions count.", icon: Package, color: "bg-orange-500/10 text-orange-600" },
  { id: "rescue", title: "Daily Rescue Operations Log", desc: "Chronological SOS reports status, assignments, and resolution rate.", icon: Activity, color: "bg-purple-500/10 text-purple-600" }
];

function ReportsPage() {
  const [selectedReportId, setSelectedReportId] = useState("victim");
  const [districts, setDistricts] = useState<any[]>([]);
  const [districtFilter, setDistrictFilter] = useState("all");
  
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewCols, setPreviewCols] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const { isStaff, isAdmin } = useRole();

  useEffect(() => {
    fetchDistricts();
    generatePreviewData();
  }, [selectedReportId, districtFilter]);

  const fetchDistricts = async () => {
    const { data } = await supabase.from("districts").select("id, name");
    if (data) setDistricts(data);
  };

  const generatePreviewData = async () => {
    setLoading(true);
    setPreviewData([]);
    setPreviewCols([]);

    try {
      if (selectedReportId === "victim") {
        const { data } = await supabase
          .from("beneficiaries")
          .select("id, blood_group, current_camp_id, shelter_status, registration_date, users(full_name, phone)")
          .limit(10);
        
        if (data) {
          setPreviewCols(["ID", "Name", "Phone", "Blood", "Status", "Date"]);
          setPreviewData(data.map((b: any) => ({
            ID: b.id.slice(0, 8).toUpperCase(),
            Name: b.users?.full_name || "—",
            Phone: b.users?.phone || "—",
            Blood: b.blood_group || "—",
            Status: b.shelter_status,
            Date: new Date(b.registration_date).toLocaleDateString()
          })));
        }
      } else if (selectedReportId === "camp") {
        const { data } = await supabase
          .from("relief_camps")
          .select("name, address, max_capacity, current_occupancy, beds_available, status")
          .limit(10);

        if (data) {
          setPreviewCols(["Camp Name", "Address", "Capacity", "Occupancy", "Beds Avail", "Status"]);
          setPreviewData(data.map((c: any) => ({
            "Camp Name": c.name,
            Address: c.address,
            Capacity: c.max_capacity,
            Occupancy: c.current_occupancy,
            "Beds Avail": c.beds_available,
            Status: c.status
          })));
        }
      } else if (selectedReportId === "volunteer") {
        const { data } = await supabase
          .from("volunteers")
          .select("id, vehicle_type, is_available, total_missions, users(full_name, phone)")
          .limit(10);

        if (data) {
          setPreviewCols(["ID", "Name", "Vehicle Type", "Status", "Missions"]);
          setPreviewData(data.map((v: any) => ({
            ID: v.id.slice(0, 8).toUpperCase(),
            Name: v.users?.full_name || "—",
            "Vehicle Type": v.vehicle_type || "None",
            Status: v.is_available ? "Available" : "Offline",
            Missions: v.total_missions || 0
          })));
        }
      } else if (selectedReportId === "inventory") {
        const { data } = await supabase
          .from("inventory")
          .select("item_name, category, current_stock, min_threshold, unit, relief_camps(name)")
          .limit(10);

        if (data) {
          setPreviewCols(["Camp Location", "Item Name", "Category", "Stock", "Threshold"]);
          setPreviewData(data.map((i: any) => ({
            "Camp Location": i.relief_camps?.name || "State Depot",
            "Item Name": i.item_name,
            Category: i.category,
            Stock: `${i.current_stock} ${i.unit}`,
            Threshold: `${i.min_threshold} ${i.unit}`
          })));
        }
      } else if (selectedReportId === "rescue") {
        const { data } = await supabase
          .from("sos_requests")
          .select("reporter_name, emergency_type, emergency_level, address, status, created_at")
          .limit(10);

        if (data) {
          setPreviewCols(["Reporter", "Emergency Type", "Level", "Address", "Status", "Time"]);
          setPreviewData(data.map((s: any) => ({
            Reporter: s.reporter_name,
            "Emergency Type": s.emergency_type.replace("_", " "),
            Level: `Lvl ${s.emergency_level}`,
            Address: s.address,
            Status: s.status,
            Time: new Date(s.created_at).toLocaleTimeString()
          })));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePdfExport = () => {
    if (previewData.length === 0) return;
    const doc = new jsPDF() as any;
    
    // Header
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("FloodResponse EMS Emergency Report", 14, 20);

    // Title & Meta
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(12);
    doc.text(`Report Type: ${REPORT_TYPES.find(r => r.id === selectedReportId)?.title}`, 14, 40);
    doc.text(`Generated At: ${new Date().toLocaleString()}`, 14, 46);

    const headers = [previewCols];
    const rows = previewData.map(row => previewCols.map(col => String(row[col])));

    doc.autoTable({
      head: headers,
      body: rows,
      startY: 52,
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [30, 58, 95] }
    });

    doc.save(`report-${selectedReportId}-${Date.now()}.pdf`);
    toast.success("PDF generated successfully!");
  };

  const handleExcelExport = () => {
    if (previewData.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(previewData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report Log");
    
    XLSX.writeFile(workbook, `report-${selectedReportId}-${Date.now()}.xlsx`);
    toast.success("Excel sheet generated successfully!");
  };

  if (!isStaff) {
    return (
      <DashboardShell title="Reports Portal">
        <div className="text-center py-20 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
          <p className="font-semibold">Access Restricted</p>
          <p className="text-sm mt-1">Only disaster authorities and camp officers have access to compile reports.</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Emergency Reports Center" subtitle="Generate printable and downloadable PDFs and spreadsheet data sheets">
      <div className="space-y-6 page-enter">
        {/* Date / District filters */}
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-4 items-end shadow-card">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <Label className="text-xs font-bold text-muted-foreground">District Focus</Label>
            <Select value={districtFilter} onValueChange={setDistrictFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All districts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {districts.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="border-border gap-1.5" onClick={handlePdfExport} disabled={previewData.length === 0}>
              <Printer className="w-4 h-4 text-red-600" />
              Export PDF
            </Button>
            <Button variant="outline" className="border-border gap-1.5" onClick={handleExcelExport} disabled={previewData.length === 0}>
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Report Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {REPORT_TYPES.map((rep) => {
            const isSelected = selectedReportId === rep.id;
            return (
              <button
                key={rep.id}
                onClick={() => setSelectedReportId(rep.id)}
                className={`text-left rounded-2xl border p-4 transition-all flex flex-col justify-between h-36 ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-elegant"
                    : "border-border bg-card hover:border-muted-foreground/40 shadow-card"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl ${rep.color} flex items-center justify-center`}>
                  <rep.icon className="w-4 h-4" />
                </div>
                <div className="mt-4">
                  <h4 className="font-bold text-xs text-foreground leading-snug">{rep.title}</h4>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{rep.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Preview Area */}
        <Card className="shadow-card overflow-hidden">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Report Preview (Top 10 entries)</span>
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
            </CardTitle>
            <CardDescription className="text-xs">Preview of compiled database entries before file creation</CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  {previewCols.map((col) => (
                    <TableHead key={col}>{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-muted rounded animate-shimmer" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : previewData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={previewCols.length || 1} className="text-center py-10 text-xs text-muted-foreground">
                      No records match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  previewData.map((row, idx) => (
                    <TableRow key={idx}>
                      {previewCols.map((col) => (
                        <TableCell key={col} className="text-xs font-medium">
                          {row[col]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
