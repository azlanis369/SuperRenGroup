import { createClient } from "@/lib/supabase/server";
import {
  ROLES,
  DEAL_STATUSES,
  SECTORS,
  type ListingStatus,
  type DealStatus,
  type Sector,
} from "@/lib/constants";
import { daysSince } from "@/lib/utils";
import type { ListingRow, DealRow, LeadRow } from "@/lib/database.types";
import { LOCAL_DEMO } from "@/lib/demo-mode";
import { demoScopedData } from "@/lib/demo-data/queries";
import {
  demoUsers,
  demoAgents,
  demoDeals,
  demoListings,
} from "@/lib/demo-data/dataset";

/** Transaction value of a deal (sale price, or annualised rental). */
function dealValue(d: DealRow): number {
  if (d.deal_type === "rental") return (Number(d.rental_price) || 0) * 12;
  return Number(d.sold_price) || 0;
}

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
  monthlySales: { month: string; value: number }[];
  areaPerformance: { area: string; listings: number; closed: number }[];
  funnel: { stage: string; count: number }[];
  dealStatusBreakdown: { status: DealStatus; count: number; value: number }[];
  salesValueThisMonth: number;
  salesValueLastMonth: number;
  bySector: { sector: Sector; closed: number; value: number }[];
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

  // Monthly sales value (closed deals)
  const salesByMonth = new Map(months.map((m) => [m, 0]));
  for (const d of closedDeals) {
    if (!d.closed_date) continue;
    const k = monthKey(d.closed_date);
    if (salesByMonth.has(k))
      salesByMonth.set(k, (salesByMonth.get(k) ?? 0) + dealValue(d));
  }
  const monthlySales = months.map((m) => ({ month: m, value: salesByMonth.get(m) ?? 0 }));

  // Sales value this month vs last month (closed)
  const lastMonthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth() - 1,
    1,
  ).toISOString();
  let salesValueThisMonth = 0;
  let salesValueLastMonth = 0;
  for (const d of closedDeals) {
    if (!d.closed_date) continue;
    const iso = new Date(d.closed_date).toISOString();
    if (iso >= monthStart) salesValueThisMonth += dealValue(d);
    else if (iso >= lastMonthStart) salesValueLastMonth += dealValue(d);
  }

  // Deal status breakdown (intelligence: booking/closed/pending/cancelled/refund/others)
  const statusAgg = new Map<DealStatus, { count: number; value: number }>();
  for (const s of DEAL_STATUSES) statusAgg.set(s, { count: 0, value: 0 });
  for (const d of deals) {
    const cur = statusAgg.get(d.deal_status) ?? { count: 0, value: 0 };
    cur.count += 1;
    cur.value += dealValue(d);
    statusAgg.set(d.deal_status, cur);
  }
  const dealStatusBreakdown = DEAL_STATUSES.map((status) => ({
    status,
    count: statusAgg.get(status)!.count,
    value: statusAgg.get(status)!.value,
  }));

  // Per-sector performance (closed deals)
  const listingById = new Map(listings.map((l) => [l.id, l]));
  const sectorAgg = new Map<Sector, { closed: number; value: number }>();
  for (const s of SECTORS) sectorAgg.set(s, { closed: 0, value: 0 });
  for (const d of closedDeals) {
    const l = listingById.get(d.listing_id);
    if (!l) continue;
    const cur = sectorAgg.get(l.category as Sector);
    if (!cur) continue;
    cur.closed += 1;
    cur.value += dealValue(d);
  }
  const bySector = SECTORS.map((sector) => ({
    sector,
    closed: sectorAgg.get(sector)!.closed,
    value: sectorAgg.get(sector)!.value,
  }));

  // Conversion funnel
  const viewsTotal = listings.reduce((s, l) => s + (l.views_count || 0), 0);
  const funnel = [
    { stage: "Views", count: viewsTotal },
    { stage: "Shares", count: shares.length },
    { stage: "Leads", count: leads.length },
    {
      stage: "Booked",
      count: deals.filter((d) =>
        ["booked", "pending", "closed"].includes(d.deal_status),
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
    monthlySales,
    areaPerformance,
    funnel,
    dealStatusBreakdown,
    salesValueThisMonth,
    salesValueLastMonth,
    bySector,
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

export type LeaderRow = {
  userId: string;
  name: string;
  photo: string | null;
  area: string | null;
  thisMonthValue: number;
  lastMonthValue: number;
  thisMonthClosed: number;
  totalValue: number;
  totalClosed: number;
  totalCommission: number;
  rankDelta: number; // +ve = climbed vs last month
};

export type AdminOverview = {
  totalAgents: number;
  activeAgents: number;
  pendingAgents: number;
  sectorLeaderboards: { sector: Sector; rows: LeaderRow[] }[];
  overallLeaderboard: LeaderRow[];
};

type AgentMeta = { name: string; photo: string | null; area: string | null };

type Acc = {
  tm: number;
  lm: number;
  tmClosed: number;
  total: number;
  totalClosed: number;
  commission: number;
};
const emptyAcc = (): Acc => ({
  tm: 0,
  lm: 0,
  tmClosed: 0,
  total: 0,
  totalClosed: 0,
  commission: 0,
});

type RankedLists = {
  sectors: { sector: Sector; rows: LeaderRow[] }[]; // full ranking
  overall: LeaderRow[]; // full ranking
};

/** Build full per-sector + overall rankings with month-over-month deltas. */
function buildLeaderboards(
  deals: DealRow[],
  sectorOf: (listingId: string) => Sector | null,
  metaOf: (agentId: string) => AgentMeta,
): RankedLists {
  const monthStart = startOfMonth();
  const lastStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth() - 1,
    1,
  ).toISOString();

  const perSector = new Map<Sector, Map<string, Acc>>();
  for (const s of SECTORS) perSector.set(s, new Map());
  const overall = new Map<string, Acc>();

  for (const d of deals) {
    if (d.deal_status !== "closed" || !d.closed_date) continue;
    const sector = sectorOf(d.listing_id);
    if (!sector) continue;
    const v = dealValue(d);
    const iso = new Date(d.closed_date).toISOString();
    const inThis = iso >= monthStart;
    const inLast = !inThis && iso >= lastStart;

    const bump = (m: Map<string, Acc>) => {
      const a = m.get(d.agent_id) ?? emptyAcc();
      a.total += v;
      a.totalClosed += 1;
      a.commission += Number(d.commission_amount) || 0;
      if (inThis) {
        a.tm += v;
        a.tmClosed += 1;
      } else if (inLast) {
        a.lm += v;
      }
      m.set(d.agent_id, a);
    };
    bump(perSector.get(sector)!);
    bump(overall);
  }

  const rank = (m: Map<string, Acc>): LeaderRow[] => {
    const entries = [...m.entries()];
    const lastRank = new Map(
      [...entries]
        .sort((a, b) => b[1].lm - a[1].lm)
        .map(([id], i) => [id, i + 1] as const),
    );
    const sorted = entries.sort(
      (a, b) => b[1].tm - a[1].tm || b[1].total - a[1].total,
    );
    return sorted.map(([id, a], i) => {
      const meta = metaOf(id);
      const thisRank = i + 1;
      const lr = lastRank.get(id) ?? thisRank;
      return {
        userId: id,
        name: meta.name,
        photo: meta.photo,
        area: meta.area,
        thisMonthValue: a.tm,
        lastMonthValue: a.lm,
        thisMonthClosed: a.tmClosed,
        totalValue: a.total,
        totalClosed: a.totalClosed,
        totalCommission: a.commission,
        rankDelta: lr - thisRank,
      };
    });
  };

  return {
    sectors: SECTORS.map((sector) => ({ sector, rows: rank(perSector.get(sector)!) })),
    overall: rank(overall),
  };
}

type GroupData = {
  deals: DealRow[];
  sectorOf: (lid: string) => Sector | null;
  metaOf: (id: string) => AgentMeta;
  agentUsers: { status: string }[];
};

async function loadGroupData(): Promise<GroupData> {
  if (LOCAL_DEMO) {
    const catById = new Map(demoListings.map((l) => [l.id, l.category]));
    const profById = new Map(demoAgents.map((a) => [a.user_id, a]));
    return {
      deals: demoDeals,
      sectorOf: (lid) => (catById.get(lid) as Sector) ?? null,
      metaOf: (id) => {
        const p = profById.get(id);
        return {
          name: p?.display_name || p?.full_name || "Agent",
          photo: p?.profile_photo_url ?? null,
          area: p?.service_areas?.[0] ?? null,
        };
      },
      agentUsers: demoUsers
        .filter((u) => u.role === ROLES.AGENT)
        .map((u) => ({ status: u.status })),
    };
  }
  const supabase = await createClient();
  const [{ data: users }, { data: profiles }, { data: deals }, { data: listings }] =
    await Promise.all([
      supabase.from("users").select("id, status, role"),
      supabase
        .from("agent_profiles")
        .select("user_id, full_name, display_name, profile_photo_url, service_areas"),
      supabase.from("deals").select("*"),
      supabase.from("listings").select("id, category"),
    ]);
  const catById = new Map((listings ?? []).map((l) => [l.id, l.category]));
  const profById = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  return {
    deals: (deals ?? []) as DealRow[],
    sectorOf: (lid) => (catById.get(lid) as Sector) ?? null,
    metaOf: (id) => {
      const p = profById.get(id);
      return {
        name: p?.display_name || p?.full_name || "Agent",
        photo: p?.profile_photo_url ?? null,
        area: p?.service_areas?.[0] ?? null,
      };
    },
    agentUsers: (users ?? [])
      .filter((u) => u.role === "agent")
      .map((u) => ({ status: u.status })),
  };
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const g = await loadGroupData();
  const lb = buildLeaderboards(g.deals, g.sectorOf, g.metaOf);
  return {
    totalAgents: g.agentUsers.length,
    activeAgents: g.agentUsers.filter((u) => u.status === "active").length,
    pendingAgents: g.agentUsers.filter((u) => u.status === "pending").length,
    sectorLeaderboards: lb.sectors.map((s) => ({ sector: s.sector, rows: s.rows.slice(0, 10) })),
    overallLeaderboard: lb.overall.slice(0, 10),
  };
}

export type Standing = { rank: number | null; of: number; value: number; closed: number };
export type AgentStanding = {
  overall: Standing;
  sectors: { sector: Sector; standing: Standing }[];
  sectorLeaderboards: { sector: Sector; rows: LeaderRow[] }[];
  overallLeaderboard: LeaderRow[];
  yearValue: number;
  yearClosed: number;
  yearCommission: number;
};

/** A single agent's standing in the group + their year-to-date achievement. */
export async function getAgentStanding(userId: string): Promise<AgentStanding> {
  const g = await loadGroupData();
  const lb = buildLeaderboards(g.deals, g.sectorOf, g.metaOf);

  const standingFrom = (rows: LeaderRow[]): Standing => {
    const i = rows.findIndex((r) => r.userId === userId);
    return {
      rank: i < 0 ? null : i + 1,
      of: rows.length,
      value: i < 0 ? 0 : rows[i].thisMonthValue,
      closed: i < 0 ? 0 : rows[i].thisMonthClosed,
    };
  };

  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
  let yearValue = 0;
  let yearClosed = 0;
  let yearCommission = 0;
  for (const d of g.deals) {
    if (d.agent_id !== userId || d.deal_status !== "closed" || !d.closed_date) continue;
    if (new Date(d.closed_date).toISOString() < yearStart) continue;
    yearValue += dealValue(d);
    yearClosed += 1;
    yearCommission += Number(d.commission_amount) || 0;
  }

  return {
    overall: standingFrom(lb.overall),
    sectors: lb.sectors.map((s) => ({ sector: s.sector, standing: standingFrom(s.rows) })),
    sectorLeaderboards: lb.sectors.map((s) => ({ sector: s.sector, rows: s.rows.slice(0, 10) })),
    overallLeaderboard: lb.overall.slice(0, 10),
    yearValue,
    yearClosed,
    yearCommission,
  };
}
