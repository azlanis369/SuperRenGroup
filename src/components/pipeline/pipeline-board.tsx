"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { formatCompact } from "@/lib/utils";
import type { AgentStamp } from "@/lib/share";
import { Badge } from "@/components/ui/badge";
import { FollowUpActions } from "@/components/deals/follow-up-actions";

export type Stage =
  | "lead"
  | "qualified"
  | "viewing"
  | "negotiation"
  | "booking"
  | "processing"
  | "completed"
  | "lost";

export type PipelineItem = {
  id: string;
  kind: "lead" | "deal";
  status: string; // original lead/deal status (for Autobot)
  stage: Stage;
  name: string;
  phone: string | null;
  listingId: string | null;
  listingTitle: string | null;
  value: number; // numeric value (0 if unknown)
  valueText: string | null; // e.g. budget string for leads
  dealType?: "sale" | "rental";
};

const STAGE_ORDER: Stage[] = [
  "lead",
  "qualified",
  "viewing",
  "negotiation",
  "booking",
  "processing",
  "completed",
  "lost",
];

const STAGE_DOT: Record<Stage, string> = {
  lead: "bg-slate-400",
  qualified: "bg-sky-400",
  viewing: "bg-indigo-400",
  negotiation: "bg-amber-400",
  booking: "bg-gold",
  processing: "bg-orange-400",
  completed: "bg-emerald-500",
  lost: "bg-red-400",
};

export function PipelineBoard({
  items,
  agent,
}: {
  items: PipelineItem[];
  agent?: AgentStamp;
}) {
  const { t } = useLanguage();
  const tp = t.pipeline;

  const byStage = STAGE_ORDER.map((stage) => {
    const list = items.filter((i) => i.stage === stage);
    const value = list.reduce((s, i) => s + i.value, 0);
    return { stage, list, value };
  });

  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
      {byStage.map(({ stage, list, value }) => (
        <div key={stage} className="w-[260px] shrink-0">
          <div className="mb-2 flex items-center justify-between rounded-lg bg-muted px-3 py-2">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <span className={`h-2.5 w-2.5 rounded-full ${STAGE_DOT[stage]}`} />
              {tp.stages[stage]}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {list.length}
            </span>
          </div>
          {value > 0 ? (
            <p className="mb-2 px-1 text-[11px] text-muted-foreground">
              {tp.value}: RM {formatCompact(value)}
            </p>
          ) : null}
          <div className="space-y-2">
            {list.map((i) => (
              <div
                key={i.id}
                className="rounded-xl border border-border bg-card p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-1 text-sm font-semibold text-foreground">
                    {i.name}
                  </p>
                  <Badge tone={i.kind === "deal" ? "primary" : "neutral"}>
                    {i.kind === "deal"
                      ? i.dealType === "rental"
                        ? t.deals.rental
                        : t.deals.sale
                      : "Lead"}
                  </Badge>
                </div>
                {i.listingTitle ? (
                  i.listingId ? (
                    <Link
                      href={`/listings/${i.listingId}`}
                      className="mt-1 line-clamp-1 block text-xs text-primary hover:underline"
                    >
                      {i.listingTitle}
                    </Link>
                  ) : (
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {i.listingTitle}
                    </p>
                  )
                ) : null}
                <p className="mt-1 text-sm font-bold">
                  {i.value > 0
                    ? `RM ${formatCompact(i.value)}`
                    : (i.valueText ?? "—")}
                </p>
                {i.phone ? (
                  <FollowUpActions
                    phone={i.phone}
                    kind={i.kind}
                    status={i.status}
                    customerName={i.name}
                    listingTitle={i.listingTitle}
                    agent={agent}
                  />
                ) : null}
              </div>
            ))}
            {list.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                —
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
