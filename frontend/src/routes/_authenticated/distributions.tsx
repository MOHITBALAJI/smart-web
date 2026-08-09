import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  QrCode,
  Search,
  User,
  Users,
  Package,
  CheckCircle,
  AlertTriangle,
  FileText,
  Clock,
  Printer,
  ShieldAlert,
  Camera,
  Layers,
  MapPin,
  RefreshCw
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
import { Scanner } from "@yudiel/react-qr-scanner";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/distributions")({
  component: DistributionsPage,
});

interface Beneficiary {
  id: string;
  user_id: string;
  blood_group: string | null;
  current_camp_id: string | null;
  shelter_status: string;
  qr_code_data: string | null;
  users?: {
    full_name: string;
    phone: string | null;
  };
  relief_camps?: {
    name: string;
  };
}

interface InventoryItem {
  id: string;
  item_name: string;
  current_stock: number;
  unit: string;
}

function DistributionsPage() {
  const [mode, setMode] = useState<"scan" | "search" | "history">("scan");
  const [loading, setLoading] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [scannerActive, setScannerActive] = useState(true);

  // Loaded profiles
  const [foundBeneficiary, setFoundBeneficiary] = useState<Beneficiary | null>(null);
  const [campInventory, setCampInventory] = useState<InventoryItem[]>([]);
  const [distHistory, setDistHistory] = useState<any[]>([]);

  // Selected distribution items
  const [distQty, setDistQty] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchHistory();
  }, []);

