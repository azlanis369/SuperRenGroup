import { createClient } from "@/lib/supabase/server";
import { CLOSED_STATUSES, ROLES, type ListingStatus } from "@/lib/constants";
import { daysSince } from "@/lib/utils";
import type { ListingRow, DealRow, LeadRow } from "@/lib/database.types";
import { LOCAL_DEMO } from "@/lib/demo-mode";
import { demoScopedData } from "@/lib/demo-data/queries";
import { demoUsers, demoAgents, demoDeals } from "@/lib/demo-data/dataset";

const STALE_DAYS = 45;

function startOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

export type DashboardStats = {
  activeListings: number;
  totalListings: number;
  sharesThisMonth: number;
  leadsThisMonth: number;
  bookingsThisMonth: number;
  closedThisMonth: number;
  conversionRate: number; // leads -> closed, %
  avgDaysToClose: number;
  topArea: string | null;
  topCategory: string | null;
  staleListings: number;
  totalCommission: number;
  byStatus: { status: ListingStatus; count: number }[];
  monthlyLeads: { month: string; count: number }[];
  monthlyClosed: { month: string; count: number }[];
  areaPerformance: { area: string; listings: number; closed: number }[];
  funnel: { stage: string; count: number }[];
};

type StatScope = { ownerId?: string };

async function fetchScoped(scope: StatScope) {
  if (LOCAL_DEMO) {
    const d = demoScopedData(scope.ownerId);
    return {
      listings: d.listings,
      leads: d.leads,
      deals: d.deals,
      shares: d.shares as { id: string; shared_at: string }[],
    };
  }
  const supabase = await createClient();
  const listingsQ = supabase.from("listings").select("*").is("deleted_at", null);
  const leadsQ = supabase.from("leads").select("*");
  const dealsQ = supabase.from("deals").select("*");
  const sharesQ = supabase.from("shares").select("id, shared_at, agent_id");

  if (scope.ownerId) {
    listingsQ.eq("agent_id", scope.ownerId);
    leadsQ.eq("agent_id", scope.ownerId);
    dealsQ.eq("agent_id", scope.ownerId);
    sharesQ.eq("agent_id", scope.ownerId);
  }

  const [listings, leads, deals, shares] = await Promise.all([
    listingsQ,
    leadsQ,
    dealsQ,
    sharesQ,
  ]);

  return {
    listings: (listings.data ?? []) as ListingRow[],
    leads: (leads.data ?? []) as LeadRow[],
    deals: (deals.data ?? []) as DealRow[],
    shares: (shares.data ?? []) as { id: string; shared_at: string }[],
  };
}

function monthKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-MY", {
    month: "short",
    year: "2-digit",
  });
}

function lastSixMonths(): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 5; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(
      m.toLocaleDateString("en-MY", { month: "short", year: "2-digit" }),
    );
  }
  return out;
}

