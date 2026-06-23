import Link from "next/link";
import { ChevronRight, ListChecks, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type DailyActionItem = {
  label: string;
  count: number;
  href: string;
  icon: LucideIcon;
  tone?: "default" | "gold" | "danger";
};

/**
 * "What to do today" — surfaces the few items that need the agent's attention
 * now (follow-ups, deals, stale listings, viewings) as quick links.
 */
export function DailyActions({
  title,
  emptyLabel,
  items,
}: {
  title: string;
  emptyLabel: string;
  items: DailyActionItem[];
}) {
  const active = items.filter((i) => i.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {active.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">🎉 {emptyLabel}</p>
        ) : (
          <ul className="divide-y divide-border">
            {active.map((i) => (
              <li key={i.label}>
                <Link
                  href={i.href}
                  className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      i.tone === "gold" && "bg-gold/15 text-gold-foreground",
                      i.tone === "danger" && "bg-red-100 text-red-700",
                      (!i.tone || i.tone === "default") &&
                        "bg-primary/10 text-primary",
                    )}
                  >
                    <i.icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
                    {i.label}
                  </span>
                  <span className="text-lg font-bold tabular-nums">{i.count}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
