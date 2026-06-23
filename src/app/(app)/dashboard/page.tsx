import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  Share2,
  Users,
  CalendarCheck,
  CheckCircle2,
  Percent,
  Clock,
  MapPin,
  PlusCircle,
} from "lucide-react";
import { requireOnboardedUser, isAdmin } from "@/lib/auth";
import { getDashboardStats, getSwot, getAgentStanding } from "@/lib/data/stats";
import { CATEGORY_LABELS, LISTING_STATUS_LABELS } from "@/lib/constants";
import { getDict } from "@/lib/i18n/server";
import { formatCompact, formatPrice } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  MonthlyLineChart,
  SimpleBarChart,
  Funnel,
  MoneyBarChart,
} from "@/components/dashboard/charts";
import { DealStatusBreakdown } from "@/components/dashboard/deal-status-breakdown";
import { AgentStandingCard } from "@/components/dashboard/agent-standing";
import { AgentLeaderboard } from "@/components/admin/leaderboard";
import { SwotPanel } from "@/components/dashboard/swot-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DemoBadge } from "@/components/demo-badge";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireOnboardedUser();
  const admin = isAdmin(user.role);
  const scope = admin ? {} : { ownerId: user.id };

  const [stats, swot, standing, dict] = await Promise.all([
    getDashboardStats(scope),
    getSwot(scope),
    admin ? Promise.resolve(null) : getAgentStanding(user.id),
    getDict(),
  ]);
  const t = dict.dashboard;

  const statusData = stats.byStatus
    .map((s) => ({ label: LISTING_STATUS_LABELS[s.status], count: s.count }))
    .sort((a, b) => b.count - a.count);

  const areaData = stats.areaPerformance.map((a) => ({
    label: a.area,
    count: a.closed || a.listings,
  }));

  const greeting = user.profile?.display_name || user.profile?.full_name;
  const firstName = (greeting ?? "Agen").split(" ")[0];
  const salesMoM =
    stats.salesValueLastMonth > 0
      ? Math.round(
          ((stats.salesValueThisMonth - stats.salesValueLastMonth) /
            stats.salesValueLastMonth) *
            100,
        )
      : stats.salesValueThisMonth > 0
        ? 100
        : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {t.greeting(greeting ?? "")}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {admin ? t.subtitleAdmin : t.subtitleAgent}
          </p>
          <DemoBadge className="mt-2" />
        </div>
        <Button asChild>
          <Link href="/listings/new">
            <PlusCircle className="h-4 w-4" /> {dict.common.addListing}
          </Link>
        </Button>
      </div>

      {/* Standing & yearly achievement (agents) */}
      {standing ? (
        <AgentStandingCard standing={standing} firstName={firstName} />
      ) : null}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          label={t.activeListings}
          value={stats.activeListings}
          hint={t.totalListingsHint(stats.totalListings)}
          icon={Building2}
        />
        <StatCard
          label={t.sharesThisMonth}
          value={stats.sharesThisMonth}
          icon={Share2}
          tone="gold"
        />
        <StatCard
          label={t.leadsThisMonth}
          value={stats.leadsThisMonth}
          icon={Users}
        />
        <StatCard
          label={t.bookingsThisMonth}
          value={stats.bookingsThisMonth}
          icon={CalendarCheck}
        />
        <StatCard
          label={t.closedThisMonth}
          value={stats.closedThisMonth}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label={t.salesThisMonth}
          value={`RM ${formatCompact(stats.salesValueThisMonth)}`}
          hint={t.vsLastMonth(salesMoM >= 0 ? "▲" : "▼", Math.abs(salesMoM))}
          icon={CheckCircle2}
          tone="gold"
        />
        <StatCard
          label={t.conversionRate}
          value={`${stats.conversionRate}%`}
          hint={t.leadToClosed}
          icon={Percent}
        />
        <StatCard
          label={t.avgDaysToClose}
          value={stats.avgDaysToClose}
          hint={dict.common.days}
          icon={Clock}
        />
        <StatCard
          label={t.topArea}
          value={stats.topArea ?? "—"}
          hint={
            stats.topCategory
              ? t.category(
                  CATEGORY_LABELS[stats.topCategory as keyof typeof CATEGORY_LABELS] ??
                    stats.topCategory,
                )
              : undefined
          }
          icon={MapPin}
          tone="gold"
        />
      </div>

      {/* Leaderboard — healthy competition (agents see their own rank) */}
      {standing ? (
        <Card>
          <CardHeader>
            <CardTitle>{t.leaderboardTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <AgentLeaderboard
              sectorLeaderboards={standing.sectorLeaderboards}
              overallLeaderboard={standing.overallLeaderboard}
              highlightUserId={user.id}
            />
          </CardContent>
        </Card>
      ) : null}

      {admin ? (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-3 p-4 text-sm">
            <Metric label={t.totalCommission} value={formatPrice(stats.totalCommission)} />
            <Metric label={t.staleListings} value={String(stats.staleListings)} />
            <Metric label={t.totalViews} value={formatCompact(stats.funnel[0]?.count ?? 0)} />
          </CardContent>
        </Card>
      ) : null}

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.monthlyLeads}</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyLineChart data={stats.monthlyLeads} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.monthlyClosed}</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyLineChart data={stats.monthlyClosed} color="hsl(41 52% 54%)" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.salesValue6m}</CardTitle>
          </CardHeader>
          <CardContent>
            <MoneyBarChart data={stats.monthlySales} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.dealStatus}</CardTitle>
          </CardHeader>
          <CardContent>
            <DealStatusBreakdown data={stats.dealStatusBreakdown} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.conversionFunnel}</CardTitle>
          </CardHeader>
          <CardContent>
            <Funnel data={stats.funnel} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.areaPerformance}</CardTitle>
          </CardHeader>
          <CardContent>
            {areaData.length ? (
              <SimpleBarChart data={areaData} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t.noArea}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t.statusDistribution}</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length ? (
              <SimpleBarChart data={statusData} color="hsl(211 63% 16%)" />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t.noListing}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <SwotPanel swot={swot} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