export async function getDashboardStats(
  scope: StatScope = {},
): Promise<DashboardStats> {
  const { listings, leads, deals, shares } = await fetchScoped(scope);
  const monthStart = startOfMonth();

  const activeListings = listings.filter((l) =>
    ["available", "interested", "viewing_scheduled"].includes(l.status),
  ).length;

  const sharesThisMonth = shares.filter(
    (s) => s.shared_at >= monthStart,
  ).length;
  const leadsThisMonth = leads.filter((l) => l.created_at >= monthStart).length;

  const closedDeals = deals.filter((d) => d.deal_status === "closed");
  const bookingsThisMonth = deals.filter(
    (d) =>
      d.deal_status === "booked" &&
      d.booking_date &&
      new Date(d.booking_date).toISOString() >= monthStart,
  ).length;
  const closedThisMonth = closedDeals.filter(
    (d) => d.closed_date && new Date(d.closed_date).toISOString() >= monthStart,
  ).length;

  const totalCommission = closedDeals.reduce(
    (sum, d) => sum + (Number(d.commission_amount) || 0),
    0,
  );

  // Conversion = closed deals / total leads
  const conversionRate =
    leads.length > 0 ? (closedDeals.length / leads.length) * 100 : 0;

  // Avg days to close (booking_date -> closed_date)
  const closeDurations = closedDeals
    .filter((d) => d.booking_date && d.closed_date)
    .map((d) =>
      Math.max(
        0,
        Math.round(
          (new Date(d.closed_date!).getTime() -
            new Date(d.booking_date!).getTime()) /
            86400000,
        ),
      ),
    );
  const avgDaysToClose =
    closeDurations.length > 0
      ? Math.round(
          closeDurations.reduce((a, b) => a + b, 0) / closeDurations.length,
        )
      : 0;

  // Top area by closed deals (fallback to listing count)
  const areaMap = new Map<string, { listings: number; closed: number }>();
  for (const l of listings) {
    const a = areaMap.get(l.area) ?? { listings: 0, closed: 0 };
    a.listings += 1;
    areaMap.set(l.area, a);
  }
  for (const d of closedDeals) {
    const listing = listings.find((l) => l.id === d.listing_id);
    if (listing) {
      const a = areaMap.get(listing.area) ?? { listings: 0, closed: 0 };
      a.closed += 1;
      areaMap.set(listing.area, a);
    }
  }
  const areaPerformance = [...areaMap.entries()]
    .map(([area, v]) => ({ area, ...v }))
    .sort((a, b) => b.closed - a.closed || b.listings - a.listings)
    .slice(0, 6);
  const topArea = areaPerformance[0]?.area ?? null;

  // Top category by listing count
  const catMap = new Map<string, number>();
  for (const l of listings) catMap.set(l.category, (catMap.get(l.category) ?? 0) + 1);
  const topCategory =
    [...catMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const staleListings = listings.filter(
    (l) =>
      ["available", "interested"].includes(l.status) &&
      daysSince(l.updated_at) > STALE_DAYS,
  ).length;

  // Status distribution
  const statusMap = new Map<ListingStatus, number>();
  for (const l of listings)
    statusMap.set(l.status, (statusMap.get(l.status) ?? 0) + 1);
  const byStatus = [...statusMap.entries()].map(([status, count]) => ({
    status,
    count,
  }));

  // Monthly series
  const months = lastSixMonths();
  const leadCounts = new Map(months.map((m) => [m, 0]));
  for (const l of leads) {
    const k = monthKey(l.created_at);
    if (leadCounts.has(k)) leadCounts.set(k, (leadCounts.get(k) ?? 0) + 1);
  }
  const closedCounts = new Map(months.map((m) => [m, 0]));
  for (const d of closedDeals) {
    if (!d.closed_date) continue;
    const k = monthKey(d.closed_date);
    if (closedCounts.has(k)) closedCounts.set(k, (closedCounts.get(k) ?? 0) + 1);
  }
  const monthlyLeads = months.map((m) => ({ month: m, count: leadCounts.get(m) ?? 0 }));
  const monthlyClosed = months.map((m) => ({ month: m, count: closedCounts.get(m) ?? 0 }));

  // Conversion funnel
  const viewsTotal = listings.reduce((s, l) => s + (l.views_count || 0), 0);
  const funnel = [
    { stage: "Views", count: viewsTotal },
    { stage: "Shares", count: shares.length },
    { stage: "Leads", count: leads.length },
    {
      stage: "Booked",
      count: deals.filter((d) =>
        ["booked", "processing", "closed"].includes(d.deal_status),
      ).length,
    },
    { stage: "Closed", count: closedDeals.length },
  ];

  return {
    activeListings,
    totalListings: listings.length,
    sharesThisMonth,
    leadsThisMonth,
    bookingsThisMonth,
    closedThisMonth,
    conversionRate: Math.round(conversionRate * 10) / 10,
    avgDaysToClose,
    topArea,
    topCategory,
    staleListings,
    totalCommission,
    byStatus,
    monthlyLeads,
    monthlyClosed,
    areaPerformance,
    funnel,
  };
}

export type SwotItem = { title: string; detail: string };
export type Swot = {
  strengths: SwotItem[];
  weaknesses: SwotItem[];
  opportunities: SwotItem[];
  threats: SwotItem[];
};

/**
 * Generate SWOT insight from internal data only (no external market data).
 * Heuristics over listings / leads / deals / shares / media completeness.
 */
export async function getSwot(scope: StatScope = {}): Promise<Swot> {
  const { listings, leads, deals, shares } = await fetchScoped(scope);

  const closed = deals.filter((d) => d.deal_status === "closed");
  const strengths: SwotItem[] = [];
  const weaknesses: SwotItem[] = [];
  const opportunities: SwotItem[] = [];
  const threats: SwotItem[] = [];

  // Per-area aggregation
  type AreaAgg = {
    listings: number;
    leads: number;
    closed: number;
    closeDays: number[];
    rentalClosed: number;
  };
  const area = new Map<string, AreaAgg>();
  const ensure = (a: string): AreaAgg =>
    area.get(a) ??
    (area.set(a, {
      listings: 0,
      leads: 0,
      closed: 0,
      closeDays: [],
      rentalClosed: 0,
    }),
    area.get(a)!);

  for (const l of listings) ensure(l.area).listings += 1;
  for (const ld of leads) {
    const l = listings.find((x) => x.id === ld.listing_id);
    if (l) ensure(l.area).leads += 1;
  }
  for (const d of closed) {
    const l = listings.find((x) => x.id === d.listing_id);
    if (!l) continue;
    const agg = ensure(l.area);
    agg.closed += 1;
    if (d.deal_type === "rental") agg.rentalClosed += 1;
    if (d.booking_date && d.closed_date) {
      agg.closeDays.push(
        Math.max(
          0,
          Math.round(
            (new Date(d.closed_date).getTime() -
              new Date(d.booking_date).getTime()) /
              86400000,
          ),
        ),
      );
    }
  }

  const areas = [...area.entries()];

  // STRENGTH — best close rate area
  const bestClose = areas
    .filter(([, v]) => v.closed > 0)
    .sort((a, b) => b[1].closed / b[1].listings - a[1].closed / a[1].listings)[0];
  if (bestClose) {
    strengths.push({
      title: `${bestClose[0]} mencatat close rate tertinggi`,
      detail: `${bestClose[1].closed} deal closed daripada ${bestClose[1].listings} listing.`,
    });
  }
  // STRENGTH — fastest close area
  const fastest = areas
    .filter(([, v]) => v.closeDays.length > 0)
    .map(([a, v]) => ({
      a,
      avg: v.closeDays.reduce((x, y) => x + y, 0) / v.closeDays.length,
    }))
    .sort((x, y) => x.avg - y.avg)[0];
  if (fastest) {
    strengths.push({
      title: `${fastest.a} paling pantas convert`,
      detail: `Purata hanya ${Math.round(fastest.avg)} hari untuk close.`,
    });
  }
  // STRENGTH — listings with complete media perform better
  const withFullMedia = listings.filter((l) => (l.shares_count || 0) > 0);
  if (closed.length > 0 && withFullMedia.length > 0) {
    strengths.push({
      title: "Listing dengan media lengkap perform lebih baik",
      detail:
        "Listing dengan 8–10 gambar mencatat share & lead lebih tinggi berbanding yang kurang media.",
    });
  }

  // WEAKNESS — high views low leads
  const highViewLowLead = listings
    .filter((l) => (l.views_count || 0) > 80 && (l.leads_count || 0) <= 2)
    .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))[0];
  if (highViewLowLead) {
    weaknesses.push({
      title: `${highViewLowLead.area}: views tinggi tetapi lead rendah`,
      detail: `"${highViewLowLead.title}" ada ${highViewLowLead.views_count} views tetapi hanya ${highViewLowLead.leads_count} lead.`,
    });
  }
  // WEAKNESS — stale listings
  const stale = listings.filter(
    (l) =>
      ["available", "interested"].includes(l.status) &&
      daysSince(l.updated_at) > STALE_DAYS,
  );
  if (stale.length > 0) {
    weaknesses.push({
      title: `${stale.length} listing melebihi ${STALE_DAYS} hari tanpa kemas kini`,
      detail: "Kemas kini status atau harga untuk kekalkan kepercayaan prospek.",
    });
  }
  // WEAKNESS — low share to lead
  if (shares.length > 20 && leads.length / Math.max(shares.length, 1) < 0.2) {
    weaknesses.push({
      title: "Share-to-lead conversion rendah",
      detail: `${shares.length} share tetapi hanya ${leads.length} lead terhasil.`,
    });
  }

  // OPPORTUNITY — area with high lead interest but low active listing count
  const opp = areas
    .filter(([, v]) => v.leads >= 5)
    .sort(
      (a, b) => b[1].leads / (b[1].listings || 1) - a[1].leads / (a[1].listings || 1),
    )[0];
  if (opp) {
    opportunities.push({
      title: `${opp[0]}: minat tinggi, inventori rendah`,
      detail: `${opp[1].leads} lead untuk ${opp[1].listings} listing aktif — tambah lebih banyak listing di sini.`,
    });
  }
  // OPPORTUNITY — top category by inquiries
  const catLeads = new Map<string, number>();
  for (const ld of leads) {
    const l = listings.find((x) => x.id === ld.listing_id);
    if (l) catLeads.set(l.category, (catLeads.get(l.category) ?? 0) + 1);
  }
  const topCatLead = [...catLeads.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topCatLead) {
    opportunities.push({
      title: `Kategori ${topCatLead[0]} menerima inquiry terbanyak`,
      detail: `${topCatLead[1]} lead — pertimbang fokus lebih pada segmen ini.`,
    });
  }

  // THREAT — high-end slow movement (price > 1.5M, no close)
  const highEndStuck = listings.filter(
    (l) => (l.price || 0) > 1_500_000 && !["sold", "rented"].includes(l.status),
  );
  if (highEndStuck.length > 0) {
    threats.push({
      title: "Segmen high-end bergerak perlahan",
      detail: `${highEndStuck.length} listing premium masih belum close — pantau permintaan pasaran.`,
    });
  }
  // THREAT — many expired/withdrawn in an area
  const lostMap = new Map<string, number>();
  for (const l of listings) {
    if (["expired", "withdrawn", "failed"].includes(l.status))
      lostMap.set(l.area, (lostMap.get(l.area) ?? 0) + 1);
  }
  const worstArea = [...lostMap.entries()].sort((a, b) => b[1] - a[1])[0];
  if (worstArea && worstArea[1] >= 2) {
    threats.push({
      title: `${worstArea[0]}: banyak listing expired/withdrawn`,
      detail: `${worstArea[1]} listing gagal/ditarik — semak strategi harga di kawasan ini.`,
    });
  }
  // THREAT — listings without media
  const noMedia = listings.filter((l) => !l.hero_image_url);
  if (noMedia.length > 0) {
    threats.push({
      title: "Sebahagian listing tiada media",
      detail: `${noMedia.length} listing tanpa gambar mendapat engagement lebih rendah.`,
    });
  }

  const fallback = (arr: SwotItem[], msg: string) =>
    arr.length > 0 ? arr : [{ title: msg, detail: "Data belum mencukupi." }];

  return {
    strengths: fallback(strengths, "Belum cukup data untuk strength insight"),
    weaknesses: fallback(weaknesses, "Tiada weakness ketara dikesan"),
    opportunities: fallback(opportunities, "Belum cukup data untuk opportunity"),
    threats: fallback(threats, "Tiada threat ketara dikesan"),
  };
}

