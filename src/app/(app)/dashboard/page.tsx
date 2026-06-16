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
import { getDashboardStats, getSwot } from "@/lib/data/stats";
import { CATEGORY_LABELS, LISTING_STATUS_LABELS } from "@/lib/constants";
import { formatCompact, formatPrice } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { MonthlyLineChart, SimpleBarChart, Funnel } from "@/components/dashboard/charts";
import { SwotPanel } from "@/components/dashboard/swot-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DemoBadge } from "@/components/demo-badge";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
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

  const greeting = user.profile?.display_name || user.profile?.full_name;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Hi, {greeting} 👋
            </h1>
          </div>
          <p className="text-muted-foreground">
            {admin
              ? "Ringkasan prestasi seluruh kumpulan."
              : "Ringkasan prestasi jualan anda bulan ini."}
          </p>
          <DemoBadge className="mt-2" />
        </div>
        <Button asChild>
          <Link href="/listings/new">
            <PlusCircle className="h-4 w-4" /> Add Listing
          </Link>
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          label="Active Listings"
          value={stats.activeListings}
          hint={`${stats.totalListings} jumlah listing`}
          icon={Building2}
        />
        <StatCard
          label="Shares (bulan ini)"
          value={stats.sharesThisMonth}
          icon={Share2}
          tone="gold"
        />
        <StatCard
          label="Leads (bulan ini)"
          value={stats.leadsThisMonth}
          icon={Users}
        />
        <StatCard
          label="Bookings (bulan ini)"
          value={stats.bookingsThisMonth}
          icon={CalendarCheck}
        />
        <StatCard
          label="Closed (bulan ini)"
          value={stats.closedThisMonth}
          icon={CheckCircle2}
          tone="success"
        />
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
          label="Top Area"
          value={stats.topArea ?? "—"}
          hint={
            stats.topCategory
              ? `Kategori: ${CATEGORY_LABELS[stats.topCategory as keyof typeof CATEGORY_LABELS] ?? stats.topCategory}`
              : undefined
          }
          icon={MapPin}
          tone="gold"
        />
      </div>

      {admin ? (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-3 p-4 text-sm">
            <Metric label="Total Commission (closed)" value={formatPrice(stats.totalCommission)} />
            <Metric label="Stale listings" value={String(stats.staleListings)} />
            <Metric label="Total views" value={formatCompact(stats.funnel[0]?.count ?? 0)} />
          </CardContent>
        </Card>
      ) : null}

      {/* Charts */}
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
