import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Building2,
  Wallet,
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
import { EmptyState } from "@/components/empty-state";
import { DemoBadge } from "@/components/demo-badge";
import { DemoResetCard } from "@/components/admin/demo-reset-card";

export const metadata: Metadata = { title: "Admin Panel" };

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

  const totalLeads = stats.funnel.find((f) => f.stage === "Leads")?.count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">
          Ringkasan & pengurusan seluruh kumpulan.
        </p>
        <DemoBadge className="mt-2" />
      </div>

      {/* Group KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Agents" value={overview.totalAgents} icon={Users} />
        <StatCard
          label="Active Agents"
          value={overview.activeAgents}
          icon={UserCheck}
          tone="success"
        />
        <StatCard
          label="Total Listings"
          value={stats.totalListings}
          icon={Building2}
        />
        <StatCard
          label="Active Listings"
          value={stats.activeListings}
          icon={Building2}
        />
        <StatCard label="Total Leads" value={totalLeads} icon={Users} />
        <StatCard
          label="Commission"
          value={formatPrice(stats.totalCommission)}
          icon={Wallet}
          tone="gold"
        />
      </div>

      {/* Agent leaderboard */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Agent Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {overview.agentLeaderboard.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted-foreground">
              Belum ada deal closed.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Agent</th>
                  <th className="px-5 py-3 font-medium">Closed</th>
                  <th className="px-5 py-3 font-medium">Commission</th>
                </tr>
              </thead>
              <tbody>
                {overview.agentLeaderboard.map((a, i) => (
                  <tr
                    key={`${a.name}-${i}`}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-5 py-3 font-medium text-foreground">
                      {i + 1}. {a.name}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{a.closed}</td>
                    <td className="px-5 py-3 font-semibold">
                      {formatPrice(a.commission)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Users */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {userRows.length === 0 ? (
            <EmptyState icon={Users} title="Tiada pengguna" />
          ) : (
            <ul className="divide-y divide-border">
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