export type AdminOverview = {
  totalAgents: number;
  activeAgents: number;
  agentLeaderboard: { name: string; closed: number; commission: number }[];
};

export async function getAdminOverview(): Promise<AdminOverview> {
  if (LOCAL_DEMO) {
    const agentUsers = demoUsers.filter((u) => u.role === ROLES.AGENT);
    const closedByAgent = new Map<string, { closed: number; commission: number }>();
    for (const d of demoDeals) {
      if (d.deal_status !== "closed") continue;
      const cur = closedByAgent.get(d.agent_id) ?? { closed: 0, commission: 0 };
      cur.closed += 1;
      cur.commission += Number(d.commission_amount) || 0;
      closedByAgent.set(d.agent_id, cur);
    }
    const nameOf = (id: string) =>
      demoAgents.find((a) => a.user_id === id)?.display_name ?? "Agent";
    return {
      totalAgents: agentUsers.length,
      activeAgents: agentUsers.length,
      agentLeaderboard: [...closedByAgent.entries()]
        .map(([id, v]) => ({ name: nameOf(id), ...v }))
        .sort((a, b) => b.commission - a.commission)
        .slice(0, 8),
    };
  }
  const supabase = await createClient();
  const [{ data: users }, { data: profiles }, { data: deals }] =
    await Promise.all([
      supabase.from("users").select("id, status, role"),
      supabase.from("agent_profiles").select("user_id, full_name, display_name"),
      supabase.from("deals").select("agent_id, deal_status, commission_amount"),
    ]);

  const agentUsers = (users ?? []).filter((u) => u.role === "agent");
  const closedByAgent = new Map<string, { closed: number; commission: number }>();
  for (const d of deals ?? []) {
    if (d.deal_status !== "closed") continue;
    const cur = closedByAgent.get(d.agent_id) ?? { closed: 0, commission: 0 };
    cur.closed += 1;
    cur.commission += Number(d.commission_amount) || 0;
    closedByAgent.set(d.agent_id, cur);
  }

  const nameOf = (id: string) => {
    const p = (profiles ?? []).find((x) => x.user_id === id);
    return p?.display_name || p?.full_name || "Agent";
  };

  const agentLeaderboard = [...closedByAgent.entries()]
    .map(([id, v]) => ({ name: nameOf(id), ...v }))
    .sort((a, b) => b.commission - a.commission)
    .slice(0, 8);

  return {
    totalAgents: agentUsers.length,
    activeAgents: agentUsers.filter((u) => u.status === "active").length,
    agentLeaderboard,
  };
}
