import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, MapPin, Users, HomeIcon, Package, HeartHandshake, QrCode, Bell, FileText, Shield, LogOut, ClipboardList, Map, User, HandHeart, ShieldAlert } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useRoles } from "@/hooks/use-role";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { ThemeToggle } from "./theme-toggle";
import { useEffect } from "react";

type NavItem = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  roles?: string[];
  group: "operations" | "management" | "portal" | "admin";
};

const navItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, group: "operations" },
  { title: "Camp Map", url: "/map", icon: Map, group: "operations" },
  { title: "Rescue Route Finder", url: "/rescue-route", icon: Map, group: "operations" },
  { title: "Notifications", url: "/notifications", icon: Bell, group: "operations" },

  { title: "Relief Camps", url: "/camps", icon: MapPin, group: "management" },
  { title: "Beneficiaries", url: "/beneficiaries", icon: Users, roles: ["super_admin", "camp_officer", "volunteer"], group: "management" },
  { title: "Families", url: "/families", icon: HomeIcon, roles: ["super_admin", "camp_officer", "volunteer"], group: "management" },
  { title: "Inventory", url: "/inventory", icon: Package, roles: ["super_admin", "camp_officer", "volunteer"], group: "management" },
  { title: "Distributions", url: "/distributions", icon: QrCode, roles: ["super_admin", "camp_officer", "volunteer"], group: "management" },
  { title: "Donations", url: "/donations", icon: HeartHandshake, roles: ["super_admin", "camp_officer", "volunteer"], group: "management" },
  { title: "Requests", url: "/requests", icon: ClipboardList, roles: ["super_admin", "camp_officer"], group: "management" },

  { title: "Volunteer Portal", url: "/volunteer", icon: HandHeart, roles: ["super_admin", "camp_officer", "volunteer"], group: "portal" },
  { title: "My Portal", url: "/my-portal", icon: User, roles: ["beneficiary", "super_admin", "camp_officer", "volunteer"], group: "portal" },

  { title: "Reports", url: "/reports", icon: FileText, roles: ["super_admin", "camp_officer"], group: "admin" },
  { title: "Audit Log", url: "/audit-log", icon: ShieldAlert, roles: ["super_admin"], group: "admin" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: profile } = useProfile();
  const { data: roles = [] } = useRoles();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Query unread notification count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-notifications-count"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return 0;
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("read", false)
        .or(`user_id.eq.${userData.user.id},user_id.is.null`);
      if (error) return 0;
      return count ?? 0;
    },
    refetchInterval: 15000, // Refresh count every 15s
  });

  // Subscribe to realtime notification changes for instant count update
  useEffect(() => {
    const channel = supabase
      .channel("sidebar-notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
        qc.invalidateQueries({ queryKey: ["unread-notifications-count"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const filteredNav = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.some((r) => roles.includes(r as any));
  });

  const renderGroup = (label: string, groupKey: NavItem["group"]) => {
    const items = filteredNav.filter((item) => item.group === groupKey);
    if (items.length === 0) return null;

    return (
      <SidebarGroup key={groupKey}>
        {!collapsed && <SidebarGroupLabel className="text-[10px] uppercase font-bold tracking-wider opacity-70">{label}</SidebarGroupLabel>}
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                  <Link to={item.url} className="flex items-center justify-between w-full group transition-all duration-200">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </div>
                    {item.title === "Notifications" && unreadCount > 0 && !collapsed && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white leading-none">
                        {unreadCount}
                      </span>
                    )}
                    {item.title === "Notifications" && unreadCount > 0 && collapsed && (
                      <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-rose-600" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar collapsible="icon" className="glass-sidebar border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border/50">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg gradient-accent text-accent-foreground shadow-sm">
            <Shield className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-semibold text-sidebar-foreground">Relief Portal</div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-sidebar-foreground/60">Govt of India</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2 space-y-1">
        {renderGroup("General Operations", "operations")}
        {renderGroup("Camp Management", "management")}
        {renderGroup("Portals", "portal")}
        {renderGroup("Administration", "admin")}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 p-2 space-y-2">
        <div className="px-1">
          <ThemeToggle collapsed={collapsed} />
        </div>
        
        {!collapsed && profile && (
          <div className="mx-1 rounded-lg bg-sidebar-accent/40 p-2.5 text-xs border border-sidebar-border/30">
            <div className="truncate font-semibold text-sidebar-foreground">{profile.full_name || profile.email}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {roles.map((r) => (
                <span key={r} className="rounded bg-sidebar-primary/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-sidebar-primary-foreground">
                  {r.replace("_", " ")}
                </span>
              ))}
            </div>
          </div>
        )}

        <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground font-medium" onClick={signOut}>
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-2">Sign out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
