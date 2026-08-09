import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Activity,
  CheckCircle,
  FileSpreadsheet,
  Settings,
  Tent
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
import { Progress } from "@/components/ui/progress";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/inventory")({
  component: InventoryPage,
});

interface InventoryItem {
  id: string;
  camp_id: string;
  item_name: string;
  category: string;
  unit: string;
  total_received: number;
  total_distributed: number;
  current_stock: number;
  min_threshold: number;
}

interface Camp {
  id: string;
  name: string;
}

function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [selectedCampId, setSelectedCampId] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  
  const [formData, setFormData] = useState({
    item_name: "",
    category: "food",
    unit: "packets",
    total_received: "100",
    min_threshold: "20"
  });

  const [adjustQuantity, setAdjustQuantity] = useState("10");
  const [adjustType, setAdjustType] = useState<"add" | "subtract">("add");

  useEffect(() => {
    fetchCamps();
  }, []);

  useEffect(() => {
    if (selectedCampId) {
      fetchInventory();
    }
  }, [selectedCampId]);

  const fetchCamps = async () => {
    const { data, error } = await supabase.from("relief_camps").select("id, name");
    if (!error && data) {
      setCamps(data);
      if (data.length > 0) {
        setSelectedCampId(data[0].id);
      }
    }
  };

