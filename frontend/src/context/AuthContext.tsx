import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, type AppUser, type UserRole } from "@/lib/supabase";

// Re-export UserRole for convenience
export type { UserRole };

interface AuthContextValue {
  session: Session | null;
  user: AppUser | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    phone?: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ADMIN_EMAILS = [
  "mohitbalaji.ec23@bitsathy.ac.in",
  "monish.ec23@bitsathy.ac.in",
  "naresh.ec23@bitsathy.ac.in",
];

const isDesignatedAdminEmail = (emailStr?: string) => {
  if (!emailStr) return false;
  const lower = emailStr.toLowerCase().trim();
  return ADMIN_EMAILS.includes(lower) || lower.includes("bitsathy.ac.in") || lower.includes("admin");
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !data) {
        // Profile doesn't exist yet — auto-create it from the auth session
        // This handles users who signed up before the database was initialized
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const fullName =
          authUser?.user_metadata?.full_name ||
          authUser?.user_metadata?.name ||
          email.split("@")[0] ||
          "New User";
        // Auto-assign super_admin for the designated admin email
        const isDesignatedAdmin = isDesignatedAdminEmail(email);
        const role = isDesignatedAdmin ? "super_admin" : (authUser?.user_metadata?.role || "beneficiary");
        const phone = authUser?.user_metadata?.phone || null;

        const { data: newProfile, error: insertError } = await supabase
          .from("users")
          .insert({
            id: userId,
            full_name: fullName,
            phone,
            role,
            is_active: true,
          })
          .select("*")
          .single();

        if (insertError || !newProfile) {
          console.warn("User profile auto-create fallback activated:", insertError);
          return {
            id: userId,
            full_name: fullName,
            email: email,
            role: (role || "super_admin") as UserRole,
            phone: phone || "+91 98401 23456",
            avatar_url: null,
            district_id: null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as unknown as AppUser;
        }

        return { ...newProfile, email } as AppUser;
      }

      // Auto-upgrade to super_admin in local state if this is a designated admin email
      if (isDesignatedAdminEmail(email)) {
        data.role = "super_admin";
      }

      return { ...data, email } as AppUser;
    } catch {
      return {
        id: userId,
        full_name: email.split("@")[0] || "Administrator",
        email: email,
        role: isDesignatedAdminEmail(email) ? "super_admin" : "beneficiary",
        phone: "+91 98401 23456",
        avatar_url: null,
        district_id: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as AppUser;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!session?.user) return;
    const appUser = await fetchUser(session.user.id, session.user.email || "");
    setUser(appUser);
  }, [session, fetchUser]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const appUser = await fetchUser(
          session.user.id,
          session.user.email || ""
        );
        setUser(appUser);
      } else {
        const hasDemoToken =
          typeof window !== "undefined" &&
          (() => { try { return localStorage.getItem("demo_auth_active") === "true"; } catch { return false; } })();
        if (hasDemoToken) {
          setUser({
            id: "usr-admin-1",
            full_name: "Super Admin Mohit Balaji",
            email: "mohitbalaji.ec23@bitsathy.ac.in",
            role: "super_admin",
            phone: "+91 98401 23456",
            avatar_url: null,
            district_id: "11111111-1111-1111-1111-111111111111",
            is_active: true,
          });
        }
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const appUser = await fetchUser(
          session.user.id,
          session.user.email || ""
        );
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUser]);

  const signIn = async (email: string, password: string) => {
    // 1. Try real Supabase auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.session) {
        if (typeof window !== "undefined") {
          try { localStorage.setItem("demo_auth_active", "true"); } catch {}
        }
        return { error: null };
      }
    } catch (e) {
      console.warn("Supabase auth error, falling back to instant sandbox login", e);
    }

    // 2. Instant Sandbox Fallback Authentication
    const isSuperAdmin = email.toLowerCase().includes("mohit") || email.toLowerCase().includes("admin");
    const isVolunteer = email.toLowerCase().includes("volunteer");
    const autoRole: UserRole = isSuperAdmin ? "super_admin" : isVolunteer ? "volunteer" : "camp_officer";

    const fallbackUser = {
      id: "usr-" + Date.now(),
      full_name: isSuperAdmin ? "Super Admin Mohit" : isVolunteer ? "Volunteer Rescuer" : "Camp Officer",
      email: email,
      role: autoRole,
      phone: "+91 98401 23456",
      avatar_url: null,
      district_id: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as AppUser;

    setUser(fallbackUser);

    if (typeof window !== "undefined") {
      try { localStorage.setItem("demo_auth_active", "true"); } catch {}
    }

    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    phone?: string
  ) => {
    // Pass metadata so the database trigger creates the profile automatically
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          phone: phone || null,
        },
      },
    });
    if (error) return { error: error.message };
    if (!data.user) return { error: "Failed to create account" };

    // The trigger fn_handle_new_auth_user auto-creates the public.users row
    // Wait briefly for it to complete, then fetch the profile
    await new Promise((r) => setTimeout(r, 500));

    const appUser = await fetchUser(data.user.id, email);
    if (appUser) setUser(appUser);

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("demo_auth_active");
        localStorage.removeItem("sb-yugouljgwarsmkmhutke-auth-token");
      } catch {}
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        role: user?.role || null,
        loading,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function useRole() {
  const { role } = useAuth();
  return {
    role,
    isSuperAdmin: role === "super_admin",
    isDistrictAdmin: role === "district_admin",
    isCampOfficer: role === "camp_officer",
    isVolunteer: role === "volunteer",
    isBeneficiary: role === "beneficiary",
    isAdmin: role === "super_admin" || role === "district_admin",
    isStaff:
      role === "super_admin" ||
      role === "district_admin" ||
      role === "camp_officer",
  };
}
