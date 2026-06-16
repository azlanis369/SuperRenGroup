import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Users, TrendingUp, CheckCircle2, Trophy, AlertCircle } from "lucide-react";
import { requireOnboardedUser, isAdmin } from "@/lib/auth";
import { LOCAL_DEMO } from "@/lib/demo-mode";
import { isTeamLeader } from "@/lib/demo-data/dataset";
import { getTeamOverview } from "@/lib/data/stats";
import { formatPrice, formatCompact } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { TeamBoard } from "@/components/team/team-board";
import { DemoBadge } from "@/components/demo-badge";

export const metadata: Metadata = { title: "Pasukan Saya" };

export default async function TeamPage() {
  const user = await requireOnboardedUser();
  const leader = LOCAL_DEMO && isTeamLeader(user.id);
  if (!leader) redirect(isAdmin(user.role) ? "/admin" : "/dashboard");

  const team = await getTeamOverview(user.id);
  if (!team) redirect("/dashboard");

  const mom =
    team.lastMonthValue > 0
      ? Math.round(
          ((team.thisMonthValue - team.lastMonthValue) / team.lastMonthValue) *
            100,
        )
      : team.thisMonthValue > 0
        ? 100
        : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pasukan Saya</h1>
        <p className="text-muted-foreground">
          Pantau prestasi {team.memberCount} ejen di bawah seliaan anda — Super
          Ren Group.
        </p>
        <DemoBadge className="mt-2" />
      </div>

      {/* Team KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Jualan Pasukan (bln ini)"
          value={`RM ${formatCompact(team.thisMonthValue)}`}
          hint={`${mom >= 0 ? "▲" : "▼"} ${Math.abs(mom)}% vs bln lalu`}
          icon={TrendingUp}
          tone="gold"
        />
        <StatCard
          label="Closed (bln ini)"
          value={team.thisMonthClosed}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Ejen Aktif (bln ini)"
          value={`${team.activeThisMonth}/${team.memberCount}`}
          hint="ada closed"
          icon={Users}
        />
        <StatCard
          label="Jualan Pasukan (tahun)"
          value={`RM ${formatCompact(team.yearValue)}`}
          icon={Trophy}
          tone="gold"
        />
      </div>

      {/* Needs attention */}
      {team.needsAttention.length > 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {team.needsAttention.length} ejen belum ada closed bulan ini
            </p>
            <p className="text-sm text-amber-800">
              {team.needsAttention.map((m) => m.name).join(", ")} — beri
              bimbingan & follow-up minggu ini.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          Semua ejen aktif menutup jualan bulan ini. Syabas! 🎉
        </div>
      )}

      {/* Member board */}
      <Card>
        <CardHeader>
          <CardTitle>Prestasi Ahli Pasukan</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamBoard members={team.members} />
          <p className="mt-3 text-xs text-muted-foreground">
            Jumlah komisen pasukan (closed):{" "}
            <span className="font-semibold text-foreground">
              {formatPrice(team.thisMonthValue)}
            </span>{" "}
            nilai jualan bulan ini.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
