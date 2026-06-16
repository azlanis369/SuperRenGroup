import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  UserCheck,
  UserPlus,
  Building2,
  Wallet,
  TrendingUp,
  ExternalLink,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { ROLES, type Role, type UserStatus } from "@/lib/constants";
import { getAdminOverview, getDashboardStats } from "@/lib/data/stats";
import { createClient } from "@/lib/supabase/server";
import { LOCAL_DEMO } from "@/lib/demo-mode";
import { demoUsers, demoAgents } from "@/lib/demo-data/dataset";
import { formatPrice } from "@/lib/utils";
import type { AgentProfileRow, UserRow } from "@/lib/database.types";
import type { BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { MoneyBarChart } from "@/components/dashboard/charts";
import { DealStatusBreakdown } from "@/components/dashboard/deal-status-breakdown";
import { AgentLeaderboard } from "@/components/admin/leaderboard";
import { EmptyState } from "@/components/empty-state";
import { DemoBadge } from "@/components/demo-badge";
import { DemoResetCard } from "@/components/admin/demo-reset-card";

export const metadata: Metadata = { title: "Group Manager" };

const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  agent: "Agent",
};

const ROLE_TONE: Record<Role, NonNullable<BadgeProps["tone"]>> = {
  super_admin: "primary",
  admin: "gold",
  agent: "neutral",
};

const STATUS_TONE: Record<UserStatus, NonNullable<BadgeProps["tone"]>> = {
  active: "success",
  pending: "warning",
  deactivated: "danger",
};

const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Active",
  pending: "Pending",
  deactivated: "Deactivated",
};

function momPct(now: number, prev: number): { pct: number; up: boolean } {
  if (prev <= 0) return { pct: now > 0 ? 100 : 0, up: now >= prev };
  const pct = Math.round(((now - prev) / prev) * 100);
  return { pct: Math.abs(pct), up: now >= prev };
}

export default async function AdminPage() {
  await requireRole([ROLES.ADMIN, ROLES.SUPER_ADMIN]);

  let userRows: UserRow[];
  let profileRows: AgentProfileRow[];
  let overview: Awaited<ReturnType<typeof getAdminOverview>>;
  let stats: Awaited<ReturnType<typeof getDashboardStats>>;

  if (LOCAL_DEMO) {
    [overview, stats] = await Promise.all([
      getAdminOverview(),
      getDashboardStats({}),
    ]);
    userRows = demoUsers as UserRow[];
    profileRows = demoAgents as AgentProfileRow[];
  } else {
    const supabase = await createClient();
    const [ov, st, usersRes, profilesRes] = await Promise.all([
      getAdminOverview(),
      getDashboardStats({}),
      supabase.from("users").select("*"),
      supabase.from("agent_profiles").select("*"),
    ]);
    overview = ov;
    stats = st;
    userRows = (usersRes.data ?? []) as UserRow[];
    profileRows = (profilesRes.data ?? []) as AgentProfileRow[];
  }
  const profileByUser = new Map(profileRows.map((p) => [p.user_id, p]));
  const mom = momPct(stats.salesValueThisMonth, stats.salesValueLastMonth);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Group Manager</h1>
        <p className="text-muted-foreground">
          Prestasi & persaingan sihat seluruh kumpulan — Super Ren Group.
        </p>
        <DemoBadge className="mt-2" />
      </div>

      {/* Group KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Jumlah Agen" value={overview.totalAgents} icon={Users} />
        <StatCard
          label="Agen Aktif"
          value={overview.activeAgents}
          icon={UserCheck}
          tone="success"
        />
        <StatCard
          label="Menunggu"
          value={overview.pendingAgents}
          icon={UserPlus}
          hint="pending"
        />
        <StatCard
          label="Jualan Bulan Ini"
          value={`RM ${Math.round(stats.salesValueThisMonth / 1000)}k`}
          hint={`${mom.up ? "▲" : "▼"} ${mom.pct}% vs bln lalu`}
          icon={TrendingUp}
          tone="gold"
        />
        <StatCard
          label="Total Listings"
          value={stats.totalListings}
          icon={Building2}
        />
        <StatCard
          label="Komisen (closed)"
          value={formatPrice(stats.totalCommission)}
          icon={Wallet}
          tone="gold"
        />
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>🏆 Carta Top 10 Agen</CardTitle>
        </CardHeader>
        <CardContent>
          <AgentLeaderboard
            sectorLeaderboards={overview.sectorLeaderboards}
            overallLeaderboard={overview.overallLeaderboard}
          />
        </CardContent>
      </Card>

      {/* Group sales trend + deal status */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nilai Jualan Kumpulan (6 Bulan)</CardTitle>
          </CardHeader>
          <CardContent>
            <MoneyBarChart data={stats.monthlySales} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Status Deal (Intelligence)</CardTitle>
          </CardHeader>
          <CardContent>
            <DealStatusBreakdown data={stats.dealStatusBreakdown} />
          </CardContent>
        </Card>
      </div>

      {/* Users */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Pengguna ({userRows.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {userRows.length === 0 ? (
            <EmptyState icon={Users} title="Tiada pengguna" />
          ) : (
            <ul className="max-h-[480px] divide-y divide-border overflow-y-auto">
              {userRows.map((u) => {
                const profile = profileByUser.get(u.id);
                const name =
                  profile?.display_name || profile?.full_name || u.email;
                return (
                  <li
                    key={u.id}
                    className="flex items-center justify-between gap-3 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {u.email}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone={ROLE_TONE[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                      <Badge tone={STATUS_TONE[u.status]}>
                        {STATUS_LABELS[u.status]}
                      </Badge>
                      {profile?.slug ? (
                        <Link
                          href={`/agent/${profile.slug}`}
                          className="text-muted-foreground hover:text-primary"
                          aria-label="Lihat profil awam"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? <DemoResetCard /> : null}
    </div>
  );
}
