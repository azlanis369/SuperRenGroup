import type { Metadata } from "next";
import { Percent, Clock, Wallet, AlertTriangle } from "lucide-react";
import { requireOnboardedUser, isAdmin } from "@/lib/auth";
import { getDashboardStats, getSwot } from "@/lib/data/stats";
import { LISTING_STATUS_LABELS, SECTOR_LABELS } from "@/lib/constants";
import { getDict } from "@/lib/i18n/server";
import { formatPrice, formatCompact } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  MonthlyLineChart,
  SimpleBarChart,
  Funnel,
  MoneyBarChart,
} from "@/components/dashboard/charts";
import { DealStatusBreakdown } from "@/components/dashboard/deal-status-breakdown";
import { SwotPanel } from "@/components/dashboard/swot-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoBadge } from "@/components/demo-badge";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const user = await requireOnboardedUser();
  const admin = isAdmin(user.role);
  const scope = admin ? {} : { ownerId: user.id };

  const [stats, swot, dict] = await Promise.all([
    getDashboardStats(scope),
    getSwot(scope),
    getDict(),
  ]);
  const t = dict.analytics;
  const td = dict.dashboard;

  const statusData = stats.byStatus
    .map((s) => ({ label: LISTING_STATUS_LABELS[s.status], count: s.count }))
    .sort((a, b) => b.count - a.count);

  const areaData = stats.areaPerformance.map((a) => ({
    label: a.area,
    count: a.closed || a.listings,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground">
          {admin ? t.subtitleAdmin : t.subtitleAgent}
        </p>
        <DemoBadge className="mt-2" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t.conversionRate}
          value={`${stats.conversionRate}%`}
          hint={td.leadToClosed}
          icon={Percent}
        />
        <StatCard
          label={t.avgDaysToClose}
          value={stats.avgDaysToClose}
          hint={dict.common.days}
          icon={Clock}
        />
        <StatCard
          label={t.totalCommission}
          value={formatPrice(stats.totalCommission)}
          hint={t.closedHint}
          icon={Wallet}
          tone="gold"
        />
        <StatCard
          label={t.staleListings}
          value={stats.staleListings}
          hint={t.staleHint}
          icon={AlertTriangle}
        />
      </div>

      {/* Sector performance */}
      <Card>
        <CardHeader>
          <CardTitle>{t.sectorPerf}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {stats.bySector.map((s) => (
              <div
                key={s.sector}
                className="rounded-xl border border-border bg-muted/30 p-3 text-center"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {SECTOR_LABELS[s.sector]}
                </p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  RM {formatCompact(s.value)}
                </p>
                <p className="text-xs text-muted-foreground">{s.closed} closed</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
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
            <CardTitle>{t.salesValue6m}</CardTitle>
          </CardHeader>
          <CardContent>
            <MoneyBarChart data={stats.monthlySales} />
          </CardContent>
        </Card>
      </div>

      <SwotPanel swot={swot} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{td.monthlyLeads}</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyLineChart data={stats.monthlyLeads} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{td.monthlyClosed}</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyLineChart data={stats.monthlyClosed} color="hsl(41 52% 54%)" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{td.conversionFunnel}</CardTitle>
          </CardHeader>
          <CardContent>
            <Funnel data={stats.funnel} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{td.areaPerformance}</CardTitle>
          </CardHeader>
          <CardContent>
            {areaData.length ? (
              <SimpleBarChart data={areaData} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {td.noArea}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{td.statusDistribution}</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length ? (
              <SimpleBarChart data={statusData} color="hsl(211 63% 16%)" />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {td.noListing}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
