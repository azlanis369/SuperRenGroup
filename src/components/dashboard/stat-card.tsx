import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "gold" | "success";
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {hint ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {hint}
            </p>
          ) : null}
        </div>
        {Icon ? (
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              tone === "gold" && "bg-gold/15 text-gold-foreground",
              tone === "success" && "bg-green-100 text-green-700",
              tone === "default" && "bg-primary/10 text-primary",
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
        ) : null}
      </div>
    </Card>
  );
}
