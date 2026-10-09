import React, { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Map,
  Users,
  Tent,
  Package,
  QrCode,
  HeartHandshake,
  FileBarChart2,
  Bell,
  ScrollText,
  UserCircle,
  Shield,
  Siren,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  Activity,
  Truck,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth, useRole } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: number | string;
  roles?: string[];
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    to: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    exact: true,
  },
  {
    to: "/sos",
    icon: Siren,
    label: "Emergency SOS",
    roles: ["super_admin", "district_admin", "beneficiary"],
  },
  {
    to: "/rescue-route",
    icon: Map,
    label: "Rescue Route Finder",
  },
  {
    to: "/map",
    icon: Map,
    label: "Live Map",
    roles: ["super_admin", "district_admin", "camp_officer"],
  },
  {
    to: "/requests",
    icon: Activity,
    label: "SOS Requests",
    roles: ["super_admin", "district_admin", "camp_officer"],
  },
  {
    to: "/volunteer",
    icon: Truck,
    label: "My Missions",
    roles: ["volunteer"],
  },
  {
    to: "/beneficiaries",
    icon: Users,
    label: "Beneficiaries",
    roles: ["super_admin", "district_admin", "camp_officer"],
  },
  {
    to: "/families",
    icon: Users,
    label: "Families",
    roles: ["super_admin", "district_admin", "camp_officer"],
  },
  {
    to: "/camps",
    icon: Tent,
    label: "Relief Camps",
    roles: ["super_admin", "district_admin", "camp_officer"],
  },
  {
    to: "/inventory",
    icon: Package,
    label: "Inventory",
    roles: ["super_admin", "district_admin", "camp_officer"],
  },
  {
    to: "/distributions",
    icon: QrCode,
    label: "Distribution",
    roles: ["super_admin", "district_admin", "camp_officer", "volunteer"],
  },
  {
    to: "/donations",
    icon: HeartHandshake,
    label: "Donations",
  },
  {
    to: "/flood-zones",
    icon: Activity,
    label: "Flood Zones",
    roles: ["super_admin", "district_admin"],
  },
  {
    to: "/helpline",
    icon: Phone,
    label: "Helpline Directory",
  },
  {
    to: "/reports",
    icon: FileBarChart2,
    label: "Reports",
    roles: ["super_admin", "district_admin", "camp_officer"],
  },
  {
    to: "/my-portal",
    icon: UserCircle,
    label: "My Portal",
    roles: ["beneficiary"],
  },
  {
    to: "/notifications",
    icon: Bell,
    label: "Notifications",
  },
  {
    to: "/audit-log",
    icon: ScrollText,
    label: "Audit Log",
    roles: ["super_admin", "district_admin"],
  },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const { role, isAdmin } = useRole();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || !role || item.roles.includes(role)
  );

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out relative z-30",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-sidebar-border",
          collapsed && "justify-center px-2"
        )}
      >
        <div className="flex-shrink-0 w-9 h-9 rounded-lg gradient-hero flex items-center justify-center shadow-lg">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-bold text-sm leading-tight text-white font-outfit">
              FloodResponse
            </div>
            <div className="text-xs text-sidebar-foreground/60 truncate">
              Emergency Management
            </div>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {/* SOS quick access - always visible */}
        <Link
          to="/emergency"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold mb-3 transition-all",
            "bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30",
            collapsed && "justify-center px-2"
          )}
        >
          <Siren className="w-4 h-4 flex-shrink-0 text-red-400" />
          {!collapsed && <span>🚨 Emergency SOS</span>}
        </Link>

        {visibleItems.map((item) => {
          const isActive =
            item.exact
              ? currentPath === item.to
              : currentPath.startsWith(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150 group",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-colors",
                  isActive
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
                )}
              />
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <Badge
                  variant="secondary"
                  className="ml-auto text-xs h-5 px-1.5 animate-notification bg-red-500 text-white"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-sidebar-border p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 border-2 border-sidebar-primary/30">
              <AvatarImage src={user?.avatar_url || undefined} />
              <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary-foreground text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate text-white">
                {user?.full_name || "User"}
              </div>
              <div className="text-xs text-sidebar-foreground/50 capitalize truncate">
                {role?.replace("_", " ")}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              onClick={signOut}
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Avatar className="w-8 h-8 border-2 border-sidebar-primary/30">
              <AvatarImage src={user?.avatar_url || undefined} />
              <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary-foreground text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors shadow-md z-10"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>
    </aside>
  );
}
