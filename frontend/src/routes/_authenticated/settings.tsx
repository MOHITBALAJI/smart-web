import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Shield,
  Save,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Loader2,
  KeyRound,
  Palette,
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();

  // Profile form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  // Theme
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );

  // Account info
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [createdAt, setCreatedAt] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setPhone(user.phone || "");
      setAvatarUrl(user.avatar_url || "");
      setRole(user.role || "");
      setEmail("");
      fetchEmail();
    }
  }, [user]);

  const fetchEmail = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser) {
      setEmail(authUser.email || "");
      setCreatedAt(authUser.created_at || "");
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!fullName.trim()) {
      toast.error("Full name is required.");
      return;
    }
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          avatar_url: avatarUrl.trim() || null,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setSavingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast.success("Password changed successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password.");
    } finally {
      setSavingPw(false);
    }
  };

  const toggleDarkMode = (checked: boolean) => {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const ROLE_COLORS: Record<string, string> = {
    super_admin: "bg-red-500/10 text-red-700 border-red-200",
    district_admin: "bg-purple-500/10 text-purple-700 border-purple-200",
    camp_officer: "bg-blue-500/10 text-blue-700 border-blue-200",
    volunteer: "bg-green-500/10 text-green-700 border-green-200",
    beneficiary: "bg-orange-500/10 text-orange-700 border-orange-200",
  };

  return (
    <DashboardShell
      title="Account Settings"
      subtitle="Manage your profile, security, and application preferences"
    >
      <div className="space-y-6 page-enter max-w-4xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Profile Card */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="shadow-card text-center">
              <CardContent className="pt-8 pb-6 space-y-4">
                <Avatar className="w-20 h-20 mx-auto border-4 border-primary/20 shadow-lg">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-lg text-foreground">
                    {fullName || "User"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {email}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`capitalize text-xs font-bold ${ROLE_COLORS[role] || "bg-muted"}`}
                >
                  <Shield className="w-3 h-3 mr-1" />
                  {role?.replace("_", " ") || "User"}
                </Badge>
                {createdAt && (
                  <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Member since{" "}
                    {new Date(createdAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                    })}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Dark Mode</p>
                    <p className="text-[10px] text-muted-foreground">
                      Switch between light and dark themes
                    </p>
                  </div>
                  <Switch
                    checked={darkMode}
                    onCheckedChange={toggleDarkMode}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Edit Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Edit Section */}
            <Card className="shadow-card">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Edit Profile
                </CardTitle>
                <CardDescription className="text-xs">
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={email}
                      disabled
                      className="pl-9 bg-muted/50"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Email cannot be changed from this page.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">
                    Avatar URL (optional)
                  </Label>
                  <Input
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                <div className="flex justify-end pt-2 border-t">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="gradient-hero text-white border-0 font-bold gap-1.5"
                  >
                    {savingProfile ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Password Section */}
            <Card className="shadow-card">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-primary" />
                  Security — Change Password
                </CardTitle>
                <CardDescription className="text-xs">
                  Update your account password
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showPw ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-9 pr-9"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPw(!showPw)}
                      >
                        {showPw ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showPw ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>

                {newPassword && confirmPassword && (
                  <div
                    className={`flex items-center gap-1.5 text-xs font-semibold ${newPassword === confirmPassword ? "text-green-600" : "text-red-500"}`}
                  >
                    {newPassword === confirmPassword ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" /> Passwords match
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" /> Passwords do not match
                      </>
                    )}
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t">
                  <Button
                    onClick={handleChangePassword}
                    disabled={
                      savingPw || !newPassword || newPassword !== confirmPassword
                    }
                    variant="outline"
                    className="gap-1.5 font-bold border-primary text-primary hover:bg-primary/5"
                  >
                    {savingPw ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <KeyRound className="w-4 h-4" />
                    )}
                    Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
