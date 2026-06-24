"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ListChecks, Check, RotateCcw, Clock } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import type { FollowUpTask, TaskType, TaskPriority } from "@/lib/data/tasks";
import type { AgentStamp } from "@/lib/share";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FollowUpActions } from "@/components/deals/follow-up-actions";

const DONE_KEY = "srg_demo_tasks_done";

const PRIORITY_TONE: Record<TaskPriority, "danger" | "warning" | "neutral"> = {
  overdue: "danger",
  today: "warning",
  soon: "neutral",
};
const TYPE_TONE: Record<TaskType, "primary" | "gold" | "info"> = {
  lead: "info",
  deal: "primary",
  viewing: "gold",
};

type Tab = "pending" | "done";
type TypeFilter = "all" | TaskType;

function readDone(): Set<string> {
  if (typeof localStorage === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DONE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function TaskBoard({
  tasks,
  agent,
}: {
  tasks: FollowUpTask[];
  agent?: AgentStamp;
}) {
  const { t } = useLanguage();
  const tt = t.tasks;
  const [done, setDone] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<Tab>("pending");
  const [type, setType] = useState<TypeFilter>("all");

  useEffect(() => setDone(readDone()), []);

  function toggle(id: string) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(DONE_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  const pending = useMemo(() => tasks.filter((x) => !done.has(x.id)), [tasks, done]);

  const kpi = useMemo(() => {
    let overdue = 0,
      today = 0,
      week = 0;
    for (const x of pending) {
      if (x.priority === "overdue") overdue++;
      if (x.priority === "today") today++;
      if (x.priority === "today" || x.priority === "soon") week++;
    }
    return { overdue, today, week, done: done.size };
  }, [pending, done]);

  const rows = useMemo(() => {
    const base = tab === "pending" ? pending : tasks.filter((x) => done.has(x.id));
    return type === "all" ? base : base.filter((x) => x.type === type);
  }, [tab, type, pending, tasks, done]);

  const TYPES: TypeFilter[] = ["all", "lead", "deal", "viewing"];

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label={tt.overdue} value={kpi.overdue} accent="text-red-600" />
        <Kpi label={tt.today} value={kpi.today} accent="text-amber-600" />
        <Kpi label={tt.week} value={kpi.week} accent="text-primary" />
        <Kpi label={tt.done} value={kpi.done} accent="text-emerald-600" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        <Seg active={tab === "pending"} onClick={() => setTab("pending")}>
          {tt.tabPending}
        </Seg>
        <Seg active={tab === "done"} onClick={() => setTab("done")}>
          {tt.tabDone}
        </Seg>
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap gap-2">
        {TYPES.map((ty) => (
          <Chip key={ty} active={type === ty} onClick={() => setType(ty)}>
            {ty === "all" ? t.common.all : tt.typeLabel[ty]}
          </Chip>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">{tt.count(rows.length)}</p>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          <ListChecks className="mx-auto mb-2 h-6 w-6 opacity-50" />
          {tab === "pending" ? `🎉 ${tt.empty}` : tt.emptyDone}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((task) => {
            const isDone = done.has(task.id);
            return (
              <Card key={task.id} className={cn("p-4", isDone && "opacity-60")}>
                <div className="flex items-start justify-between gap-2">
                  <Badge tone={TYPE_TONE[task.type]}>{tt.typeLabel[task.type]}</Badge>
                  {!isDone ? (
                    <Badge tone={PRIORITY_TONE[task.priority]}>
                      {tt.priorityLabel[task.priority]}
                    </Badge>
                  ) : null}
                </div>

                <p
                  className={cn(
                    "mt-3 font-semibold leading-tight",
                    isDone && "line-through",
                  )}
                >
                  {task.title}
                </p>
                <p className="text-sm text-muted-foreground">{task.customerName}</p>

                {task.listingTitle ? (
                  task.listingId ? (
                    <Link
                      href={`/listings/${task.listingId}`}
                      className="mt-1 line-clamp-1 block text-xs text-primary hover:underline"
                    >
                      {task.listingTitle}
                    </Link>
                  ) : (
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {task.listingTitle}
                    </p>
                  )
                ) : null}

                {task.dueAt ? (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {tt.due(formatDate(task.dueAt))}
                  </p>
                ) : null}

                {!isDone && task.phone ? (
                  <FollowUpActions
                    phone={task.phone}
                    kind={task.type === "deal" ? "deal" : "lead"}
                    status={task.status}
                    customerName={task.customerName}
                    listingTitle={task.listingTitle}
                    agent={agent}
                  />
                ) : null}

                <button
                  onClick={() => toggle(task.id)}
                  className={cn(
                    "mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                    isDone
                      ? "border-border bg-card text-muted-foreground hover:bg-muted"
                      : "border-emerald-600 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                  )}
                >
                  {isDone ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5" /> {tt.undo}
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" /> {tt.markDone}
                    </>
                  )}
                </button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold tabular-nums", accent)}>{value}</p>
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
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
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
