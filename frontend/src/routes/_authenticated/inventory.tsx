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

const MOCK_CAMPS: Camp[] = [
  { id: 'camp-1', name: 'Sathyamangalam Primary Relief Shelter' },
  { id: 'camp-2', name: 'Erode Govt Higher Secondary School' },
  { id: 'camp-3', name: 'Bhavani Community Relief Hall' },
  { id: 'camp-4', name: 'Gobichettipalayam Indoor Stadium' },
  { id: 'camp-5', name: 'Anthiyur Panchayat Community Center' },
];

  const fetchCamps = async () => {
    try {
      const { data, error } = await supabase.from("relief_camps").select("id, name");
      if (!error && data && data.length > 0) {
        setCamps(data);
        setSelectedCampId(data[0].id);
      } else {
        setCamps(MOCK_CAMPS);
        setSelectedCampId(MOCK_CAMPS[0].id);
      }
    } catch {
      setCamps(MOCK_CAMPS);
      setSelectedCampId(MOCK_CAMPS[0].id);
    }
  };

const MOCK_INVENTORY: InventoryItem[] = [
  // camp-1
  { id: 'i1', camp_id: 'camp-1', item_name: 'Rice Bags (25kg)', category: 'food', unit: 'bags', total_received: 500, total_distributed: 400, current_stock: 100, min_threshold: 150 },
  { id: 'i2', camp_id: 'camp-1', item_name: 'First Aid Kits', category: 'medical', unit: 'kits', total_received: 200, total_distributed: 100, current_stock: 100, min_threshold: 50 },
  { id: 'i3', camp_id: 'camp-1', item_name: 'Tarpaulin Sheets', category: 'shelter', unit: 'sheets', total_received: 300, total_distributed: 290, current_stock: 10, min_threshold: 30 },
  { id: 'i4', camp_id: 'camp-1', item_name: "Women's Sarees", category: 'clothing', unit: 'pieces', total_received: 250, total_distributed: 200, current_stock: 50, min_threshold: 40 },
  { id: 'i5', camp_id: 'camp-1', item_name: 'Sanitary Pads', category: 'hygiene', unit: 'packets', total_received: 400, total_distributed: 350, current_stock: 50, min_threshold: 100 },
  
  // camp-2
  { id: 'i6', camp_id: 'camp-2', item_name: 'Dal Packets', category: 'food', unit: 'packets', total_received: 300, total_distributed: 250, current_stock: 50, min_threshold: 100 },
  { id: 'i7', camp_id: 'camp-2', item_name: 'Paracetamol Strips', category: 'medical', unit: 'strips', total_received: 500, total_distributed: 400, current_stock: 100, min_threshold: 50 },
  { id: 'i8', camp_id: 'camp-2', item_name: 'Blankets', category: 'shelter', unit: 'pieces', total_received: 400, total_distributed: 380, current_stock: 20, min_threshold: 50 },
  { id: 'i9', camp_id: 'camp-2', item_name: "Men's Shirts", category: 'clothing', unit: 'pieces', total_received: 200, total_distributed: 150, current_stock: 50, min_threshold: 30 },
  { id: 'i10', camp_id: 'camp-2', item_name: 'Soap Bars', category: 'hygiene', unit: 'bars', total_received: 500, total_distributed: 300, current_stock: 200, min_threshold: 50 },

  // camp-3
  { id: 'i11', camp_id: 'camp-3', item_name: 'Ready-to-Eat Meals', category: 'food', unit: 'packets', total_received: 500, total_distributed: 450, current_stock: 50, min_threshold: 100 },
  { id: 'i12', camp_id: 'camp-3', item_name: 'ORS Packets', category: 'medical', unit: 'packets', total_received: 400, total_distributed: 200, current_stock: 200, min_threshold: 100 },
  { id: 'i13', camp_id: 'camp-3', item_name: 'Sleeping Mats', category: 'shelter', unit: 'pieces', total_received: 300, total_distributed: 280, current_stock: 20, min_threshold: 50 },
  { id: 'i14', camp_id: 'camp-3', item_name: 'Children\'s Clothing Sets', category: 'clothing', unit: 'sets', total_received: 150, total_distributed: 130, current_stock: 20, min_threshold: 30 },
  { id: 'i15', camp_id: 'camp-3', item_name: 'Toothbrush Sets', category: 'hygiene', unit: 'sets', total_received: 300, total_distributed: 150, current_stock: 150, min_threshold: 50 },

  // camp-4
  { id: 'i16', camp_id: 'camp-4', item_name: 'Biscuit Tins', category: 'food', unit: 'tins', total_received: 400, total_distributed: 300, current_stock: 100, min_threshold: 50 },
  { id: 'i17', camp_id: 'camp-4', item_name: 'Insulin Kits', category: 'medical', unit: 'kits', total_received: 50, total_distributed: 40, current_stock: 10, min_threshold: 20 },
  { id: 'i18', camp_id: 'camp-4', item_name: 'Mosquito Nets', category: 'shelter', unit: 'pieces', total_received: 350, total_distributed: 300, current_stock: 50, min_threshold: 100 },
  { id: 'i19', camp_id: 'camp-4', item_name: 'Towels', category: 'clothing', unit: 'pieces', total_received: 300, total_distributed: 100, current_stock: 200, min_threshold: 50 },
  { id: 'i20', camp_id: 'camp-4', item_name: 'Detergent Powder', category: 'hygiene', unit: 'packets', total_received: 200, total_distributed: 180, current_stock: 20, min_threshold: 50 },

  // camp-5
  { id: 'i21', camp_id: 'camp-5', item_name: 'Milk Powder', category: 'food', unit: 'tins', total_received: 150, total_distributed: 140, current_stock: 10, min_threshold: 30 },
  { id: 'i22', camp_id: 'camp-5', item_name: 'Bandages (rolls)', category: 'medical', unit: 'rolls', total_received: 300, total_distributed: 100, current_stock: 200, min_threshold: 50 },
  { id: 'i23', camp_id: 'camp-5', item_name: 'Plastic Buckets', category: 'shelter', unit: 'pieces', total_received: 250, total_distributed: 230, current_stock: 20, min_threshold: 40 },
  { id: 'i24', camp_id: 'camp-5', item_name: 'Drinking Water (1L bottles)', category: 'food', unit: 'bottles', total_received: 500, total_distributed: 450, current_stock: 50, min_threshold: 100 },
  { id: 'i25', camp_id: 'camp-5', item_name: 'Antiseptic (bottles)', category: 'medical', unit: 'bottles', total_received: 100, total_distributed: 50, current_stock: 50, min_threshold: 20 },
  { id: 'i26', camp_id: 'camp-5', item_name: 'Cooking Oil (5L)', category: 'food', unit: 'tins', total_received: 150, total_distributed: 100, current_stock: 50, min_threshold: 30 },
  { id: 'i27', camp_id: 'camp-5', item_name: 'Sugar (1kg)', category: 'food', unit: 'packets', total_received: 300, total_distributed: 200, current_stock: 100, min_threshold: 50 },
  { id: 'i28', camp_id: 'camp-5', item_name: 'Masks (box of 50)', category: 'medical', unit: 'boxes', total_received: 200, total_distributed: 100, current_stock: 100, min_threshold: 50 },
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
        setItems(MOCK_INVENTORY.filter(i => i.camp_id === selectedCampId));
      }
    } catch {
      setItems(MOCK_INVENTORY.filter(i => i.camp_id === selectedCampId));
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
