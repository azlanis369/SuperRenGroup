import Link from "next/link";
import { LEAD_STATUSES } from "@/lib/constants";
import { LEAD_STATUS_LABELS } from "@/components/leads/lead-status";
import { cn } from "@/lib/utils";

export function LeadFilterPills({
  active,
  source,
}: {
  active?: string;
  source?: string;
}) {
  const buildHref = (status?: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (source) params.set("source", source);
    const qs = params.toString();
    return qs ? `/leads?${qs}` : "/leads";
  };

  const pills = [
    { key: undefined, label: "Semua" },
    ...LEAD_STATUSES.map((s) => ({ key: s as string, label: LEAD_STATUS_LABELS[s] })),
  ];

  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
      {pills.map((pill) => {
        const isActive = (active ?? undefined) === pill.key;
        return (
          <Link
            key={pill.key ?? "all"}
            href={buildHref(pill.key)}
            className={cn(
              "whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-secondary",
            )}
          >
            {pill.label}
          </Link>
        );
      })}
    </div>
  );
}