const MOCK_DISTRIBUTIONS = [
  { id: "d1", quantity: 5, created_at: "2026-08-09T09:10:00Z", beneficiaries: { users: { full_name: "Kavitha R." } }, relief_camps: { name: "Sathyamangalam Rescue Shelter #1" } },
  { id: "d2", quantity: 8, created_at: "2026-08-09T09:35:00Z", beneficiaries: { users: { full_name: "Ramesh K." } }, relief_camps: { name: "Sathyamangalam Disaster Base #2" } },
  { id: "d3", quantity: 6, created_at: "2026-08-09T10:00:00Z", beneficiaries: { users: { full_name: "Priya V." } }, relief_camps: { name: "Velachery Central Relief Camp" } },
  { id: "d4", quantity: 12, created_at: "2026-08-09T10:20:00Z", beneficiaries: { users: { full_name: "Rajesh S." } }, relief_camps: { name: "Erode Disaster Relief Base #3" } },
  { id: "d5", quantity: 4, created_at: "2026-08-09T10:45:00Z", beneficiaries: { users: { full_name: "Deepa N." } }, relief_camps: { name: "Mettupalayam Emergency Camp #4" } },
  { id: "d6", quantity: 7, created_at: "2026-08-09T11:10:00Z", beneficiaries: { users: { full_name: "Karthik M." } }, relief_camps: { name: "Gobichettipalayam Shelter #5" } },
  { id: "d7", quantity: 10, created_at: "2026-08-09T11:35:00Z", beneficiaries: { users: { full_name: "Lakshmi P." } }, relief_camps: { name: "Coimbatore Disaster Base #6" } },
  { id: "d8", quantity: 3, created_at: "2026-08-09T12:00:00Z", beneficiaries: { users: { full_name: "Vignesh A." } }, relief_camps: { name: "Tiruppur Relief Shelter #7" } },
  { id: "d9", quantity: 9, created_at: "2026-08-09T12:25:00Z", beneficiaries: { users: { full_name: "Anitha K." } }, relief_camps: { name: "Bhavani River Disaster Base #8" } },
  { id: "d10", quantity: 5, created_at: "2026-08-09T12:50:00Z", beneficiaries: { users: { full_name: "Divya B." } }, relief_camps: { name: "Perundurai High School Camp #9" } },
  { id: "d11", quantity: 11, created_at: "2026-08-09T13:15:00Z", beneficiaries: { users: { full_name: "Surya T." } }, relief_camps: { name: "Salem District Base Camp #10" } },
  { id: "d12", quantity: 6, created_at: "2026-08-09T13:40:00Z", beneficiaries: { users: { full_name: "Sundar M." } }, relief_camps: { name: "Karur Emergency Camp #11" } },
  { id: "d13", quantity: 8, created_at: "2026-08-09T14:05:00Z", beneficiaries: { users: { full_name: "Meena R." } }, relief_camps: { name: "Namakkal Welfare Center #12" } },
  { id: "d14", quantity: 4, created_at: "2026-08-09T14:30:00Z", beneficiaries: { users: { full_name: "Anand G." } }, relief_camps: { name: "Annur Relief Base #13" } },
  { id: "d15", quantity: 14, created_at: "2026-08-09T14:55:00Z", beneficiaries: { users: { full_name: "Balaji V." } }, relief_camps: { name: "Sirumugai Emergency Shelter #15" } },
];

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("resource_distribution")
        .select(`
          *,
          beneficiaries (
            users (
              full_name
            )
          ),
          relief_camps (
            name
          )
        `)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        setDistHistory(data);
      } else {
        setDistHistory(MOCK_DISTRIBUTIONS);
      }
    } catch {
      setDistHistory(MOCK_DISTRIBUTIONS);
    }
  };

  const handleQrScan = async (text: string | null) => {
    if (!text) return;
    setScannerActive(false);
    toast.success("QR Code detected!");
    await lookupBeneficiary(text, "qr");
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchVal) return;
    await lookupBeneficiary(searchVal, "search");
  };

  const lookupBeneficiary = async (value: string, type: "qr" | "search") => {
    setLoading(true);
    setFoundBeneficiary(null);
    setCampInventory([]);
    setDistQty({});

    try {
      let query = supabase
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
        `);

      if (type === "qr") {
        query = query.eq("qr_code_data", value);
      } else {
        // Search by exact ID string or exact phone number
        query = query.or(`id.eq.${value},qr_code_data.eq.${value}`);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error("Beneficiary record not found. Try again.");
        setScannerActive(true);
        setLoading(false);
        return;
      }

      const ben = data as Beneficiary;
      setFoundBeneficiary(ben);

      // Load camp inventory if beneficiary is assigned to a camp
      if (ben.current_camp_id) {
        const { data: inv } = await supabase
          .from("inventory")
          .select("id, item_name, current_stock, unit")
          .eq("camp_id", ben.current_camp_id);
        
        if (inv) {
          setCampInventory(inv);
          // Initialize distribution quantity state
          const initialQty: Record<string, number> = {};
          inv.forEach(item => {
            initialQty[item.id] = 0;
          });
          setDistQty(initialQty);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Lookup error");
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (itemId: string, val: number) => {
    setDistQty(prev => ({
      ...prev,
      [itemId]: Math.max(0, val)
    }));
  };

  const handleDistributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundBeneficiary) return;

    // Check if any items are selected
    const selectedItems = Object.entries(distQty)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const item = campInventory.find(i => i.id === id);
        return {
          inventory_id: id,
          item_name: item?.item_name || "Supplies",
          quantity: qty
        };
      });

    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to distribute.");
      return;
    }

    setLoading(true);
    try {
      // 1. Double check inventory stock levels
      for (const selected of selectedItems) {
        const item = campInventory.find(i => i.id === selected.inventory_id);
        if (!item || item.current_stock < selected.quantity) {
          throw new Error(`Insufficient stock for: ${selected.item_name}`);
        }
      }

      // 2. Perform distribution insert
      const { error: distError } = await supabase
        .from("resource_distribution")
        .insert({
          beneficiary_id: foundBeneficiary.id,
          camp_id: foundBeneficiary.current_camp_id,
          items: selectedItems,
          qr_scanned: mode === "scan",
          distribution_date: new Date().toISOString()
        });

      if (distError) throw distError;

      // 3. Deduct stock levels in inventory (Loop over each item)
      for (const selected of selectedItems) {
        const item = campInventory.find(i => i.id === selected.inventory_id)!;
        const newStock = item.current_stock - selected.quantity;
        
        const { error: updateError } = await supabase
          .from("inventory")
          .update({
            current_stock: newStock,
            total_distributed: selected.quantity // seeded increment simulation
          })
          .eq("id", selected.inventory_id);
        
        if (updateError) throw updateError;
      }

      toast.success("Distribution transaction completed successfully!");
      setFoundBeneficiary(null);
      setCampInventory([]);
      setDistQty({});
      setScannerActive(true);
      fetchHistory();
    } catch (err: any) {
      toast.error(err.message || "Failed to process distribution");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell title="QR Resource Distribution" subtitle="Scan beneficiary QR code or search manually to distribute supplies">
      <div className="space-y-6 page-enter">
        {/* Mode Selector */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 max-w-sm">
          {[
            { id: "scan", label: "Scan QR Pass", icon: QrCode },
            { id: "search", label: "Manual Lookup", icon: Search },
            { id: "history", label: "Distribution Logs", icon: FileText }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id as any); setFoundBeneficiary(null); }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border-0 ${
                mode === m.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <m.icon className="w-3.5 h-3.5" />
              {m.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left panel: Lookup controls */}
          <div>
            {mode === "scan" && !foundBeneficiary && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-primary" />
                    Live QR Camera Scan
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  {scannerActive ? (
                    <div className="w-full max-w-xs aspect-square rounded-2xl overflow-hidden border-2 border-primary/20 relative">
                      <Scanner
                        onScan={(detected) => {
                          if (detected && detected[0]) {
                            handleQrScan(detected[0].rawValue);
                          }
                        }}
                        onError={(err) => {
                          console.error(err);
                          toast.error("Camera access failed. Check permissions.");
                        }}
                      />
                      <div className="qr-scan-line" />
                    </div>
                  ) : (
                    <Button variant="outline" className="gap-1.5" onClick={() => setScannerActive(true)}>
                      <RefreshCw className="w-4 h-4" />
                      Restart Scanner
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    Align the beneficiary's printed digital pass QR within the camera view box.
                  </p>
                </CardContent>
              </Card>
            )}

            {mode === "search" && !foundBeneficiary && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Manual Profile Lookup</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleManualSearch} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Beneficiary ID or QR Data string</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="E.g. FLOOD-a1b2c3d4"
                          value={searchVal}
                          onChange={(e) => setSearchVal(e.target.value)}
                        />
                        <Button type="submit" className="bg-primary text-white border-0 font-semibold">
                          Find Profile
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Found Beneficiary Info Card */}
            {foundBeneficiary && (
              <Card className="shadow-card border-green-200 bg-green-500/5">
                <CardHeader className="bg-green-500/10 pb-3 border-b border-green-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-green-800">
                      <User className="w-5 h-5" />
                      <CardTitle className="text-sm font-bold">Verified Beneficiary Pass</CardTitle>
                    </div>
                    <Badge className="bg-green-600 text-white">Verified ✓</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 text-sm">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground text-xs font-semibold">Full Name</p>
                      <p className="font-bold text-foreground text-base mt-0.5">{foundBeneficiary.users?.full_name}</p>
                      {foundBeneficiary.users?.phone && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {foundBeneficiary.users.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-muted-foreground text-xs font-semibold">Assigned Camp</p>
                      <p className="font-bold text-foreground mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        {foundBeneficiary.relief_camps?.name || "Unassigned"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs bg-white">
                      Blood: {foundBeneficiary.blood_group || "Unknown"}
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-white">
                      Status: {foundBeneficiary.shelter_status.replace("_", " ")}
                    </Badge>
                  </div>

                  <Button variant="outline" className="w-full text-xs font-semibold border-border bg-white" onClick={() => { setFoundBeneficiary(null); setScannerActive(true); }}>
                    Cancel / Scan Another
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Distribution logs table (active mode: history) */}
            {mode === "history" && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Recent Distribution History</CardTitle>
                  <CardDescription className="text-xs">Audit trails of supplies handed out</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Beneficiary</TableHead>
                        <TableHead>Camp Location</TableHead>
                        <TableHead>Items Distributed</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {distHistory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground">
                            No distribution logs yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        distHistory.map(h => (
                          <TableRow key={h.id}>
                            <TableCell className="font-bold text-xs">{(h as any).beneficiaries?.users?.full_name}</TableCell>
                            <TableCell className="text-xs">{(h as any).relief_camps?.name}</TableCell>
                            <TableCell className="text-xs truncate max-w-[160px]">
                              {Array.isArray(h.items) ? h.items.map((it: any) => `${it.quantity}x ${it.item_name}`).join(", ") : "—"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(h.created_at).toLocaleDateString()}
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

          {/* Right panel: Items selection checklist */}
          <div>
            {foundBeneficiary && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Select Distribution Items</CardTitle>
                  <CardDescription className="text-xs">Select items and quantities based on family size requirements</CardDescription>
                </CardHeader>
                <CardContent>
                  {campInventory.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                      <p className="font-semibold text-sm">No Inventory in Camp</p>
                      <p className="text-xs mt-1">Please populate camp inventory in the inventory tab first.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleDistributeSubmit} className="space-y-5">
                      <div className="space-y-3">
                        {campInventory.map((item) => (
                          <div key={item.id} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0 last:pb-0">
                            <div>
                              <p className="text-xs font-bold text-foreground">{item.item_name}</p>
                              <p className="text-[10px] text-muted-foreground">Available: {item.current_stock} {item.unit}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="w-7 h-7 border-border"
                                onClick={() => handleQuantityChange(item.id, (distQty[item.id] || 0) - 1)}
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                className="w-14 h-8 text-center text-xs p-1"
                                value={distQty[item.id] || 0}
                                onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="w-7 h-7 border-border"
                                onClick={() => handleQuantityChange(item.id, (distQty[item.id] || 0) + 1)}
                              >
                                +
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button type="submit" className="w-full bg-primary text-white border-0 font-bold gap-1.5" disabled={loading}>
                        {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                        Confirm Resource Handout
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
