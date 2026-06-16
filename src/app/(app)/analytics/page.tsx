import type { Metadata } from "next";
import { Percent, Clock, Wallet, AlertTriangle } from "lucide-react";
import { requireOnboardedUser, isAdmin } from "@/lib/auth";
import { getDashboardStats, getSwot } from "@/lib/data/stats";
import { LISTING_STATUS_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  MonthlyLineChart,
  SimpleBarChart,
  Funnel,
} from "@/components/dashboard/charts";
import { SwotPanel } from "@/components/dashboard/swot-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoBadge } from "@/components/demo-badge";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const user = await requireOnboardedUser();
  const admin = isAdmin(user.role);
  const scope = admin ? {} : { ownerId: user.id };

  const [stats, swot] = await Promise.all([
    getDashboardStats(scope),
    getSwot(scope),
  ]);

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
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          {admin
            ? "Pandangan mendalam prestasi seluruh kumpulan."
            : "Pandangan mendalam prestasi jualan anda."}
        </p>
        <DemoBadge className="mt-2" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Conversion Rate"
          value={`${stats.conversionRate}%`}
          hint="lead → closed"
          icon={Percent}
        />
        <StatCard
          label="Avg Days to Close"
          value={stats.avgDaysToClose}
          hint="hari"
          icon={Clock}
        />
        <StatCard
          label="Total Commission"
          value={formatPrice(stats.totalCommission)}
          hint="deal closed"
          icon={Wallet}
          tone="gold"
        />
        <StatCard
          label="Stale Listings"
          value={stats.staleListings}
          hint="> 45 hari"
          icon={AlertTriangle}
        />
      </div>

      <SwotPanel swot={swot} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyLineChart data={stats.monthlyLeads} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Closed Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyLineChart data={stats.monthlyClosed} color="hsl(41 52% 54%)" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <Funnel data={stats.funnel} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Area Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {areaData.length ? (
              <SimpleBarChart data={areaData} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Tiada data kawasan lagi.
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Listing Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length ? (
              <SimpleBarChart data={statusData} color="hsl(211 63% 16%)" />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Tiada listing lagi.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
