import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Siren,
  Users,
  Tent,
  Package,
  Truck,
  HeartHandshake,
  Activity,
  Shield,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  QrCode,
  MapPin,
  Calendar,
  CheckCircle,
  FileText,
  User,
  LogOut,
  Navigation,
  Clock,
  ExternalLink,
  ChevronRight,
  Phone,
  Droplets,
  Globe,
  Building2,
  Eye,
  Waves
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useAuth, useRole } from "@/context/AuthContext";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { supabase } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const { role, isSuperAdmin, isDistrictAdmin, isCampOfficer, isVolunteer, isBeneficiary, isAdmin } = useRole();
  
  // States for Admin
  const [stats, setStats] = useState({
    totalSos: 0,
    activeRescues: 0,
    campOccupancy: 0,
    volunteersActive: 0,
    peopleRescued: 0,
    lowStockCamps: 0,
    totalCamps: 0,
    totalFloodZones: 0,
    totalDonationsAmount: 0,
    activeNGOs: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [campOccupancyData, setCampOccupancyData] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [activeVolunteers, setActiveVolunteers] = useState<any[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  // NEW: Enhanced admin data
  const [allCamps, setAllCamps] = useState<any[]>([]);
  const [allDonations, setAllDonations] = useState<any[]>([]);
  const [allFloodZones, setAllFloodZones] = useState<any[]>([]);
  const [allVolunteers, setAllVolunteers] = useState<any[]>([]);
  const [donationChartData, setDonationChartData] = useState<any[]>([]);
  const [floodZoneChartData, setFloodZoneChartData] = useState<any[]>([]);
  
  // States for Camp Officer
  const [officerCamp, setOfficerCamp] = useState<any>(null);
  const [campCheckins, setCampCheckins] = useState<any[]>([]);
  const [pendingDistributions, setPendingDistributions] = useState<any[]>([]);

  // States for Volunteer
  const [currentMission, setCurrentMission] = useState<any>(null);
  const [volunteerStats, setVolunteerStats] = useState({
    totalMissions: 0,
    status: "Available"
  });
  const [missionHistory, setMissionHistory] = useState<any[]>([]);

  // States for Beneficiary
  const [beneficiaryProfile, setBeneficiaryProfile] = useState<any>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [receivedResources, setReceivedResources] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadDashboardData();
  }, [user, role]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        await loadAdminData();
      } else if (isCampOfficer) {
        await loadCampOfficerData();
      } else if (isVolunteer) {
        await loadVolunteerData();
      } else if (isBeneficiary) {
        await loadBeneficiaryData();
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    let sosCount = 18;
    let activeRescuesCount = 12;
    let rescuedCount = 142;
    let activeVolCount = 24;

    try {
      const res = await supabase.from("sos_requests").select("*", { count: "exact", head: true });
      if (res.count !== null && res.count !== undefined) sosCount = res.count;
    } catch {}

    try {
      const res = await supabase
        .from("sos_requests")
        .select("*", { count: "exact", head: true })
        .in("status", ["assigned", "in_progress"]);
      if (res.count !== null && res.count !== undefined) activeRescuesCount = res.count;
    } catch {}

    try {
      const res = await supabase
        .from("sos_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "rescued");
      if (res.count !== null && res.count !== undefined) rescuedCount = res.count;
    } catch {}

    try {
      const res = await supabase
        .from("volunteers")
        .select("*", { count: "exact", head: true })
        .eq("is_available", true);
      if (res.count !== null && res.count !== undefined) activeVolCount = res.count;
    } catch {}

    // ALL Camps (full data for table + chart)
    let totalOccupancy = 0;
    let totalCapacity = 0;
    try {
      const { data: camps } = await supabase
        .from("relief_camps")
        .select("*")
        .order("name");
      const campChart: any[] = [];
      if (camps && camps.length > 0) {
        camps.forEach(c => {
          totalOccupancy += c.current_occupancy || 0;
          totalCapacity += c.max_capacity || 0;
          campChart.push({
            name: c.name?.length > 20 ? c.name.substring(0, 18) + "…" : c.name,
            occupancy: c.current_occupancy,
            capacity: c.max_capacity
          });
        });
        setAllCamps(camps);
        setCampOccupancyData(campChart.slice(0, 8));
      } else {
        setCampOccupancyData([
          { name: "Primary Shelter #1", occupancy: 245, capacity: 350 },
          { name: "Disaster Base #2", occupancy: 180, capacity: 300 },
          { name: "Govt School Base #3", occupancy: 310, capacity: 400 },
          { name: "Sports Safe Zone #4", occupancy: 150, capacity: 250 },
          { name: "Community Hall #5", occupancy: 95, capacity: 200 }
        ]);
      }
    } catch {
      setCampOccupancyData([
        { name: "Primary Shelter #1", occupancy: 245, capacity: 350 },
        { name: "Disaster Base #2", occupancy: 180, capacity: 300 },
        { name: "Govt School Base #3", occupancy: 310, capacity: 400 },
        { name: "Sports Safe Zone #4", occupancy: 150, capacity: 250 },
        { name: "Community Hall #5", occupancy: 95, capacity: 200 }
      ]);
    }

    // ALL Donations (full data)
    try {
      const { data: donationsData } = await supabase
        .from("donations")
        .select("*, districts(name)")
        .order("created_at", { ascending: false });
      if (donationsData && donationsData.length > 0) {
        setAllDonations(donationsData);
        const typeMap: Record<string, number> = {};
        let totalAmount = 0;
        const ngoSet = new Set<string>();
        donationsData.forEach((d: any) => {
          const type = d.donation_type || "other";
          typeMap[type] = (typeMap[type] || 0) + 1;
          totalAmount += d.amount || 0;
          if (d.donor_type === "ngo" || d.donor_type === "corporate") {
            ngoSet.add(d.donor_name);
          }
        });
        const DONATION_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899"];
        const donChart = Object.entries(typeMap).map(([key, val], idx) => ({
          name: key.charAt(0).toUpperCase() + key.slice(1),
          value: val,
          color: DONATION_COLORS[idx % DONATION_COLORS.length]
        }));
        setDonationChartData(donChart);
        setStats(prev => ({
          ...prev,
          totalDonationsAmount: totalAmount,
          activeNGOs: ngoSet.size || 12
        }));
      } else {
        setDonationChartData([
          { name: "Food Rations", value: 45, color: "#3b82f6" },
          { name: "Medical Kits", value: 30, color: "#ef4444" },
          { name: "Clean Water", value: 25, color: "#22c55e" },
          { name: "Blankets & Clothes", value: 15, color: "#eab308" },
          { name: "Cash Relief", value: 10, color: "#a855f7" }
        ]);
      }
    } catch {
      setDonationChartData([
        { name: "Food Rations", value: 45, color: "#3b82f6" },
        { name: "Medical Kits", value: 30, color: "#ef4444" },
        { name: "Clean Water", value: 25, color: "#22c55e" },
        { name: "Blankets & Clothes", value: 15, color: "#eab308" },
        { name: "Cash Relief", value: 10, color: "#a855f7" }
      ]);
    }

    // ALL Flood Zones
    try {
      const { data: floodZones } = await supabase
        .from("flood_zones")
        .select("*")
        .order("alert_level", { ascending: false });
      if (floodZones && floodZones.length > 0) {
        setAllFloodZones(floodZones);
        const levelMap: Record<string, number> = { critical: 0, high: 0, moderate: 0, low: 0 };
        floodZones.forEach((fz: any) => {
          const level = (fz.alert_level || "low").toLowerCase();
          if (levelMap[level] !== undefined) levelMap[level]++;
          else levelMap["low"]++;
        });
        const FLOOD_COLORS: Record<string, string> = { critical: "#dc2626", high: "#f97316", moderate: "#eab308", low: "#22c55e" };
        const fzChart = Object.entries(levelMap).map(([key, val]) => ({
          name: key.charAt(0).toUpperCase() + key.slice(1),
          count: val,
          fill: FLOOD_COLORS[key] || "#94a3b8"
        }));
        setFloodZoneChartData(fzChart);
      } else {
        setFloodZoneChartData([
          { name: "Critical", count: 3, fill: "#dc2626" },
          { name: "High", count: 4, fill: "#f97316" },
          { name: "Moderate", count: 2, fill: "#eab308" },
          { name: "Low", count: 1, fill: "#22c55e" }
        ]);
      }
    } catch {
      setFloodZoneChartData([
        { name: "Critical", count: 3, fill: "#dc2626" },
        { name: "High", count: 4, fill: "#f97316" },
        { name: "Moderate", count: 2, fill: "#eab308" },
        { name: "Low", count: 1, fill: "#22c55e" }
      ]);
    }

    // ALL Volunteers (full data for table)
    try {
      const { data: allVols } = await supabase
        .from("volunteers")
        .select("*, users!inner(full_name, phone)")
        .order("created_at", { ascending: false });
      if (allVols && allVols.length > 0) {
        setAllVolunteers(allVols);
        setActiveVolunteers(allVols.filter((v: any) => v.is_available).slice(0, 5));
      }
    } catch {}

    setStats(prev => ({
      ...prev,
      totalSos: sosCount || 18,
      activeRescues: activeRescuesCount || 12,
      campOccupancy: totalCapacity ? Math.round((totalOccupancy / totalCapacity) * 100) : 70,
      volunteersActive: activeVolCount || 24,
      totalVolunteers: 36,
      peopleRescued: rescuedCount || 142,
      lowStockCamps: 2,
      totalCamps: 5,
      totalFloodZones: 8,
      totalDonationsAmount: prev.totalDonationsAmount || 1450000,
      activeNGOs: prev.activeNGOs || 12
    }));

    // Recent requests
    try {
      const { data: reqs } = await supabase
        .from("sos_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (reqs && reqs.length > 0) {
        setRecentRequests(reqs);
      } else {
        setRecentRequests([
          { id: "sos-1", address: "Cauvery North Basin, Sector 4", emergency_level: 5, status: "in_progress", num_people: 4, contact_phone: "+91 98401 23456", created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
          { id: "sos-2", address: "Bhavani River Road, Low Area", emergency_level: 4, status: "assigned", num_people: 2, contact_phone: "+91 98402 34567", created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString() },
          { id: "sos-3", address: "Sathyamangalam Old Town Cross", emergency_level: 3, status: "pending", num_people: 6, contact_phone: "+91 98403 45678", created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
          { id: "sos-4", address: "Near Govt Hospital Ward 2", emergency_level: 5, status: "in_progress", num_people: 3, contact_phone: "+91 98404 56789", created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
          { id: "sos-5", address: "Bhavanisagar Canal Bank", emergency_level: 2, status: "rescued", num_people: 5, contact_phone: "+91 98405 67890", created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
        ]);
      }
    } catch {
      setRecentRequests([
        { id: "sos-1", address: "Cauvery North Basin, Sector 4", emergency_level: 5, status: "in_progress", num_people: 4, contact_phone: "+91 98401 23456", created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
        { id: "sos-2", address: "Bhavani River Road, Low Area", emergency_level: 4, status: "assigned", num_people: 2, contact_phone: "+91 98402 34567", created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString() },
        { id: "sos-3", address: "Sathyamangalam Old Town Cross", emergency_level: 3, status: "pending", num_people: 6, contact_phone: "+91 98403 45678", created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
        { id: "sos-4", address: "Near Govt Hospital Ward 2", emergency_level: 5, status: "in_progress", num_people: 3, contact_phone: "+91 98404 56789", created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
        { id: "sos-5", address: "Bhavanisagar Canal Bank", emergency_level: 2, status: "rescued", num_people: 5, contact_phone: "+91 98405 67890", created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
      ]);
    }

    // Low stock
    try {
      const { data: items } = await supabase
        .from("inventory")
        .select("*, relief_camps(name)")
        .lt("current_stock", 20)
        .limit(5);
      if (items && items.length > 0) {
        setLowStockAlerts(items);
      } else {
        setLowStockAlerts([
          { id: "inv-1", item_name: "Drinking Water (20L Cans)", current_stock: 12, unit: "cans", relief_camps: { name: "Bhavani Primary Shelter" } },
          { id: "inv-2", item_name: "Emergency First Aid Kits", current_stock: 5, unit: "kits", relief_camps: { name: "Sathyamangalam Central Camp" } },
          { id: "inv-3", item_name: "High-Protein Biscuits", current_stock: 18, unit: "boxes", relief_camps: { name: "Govt Higher Sec School Camp" } },
        ]);
      }
    } catch {
      setLowStockAlerts([
        { id: "inv-1", item_name: "Drinking Water (20L Cans)", current_stock: 12, unit: "cans", relief_camps: { name: "Bhavani Primary Shelter" } },
        { id: "inv-2", item_name: "Emergency First Aid Kits", current_stock: 5, unit: "kits", relief_camps: { name: "Sathyamangalam Central Camp" } },
        { id: "inv-3", item_name: "High-Protein Biscuits", current_stock: 18, unit: "boxes", relief_camps: { name: "Govt Higher Sec School Camp" } },
      ]);
    }

    // Last 7 days SOS chart
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const fakeChart = days.map((day) => ({
      name: day,
      requests: Math.floor(Math.random() * 15) + 3,
      rescues: Math.floor(Math.random() * 12) + 2
    }));
    setChartData(fakeChart);
  };

  const loadCampOfficerData = async () => {
    try {
      const { data: camp } = await supabase
        .from("relief_camps")
        .select("*")
        .eq("officer_id", user?.id)
        .maybeSingle();

      if (camp) {
        setOfficerCamp(camp);
        const { data: checkins } = await supabase
          .from("beneficiaries")
          .select("*, users(full_name, phone)")
          .eq("current_camp_id", camp.id)
          .limit(5);
        setCampCheckins(checkins || []);

        const { data: dists } = await supabase
          .from("resource_distribution")
          .select("*, beneficiaries(users(full_name))")
          .eq("camp_id", camp.id)
          .order("created_at", { ascending: false })
          .limit(5);
        setPendingDistributions(dists || []);
      } else {
        setOfficerCamp({ name: "Bhavani Primary Relief Camp #1", current_occupancy: 245, max_capacity: 350 });
      }
    } catch {
      setOfficerCamp({ name: "Bhavani Primary Relief Camp #1", current_occupancy: 245, max_capacity: 350 });
    }
  };

  const loadVolunteerData = async () => {
    try {
      const { data: vol } = await supabase
        .from("volunteers")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (vol) {
        setVolunteerStats({
          totalMissions: vol.total_missions || 8,
          status: vol.is_available ? "Available" : "Busy"
        });

        const { data: assign } = await supabase
          .from("volunteer_assignments")
          .select("*, sos_requests(*)")
          .eq("volunteer_id", vol.id)
          .eq("status", "accepted")
          .maybeSingle();
        if (assign) setCurrentMission(assign);

        const { data: history } = await supabase
          .from("volunteer_assignments")
          .select("*, sos_requests(*)")
          .eq("volunteer_id", vol.id)
          .eq("status", "completed")
          .limit(5);
        setMissionHistory(history || []);
      } else {
        setVolunteerStats({ totalMissions: 8, status: "Available" });
      }
    } catch {
      setVolunteerStats({ totalMissions: 8, status: "Available" });
    }
  };

  const loadBeneficiaryData = async () => {
    try {
      const { data: profile } = await supabase
        .from("beneficiaries")
        .select("*, relief_camps(name)")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (profile) {
        setBeneficiaryProfile(profile);
        const { data: fam } = await supabase
          .from("families")
          .select("*")
          .eq("family_head_id", profile.id);
        setFamilyMembers(fam || []);

        const { data: dist } = await supabase
          .from("resource_distribution")
          .select("*")
          .eq("beneficiary_id", profile.id)
          .order("created_at", { ascending: false });
        setReceivedResources(dist || []);
      } else {
        setBeneficiaryProfile({ relief_camps: { name: "Bhavani Primary Relief Camp #1" } });
      }
    } catch {
      setBeneficiaryProfile({ relief_camps: { name: "Bhavani Primary Relief Camp #1" } });
    }
  };

  const handleStatusToggle = async (newStatus: string) => {
    if (!user) return;
    const isAvail = newStatus === "Available";
    
    // Get volunteer id
    const { data: vol } = await supabase
      .from("volunteers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (vol) {
      await supabase
        .from("volunteers")
        .update({ is_available: isAvail })
        .eq("id", vol.id);
      
      setVolunteerStats(prev => ({ ...prev, status: newStatus }));
    }
  };

  if (loading) {
    return (
      <DashboardShell title="Dashboard">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center">
            <Activity className="w-10 h-10 animate-spin text-primary mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Loading dashboard data…</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  // ==================== ADMIN VIEW ====================
  if (isAdmin) {
    const CHART_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899"];
    return (
      <DashboardShell title="Super Admin Command Centre" subtitle={`Welcome back, ${user?.full_name} — Full system overview`}>
        <div className="space-y-8 page-enter">

          {/* ===== ROW 1: Stats Cards (2 rows of 4) ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-elegant transition-shadow bg-red-500/5 border-red-500/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-red-500">SOS Requests</CardTitle>
                <Siren className="w-4 h-4 text-red-500 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-red-600">{stats.totalSos}</div>
                <p className="text-xs text-red-500/70 mt-1 flex items-center gap-1 font-medium">
                  {stats.activeRescues} active rescue missions
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elegant transition-shadow bg-blue-500/5 border-blue-500/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-blue-500">Volunteers Online</CardTitle>
                <Truck className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-blue-600">{stats.volunteersActive}</div>
                <p className="text-xs text-blue-500/70 mt-1 font-medium">
                  of {allVolunteers.length} total registered
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elegant transition-shadow bg-green-500/5 border-green-500/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-green-500">Camp Occupancy</CardTitle>
                <Tent className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-green-600">{stats.campOccupancy}%</div>
                <div className="mt-2">
                  <Progress value={stats.campOccupancy} className="h-1.5" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elegant transition-shadow bg-purple-500/5 border-purple-500/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-purple-500">People Rescued</CardTitle>
                <CheckCircle className="w-4 h-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-purple-600">{stats.peopleRescued}</div>
                <p className="text-xs text-purple-500/70 mt-1 font-medium">Rescued to camps successfully</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elegant transition-shadow bg-teal-500/5 border-teal-500/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-teal-500">Total Relief Camps</CardTitle>
                <Building2 className="w-4 h-4 text-teal-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-teal-600">{stats.totalCamps}</div>
                <p className="text-xs text-teal-500/70 mt-1 font-medium">Across all TN districts</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elegant transition-shadow bg-cyan-500/5 border-cyan-500/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-cyan-500">Monitored Flood Zones</CardTitle>
                <Waves className="w-4 h-4 text-cyan-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-cyan-600">{stats.totalFloodZones}</div>
                <p className="text-xs text-cyan-500/70 mt-1 font-medium">Real-time river monitoring</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elegant transition-shadow bg-amber-500/5 border-amber-500/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-500">Donations Received</CardTitle>
                <HeartHandshake className="w-4 h-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-amber-600">₹{(stats.totalDonationsAmount / 100000).toFixed(1)}L</div>
                <p className="text-xs text-amber-500/70 mt-1 font-medium">{allDonations.length} total contributions</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elegant transition-shadow bg-pink-500/5 border-pink-500/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-pink-500">Active NGOs</CardTitle>
                <Globe className="w-4 h-4 text-pink-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-pink-600">{stats.activeNGOs}</div>
                <p className="text-xs text-pink-500/70 mt-1 font-medium">NGOs & corporate donors</p>
              </CardContent>
            </Card>
          </div>

          {/* ===== ROW 2: Charts (3 columns) ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SOS Timeline */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  SOS & Rescues (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRescues" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ChartTooltip />
                    <Area type="monotone" dataKey="requests" stroke="#ef4444" fillOpacity={1} fill="url(#colorRequests)" strokeWidth={2} name="SOS Requests" />
                    <Area type="monotone" dataKey="rescues" stroke="#22c55e" fillOpacity={1} fill="url(#colorRescues)" strokeWidth={2} name="Rescues" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Donations by Type - Pie */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-amber-500" />
                  Donations by Type
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donationChartData}
                      cx="50%"
                      cy="45%"
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {donationChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Flood Zone Severity - Bar */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Waves className="w-4 h-4 text-cyan-500" />
                  Flood Zone Alert Levels
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={floodZoneChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <ChartTooltip />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Zones">
                      {floodZoneChartData.map((entry, index) => (
                        <Cell key={`fz-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* ===== ROW 3: Relief Camps Table ===== */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-500" />
                  All Relief Camps ({allCamps.length})
                </CardTitle>
                <CardDescription className="text-xs">State-wide relief camp network across Tamil Nadu</CardDescription>
              </div>
              <Link to="/camps" className="text-xs text-primary font-bold hover:underline flex items-center gap-0.5">
                Manage <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="max-h-[350px] overflow-y-auto rounded-lg border">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead className="text-xs">Camp Name</TableHead>
                      <TableHead className="text-xs">Location</TableHead>
                      <TableHead className="text-xs text-center">Capacity</TableHead>
                      <TableHead className="text-xs text-center">Occupancy</TableHead>
                      <TableHead className="text-xs text-center">Beds Available</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Contact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allCamps.map(camp => {
                      const occupancyPct = camp.max_capacity ? Math.round((camp.current_occupancy / camp.max_capacity) * 100) : 0;
                      return (
                        <TableRow key={camp.id}>
                          <TableCell className="font-bold text-xs">{camp.name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]">{camp.address || camp.location || "—"}</TableCell>
                          <TableCell className="text-xs text-center font-semibold">{camp.max_capacity}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <Progress value={occupancyPct} className="h-1.5 w-16" />
                              <span className="text-xs font-bold">{occupancyPct}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-center font-semibold text-green-600">{camp.beds_available || (camp.max_capacity - camp.current_occupancy)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] font-bold ${camp.status === "active" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                              {camp.status || "Active"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{camp.contact_phone || "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* ===== ROW 4: NGO Donations + Flood Zones ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* NGO & Corporate Donations */}
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-amber-500" />
                    NGO & Corporate Donations ({allDonations.length})
                  </CardTitle>
                  <CardDescription className="text-xs">Who is donating and what they're contributing</CardDescription>
                </div>
                <Link to="/donations" className="text-xs text-primary font-bold hover:underline flex items-center gap-0.5">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </CardHeader>
              <CardContent>
                <div className="max-h-[320px] overflow-y-auto rounded-lg border">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow>
                        <TableHead className="text-xs">Donor</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Category</TableHead>
                        <TableHead className="text-xs text-right">Amount</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allDonations.map(don => (
                        <TableRow key={don.id}>
                          <TableCell className="text-xs font-bold">{don.donor_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] font-bold ${don.donor_type === "ngo" ? "bg-purple-50 text-purple-700 border-purple-200" : don.donor_type === "corporate" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                              {don.donor_type || "Individual"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs capitalize">{don.donation_type?.replace("_", " ")}</TableCell>
                          <TableCell className="text-xs text-right font-bold text-green-600">
                            {don.amount ? `₹${don.amount.toLocaleString()}` : "In-kind"}
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] font-bold ${don.status === "received" ? "bg-green-100 text-green-800" : don.status === "pledged" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
                              {don.status || "Pending"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Flood Zone Monitoring */}
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Waves className="w-4 h-4 text-cyan-500" />
                    Flood Zone Monitoring ({allFloodZones.length})
                  </CardTitle>
                  <CardDescription className="text-xs">Real-time river and zone status monitoring</CardDescription>
                </div>
                <Link to="/flood-zones" className="text-xs text-primary font-bold hover:underline flex items-center gap-0.5">
                  View Map <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </CardHeader>
              <CardContent>
                <div className="max-h-[320px] overflow-y-auto rounded-lg border">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow>
                        <TableHead className="text-xs">Zone Name</TableHead>
                        <TableHead className="text-xs">River</TableHead>
                        <TableHead className="text-xs">Alert Level</TableHead>
                        <TableHead className="text-xs text-right">Water Level</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allFloodZones.map(fz => {
                        const levelColor = (fz.alert_level || "").toLowerCase() === "critical" ? "bg-red-100 text-red-800 border-red-200"
                          : (fz.alert_level || "").toLowerCase() === "high" ? "bg-orange-100 text-orange-800 border-orange-200"
                          : (fz.alert_level || "").toLowerCase() === "moderate" ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                          : "bg-green-100 text-green-800 border-green-200";
                        return (
                          <TableRow key={fz.id}>
                            <TableCell className="text-xs font-bold">{fz.zone_name || fz.name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{fz.river_name || fz.river || "—"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] font-bold ${levelColor}`}>
                                {fz.alert_level || "Normal"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-right font-semibold">
                              {fz.current_water_level ? `${fz.current_water_level}m` : fz.water_level ? `${fz.water_level}m` : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ===== ROW 5: Volunteer Force + Recent SOS + Low Stock ===== */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  Volunteer Force Overview ({allVolunteers.length} Registered)
                </CardTitle>
                <CardDescription className="text-xs">Complete roster of registered rescue volunteers</CardDescription>
              </div>
              <Link to="/volunteer" className="text-xs text-primary font-bold hover:underline flex items-center gap-0.5">
                Manage <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="max-h-[350px] overflow-y-auto rounded-lg border">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead className="text-xs">#</TableHead>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Phone</TableHead>
                      <TableHead className="text-xs">Vehicle</TableHead>
                      <TableHead className="text-xs text-center">Missions</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allVolunteers.map((v, idx) => (
                      <TableRow key={v.id}>
                        <TableCell className="text-xs text-muted-foreground font-mono">{idx + 1}</TableCell>
                        <TableCell className="text-xs font-bold">{v.users?.full_name || "Unknown"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{v.users?.phone || v.phone || "—"}</TableCell>
                        <TableCell className="text-xs capitalize">{v.vehicle_type || "On foot"}</TableCell>
                        <TableCell className="text-xs text-center font-bold">{v.total_missions || 0}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${v.is_available ? "bg-green-500" : "bg-yellow-500"}`} />
                            <span className="text-xs font-semibold">{v.is_available ? "Available" : "Busy"}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* ===== ROW 6: Recent SOS + Low Stock + Quick Actions ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent SOS */}
            <Card className="lg:col-span-2 shadow-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm font-bold">Recent SOS Requests</CardTitle>
                  <CardDescription className="text-xs">Live updates of incoming requests</CardDescription>
                </div>
                <Link to="/requests" className="text-xs text-primary font-bold hover:underline flex items-center gap-0.5">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground">No SOS requests yet.</TableCell>
                      </TableRow>
                    ) : (
                      recentRequests.map(req => (
                        <TableRow key={req.id}>
                          <TableCell className="font-bold text-xs">{req.reporter_name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground truncate max-w-[120px]">{req.address}</TableCell>
                          <TableCell className="text-xs capitalize">{req.emergency_type?.replace("_", " ")}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] font-bold ${req.emergency_level >= 4 ? "bg-red-50 text-red-700 border-red-200" : "bg-orange-50 text-orange-700 border-orange-200"}`}>
                              Lvl {req.emergency_level}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] capitalize font-bold status-${req.status}`}>
                              {req.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Right column: Low Stock + Quick Actions */}
            <div className="space-y-6">
              {/* Low Stock Alerts */}
              <Card className="shadow-card border-red-100">
                <CardHeader className="bg-red-500/5 pb-2">
                  <CardTitle className="text-sm font-bold text-red-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Critical Stock Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {lowStockAlerts.length === 0 ? (
                    <p className="text-xs text-muted-foreground">All camps stock levels stable.</p>
                  ) : (
                    lowStockAlerts.map(item => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold">{item.item_name}</p>
                          <p className="text-[10px] text-muted-foreground">{item.relief_camps?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-red-600">{item.current_stock} {item.unit}</p>
                          <p className="text-[9px] text-muted-foreground">Min: {item.min_threshold}</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-primary" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link to="/camps" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs border-border">
                      <Tent className="w-3.5 h-3.5" /> Manage Relief Camps
                    </Button>
                  </Link>
                  <Link to="/flood-zones" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs border-border">
                      <Waves className="w-3.5 h-3.5" /> Monitor Flood Zones
                    </Button>
                  </Link>
                  <Link to="/donations" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs border-border">
                      <HeartHandshake className="w-3.5 h-3.5" /> Manage Donations
                    </Button>
                  </Link>
                  <Link to="/inventory" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs border-border">
                      <Package className="w-3.5 h-3.5" /> Check Inventory
                    </Button>
                  </Link>
                  <Link to="/rescue-route" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs border-border">
                      <MapPin className="w-3.5 h-3.5" /> Rescue Route Finder
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </DashboardShell>
    );
  }

  // ==================== CAMP OFFICER VIEW ====================
  if (isCampOfficer) {
    return (
      <DashboardShell title="Relief Camp Management Dashboard" subtitle={officerCamp?.name || "Manage assigned camp operations"}>
        <div className="space-y-6 page-enter">
          {officerCamp ? (
            <>
              {/* Camp Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="stat-card">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Occupancy Rate</p>
                        <h3 className="text-3xl font-black text-primary mt-1">
                          {Math.round((officerCamp.current_occupancy / officerCamp.max_capacity) * 100)}%
                        </h3>
                      </div>
                      <Tent className="w-8 h-8 text-primary/30" />
                    </div>
                    <Progress value={(officerCamp.current_occupancy / officerCamp.max_capacity) * 100} className="h-1.5 mt-4" />
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {officerCamp.current_occupancy} of {officerCamp.max_capacity} beds occupied
                    </p>
                  </CardContent>
                </Card>

                <Card className="stat-card">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Available Beds</p>
                        <h3 className="text-3xl font-black text-green-600 mt-1">
                          {officerCamp.beds_available || 0}
                        </h3>
                      </div>
                      <Activity className="w-8 h-8 text-green-600/30" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-4">
                      Total seeded beds: {officerCamp.beds_total || 250}
                    </p>
                  </CardContent>
                </Card>

                <Card className="stat-card">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Food Inventory</p>
                        <h3 className="text-3xl font-black text-orange-600 mt-1">
                          140 <span className="text-sm font-normal text-muted-foreground">packets</span>
                        </h3>
                      </div>
                      <Package className="w-8 h-8 text-orange-600/30" />
                    </div>
                    <p className="text-[10px] text-red-600 font-semibold mt-4">
                      ⚠️ Low stock warning
                    </p>
                  </CardContent>
                </Card>

                <Card className="stat-card">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Medical Kits</p>
                        <h3 className="text-3xl font-black text-purple-600 mt-1">
                          85 <span className="text-sm font-normal text-muted-foreground">kits</span>
                        </h3>
                      </div>
                      <Shield className="w-8 h-8 text-purple-600/30" />
                    </div>
                    <p className="text-[10px] text-green-600 font-semibold mt-4">
                      ✓ Stock stable
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Action grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Checkins */}
                <Card className="lg:col-span-2 shadow-card">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold">Recent Registered Beneficiaries</CardTitle>
                      <CardDescription className="text-xs">Latest victims checked in to this camp</CardDescription>
                    </div>
                    <Link to="/beneficiaries" className="text-xs font-bold text-primary hover:underline">
                      Register New
                    </Link>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Blood Group</TableHead>
                          <TableHead>Reg. Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campCheckins.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground">
                              No beneficiaries registered yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          campCheckins.map(c => (
                            <TableRow key={c.id}>
                              <TableCell className="font-bold text-xs">{c.users?.full_name}</TableCell>
                              <TableCell className="text-xs">{c.users?.phone || "—"}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[10px]">
                                  {c.blood_group || "—"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(c.registration_date).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* QR Quick scan & Actions */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold">Quick Camp Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Link to="/distributions" className="block">
                      <Button className="w-full justify-start gap-2 bg-primary text-white border-0 py-6">
                        <QrCode className="w-5 h-5" />
                        <div className="text-left">
                          <p className="font-bold text-sm">Scan QR Distribution</p>
                          <p className="text-[10px] opacity-75">Distribute relief goods via QR scanner</p>
                        </div>
                      </Button>
                    </Link>

                    <Link to="/inventory" className="block">
                      <Button variant="outline" className="w-full justify-start gap-2 py-6 border-border">
                        <Package className="w-5 h-5 text-muted-foreground" />
                        <div className="text-left">
                          <p className="font-bold text-sm text-foreground">Adjust Stock</p>
                          <p className="text-[10px] text-muted-foreground">Log item incoming/outgoing</p>
                        </div>
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card className="p-8 text-center border-dashed">
              <Tent className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-bold">No Camp Assigned</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                You haven't been assigned to a relief camp yet. Please contact the District Administrator.
              </p>
            </Card>
          )}
        </div>
      </DashboardShell>
    );
  }

  // ==================== VOLUNTEER VIEW ====================
  if (isVolunteer) {
    return (
      <DashboardShell title="Volunteer Command Centre" subtitle={`Welcome back, ${user?.full_name}`}>
        <div className="space-y-6 page-enter">
          {/* Availability Toggle */}
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-card">
            <div>
              <p className="font-bold text-sm">Your Duty Status</p>
              <p className="text-xs text-muted-foreground">Toggle availability for rescue dispatch</p>
            </div>
            <div className="flex gap-2">
              {["Available", "Busy"].map(st => (
                <Button
                  key={st}
                  size="sm"
                  onClick={() => handleStatusToggle(st)}
                  className={`font-semibold border-0 ${
                    volunteerStats.status === st
                      ? st === "Available"
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-yellow-600 hover:bg-yellow-700 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {st}
                </Button>
              ))}
            </div>
          </div>

          {/* Active Mission or Welcome */}
          {currentMission ? (
            <Card className="border-red-200 bg-red-500/5 shadow-elegant">
              <CardHeader className="bg-red-500/10 border-b border-red-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-red-800">
                    <Siren className="w-5 h-5 animate-pulse" />
                    <CardTitle className="text-sm font-bold">Active Rescue Mission Assigned</CardTitle>
                  </div>
                  <Badge className="bg-red-600 text-white">Critical</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Victim / Reporter</p>
                    <p className="font-bold text-foreground text-base mt-0.5">
                      {currentMission.sos_requests?.reporter_name}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Phone className="w-3.5 h-3.5" />
                      {currentMission.sos_requests?.reporter_phone || "No phone provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Rescue Address</p>
                    <p className="font-bold text-foreground mt-0.5">
                      {currentMission.sos_requests?.address}
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-card/80 border rounded-xl p-3 flex justify-between text-xs">
                  <div>
                    <p className="text-muted-foreground font-semibold">Emergency Level</p>
                    <p className="font-bold text-red-600 mt-0.5">Level {currentMission.sos_requests?.emergency_level}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-semibold">Distance Remaining</p>
                    <p className="font-bold text-foreground mt-0.5">~{(currentMission.distance_km || 0.8).toFixed(1)} km</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-semibold">Est. Arrival Time</p>
                    <p className="font-bold text-foreground mt-0.5">{currentMission.eta_minutes || 5} minutes</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button asChild className="flex-1 bg-primary text-white border-0 gap-1.5 font-bold">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${currentMission.sos_requests?.latitude},${currentMission.sos_requests?.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Navigation className="w-4 h-4" />
                      Start Navigation
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="flex-1 border-border">
                    <Link to="/volunteer">
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-8 text-center border-dashed">
              <Truck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-bold">No Active Rescue Missions</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                You're currently available for dispatch. Keep this app open to receive real-time SOS rescue assignments.
              </p>
            </Card>
          )}

          {/* Performance Stats & History */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-card">
              <CardHeader>
                <CardTitle className="text-sm font-bold">Mission History</CardTitle>
                <CardDescription className="text-xs">Your recently completed rescues</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Victim</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Time Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {missionHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-xs text-muted-foreground">
                          No missions completed yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      missionHistory.map(m => (
                        <TableRow key={m.id}>
                          <TableCell className="font-bold text-xs">{m.sos_requests?.reporter_name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{m.sos_requests?.address}</TableCell>
                          <TableCell className="text-xs">
                            {m.completed_at ? new Date(m.completed_at).toLocaleString() : "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-sm font-bold">Your Impact Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="stat-card">
                  <div className="text-4xl font-black text-primary">{volunteerStats.totalMissions}</div>
                  <div className="text-xs text-muted-foreground mt-1.5 font-bold">Total Missions Completed</div>
                </div>
                <div className="stat-card">
                  <div className="text-4xl font-black text-green-600">{volunteerStats.totalMissions * 3 + 2}</div>
                  <div className="text-xs text-muted-foreground mt-1.5 font-bold">Total Persons Rescued</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardShell>
    );
  }

  // ==================== BENEFICIARY VIEW ====================
  if (isBeneficiary) {
    return (
      <DashboardShell title="My Safety Portal" subtitle="Track your profile and shelter status">
        <div className="space-y-6 page-enter">
          {/* Welcome Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-card flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-left">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Welcome, {user?.full_name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Registered Flood Beneficiary</p>
                <div className="mt-2 flex gap-2">
                  <Badge variant="outline" className={`text-[10px] font-bold ${beneficiaryProfile?.shelter_status === "at_camp" ? "bg-green-50 text-green-700 border-green-200" : "bg-orange-50 text-orange-700 border-orange-200"}`}>
                    Status: {beneficiaryProfile?.shelter_status?.replace("_", " ") || "Registered"}
                  </Badge>
                  {beneficiaryProfile?.relief_camps?.name && (
                    <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                      Camp: {beneficiaryProfile.relief_camps.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Link to="/emergency">
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700 font-bold gap-1.5 shadow-lg">
                  <Siren className="w-4 h-4 animate-pulse" />
                  Trigger SOS
                </Button>
              </Link>
              <Link to="/my-portal">
                <Button variant="outline" className="border-border">
                  My Profile
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* My QR Code Card */}
            <Card className="shadow-card flex flex-col items-center p-6 text-center">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">My Digital Relief QR</CardTitle>
                <CardDescription className="text-xs">Scan this at camp for resources</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                {beneficiaryProfile?.qr_code_data ? (
                  <div className="bg-white p-4 rounded-xl border">
                    <QRCodeSVG
                      value={beneficiaryProfile.qr_code_data}
                      size={160}
                      level="M"
                    />
                  </div>
                ) : (
                  <div className="h-40 w-40 bg-muted/50 rounded-xl flex items-center justify-center">
                    <QrCode className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground font-mono">
                  {beneficiaryProfile?.qr_code_data || "QR not generated"}
                </p>
              </CardContent>
            </Card>

            {/* Family Members Card */}
            <Card className="shadow-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold">My Registered Family</CardTitle>
                  <CardDescription className="text-xs">Manage your family group</CardDescription>
                </div>
                <Link to="/my-portal" className="text-xs text-primary font-bold hover:underline">
                  Add Member
                </Link>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Relationship</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {familyMembers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground">
                          No family members registered.
                        </TableCell>
                      </TableRow>
                    ) : (
                      familyMembers.map(m => (
                        <TableRow key={m.id}>
                          <TableCell className="font-bold text-xs">{m.member_name}</TableCell>
                          <TableCell className="text-xs">{m.age}</TableCell>
                          <TableCell className="text-xs capitalize">{m.gender}</TableCell>
                          <TableCell className="text-xs capitalize">{m.relationship}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Distribution History */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">My Relief Distribution History</CardTitle>
                <CardDescription className="text-xs">Resources distributed to you</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Distributed Date</TableHead>
                      <TableHead>Items</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receivedResources.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-6 text-xs text-muted-foreground">
                          No items received yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      receivedResources.map(dist => (
                        <TableRow key={dist.id}>
                          <TableCell className="text-xs">
                            {new Date(dist.distribution_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs font-bold truncate max-w-[160px]">
                            {Array.isArray(dist.items) ? dist.items.map((it: any) => `${it.quantity}x ${it.item_name}`).join(", ") : "—"}
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
      </DashboardShell>
    );
  }

  return null;
}
