"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, MapPin, Clock } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import type { ViewingRow, ViewingStatus } from "@/lib/data/viewings";
import type { AgentStamp } from "@/lib/share";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FollowUpActions } from "@/components/deals/follow-up-actions";

const STATUS_TONE: Record<
  ViewingStatus,
  "primary" | "success" | "warning" | "danger" | "info" | "neutral"
> = {
  scheduled: "primary",
  completed: "success",
  rescheduled: "warning",
  cancelled: "danger",
  no_show: "danger",
  interested: "success",
  not_interested: "neutral",
};

const ALL_STATUSES: ViewingStatus[] = [
  "scheduled",
  "completed",
  "interested",
  "rescheduled",
  "no_show",
  "cancelled",
  "not_interested",
];

type Tab = "upcoming" | "all";

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function timeStr(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-MY", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function ViewingBoard({
  viewings,
  agent,
}: {
  viewings: ViewingRow[];
  agent?: AgentStamp;
}) {
  const { t } = useLanguage();
  const tv = t.viewing;
  const [tab, setTab] = useState<Tab>("upcoming");
  const [status, setStatus] = useState<ViewingStatus | "all">("all");

  const now = Date.now();
  const todayStart = startOfDay(new Date());
  const todayEnd = todayStart + 86400000;
  const weekEnd = todayStart + 7 * 86400000;

  // KPIs
  const kpi = useMemo(() => {
    let today = 0;
    let week = 0;
    let upcoming = 0;
    let completed = 0;
    for (const v of viewings) {
      const ts = new Date(v.scheduled_at).getTime();
      if (v.status === "completed") completed += 1;
      if (v.status === "scheduled" || v.status === "rescheduled") {
        if (ts >= now) upcoming += 1;
        if (ts >= todayStart && ts < todayEnd) today += 1;
        if (ts >= todayStart && ts < weekEnd) week += 1;
      }
    }
    return { today, week, upcoming, completed };
  }, [viewings, now, todayStart, todayEnd, weekEnd]);

  const rows = useMemo(() => {
    let list = viewings.slice();
    if (tab === "upcoming") {
      list = list.filter(
        (v) =>
          new Date(v.scheduled_at).getTime() >= todayStart &&
          (v.status === "scheduled" || v.status === "rescheduled"),
      );
      list.sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
      );
    } else {
      if (status !== "all") list = list.filter((v) => v.status === status);
      list.sort(
        (a, b) =>
          new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime(),
      );
    }
    return list;
  }, [viewings, tab, status, todayStart]);

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label={tv.today} value={kpi.today} accent="text-primary" />
        <Kpi label={tv.week} value={kpi.week} accent="text-indigo-500" />
        <Kpi label={tv.upcoming} value={kpi.upcoming} accent="text-gold-foreground" />
        <Kpi label={tv.completed} value={kpi.completed} accent="text-emerald-600" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        <Seg active={tab === "upcoming"} onClick={() => setTab("upcoming")}>
          {tv.tabUpcoming}
        </Seg>
        <Seg active={tab === "all"} onClick={() => setTab("all")}>
          {tv.tabAll}
        </Seg>
      </div>

      {/* Status filter (only on All) */}
      {tab === "all" ? (
        <div className="flex flex-wrap gap-2">
          <Chip active={status === "all"} onClick={() => setStatus("all")}>
            {t.common.all}
          </Chip>
          {ALL_STATUSES.map((s) => (
            <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
              {tv.statusLabel[s]}
            </Chip>
          ))}
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">{tv.count(rows.length)}</p>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          <CalendarClock className="mx-auto mb-2 h-6 w-6 opacity-50" />
          {tab === "upcoming" ? tv.noUpcoming : tv.empty}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((v) => (
            <Card key={v.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  {formatDate(v.scheduled_at)}
                </div>
                <Badge tone={STATUS_TONE[v.status]}>{tv.statusLabel[v.status]}</Badge>
              </div>

              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> {timeStr(v.scheduled_at)}
              </p>

              {v.listing_title ? (
                v.listing_id ? (
                  <Link
                    href={`/listings/${v.listing_id}`}
                    className="mt-3 line-clamp-2 block font-semibold leading-tight hover:text-primary"
                  >
                    {v.listing_title}
                  </Link>
                ) : (
                  <p className="mt-3 line-clamp-2 font-semibold leading-tight">
                    {v.listing_title}
                  </p>
                )
              ) : null}

              {v.location ? (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="line-clamp-1">{v.location}</span>
                </p>
              ) : null}

              <div className="mt-3 border-t border-border pt-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {tv.prospect}
                </p>
                <p className="font-medium text-foreground">{v.prospect_name}</p>
                {v.notes ? (
                  <p className="mt-1 text-xs text-muted-foreground">{v.notes}</p>
                ) : null}
                {v.prospect_phone ? (
                  <FollowUpActions
                    phone={v.prospect_phone}
                    kind="lead"
                    status="viewing"
                    customerName={v.prospect_name}
                    listingTitle={v.listing_title}
                    agent={agent}
                  />
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold", accent)}>{value}</p>
    </Card>
  );
}

function Chip({
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
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function Seg({
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
        "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-secondary",
      )}
    >
      {children}
    </button>
  );
}
