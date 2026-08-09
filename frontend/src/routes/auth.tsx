import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Shield,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Siren,
  Eye,
  EyeOff,
  ChevronDown,
  Loader2,
  CheckCircle,
  AlertTriangle,
  QrCode,
  Check,
  Tent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth, type UserRole } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  phone: z.string().min(10, "Enter a valid phone number").optional().or(z.literal("")),
  role: z.enum(["beneficiary", "volunteer", "camp_officer"]),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

const ROLE_OPTIONS = [
  { value: "beneficiary", label: "Relief Victim / Beneficiary", desc: "Register to get a Digital QR ID, receive food rations, and view camp shelter slots." },
  { value: "volunteer", label: "Volunteer Rescuer", desc: "Access dispatch mapping to locate stranded victims and manage boat/vehicle navigation." },
  { value: "camp_officer", label: "Camp Welfare Officer", desc: "Track room allocation, bed availability, medicine stock, and ration distributions." },
];

function AuthPage() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "beneficiary" },
  });

  const handleLogin = async (data: LoginForm) => {
    setError(null);
    setSuccess(null);
    if (typeof window !== "undefined") {
      try { localStorage.setItem("demo_auth_active", "true"); } catch {}
    }

    const { error } = await signIn(data.email, data.password);
    if (error) {
      setError(error);
      return;
    }

    setSuccess("Authenticated! Opening Dashboard...");
    try {
      await router.invalidate();
      await router.navigate({ to: "/dashboard" });
    } catch {
      window.location.href = "/dashboard";
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    setError(null);
    const { error } = await signUp(
      data.email,
      data.password,
      data.fullName,
      data.role as UserRole,
      data.phone || undefined
    );
    if (error) return setError(error);
    setSuccess("Account created! Please check your email to verify your account.");
    setMode("login");
  };

  // Demo auto-fill credentials helpers with instant 1-click login
  const handleQuickFill = async (role: "admin" | "volunteer" | "camp") => {
    setError(null);
    let email = "mohitbalaji2005@gmail.com";
    let pass = "12345678";

    if (role === "volunteer") {
      email = "volunteer@floodresponse.in";
      pass = "Vol@123";
    } else if (role === "camp") {
      email = "camp_officer@floodresponse.in";
      pass = "Camp@123";
    }

    loginForm.setValue("email", email);
    loginForm.setValue("password", pass);

    if (typeof window !== "undefined") {
      try { localStorage.setItem("demo_auth_active", "true"); } catch {}
    }

    await signIn(email, pass);
    try {
      await router.invalidate();
      await router.navigate({ to: "/dashboard" });
    } catch {
      window.location.href = "/dashboard";
    }
  };

  // Watch register password for security meter
  const regPassword = registerForm.watch("password") || "";
  const calculatePassStrength = () => {
    if (regPassword.length === 0) return 0;
    let strength = 0;
    if (regPassword.length >= 8) strength += 1;
    if (/[A-Z]/.test(regPassword)) strength += 1;
    if (/[0-9]/.test(regPassword)) strength += 1;
    if (/[^A-Za-z0-9]/.test(regPassword)) strength += 1;
    return strength;
  };

  const passStrength = calculatePassStrength();

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row transition-all duration-300">
      
      {/* LEFT COLUMN - DISASTER METRICS & DEEP NAVY SHOWCASE */}
      <div className="lg:w-[40%] bg-sidebar flex flex-col justify-between p-8 lg:p-12 relative overflow-hidden text-sidebar-foreground border-b lg:border-b-0 lg:border-r border-sidebar-border shrink-0">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="absolute inset-0 hero-grid opacity-10" />
        
        {/* Decorative background blobs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 space-y-8 flex-1 flex flex-col justify-between">
          {/* Logo & Header */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white font-outfit text-sm leading-tight">FloodResponse EMS</h2>
              <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider">Emergency Management Platform</p>
            </div>
          </Link>

          {/* Core Info Details */}
          <div className="space-y-6 my-auto pt-8">
            <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight font-outfit">
              Secure access to disaster <span className="text-cyan-300">relief & rescue</span> systems.
            </h1>
            <p className="text-sm text-blue-100/70 leading-relaxed max-w-sm">
              Log in to register flood victims, request active volunteer dispatches, track supply inventory, and search rescue route paths.
            </p>

            <div className="space-y-3.5">
              {[
                { icon: "🚨", label: "One-Click GPS SOS Capturing" },
                { icon: "🧭", label: "Safe Routing & Path Finder" },
                { icon: "🎫", label: "Encrypted QR ID Cards for Victims" },
                { icon: "📦", label: "Live Ration Supply Control" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-xs font-semibold text-white/95">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="pt-6 border-t border-white/10 space-y-2.5">
            <Link to="/facilities" className="flex items-center justify-between bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 p-3.5 rounded-2xl transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
                  <Tent className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Browse Relief Camps</h4>
                  <p className="text-[10px] text-emerald-300">View beds & shelters without logging in</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/60 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link to="/emergency" className="flex items-center justify-between bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 p-3.5 rounded-2xl transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
                  <Siren className="w-4 h-4 text-white animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Need Immediate Help?</h4>
                  <p className="text-[10px] text-red-300">Trigger GPS SOS without logging in</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/60 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - AUTHENTICATION PANEL */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md space-y-6">
          
          {/* Form Header */}
          <div className="text-center space-y-1.5">
            <h2 className="text-2xl font-black font-outfit tracking-tight text-foreground">Welcome to Relief Control</h2>
            <p className="text-xs text-muted-foreground">Select your entry method to log in or register</p>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-muted p-1 rounded-xl border border-border/80">
            <Button
              size="sm"
              variant={mode === "login" ? "default" : "ghost"}
              onClick={() => { setMode("login"); setError(null); setSuccess(null); }}
              className="text-xs font-bold rounded-lg h-8"
            >
              Sign In
            </Button>
            <Button
              size="sm"
              variant={mode === "register" ? "default" : "ghost"}
              onClick={() => { setMode("register"); setError(null); setSuccess(null); }}
              className="text-xs font-bold rounded-lg h-8"
            >
              Register
            </Button>
          </div>

          {success && (
            <Alert className="border-green-500/20 bg-green-500/10 text-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-xs font-semibold">{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="border-red-500/20 bg-red-500/10 text-red-800" variant="destructive">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
            </Alert>
          )}

          {/* TAB 1: LOGIN FORM */}
          {mode === "login" && (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="name@relief.gov.in"
                    className="pl-9 text-xs"
                    {...loginForm.register("email")}
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-[10px] text-red-500 font-semibold">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-9 pr-9 text-xs"
                    {...loginForm.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-[10px] text-red-500 font-semibold">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-[10px] font-bold text-primary hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={loginForm.formState.isSubmitting}
                className="w-full gradient-hero text-white border-0 font-bold text-xs py-2.5 shadow-lg"
              >
                {loginForm.formState.isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Sign In to Dashboard <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>

              {/* Quick Fill Demo Helpers */}
              <div className="bg-muted/40 border border-border p-4 rounded-xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quick Sandbox Entry</span>
                <div className="grid grid-cols-3 gap-2">
                  <Button type="button" onClick={() => handleQuickFill("admin")} variant="outline" className="text-[10px] h-7 px-1">
                    Super Admin
                  </Button>
                  <Button type="button" onClick={() => handleQuickFill("volunteer")} variant="outline" className="text-[10px] h-7 px-1">
                    Volunteer
                  </Button>
                  <Button type="button" onClick={() => handleQuickFill("camp")} variant="outline" className="text-[10px] h-7 px-1">
                    Camp Officer
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER FORM */}
          {mode === "register" && (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              
              {/* Role Selection Cards */}
              <div className="space-y-2">
                <Label className="text-xs">Choose Your Registration Role</Label>
                <div className="space-y-2">
                  {ROLE_OPTIONS.map((opt) => {
                    const currentRole = registerForm.watch("role");
                    const isSelected = currentRole === opt.value;
                    return (
                      <div
                        key={opt.value}
                        onClick={() => registerForm.setValue("role", opt.value as any)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 flex items-start gap-3 ${
                          isSelected
                            ? "bg-primary/5 border-primary shadow-sm"
                            : "bg-card border-border hover:border-muted-foreground/50"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? "border-primary bg-primary text-white" : "border-border"
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-foreground">{opt.label}</span>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">{opt.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="e.g. Rajan Kumar"
                      className="pl-9 text-xs"
                      {...registerForm.register("fullName")}
                    />
                  </div>
                  {registerForm.formState.errors.fullName && (
                    <p className="text-[10px] text-red-500 font-semibold">{registerForm.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      className="pl-9 text-xs"
                      {...registerForm.register("email")}
                    />
                  </div>
                  {registerForm.formState.errors.email && (
                    <p className="text-[10px] text-red-500 font-semibold">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Password</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="text-xs"
                      {...registerForm.register("password")}
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-[10px] text-red-500 font-semibold">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Confirm Password</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="text-xs"
                      {...registerForm.register("confirmPassword")}
                    />
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-[10px] text-red-500 font-semibold">{registerForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                {/* Password Strength Meter */}
                {regPassword.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold">
                      <span className="text-muted-foreground">Password Security:</span>
                      <span className={
                        passStrength === 4 ? "text-green-600" :
                        passStrength >= 2 ? "text-amber-600" : "text-red-500"
                      }>
                        {passStrength === 4 ? "Strong" : passStrength >= 2 ? "Moderate" : "Weak"}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 h-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full rounded-full transition-all ${
                            step <= passStrength
                              ? passStrength === 4
                                ? "bg-green-500"
                                : passStrength >= 2
                                ? "bg-amber-500"
                                : "bg-red-500"
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs">Phone Number (optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="+91 98765 43210"
                      className="pl-9 text-xs"
                      {...registerForm.register("phone")}
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={registerForm.formState.isSubmitting}
                className="w-full gradient-hero text-white border-0 font-bold text-xs py-2.5 mt-2"
              >
                {registerForm.formState.isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Create Relief Account <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === "forgot" && (
            <form onSubmit={(e) => { e.preventDefault(); setSuccess("Reset link sent!"); }} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Reset Your Password</Label>
                <p className="text-[10px] text-muted-foreground">We'll email you a secure link to reset your account password.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="email" placeholder="name@example.com" className="pl-9 text-xs" required />
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/95 text-white font-bold text-xs">
                Send Reset Link
              </Button>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="w-full text-[10px] font-bold text-muted-foreground hover:text-foreground text-center"
              >
                ← Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
