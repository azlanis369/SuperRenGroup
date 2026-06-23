"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUp, ArrowDown, Minus, Trophy } from "lucide-react";
import { type Sector } from "@/lib/constants";
import { useLanguage } from "@/contexts/language-context";
import { formatCompact } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type LeaderRow = {
  userId: string;
  name: string;
  photo: string | null;
  area: string | null;
  thisMonthValue: number;
  lastMonthValue: number;
  thisMonthClosed: number;
  totalValue: number;
  totalClosed: number;
  totalCommission: number;
  rankDelta: number;
};

type Tab = Sector | "overall";

export function AgentLeaderboard({
  sectorLeaderboards,
  overallLeaderboard,
  highlightUserId,
}: {
  sectorLeaderboards: { sector: Sector; rows: LeaderRow[] }[];
  overallLeaderboard: LeaderRow[];
  highlightUserId?: string;
}) {
  const [tab, setTab] = useState<Tab>("overall");
  const { t } = useLanguage();
  const tl = t.leaderboard;

  const tabs: { key: Tab; label: string }[] = [
    { key: "overall", label: tl.overall },
    ...sectorLeaderboards.map((s) => ({
      key: s.sector as Tab,
      label: t.segment[s.sector],
    })),
  ];

  const rows =
    tab === "overall"
      ? overallLeaderboard
      : (sectorLeaderboards.find((s) => s.sector === tab)?.rows ?? []);

  return (
    <div>
      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-secondary",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {tl.noSector}
        </p>
      ) : (
        <ol className="space-y-2">
          {rows.map((r, i) => (
            <LeaderItem
              key={r.userId}
              row={r}
              rank={i + 1}
              highlight={r.userId === highlightUserId}
            />
          ))}
        </ol>
      )}
      <p className="mt-3 text-xs text-muted-foreground">{tl.note}</p>
    </div>
  );
}

function LeaderItem({
  row,
  rank,
  highlight = false,
}: {
  row: LeaderRow;
  rank: number;
  highlight?: boolean;
}) {
  const { t } = useLanguage();
  const tl = t.leaderboard;
  const medal =
    rank === 1
      ? "bg-gold text-white"
      : rank === 2
        ? "bg-slate-300 text-slate-800"
        : rank === 3
          ? "bg-amber-700/80 text-white"
          : "bg-muted text-muted-foreground";

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl border p-2.5 pr-3.5",
        highlight
          ? "border-gold bg-gold/10 ring-1 ring-gold"
          : "border-border bg-card",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
          medal,
        )}
      >
        {rank <= 3 ? <Trophy className="h-4 w-4" /> : rank}
      </div>

      {row.photo ? (
        <Image
          src={row.photo}
          alt={row.name}
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
          {row.name.slice(0, 1)}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {row.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {row.area ?? "—"} · {tl.closedThisMonth(row.thisMonthClosed)}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-foreground">
          RM {formatCompact(row.thisMonthValue)}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {tl.lastMonth(formatCompact(row.lastMonthValue))}
        </p>
      </div>

      <RankDelta delta={row.rankDelta} />
    </li>
  );
}

function RankDelta({ delta }: { delta: number }) {
  if (delta > 0)
    return (
      <span className="flex w-9 shrink-0 items-center justify-end gap-0.5 text-xs font-semibold text-emerald-600">
        <ArrowUp className="h-3.5 w-3.5" />
        {delta}
      </span>
    );
  if (delta < 0)
    return (
      <span className="flex w-9 shrink-0 items-center justify-end gap-0.5 text-xs font-semibold text-red-500">
        <ArrowDown className="h-3.5 w-3.5" />
        {Math.abs(delta)}
      </span>
    );
  return (
    <span className="flex w-9 shrink-0 items-center justify-end text-muted-foreground">
      <Minus className="h-3.5 w-3.5" />
    </span>
  );
}
