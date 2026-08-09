import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Bell } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function DashboardShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  // Query unread notification count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-notifications-count"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return 0;
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("read", false)
        .or(`user_id.eq.${userData.user.id},user_id.is.null`);
      return count ?? 0;
    },
  });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background transition-colors duration-300">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Sticky top bar header */}
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/80 bg-background/80 px-4 backdrop-blur md:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <div className="h-4 w-[1px] bg-border/60 mx-1 hidden md:block" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:block">
                National Disaster Relief Portal
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="icon" variant="ghost" className="relative rounded-full hover:bg-muted/80">
                <Link to="/notifications">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
                  )}
                </Link>
              </Button>
            </div>
          </header>

          {/* Page contents with page-enter animation */}
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 page-enter">
            <div className="flex flex-col gap-0.5 pb-5 border-b border-border/80 mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
