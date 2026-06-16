"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUp, ArrowDown, Minus, Crown, AlertCircle } from "lucide-react";
import { cn, formatCompact } from "@/lib/utils";
import type { TeamMemberRow } from "@/lib/data/stats";

type SortKey = "month" | "year";

export function TeamBoard({ members }: { members: TeamMemberRow[] }) {
  const [sort, setSort] = useState<SortKey>("month");

  const rows = [...members].sort((a, b) =>
    sort === "month" ? b.thisMonth - a.thisMonth : b.yearValue - a.yearValue,
  );
  const best = Math.max(...members.map((m) => m.thisMonth), 1);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          {members.length} ahli pasukan
        </p>
        <div className="flex gap-1.5">
          <SortBtn active={sort === "month"} onClick={() => setSort("month")}>
            Bulan ini
          </SortBtn>
          <SortBtn active={sort === "year"} onClick={() => setSort("year")}>
            Tahun ini
          </SortBtn>
        </div>
      </div>

      <ul className="space-y-2">
        {rows.map((m, i) => {
          const mom =
            m.lastMonth > 0
              ? Math.round(((m.thisMonth - m.lastMonth) / m.lastMonth) * 100)
              : m.thisMonth > 0
                ? 100
                : 0;
          const quiet = !m.isLeader && m.thisMonthClosed === 0;
          return (
            <li
              key={m.userId}
              className={cn(
                "rounded-xl border p-3",
                m.isLeader
                  ? "border-gold/60 bg-gold/5"
                  : quiet
                    ? "border-red-200 bg-red-50/50"
                    : "border-border bg-card",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 shrink-0 text-center text-sm font-bold text-muted-foreground">
                  {i + 1}
                </span>
                {m.photo ? (
                  <Image
                    src={m.photo}
                    alt={m.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                    {m.name.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-foreground">
                    {m.name}
                    {m.isLeader ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold text-white">
                        <Crown className="h-2.5 w-2.5" /> Ketua
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.area ?? "—"} · {m.thisMonthClosed} closed bln ini ·{" "}
                    {m.yearClosed} setahun
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold">
                    RM {formatCompact(sort === "month" ? m.thisMonth : m.yearValue)}
                  </p>
                  {sort === "month" ? (
                    <Delta pct={mom} />
                  ) : (
                    <p className="text-[11px] text-muted-foreground">setahun</p>
                  )}
                </div>
              </div>

              {sort === "month" ? (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.round((m.thisMonth / best) * 100)}%` }}
                  />
                </div>
              ) : null}

              {quiet ? (
                <p className="mt-2 flex items-center gap-1 text-xs font-medium text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" /> Belum ada closed bulan ini
                  — perlu perhatian
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SortBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-secondary",
      )}
    >
      {children}
    </button>
  );
}

function Delta({ pct }: { pct: number }) {
  if (pct > 0)
    return (
      <span className="flex items-center justify-end gap-0.5 text-[11px] font-semibold text-emerald-600">
        <ArrowUp className="h-3 w-3" /> {pct}%
      </span>
    );
  if (pct < 0)
    return (
      <span className="flex items-center justify-end gap-0.5 text-[11px] font-semibold text-red-500">
        <ArrowDown className="h-3 w-3" /> {Math.abs(pct)}%
      </span>
    );
  return (
    <span className="flex items-center justify-end text-[11px] text-muted-foreground">
      <Minus className="h-3 w-3" />
    </span>
  );
}
