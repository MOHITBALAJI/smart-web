import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const getSafeLocalStorage = (key: string) => {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    try {
      return localStorage.getItem(key);
    } catch {}
  }
  return null;
};

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const hasToken = getSafeLocalStorage("sb-yugouljgwarsmkmhutke-auth-token") || getSafeLocalStorage("demo_auth_active");
    if (!session && !hasToken) {
      throw redirect({ to: "/auth" });
    }
    return { session };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      const hasToken = getSafeLocalStorage("sb-yugouljgwarsmkmhutke-auth-token") || getSafeLocalStorage("demo_auth_active");
      if (!hasToken) {
        supabase.auth.signOut().then(() => {
          navigate({ to: "/auth" });
        });
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return <Outlet />;
}

