import { Trophy, Medal, Target, CalendarClock, Flame } from "lucide-react";
import { SECTOR_LABELS } from "@/lib/constants";
import { formatPrice, formatCompact } from "@/lib/utils";
import type { AgentStanding } from "@/lib/data/stats";

const MILESTONES = [
  { v: 1_000_000, label: "RM1 Juta Club" },
  { v: 3_000_000, label: "RM3 Juta Club" },
  { v: 5_000_000, label: "RM5 Juta Club" },
  { v: 10_000_000, label: "RM10 Juta Club" },
  { v: 20_000_000, label: "RM20 Juta Club" },
  { v: 50_000_000, label: "RM50 Juta Club" },
];

function daysLeftInMonth(): number {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Math.max(0, end - now.getDate());
}

export function AgentStandingCard({
  standing,
  firstName,
}: {
  standing: AgentStanding;
  firstName: string;
}) {
  const year = new Date().getFullYear();
  const achieved = [...MILESTONES].reverse().find((m) => standing.yearValue >= m.v);
  const next = MILESTONES.find((m) => standing.yearValue < m.v);
  const progress = next ? Math.min(100, Math.round((standing.yearValue / next.v) * 100)) : 100;
  const daysLeft = daysLeftInMonth();

  const rankedSectors = standing.sectors.filter((s) => s.standing.rank != null);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary to-primary/85 text-primary-foreground shadow-card">
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        {/* Rank this month */}
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-white/70">
            <Trophy className="h-3.5 w-3.5 text-gold" /> Kedudukan bulan ini
          </p>
          <p className="mt-1 text-3xl font-extrabold">
            {standing.overall.rank ? `#${standing.overall.rank}` : "—"}
            <span className="ml-1 text-base font-medium text-white/70">
              / {standing.overall.of} agen
            </span>
          </p>
          <p className="text-sm text-white/80">
            Jualan bulan ini:{" "}
            <span className="font-semibold text-gold">
              RM {formatCompact(standing.overall.value)}
            </span>{" "}
            · {standing.overall.closed} closed
          </p>

          {rankedSectors.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {rankedSectors.map((s) => (
                <span
                  key={s.sector}
                  className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium"
                >
                  <Medal className="h-3 w-3 text-gold" />
                  {SECTOR_LABELS[s.sector]} #{s.standing.rank}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Yearly achievement */}
        <div className="sm:border-l sm:border-white/15 sm:pl-4">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-white/70">
            <Target className="h-3.5 w-3.5 text-gold" /> Pencapaian {year}
          </p>
          <p className="mt-1 text-2xl font-extrabold text-gold">
            {formatPrice(standing.yearValue)}
          </p>
          <p className="text-sm text-white/80">
            {standing.yearClosed} deal closed · komisen{" "}
            {formatPrice(standing.yearCommission)}
          </p>

          {achieved ? (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-xs font-bold text-gold-foreground">
              <Flame className="h-3.5 w-3.5" /> {achieved.label}
            </span>
          ) : null}

          {next ? (
            <div className="mt-2">
              <div className="mb-1 flex justify-between text-[11px] text-white/70">
                <span>Menuju {next.label}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-gold" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Periodic reminder */}
      <div className="flex items-center gap-2 border-t border-white/15 bg-black/15 px-5 py-2.5 text-sm">
        <CalendarClock className="h-4 w-4 shrink-0 text-gold" />
        <p className="text-white/90">
          {firstName}, tinggal <strong>{daysLeft} hari</strong> lagi bulan ini —
          {standing.overall.rank && standing.overall.rank > 1
            ? " kejar ranking lebih tinggi & kekalkan momentum! 🔥"
            : " pertahankan kedudukan teratas anda! 🏆"}
        </p>
      </div>
    </div>
  );
}
