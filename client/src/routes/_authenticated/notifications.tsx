import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Bell,
  Siren,
  Tent,
  Package,
  CheckCircle,
  Clock,
  Trash,
  MailOpen,
  Inbox
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

interface Notification {
  id: string;
  user_id: string | null;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const NOTIFICATION_ICONS: Record<string, any> = {
  sos: Siren,
  camp: Tent,
  inventory: Package,
  rescue: CheckCircle,
  system: Bell
};

const ICON_COLORS: Record<string, string> = {
  sos: "bg-red-500/10 text-red-600",
  camp: "bg-green-500/10 text-green-600",
  inventory: "bg-orange-500/10 text-orange-600",
  rescue: "bg-purple-500/10 text-purple-600",
  system: "bg-blue-500/10 text-blue-600"
};

function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const newNotif = payload.new as Notification;
          // Check if the notification is for the current user or broadcast (null)
          if (!newNotif.user_id || newNotif.user_id === user.id) {
            setNotifications(prev => [newNotif, ...prev]);
            toast.info(`🔔 ${newNotif.title}: ${newNotif.message}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .or(`user_id.eq.${user?.id},user_id.is.null`)
      .order("created_at", { ascending: false });

    if (!error && data) setNotifications(data);
    setLoading(false);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      toast.success("Notification marked as read");
    } catch (err: any) {
      toast.error(err.message || "Failed to update notification");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .or(`user_id.eq.${user?.id},user_id.is.null`);
      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    } catch (err: any) {
      toast.error(err.message || "Failed to update notifications");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("Notification deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete notification");
    }
  };

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <DashboardShell title="Emergency Notification Centre" subtitle="Live alerts, threshold updates, and assignment logs">
      <div className="space-y-6 page-enter max-w-3xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              className={filter === "all" ? "bg-primary text-white border-0" : "border-border"}
              onClick={() => setFilter("all")}
            >
              All Notifications
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              size="sm"
              className={filter === "unread" ? "bg-primary text-white border-0" : "border-border"}
              onClick={() => setFilter("unread")}
            >
              Unread
              {unreadCount > 0 && (
                <Badge className="ml-1.5 h-5 px-1.5 bg-red-500 text-white font-bold border-0">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </div>

          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={handleMarkAllRead}>
              <MailOpen className="w-3.5 h-3.5" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-card border rounded-2xl animate-shimmer" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-card border rounded-2xl text-muted-foreground">
            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
            <p className="font-semibold">All caught up!</p>
            <p className="text-sm mt-1">No emergency notifications in your queue.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((n) => {
              const Icon = NOTIFICATION_ICONS[n.type] || Bell;
              const colorClass = ICON_COLORS[n.type] || "bg-muted text-muted-foreground";

              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                    n.is_read
                      ? "bg-card border-border/60 opacity-80"
                      : "bg-primary/5 border-primary/20 shadow-xs border-l-4 border-l-primary"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className={`text-sm font-bold truncate ${n.is_read ? "text-foreground" : "text-primary"}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                    
                    <div className="flex gap-2 mt-2">
                      {!n.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(n.id)}
                          className="text-[10px] text-primary hover:underline font-bold"
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(n.id)}
                        className="text-[10px] text-red-500 hover:underline font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
