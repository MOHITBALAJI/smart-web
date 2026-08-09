import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Illustrated empty state for tables, lists, and pages with no data */
export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-muted/60 mb-4">
          <Icon className="h-8 w-8 text-muted-foreground/60" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
        {actionLabel && onAction && (
          <Button onClick={onAction} className="mt-5" size="sm">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
