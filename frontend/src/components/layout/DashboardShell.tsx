import React from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function DashboardShell({
  children,
  title,
  subtitle,
  className,
}: DashboardShellProps) {
  const [isDark, setIsDark] = React.useState(() =>
    document.documentElement.classList.contains("dark")
  );

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark((prev) => !prev);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopHeader
          title={title}
          subtitle={subtitle}
          onDarkModeToggle={toggleDark}
          isDark={isDark}
        />
        <main
          className={cn(
            "flex-1 overflow-y-auto p-6 page-enter",
            className
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
