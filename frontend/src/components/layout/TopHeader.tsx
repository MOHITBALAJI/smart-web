import React from "react";
import { Bell, Moon, Sun, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface TopHeaderProps {
  title?: string;
  subtitle?: string;
  notificationCount?: number;
  onDarkModeToggle?: () => void;
  isDark?: boolean;
  className?: string;
}

export function TopHeader({
  title,
  subtitle,
  notificationCount = 0,
  onDarkModeToggle,
  isDark,
  className,
}: TopHeaderProps) {
  const { user } = useAuth();

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex items-center justify-between gap-4 px-6 py-3.5",
        "bg-background/95 backdrop-blur-md border-b border-border",
        className
      )}
    >
      {/* Left: Page Title */}
      <div className="min-w-0">
        {title && (
          <h1 className="text-lg font-bold text-foreground truncate leading-tight">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Live indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/20">
          <span className="live-dot" />
          <span className="text-xs font-medium text-success-foreground/80">
            Live
          </span>
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative" asChild>
          <a href="/notifications">
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-red-500 text-white border-0 animate-notification">
                {notificationCount > 9 ? "9+" : notificationCount}
              </Badge>
            )}
          </a>
        </Button>

        {/* Dark mode */}
        {onDarkModeToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDarkModeToggle}
            className="text-muted-foreground hover:text-foreground"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        )}
      </div>
    </header>
  );
}
