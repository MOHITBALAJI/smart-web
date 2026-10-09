import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();

    // Accept real Supabase session OR sandbox demo login
    const hasDemoToken =
      typeof window !== "undefined" &&
      (() => { try { return localStorage.getItem("demo_auth_active") === "true"; } catch { return false; } })();

    if (!session && !hasDemoToken) {
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
      const hasDemoToken =
        typeof window !== "undefined" &&
        (() => { try { return localStorage.getItem("demo_auth_active") === "true"; } catch { return false; } })();

      if (hasDemoToken) return; // sandbox login — user is set in React state

      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          navigate({ to: "/auth" });
        }
      });
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

