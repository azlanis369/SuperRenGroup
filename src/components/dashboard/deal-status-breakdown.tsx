"use client";

import { type DealStatus } from "@/lib/constants";
import { useLanguage } from "@/contexts/language-context";
import { formatPrice } from "@/lib/utils";

const COLORS: Record<DealStatus, string> = {
  closed: "bg-emerald-500",
  booked: "bg-gold",
  pending: "bg-amber-400",
  cancelled: "bg-red-400",
  refund: "bg-sky-400",
  others: "bg-slate-400",
};

const DOT: Record<DealStatus, string> = {
  closed: "bg-emerald-500",
  booked: "bg-gold",
  pending: "bg-amber-400",
  cancelled: "bg-red-400",
  refund: "bg-sky-400",
  others: "bg-slate-400",
};

/**
 * Segmented bar + legend showing the deal pipeline split by status,
 * with deal counts and total value per status.
 */
export function DealStatusBreakdown({
  data,
}: {
  data: { status: DealStatus; count: number; value: number }[];
}) {
  const { t } = useLanguage();
  const label = t.dealStatusLabel;
  const total = data.reduce((s, d) => s + d.count, 0);
  const closedValue =
    data.find((d) => d.status === "closed")?.value ?? 0;

  return (
    <div className="space-y-4">
      {/* Segmented bar */}
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {data.map((d) =>
          d.count > 0 ? (
            <div
              key={d.status}
              className={COLORS[d.status]}
              style={{ width: `${(d.count / Math.max(total, 1)) * 100}%` }}
              title={`${label[d.status]}: ${d.count}`}
            />
          ) : null,
        )}
      </div>

      {/* Legend */}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
        {data.map((d) => (
          <li key={d.status} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[d.status]}`} />
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-none text-foreground">
                {d.count}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  {label[d.status]}
                </span>
              </p>
              {d.value > 0 ? (
                <p className="mt-0.5 whitespace-nowrap text-[11px] tabular-nums text-muted-foreground">
                  {formatPrice(d.value)}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <p className="border-t border-border pt-3 text-xs text-muted-foreground">
        {t.deals.breakdownFoot(formatPrice(closedValue), total)}
      </p>
    </div>
  );
}
