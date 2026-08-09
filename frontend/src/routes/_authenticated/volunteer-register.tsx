import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Truck,
  MapPin,
  Shield,
  CheckCircle,
  Heart,
  Navigation,
  Anchor,
  Loader2,
  Users,
  Activity,
  Award,
  Waves,
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import {
  useGeolocation,
  GoogleMap,
  type MapMarker,
} from "@/components/maps/GoogleMap";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/volunteer-register")({
  component: VolunteerRegisterPage,
});

function VolunteerRegisterPage() {
  const { user } = useAuth();
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Stats
  const [totalVolunteers, setTotalVolunteers] = useState(0);
  const [totalMissions, setTotalMissions] = useState(0);

  // Form
  const [vehicleType, setVehicleType] = useState("none");
  const [skills, setSkills] = useState("");
  const [agreed, setAgreed] = useState(false);

  const { position, getPosition } = useGeolocation();

  useEffect(() => {
    if (!user) return;
    checkExistingProfile();
    fetchStats();
    getPosition();
  }, [user]);

  const checkExistingProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("volunteers")
      .select("*, users(full_name)")
      .eq("user_id", user?.id)
      .maybeSingle();

    if (!error && data) setExistingProfile(data);
    setLoading(false);
  };

  const fetchStats = async () => {
    const { count: volCount } = await supabase
      .from("volunteers")
      .select("*", { count: "exact", head: true });
    setTotalVolunteers(volCount || 0);

    const { data: missions } = await supabase
      .from("volunteer_assignments")
      .select("id")
      .eq("status", "completed");
    setTotalMissions(missions?.length || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!agreed) {
      toast.error("Please accept the volunteer code of conduct.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Insert volunteer record
      const { error: volError } = await supabase.from("volunteers").insert({
        user_id: user.id,
        vehicle_type: vehicleType,
        skills: skills || null,
        current_lat: position?.lat || null,
        current_lng: position?.lng || null,
        is_available: true,
        total_missions: 0,
      });

      if (volError) throw volError;

      // 2. Update user role to volunteer
      const { error: roleError } = await supabase
        .from("users")
        .update({ role: "volunteer" })
        .eq("id", user.id);

      if (roleError) throw roleError;

      toast.success(
        "Welcome to the rescue team! You are now a registered volunteer."
      );
      checkExistingProfile();
    } catch (err: any) {
      toast.error(err.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const mapMarkers: MapMarker[] = position
    ? [
        {
          id: "you",
          lat: position.lat,
          lng: position.lng,
          type: "volunteer" as const,
          title: "Your Location",
        },
      ]
    : [];

  if (loading) {
    return (
      <DashboardShell title="Volunteer Registration">
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Volunteer Rescue Program"
      subtitle="Join the emergency rescue team and save lives during floods"
    >
      <div className="space-y-6 page-enter max-w-4xl mx-auto">
        {/* Hero Banner */}
        <Card className="shadow-elegant overflow-hidden border-0">
          <div className="gradient-hero p-8 text-white relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,white,transparent)]" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-6 h-6 text-red-300" />
                <h2 className="text-2xl font-black">
                  Be a Hero. Save Lives.
                </h2>
              </div>
              <p className="text-sm text-white/80 max-w-lg">
                Volunteers are the backbone of flood emergency response.
                Register now to receive rescue assignments, navigate to victims
                using live GPS, and make a direct impact during disasters.
              </p>
            </div>
          </div>
          <CardContent className="p-0">
            <div className="grid grid-cols-3 divide-x divide-border">
              <div className="p-4 text-center">
                <div className="text-2xl font-black text-primary">
                  {totalVolunteers}
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold mt-0.5">
                  Active Volunteers
                </p>
              </div>
              <div className="p-4 text-center">
                <div className="text-2xl font-black text-green-600">
                  {totalMissions}
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold mt-0.5">
                  Rescues Completed
                </p>
              </div>
              <div className="p-4 text-center">
                <div className="text-2xl font-black text-blue-600">24/7</div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold mt-0.5">
                  Dispatch Active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {existingProfile ? (
          /* Already registered - show profile */
          <Card className="shadow-card border-green-200 bg-green-500/5">
            <CardHeader className="bg-green-500/10 border-b border-green-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <CardTitle className="text-base font-bold">
                    You're a Registered Volunteer!
                  </CardTitle>
                </div>
                <Badge className="bg-green-600 text-white border-0">
                  Active ✓
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    Vehicle Type
                  </p>
                  <p className="font-bold capitalize mt-0.5">
                    {existingProfile.vehicle_type || "None"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    Total Missions
                  </p>
                  <p className="font-bold mt-0.5">
                    {existingProfile.total_missions || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    Status
                  </p>
                  <p className="font-bold mt-0.5">
                    {existingProfile.is_available ? "🟢 Available" : "⚫ Offline"}
                  </p>
                </div>
              </div>

              <Button
                asChild
                className="w-full gradient-hero text-white border-0 font-bold gap-1.5"
              >
                <Link to="/volunteer">
                  <Navigation className="w-4 h-4" />
                  Open Volunteer Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Registration Form */
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="shadow-card">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" />
                  Registration Form
                </CardTitle>
                <CardDescription className="text-xs">
                  Fill in your details to join the rescue operations team
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Vehicle Type</Label>
                    <Select value={vehicleType} onValueChange={setVehicleType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          🚶 No Vehicle (On Foot)
                        </SelectItem>
                        <SelectItem value="boat">🚤 Rescue Boat</SelectItem>
                        <SelectItem value="motorcycle">
                          🏍️ Motorcycle
                        </SelectItem>
                        <SelectItem value="car">🚗 Car / Jeep</SelectItem>
                        <SelectItem value="truck">
                          🚛 Truck / Heavy Vehicle
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">
                      Skills & Specializations
                    </Label>
                    <Input
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="E.g. Swimming, First Aid, CPR, Diving"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Separate multiple skills with commas
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">GPS Location</Label>
                    {position ? (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800">
                        <div className="flex items-center gap-1.5 font-bold">
                          <MapPin className="w-4 h-4" />
                          Location Detected
                        </div>
                        <p className="mt-1 font-mono text-[10px]">
                          {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                        <p>
                          Detecting your GPS location… Please allow location
                          access.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-xl border">
                    <Checkbox
                      id="agree"
                      checked={agreed}
                      onCheckedChange={(v) => setAgreed(!!v)}
                      className="mt-0.5"
                    />
                    <label htmlFor="agree" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                      I agree to the <strong>Volunteer Code of Conduct</strong>.
                      I understand that I may be dispatched to emergency rescue
                      situations and will prioritize victim safety. I will
                      maintain communication with district control.
                    </label>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting || !agreed}
                    className="w-full gradient-hero text-white border-0 font-bold gap-1.5"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Shield className="w-4 h-4" />
                    )}
                    Register as Volunteer
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Map Preview */}
            <Card className="shadow-card overflow-hidden">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-primary" />
                  Your Current Location
                </CardTitle>
              </CardHeader>
              <div>
                <GoogleMap
                  center={position || undefined}
                  zoom={position ? 14 : 8}
                  markers={mapMarkers}
                  className="h-[300px] w-full"
                />
              </div>
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-muted/50 rounded-xl text-center">
                    <Award className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="font-bold">Training Provided</p>
                    <p className="text-muted-foreground mt-0.5">
                      Basic rescue orientation
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-xl text-center">
                    <Waves className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                    <p className="font-bold">Flood Specific</p>
                    <p className="text-muted-foreground mt-0.5">
                      Water rescue operations
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