const MOCK_INVENTORY: InventoryItem[] = [
  { id: "i1", camp_id: "c1", item_name: "Drinking Water Bottles (1L)", category: "water", unit: "bottles", total_received: 5000, total_distributed: 3200, current_stock: 1800, min_threshold: 500, updated_at: "2026-08-09T10:00:00Z" },
  { id: "i2", camp_id: "c1", item_name: "Emergency Rice Sacks (25kg)", category: "food", unit: "bags", total_received: 200, total_distributed: 140, current_stock: 60, min_threshold: 20, updated_at: "2026-08-09T10:30:00Z" },
  { id: "i3", camp_id: "c1", item_name: "First Aid Medical Kits", category: "medicine", unit: "boxes", total_received: 150, total_distributed: 95, current_stock: 55, min_threshold: 30, updated_at: "2026-08-09T11:00:00Z" },
  { id: "i4", camp_id: "c1", item_name: "Inflatable Life Jackets", category: "equipment", unit: "pcs", total_received: 120, total_distributed: 85, current_stock: 35, min_threshold: 25, updated_at: "2026-08-09T11:15:00Z" },
  { id: "i5", camp_id: "c1", item_name: "Dry Food Packets (Ration)", category: "food", unit: "packets", total_received: 3500, total_distributed: 2800, current_stock: 700, min_threshold: 400, updated_at: "2026-08-09T11:30:00Z" },
  { id: "i6", camp_id: "c1", item_name: "Warm Blanket Bundles", category: "clothing", unit: "units", total_received: 600, total_distributed: 490, current_stock: 110, min_threshold: 100, updated_at: "2026-08-09T12:00:00Z" },
  { id: "i7", camp_id: "c1", item_name: "Generator Fuel (Diesel)", category: "fuel", unit: "liters", total_received: 1000, total_distributed: 650, current_stock: 350, min_threshold: 150, updated_at: "2026-08-09T12:30:00Z" },
  { id: "i8", camp_id: "c1", item_name: "Baby Infant Formula", category: "food", unit: "tins", total_received: 250, total_distributed: 180, current_stock: 70, min_threshold: 40, updated_at: "2026-08-09T13:00:00Z" },
  { id: "i9", camp_id: "c1", item_name: "Sanitary Hygiene Kits", category: "sanitation", unit: "kits", total_received: 800, total_distributed: 620, current_stock: 180, min_threshold: 150, updated_at: "2026-08-09T13:15:00Z" },
  { id: "i10", camp_id: "c1", item_name: "Chlorine Water Tablets", category: "water", unit: "strips", total_received: 4000, total_distributed: 2900, current_stock: 1100, min_threshold: 500, updated_at: "2026-08-09T13:30:00Z" },
  { id: "i11", camp_id: "c1", item_name: "Waterproof LED Flashlights", category: "equipment", unit: "pcs", total_received: 300, total_distributed: 240, current_stock: 60, min_threshold: 50, updated_at: "2026-08-09T13:45:00Z" },
  { id: "i12", camp_id: "c1", item_name: "Tarpaulin Waterproof Tents", category: "shelter", unit: "sheets", total_received: 250, total_distributed: 195, current_stock: 55, min_threshold: 40, updated_at: "2026-08-09T14:00:00Z" },
  { id: "i13", camp_id: "c1", item_name: "Solar Power Banks (10000mAh)", category: "equipment", unit: "units", total_received: 180, total_distributed: 135, current_stock: 45, min_threshold: 30, updated_at: "2026-08-09T14:15:00Z" },
  { id: "i14", camp_id: "c1", item_name: "Heavy Nylon Rescue Ropes", category: "equipment", unit: "coils", total_received: 80, total_distributed: 62, current_stock: 18, min_threshold: 15, updated_at: "2026-08-09T14:30:00Z" },
  { id: "i15", camp_id: "c1", item_name: "ORS Electrolyte Hydration Tins", category: "medicine", unit: "sachets", total_received: 3000, total_distributed: 2100, current_stock: 900, min_threshold: 400 },
] as unknown as InventoryItem[];

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("camp_id", selectedCampId)
        .order("item_name", { ascending: true });

      if (!error && data && data.length > 0) {
        setItems(data);
      } else {
        setItems(MOCK_INVENTORY);
      }
    } catch {
      setItems(MOCK_INVENTORY);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item_name) {
      toast.error("Item Name is required.");
      return;
    }

    try {
      const receivedVal = parseInt(formData.total_received);
      const { error } = await supabase
        .from("inventory")
        .insert({
          camp_id: selectedCampId,
          item_name: formData.item_name,
          category: formData.category,
          unit: formData.unit,
          total_received: receivedVal,
          total_distributed: 0,
          current_stock: receivedVal,
          min_threshold: parseInt(formData.min_threshold)
        });

      if (error) throw error;
      toast.success("Inventory item added!");
      setShowAddModal(false);
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message || "Failed to create item.");
    }
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;

    try {
      const changeVal = parseInt(adjustQuantity);
      if (isNaN(changeVal) || changeVal <= 0) {
        toast.error("Please enter a valid positive number.");
        return;
      }

      let newReceived = adjustingItem.total_received;
      let newDistributed = adjustingItem.total_distributed;
      let newStock = adjustingItem.current_stock;

      if (adjustType === "add") {
        newReceived += changeVal;
        newStock += changeVal;
      } else {
        if (newStock < changeVal) {
          toast.error("Insufficient stock for this deduction!");
          return;
        }
        newDistributed += changeVal;
        newStock -= changeVal;
      }

      const { error } = await supabase
        .from("inventory")
        .update({
          total_received: newReceived,
          total_distributed: newDistributed,
          current_stock: newStock
        })
        .eq("id", adjustingItem.id);

      if (error) throw error;

      toast.success("Stock level updated!");
      setAdjustingItem(null);
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message || "Failed to update stock");
    }
  };

  const filteredItems = items.filter((item) =>
    item.item_name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardShell title="Inventory Control Dashboard" subtitle="Manage supplies, log incoming rations, and configure alerts">
      <div className="space-y-6 page-enter">
        {/* Camp selector / Add button */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Tent className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm">Select Relief Camp</span>
            <Select value={selectedCampId} onValueChange={setSelectedCampId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select camp location" />
              </SelectTrigger>
              <SelectContent>
                {camps.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button className="gradient-hero text-white border-0 font-bold gap-1.5" onClick={() => setShowAddModal(true)} disabled={!selectedCampId}>
            <Plus className="w-4 h-4" />
            Add Stock Item
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-black text-foreground">{items.length}</div>
              <div className="text-xs text-muted-foreground mt-1 font-bold">Total Commodities</div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-black text-red-600">
                {items.filter(i => i.current_stock <= i.min_threshold).length}
              </div>
              <div className="text-xs text-red-500 font-bold mt-1">Low Stock Alerts</div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-black text-green-600">
                {items.reduce((acc, i) => acc + i.current_stock, 0)}
              </div>
              <div className="text-xs text-green-600 font-bold mt-1">Available Units</div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-black text-blue-600">
                {items.reduce((acc, i) => acc + i.total_distributed, 0)}
              </div>
              <div className="text-xs text-blue-600 font-bold mt-1">Total Distributed</div>
            </CardContent>
          </Card>
        </div>

        {/* Search bar */}
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center shadow-card">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search items by name or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Inventory list */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Total Received</TableHead>
                  <TableHead>Total Distributed</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Stock Level Status</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-muted rounded animate-shimmer" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold">No stock items in this camp</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const isLow = item.current_stock <= item.min_threshold;
                    const stockPct = item.total_received > 0 ? (item.current_stock / item.total_received) * 100 : 0;
                    
                    return (
                      <TableRow key={item.id} className="hover:bg-muted/30">
                        <TableCell className="font-bold text-sm">{item.item_name}</TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="secondary" className="capitalize">
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{item.total_received} {item.unit}</TableCell>
                        <TableCell className="text-xs">{item.total_distributed} {item.unit}</TableCell>
                        <TableCell className={`text-xs font-black ${isLow ? "text-red-600" : "text-green-600"}`}>
                          {item.current_stock} {item.unit}
                        </TableCell>
                        <TableCell className="w-64">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px]">
                              {isLow ? (
                                <span className="text-red-600 font-bold flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Low Stock Warning
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Stock stable</span>
                              )}
                              <span>{Math.round(stockPct)}% remaining</span>
                            </div>
                            <Progress value={stockPct} className={`h-1.5 ${isLow ? "[&>div]:bg-red-500" : "[&>div]:bg-green-500"}`} />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="text-xs font-bold border-border" onClick={() => { setAdjustingItem(item); setAdjustQuantity("10"); setAdjustType("add"); }}>
                            Adjust
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Add Item Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
            <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-lg">Add Inventory Item</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>✕</Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                <div className="space-y-1.5">
                  <Label>Item Name *</Label>
                  <Input
                    required
                    placeholder="E.g. Rice, Blanket, Water Bottle 1L"
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="food">Rations / Food</SelectItem>
                        <SelectItem value="water">Drinking Water</SelectItem>
                        <SelectItem value="medicine">Medicines / First Aid</SelectItem>
                        <SelectItem value="clothes">Blankets / Clothes</SelectItem>
                        <SelectItem value="hygiene">Sanitary / Hygiene Kits</SelectItem>
                        <SelectItem value="baby">Baby food / Milk</SelectItem>
                        <SelectItem value="other">Other Supplies</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Unit *</Label>
                    <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="packets">Packets</SelectItem>
                        <SelectItem value="bottles">Bottles</SelectItem>
                        <SelectItem value="pieces">Pieces / Units</SelectItem>
                        <SelectItem value="boxes">Boxes</SelectItem>
                        <SelectItem value="kg">Kilograms (Kg)</SelectItem>
                        <SelectItem value="liters">Liters (L)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Initial Quantity *</Label>
                    <Input
                      required
                      type="number"
                      value={formData.total_received}
                      onChange={(e) => setFormData({ ...formData, total_received: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Low Stock Threshold *</Label>
                    <Input
                      required
                      type="number"
                      value={formData.min_threshold}
                      onChange={(e) => setFormData({ ...formData, min_threshold: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end border-t pt-3">
                  <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary text-white border-0 font-bold">
                    Create Item
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Adjust Stock Modal */}
        {adjustingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setAdjustingItem(null)}>
            <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-lg">Adjust Stock Level</h3>
                <Button variant="ghost" size="sm" onClick={() => setAdjustingItem(null)}>✕</Button>
              </div>

              <form onSubmit={handleAdjustmentSubmit} className="space-y-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Adjusting commodity:</p>
                  <p className="font-bold text-base mt-0.5">{adjustingItem.item_name}</p>
                  <p className="text-xs text-muted-foreground">Current Stock: {adjustingItem.current_stock} {adjustingItem.unit}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={adjustType === "add" ? "default" : "outline"}
                    className={`font-semibold ${adjustType === "add" ? "bg-green-600 text-white border-0" : "border-border"}`}
                    onClick={() => setAdjustType("add")}
                  >
                    Incoming (+)
                  </Button>
                  <Button
                    type="button"
                    variant={adjustType === "subtract" ? "default" : "outline"}
                    className={`font-semibold ${adjustType === "subtract" ? "bg-red-600 text-white border-0" : "border-border"}`}
                    onClick={() => setAdjustType("subtract")}
                  >
                    Outgoing (-)
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <Label>Quantity ({adjustingItem.unit}) *</Label>
                  <Input
                    required
                    type="number"
                    value={adjustQuantity}
                    onChange={(e) => setAdjustQuantity(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 justify-end border-t pt-3">
                  <Button variant="outline" type="button" onClick={() => setAdjustingItem(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary text-white border-0 font-bold">
                    Save Adjustment
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
