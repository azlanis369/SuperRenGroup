// Deterministic in-memory demo dataset shaped exactly like the DB Row types,
// so the same components/queries work without any database. Built once at
// module load. Tuned to simulate ~6 months of real estate sales activity for
// a 50-agent group (30 active) across Kuala Lumpur & Selangor, so dashboards,
// SWOT and the agent leaderboard look meaningful.

import type {
  AgentProfileRow,
  UserRow,
  ListingRow,
  ListingMediaRow,
  ListingProjectDetailRow,
  ListingSubsaleDetailRow,
  ListingRentalDetailRow,
  LeadRow,
  DealRow,
  ShareRow,
} from "@/lib/database.types";
import {
  type ListingCategory,
  type ListingStatus,
  type LeadStatus,
  type LeadSource,
  type PropertyType,
  type DealStatus,
  LEAD_SOURCES,
} from "@/lib/constants";
import { slugify } from "@/lib/utils";

// Seeded PRNG (mulberry32) for reproducible data.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260616);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
const between = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
const chance = (p: number) => rnd() < p;

const NOW = new Date();
const NOW_ISO = NOW.toISOString();
const daysAgoISO = (d: number) =>
  new Date(NOW.getTime() - d * 86400000).toISOString();
const dateOnly = (iso: string) => iso.slice(0, 10);

/** Random calendar date within `offset` months ago (0 = current month to date). */
function dateInMonth(offset: number): Date {
  const base = new Date(NOW.getFullYear(), NOW.getMonth() - offset, 1);
  const maxDay =
    offset === 0
      ? NOW.getDate()
      : new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  return new Date(base.getFullYear(), base.getMonth(), 1 + Math.floor(rnd() * maxDay));
}

// ---------------------------------------------------------------------------
// Areas (KL / Selangor) grouped by price tier
// ---------------------------------------------------------------------------
const AREA_TIER: Record<string, "premium" | "mid" | "value"> = {
  KLCC: "premium", "Mont Kiara": "premium", Bangsar: "premium",
  Damansara: "premium", "Ampang Hilir": "premium", "Desa ParkCity": "premium",
  Ampang: "mid", "Pandan Indah": "mid", "Pandan Jaya": "mid", "Hulu Klang": "mid",
  Cheras: "mid", "Petaling Jaya": "mid", "Subang Jaya": "mid", "Bukit Jalil": "mid",
  Cyberjaya: "mid", Putrajaya: "mid", Setiawangsa: "mid", "Kuala Lumpur": "mid",
  Setapak: "value", "Wangsa Maju": "value", Keramat: "value", Gombak: "value",
  "Shah Alam": "value", Klang: "value", Puchong: "value", "Seri Kembangan": "value",
  Kajang: "value", Bangi: "value", Semenyih: "value", Rawang: "value",
  Kepong: "value", Selayang: "value", "Sungai Buloh": "value",
};
const ALL_AREAS = Object.keys(AREA_TIER);
const AZLAN_AREAS = ["Ampang", "Pandan Indah", "Pandan Jaya", "Ampang Hilir", "Hulu Klang"];

const PRICE_RANGE = {
  premium: { subsale: [1_200_000, 3_500_000], rental: [3_500, 9_000], project: [800_000, 1_800_000] },
  mid: { subsale: [600_000, 1_400_000], rental: [1_800, 4_200], project: [450_000, 950_000] },
  value: { subsale: [350_000, 780_000], rental: [1_000, 2_200], project: [300_000, 560_000] },
} as const;

const PROP_TYPES: Record<ListingCategory, PropertyType[]> = {
  subsale: ["terrace", "semi_d", "bungalow", "condo", "apartment", "shop", "land"],
  rental: ["condo", "apartment", "terrace", "office", "shop"],
  project: ["condo", "apartment"],
};
const RESIDENTIAL_TYPES: PropertyType[] = [
  "terrace",
  "semi_d",
  "bungalow",
  "condo",
  "apartment",
];

const PROJECT_NAMES = [
  "Aurora", "Lumina", "Vista", "Emerald", "Zenith", "Solaris", "Tropika", "Saffron",
  "Mirage", "Verde", "Iris", "Cendana", "Seroja", "Bayu", "Mutiara", "Suria",
];
const SUBSALE_TITLES = [
  "2-Storey Terrace", "Corner Lot Terrace", "Renovated Semi-D", "Spacious Bungalow",
  "Freehold Condo", "High-Floor Apartment", "Endlot Terrace", "Cluster Home",
  "Shop Office", "Townhouse",
];
const RENTAL_TITLES = [
  "Furnished Condo for Rent", "Serviced Suite for Rent", "Cozy Apartment for Rent",
  "Terrace House for Rent", "Office Lot for Rent", "Shoplot for Rent",
  "Studio for Rent", "Family Home for Rent",
];

const FACILITIES = ["Swimming Pool", "Gym", "24h Security", "Playground", "Surau", "BBQ Area", "Sauna", "Multipurpose Hall", "Covered Parking"];
const AMENITIES = ["Shopping Mall", "School", "Hospital", "Bank", "Restoran", "Pasar", "MRT/LRT"];
const SELLING = ["Lokasi strategik", "Hampir pengangkutan awam", "Kawasan selamat 24 jam", "Harga bawah pasaran", "Pemandangan menarik", "Sesuai untuk keluarga", "Pulangan sewa tinggi", "Senang dapat penyewa", "Sudah diubahsuai"];

// ---------------------------------------------------------------------------
// Names (multi-ethnic, Malaysian)
// ---------------------------------------------------------------------------
const MALAY_FIRST = ["Ahmad", "Muhammad", "Aiman", "Faris", "Hafiz", "Iskandar", "Syafiq", "Amir", "Khairul", "Izzat", "Danial", "Hakim", "Zulkifli", "Aqil", "Haziq", "Nurul", "Siti", "Aisyah", "Farah", "Hana", "Liyana", "Aqilah", "Najwa", "Sofea", "Alia"];
const MALAY_LAST = ["Abdullah", "Ismail", "Rahman", "Osman", "Yusof", "Zainal", "Hamid", "Bakar", "Razak", "Karim", "Salleh", "Idris"];
const CHINESE_LAST = ["Lim", "Tan", "Wong", "Lee", "Ong", "Goh", "Chan", "Ng", "Teh", "Yap", "Chong", "Khoo"];
const CHINESE_GIVEN = ["Wei Jie", "Ming Hui", "Jia Xin", "Mei Ling", "Kai Wen", "Yong Sheng", "Li Ying", "Jun Hao", "Xin Yi", "Zhi Hao", "Hui Min", "Cheng"];
const INDIAN_FIRST = ["Suresh", "Anand", "Vijay", "Arjun", "Priya", "Maya", "Kavitha", "Deepak", "Ramesh", "Divya", "Karthik", "Shanti"];
const INDIAN_LAST = ["Subramaniam", "Pillai", "Nair", "Menon", "Krishnan", "Raj", "Kumar", "Devan"];

function randomName(): string {
  const e = rnd();
  if (e < 0.55) return `${pick(MALAY_FIRST)} ${pick(MALAY_LAST)}`;
  if (e < 0.82) return `${pick(CHINESE_LAST)} ${pick(CHINESE_GIVEN)}`;
  return `${pick(INDIAN_FIRST)} ${pick(INDIAN_LAST)}`;
}

const LEAD_FIRST = [...MALAY_FIRST, ...INDIAN_FIRST, "Wong", "Tan", "Lim", "Lee"];

// ---------------------------------------------------------------------------
// Agent roster: 50 agents (Azlan + 8 named + 41 generated). 30 active.
// ---------------------------------------------------------------------------
type Tier = "top" | "mid" | "low";
type Agent = {
  key: string;
  userId: string;
  name: string;
  status: "active" | "pending" | "deactivated";
  tier: Tier;
  area: string; // home base area
  sectors: ListingCategory[]; // sectors they work
  ren: string;
  photo: string;
  isLeader?: boolean;
  teamLeaderId?: string | null;
};

const NAMED = [
  { key: "aiman", name: "Aiman Hakimi", area: "KLCC" },
  { key: "aisyah", name: "Nur Aisyah Rahman", area: "Kajang" },
  { key: "daniel", name: "Daniel Lim", area: "Petaling Jaya" },
  { key: "siti", name: "Siti Hajar Osman", area: "Shah Alam" },
  { key: "faris", name: "Faris Iskandar", area: "Setapak" },
  { key: "michelle", name: "Michelle Tan", area: "Mont Kiara" },
  { key: "harith", name: "Harith Zulkifli", area: "Cyberjaya" },
  { key: "kavitha", name: "Kavitha Raj", area: "Puchong" },
];

const ALL_SECTORS: ListingCategory[] = ["subsale", "rental", "project"];
function pickSectors(): ListingCategory[] {
  const primary = pick(ALL_SECTORS);
  const set = new Set<ListingCategory>([primary]);
  if (chance(0.7)) set.add(pick(ALL_SECTORS));
  if (chance(0.3)) set.add(pick(ALL_SECTORS));
  return [...set];
}
function tierFor(): Tier {
  // Deterministic spread: ~8 top, ~12 mid, rest low among the active set.
  const r = rnd();
  if (r < 0.27) return "top";
  if (r < 0.62) return "mid";
  return "low";
}

const agents: Agent[] = [];

// 0 — Amirul Nasyriq (primary persona)
agents.push({
  key: "azlan",
  userId: "user-azlan",
  name: "Amirul Nasyriq",
  status: "active",
  tier: "top",
  area: "Ampang",
  sectors: ["subsale", "rental"],
  ren: "REN 39593",
  photo: "/demo/agents/agent-azlan.svg",
});

// 1–8 — named agents (active)
NAMED.forEach((n, i) => {
  agents.push({
    key: n.key,
    userId: `user-${n.key}`,
    name: n.name,
    status: "active",
    tier: tierFor(),
    area: n.area,
    sectors: pickSectors(),
    ren: `REN ${12345 + i * 1111}`,
    photo: `/demo/agents/agent-${String((i % 8) + 1).padStart(2, "0")}.svg`,
  });
});

// 9–49 — generated agents
for (let i = agents.length; i < 50; i++) {
  const status: Agent["status"] =
    i < 30 ? "active" : i < 44 ? "pending" : "deactivated";
  agents.push({
    key: `agent${i}`,
    userId: `user-agent${i}`,
    name: randomName(),
    status,
    tier: status === "active" ? tierFor() : "low",
    area: pick(ALL_AREAS),
    sectors: pickSectors(),
    ren: `REN ${20000 + i * 137}`,
    photo: `/demo/agents/agent-${String((i % 8) + 1).padStart(2, "0")}.svg`,
  });
}

const activeAgents = agents.filter((a) => a.status === "active");

// ---------------------------------------------------------------------------
// Teams: 4 Team Leaders, each supervising a group of agents.
// Azlan leads a team of 11 agents; the other 3 leaders share the rest.
// ---------------------------------------------------------------------------
const LEADER_KEYS = ["azlan", "aiman", "siti", "daniel"];
for (const a of agents) {
  a.isLeader = false;
  a.teamLeaderId = null;
}
const leaders = LEADER_KEYS.map((k) => agents.find((a) => a.key === k)!).filter(
  Boolean,
);
leaders.forEach((l) => {
  l.isLeader = true;
  l.teamLeaderId = l.userId;
});
const azlanLeader = leaders.find((l) => l.key === "azlan")!;
const otherLeaders = leaders.filter((l) => l.key !== "azlan");
const teamPool = activeAgents.filter((a) => !LEADER_KEYS.includes(a.key));
teamPool.forEach((m, i) => {
  m.teamLeaderId =
    i < 11
      ? azlanLeader.userId
      : otherLeaders[(i - 11) % otherLeaders.length].userId;
});

export const demoTeamLeaders = leaders.map((l) => ({
  userId: l.userId,
  name: l.name,
}));
export function isTeamLeader(userId: string): boolean {
  return agents.some((a) => a.userId === userId && a.isLeader);
}
export function teamLeaderIdOf(userId: string): string | null {
  return agents.find((a) => a.userId === userId)?.teamLeaderId ?? null;
}
/** User IDs in a leader's team (includes the leader). */
export function teamMemberIds(leaderId: string): string[] {
  return agents
    .filter((a) => a.teamLeaderId === leaderId)
    .map((a) => a.userId);
}

// ---------------------------------------------------------------------------
// Users & profiles
// ---------------------------------------------------------------------------
export const demoUsers: UserRow[] = [
  { id: "user-superadmin", email: "superadmin@superren.demo", role: "super_admin", status: "active", created_at: daysAgoISO(400), last_login_at: NOW_ISO },
  { id: "user-admin", email: "admin@superren.demo", role: "admin", status: "active", created_at: daysAgoISO(380), last_login_at: NOW_ISO },
  ...agents.map((a) => ({
    id: a.userId,
    email: `${a.key}@superren.demo`,
    // Amirul Nasyriq (user-azlan) is the Group Team Manager.
    role: (a.userId === "user-azlan" ? "admin" : "agent") as UserRow["role"],
    status: a.status,
    created_at: daysAgoISO(between(60, 360)),
    last_login_at:
      a.status === "active"
        ? daysAgoISO(between(0, 6))
        : a.status === "pending"
          ? daysAgoISO(between(7, 40))
          : daysAgoISO(between(60, 200)),
  })),
];

const AGENCY_NAME = "Chester Properties HQ";
const TITLES = ["Real Estate Negotiator", "Senior Negotiator", "Property Consultant", "Sales Advisor"];

/** Primary agent profile (Amirul Nasyriq) — with real contact details. */
export const azlanProfile: AgentProfileRow = {
  id: "profile-azlan",
  user_id: "user-azlan",
  full_name: "Amirul Nasyriq",
  display_name: "Amirul Nasyriq",
  slug: "amirul-nasyriq",
  profile_photo_url: "/demo/agents/agent-azlan.svg",
  ren_number: "REN 39593",
  agency_name: AGENCY_NAME,
  title: "Group Team Manager · Super Ren Group",
  headline: "Pakar Jual & Sewa Hartanah Kediaman dan Komersial Sekitar Selangor / KL",
  phone: "+60 19-823 6383",
  whatsapp: "+60198236383",
  email: "amirul@superren.demo",
  bio: "Group Team Manager Super Ren Group di bawah Chester Properties HQ, dengan sokongan team seramai 36 ejen. Membantu pemilik, pembeli & penyewa untuk hartanah kediaman dan komersial sekitar Selangor & Kuala Lumpur.",
  service_areas: ["Ampang / Hulu Klang", "Petaling Jaya", "Shah Alam / Klang", "Puchong", "Hartamas / Mont Kiara / KLCC"],
  specialization: ["subsale", "rental", "commercial"],
  facebook_url: "https://www.facebook.com/amirulnasyriq.bahri",
  instagram_url: null,
  tiktok_url: null,
  website_url: null,
  telegram_username: null,
  qr_code_url: null,
  is_profile_public: true,
  is_demo: false,
  created_at: daysAgoISO(360),
  updated_at: NOW_ISO,
};

export const demoAgents: AgentProfileRow[] = [
  azlanProfile,
  ...agents.slice(1).map((a, i) => ({
    id: `profile-${a.key}`,
    user_id: a.userId,
    full_name: a.name,
    display_name: a.name,
    slug: slugify(a.name) + (i > 0 ? `-${i}` : ""),
    profile_photo_url: a.photo,
    ren_number: a.ren,
    agency_name: AGENCY_NAME,
    title: pick(TITLES),
    phone: `+60 1${between(2, 9)}-${between(300, 999)} ${between(1000, 9999)}`,
    whatsapp: `+601${between(2, 9)}${between(3000000, 9999999)}`,
    email: `${a.key}@superren.demo`,
    bio: `Ejen hartanah berpengalaman di ${a.area} dan sekitarnya.`,
    service_areas: [a.area],
    specialization: a.sectors,
    facebook_url: null,
    instagram_url: null,
    tiktok_url: null,
    website_url: null,
    telegram_username: null,
    qr_code_url: null,
    is_profile_public: a.status === "active",
    is_demo: true,
    created_at: daysAgoISO(between(60, 360)),
    updated_at: daysAgoISO(between(0, 30)),
  })),
];

// ---------------------------------------------------------------------------
// Listings + deals + leads + shares generation
// ---------------------------------------------------------------------------
export const demoListings: ListingRow[] = [];
export const demoMedia: Record<string, ListingMediaRow[]> = {};
export const demoProjectDetails: Record<string, ListingProjectDetailRow> = {};
export const demoSubsaleDetails: Record<string, ListingSubsaleDetailRow> = {};
export const demoRentalDetails: Record<string, ListingRentalDetailRow> = {};
export const demoLeads: LeadRow[] = [];
export const demoDeals: DealRow[] = [];
export const demoShares: ShareRow[] = [];

export type ViewingStatus =
  | "scheduled"
  | "completed"
  | "rescheduled"
  | "cancelled"
  | "no_show"
  | "interested"
  | "not_interested";

export type ViewingRow = {
  id: string;
  listing_id: string | null;
  lead_id: string | null;
  agent_id: string;
  prospect_name: string;
  prospect_phone: string | null;
  listing_title: string | null;
  location: string;
  scheduled_at: string; // ISO datetime
  status: ViewingStatus;
  notes: string | null;
  is_demo: boolean;
  created_at: string;
};

export const demoViewings: ViewingRow[] = [];

let lid = 0;
let did = 0;
let leadId = 0;
let shareId = 0;

const heroCounters: Record<string, number> = {};
function cycleHero(key: string, max: number): string {
  heroCounters[key] = ((heroCounters[key] ?? 0) % max) + 1;
  return `/demo/properties/${key}-${String(heroCounters[key]).padStart(2, "0")}.svg`;
}
/** Pick a hero image that matches the asset type (land / commercial / category). */
function heroForListing(cat: ListingCategory, type: PropertyType): string {
  if (type === "land") return cycleHero("land", 6);
  if (type === "shop" || type === "office") return cycleHero("commercial", 6);
  return cycleHero(cat, 12);
}

function priceFor(area: string, cat: ListingCategory): number {
  const tier = AREA_TIER[area] ?? "mid";
  const [lo, hi] = PRICE_RANGE[tier][cat];
  const step = cat === "rental" ? 100 : 10000;
  return Math.round(between(lo, hi) / step) * step;
}

const LAND_TITLES = ["Tanah Lot", "Bungalow Lot", "Freehold Land", "Commercial Land", "Agricultural Land"];
const COMMERCIAL_TITLES = ["Shop Office", "Retail Shoplot", "Ground Floor Shop", "Office Lot", "3-Storey Shop Office"];

function titleFor(cat: ListingCategory, area: string, type: PropertyType): string {
  if (type === "land") return `${pick(LAND_TITLES)}, ${area}`;
  if (type === "shop" || type === "office")
    return `${pick(COMMERCIAL_TITLES)}, ${area}`;
  if (cat === "project") return `${pick(PROJECT_NAMES)} Residences, ${area}`;
  if (cat === "rental") return `${pick(RENTAL_TITLES)}, ${area}`;
  return `${pick(SUBSALE_TITLES)}, ${area}`;
}

type MakeOpts = {
  agent: Agent;
  cat: ListingCategory;
  area: string;
  status: ListingStatus;
  ageDays: number;
  withMedia?: boolean;
  views?: number;
  shares?: number;
  leads?: number;
  price?: number;
  pool?: PropertyType[];
};

function makeListing(o: MakeOpts): ListingRow {
  lid += 1;
  const id = `listing-${lid}`;
  const price = o.price ?? priceFor(o.area, o.cat);
  const type = pick(o.pool ?? PROP_TYPES[o.cat]);
  const isLanded = ["terrace", "semi_d", "bungalow"].includes(type);
  const createdAt = daysAgoISO(o.ageDays);
  const views = o.views ?? between(40, 480);
  const shares = o.shares ?? between(2, 26);
  const leads = o.leads ?? between(0, 8);
  const title = titleFor(o.cat, o.area, type);
  const hero = heroForListing(o.cat, type);

  const listing: ListingRow = {
    id,
    agent_id: o.agent.userId,
    category: o.cat,
    title,
    slug: slugify(title) + "-" + id,
    property_type: type,
    area: o.area,
    address_private: `No. ${between(1, 99)}, Jalan ${o.area} ${between(1, 20)}`,
    address_public: `Berhampiran pusat ${o.area}`,
    show_exact_address: false,
    map_url: "https://maps.google.com",
    price,
    price_display: o.cat === "rental" ? `RM ${price.toLocaleString()}/bulan` : null,
    tenure: pick(["freehold", "leasehold"]),
    built_up_sqft: type === "land" ? null : between(650, isLanded ? 3200 : 1800),
    land_area_sqft:
      type === "land"
        ? between(2400, 12000)
        : isLanded
          ? between(1400, 4500)
          : null,
    bedrooms: ["office", "shop", "land"].includes(type) ? null : between(1, 5),
    bathrooms: type === "land" ? null : between(1, 4),
    carparks: between(1, 3),
    furnishing: pick(["unfurnished", "partly_furnished", "fully_furnished"]),
    description: `${title} di ${o.area}. Sesuai untuk pelaburan atau kediaman. Hubungi ejen untuk tempahan viewing.`,
    top_selling_points: [...SELLING].sort(() => rnd() - 0.5).slice(0, 5),
    facilities: [...FACILITIES].sort(() => rnd() - 0.5).slice(0, between(3, 6)),
    amenities: [...AMENITIES].sort(() => rnd() - 0.5).slice(0, between(2, 5)),
    nearby: [`${o.area} MRT ${between(3, 12)} min`, `Mall ${o.area}`, `Sekolah berhampiran`],
    tags: pick([["hot"], ["value-buy"], ["urgent", "nego"], ["new"], []]),
    status: o.status,
    visibility: "public",
    featured: chance(0.18),
    show_agent_phone: true,
    enable_whatsapp_cta: true,
    enable_telegram_share: true,
    hero_image_url: hero,
    internal_notes: null,
    views_count: views,
    shares_count: shares,
    leads_count: leads,
    is_demo: true,
    deleted_at: null,
    created_at: createdAt,
    updated_at: ["sold", "rented"].includes(o.status) ? daysAgoISO(Math.max(0, o.ageDays - between(5, 20))) : createdAt,
    published_at: o.status === "draft" ? null : createdAt,
  };
  demoListings.push(listing);

  if (o.withMedia) {
    const n = between(5, 9);
    demoMedia[id] = Array.from({ length: n }).map((_, i) => ({
      id: `${id}-m${i}`,
      listing_id: id,
      media_type: "image" as const,
      url: i === 0 ? hero : heroForListing(o.cat, type),
      thumbnail_url: null,
      caption: i === 0 ? "Hero" : "Unit",
      sort_order: i,
      file_size: between(120000, 480000),
      is_demo: true,
      created_at: createdAt,
    }));
  } else {
    demoMedia[id] = [{
      id: `${id}-m0`, listing_id: id, media_type: "image", url: hero,
      thumbnail_url: null, caption: null, sort_order: 0, file_size: 240000,
      is_demo: true, created_at: createdAt,
    }];
  }

  // Category detail
  if (o.cat === "project") {
    demoProjectDetails[id] = {
      id: `${id}-pd`, listing_id: id, project_name: title, developer: pick(["Sunrise Bhd", "GreenBuild Sdn Bhd", "Metro Devt", "Pavilion Group"]),
      completion_year: String(between(2026, 2028)), project_status: pick(["New Launch", "Under Construction", "Completed"]),
      unit_types: "Type A, B, C", starting_price: price, maintenance_fee: between(200, 450),
      package_info: "Rebate 5% + percuma legal fee", booking_fee: 5000, sales_gallery_link: "https://example.com/gallery", brochure_url: null,
    };
  } else if (o.cat === "subsale") {
    demoSubsaleDetails[id] = {
      id: `${id}-sd`, listing_id: id, asking_price: price, valuation_estimate: Math.round(price * 0.97),
      occupancy_status: pick(["Owner occupied", "Tenanted", "Vacant"]), maintenance_fee: between(0, 350),
      renovation_info: pick(["Fully renovated", "Partially renovated", "Original condition"]),
      facing_direction: pick(["North", "South", "East", "West"]), title_type: pick(["Individual", "Strata", "Master"]),
      viewing_availability: "Hujung minggu", co_broke_allowed: true, private_commission_notes: "Co-broke 50/50.",
    };
  } else {
    demoRentalDetails[id] = {
      id: `${id}-rd`, listing_id: id, monthly_rental: price, deposit_requirement: "2 bulan + 1 utiliti",
      minimum_tenancy: "12 bulan", move_in_date: dateOnly(daysAgoISO(-between(7, 30))),
      tenant_preference: pick(["Profesional", "Keluarga", "Pelajar", "Semua"]),
      pet_allowed: chance(0.4), cooking_allowed: chance(0.7), parking_included: true, utilities_info: "Tidak termasuk utiliti.",
    };
  }

  // Leads for this listing, spread over the past 6 months
  for (let i = 0; i < leads; i++) {
    leadId += 1;
    demoLeads.push({
      id: `lead-${leadId}`,
      listing_id: id,
      agent_id: o.agent.userId,
      name: `${pick(LEAD_FIRST)} ${pick(LEAD_FIRST)}`,
      phone: `+6013${between(1000000, 9999999)}`,
      email: chance(0.5) ? `prospek${leadId}@example.com` : null,
      source: pick(LEAD_SOURCES as unknown as LeadSource[]),
      budget: `RM ${between(2, 25) * 100}k`,
      preferred_area: o.area,
      notes: "Lead contoh.",
      status: pick(["new", "contacted", "viewing", "negotiating", "booked", "closed", "lost"] as LeadStatus[]),
      is_demo: true,
      created_at: daysAgoISO(between(0, 180)),
      updated_at: NOW_ISO,
    });
  }

  // Shares for this listing
  for (let i = 0; i < shares; i++) {
    shareId += 1;
    demoShares.push({
      id: `share-${shareId}`,
      listing_id: id,
      agent_id: o.agent.userId,
      channel: pick(["whatsapp", "telegram", "copy_link", "website"] as ShareRow["channel"][]),
      shared_at: daysAgoISO(between(0, 180)),
      visitor_token: null,
      metadata: null,
      is_demo: true,
    });
  }

  return listing;
}

// Deal status distribution & how it maps to a listing status.
const DEAL_STATUS_POOL: DealStatus[] = [
  "closed", "closed", "closed", "closed", "closed", // ~45%
  "booked", "booked",
  "pending", "pending",
  "cancelled",
  "refund",
  "others",
];
function listingStatusForDeal(s: DealStatus, cat: ListingCategory): ListingStatus {
  const sold = cat === "rental" ? "rented" : "sold";
  switch (s) {
    case "closed": return sold;
    case "booked": return "booked";
    case "pending": return cat === "rental" ? "loan_in_progress" : "spa_in_progress";
    case "cancelled": return "withdrawn";
    case "refund": return "failed";
    default: return "expired";
  }
}

function commissionFor(cat: ListingCategory, price: number): { amount: number; pct: number | null } {
  if (cat === "rental") return { amount: price, pct: null }; // one month
  const pct = cat === "project" ? 2.5 : 2;
  return { amount: Math.round((price * pct) / 100), pct };
}

const dealsPerTier: Record<Tier, [number, number]> = { top: [11, 16], mid: [6, 10], low: [2, 5] };
const invPerTier: Record<Tier, [number, number]> = { top: [4, 6], mid: [2, 4], low: [1, 2] };

function generateForAgent(agent: Agent, opts: { rich?: boolean } = {}) {
  const sectors: ListingCategory[] = agent.sectors.length
    ? agent.sectors
    : ["subsale"];
  const primary = sectors[0];
  const pickSector = (): ListingCategory =>
    chance(0.65) ? primary : pick(sectors);
  const areaFor = () =>
    agent.key === "azlan" ? pick(AZLAN_AREAS) : chance(0.7) ? agent.area : pick(ALL_AREAS);
  // Azlan deals in residential subsale + rental; his commercial is the real Excella listing.
  const poolFor = (c: ListingCategory): PropertyType[] | undefined =>
    agent.key === "azlan" && c === "subsale" ? RESIDENTIAL_TYPES : undefined;

  // Deals over the last 6 months
  const [dlo, dhi] = dealsPerTier[agent.tier];
  const nDeals = between(dlo, dhi);
  for (let i = 0; i < nDeals; i++) {
    const cat = pickSector();
    const area = areaFor();
    const status = pick(DEAL_STATUS_POOL);
    const monthOffset = between(0, 5);
    const isClosedLike = status === "closed" || status === "refund";

    const closedDate = isClosedLike ? dateInMonth(monthOffset) : null;
    const bookingBase = closedDate ?? dateInMonth(Math.min(5, monthOffset));
    const bookingDate = new Date(bookingBase.getTime() - between(7, 40) * 86400000);
    const ageDays = Math.max(1, Math.round((NOW.getTime() - bookingDate.getTime()) / 86400000));

    const lStatus = listingStatusForDeal(status, cat);
    const price = priceFor(area, cat);
    const listing = makeListing({
      agent, cat, area, status: lStatus, ageDays,
      withMedia: !!opts.rich && i < 4,
      price,
      pool: poolFor(cat),
      leads: isClosedLike ? between(3, 9) : between(1, 5),
    });

    const isRental = cat === "rental";
    const comm = commissionFor(cat, price);
    did += 1;
    demoDeals.push({
      id: `deal-${did}`,
      listing_id: listing.id,
      agent_id: agent.userId,
      lead_id: null,
      deal_type: isRental ? "rental" : "sale",
      booking_date: dateOnly(bookingDate.toISOString()),
      closed_date: closedDate ? dateOnly(closedDate.toISOString()) : null,
      sold_price: isRental ? null : price,
      rental_price: isRental ? price : null,
      commission_amount: comm.amount,
      commission_percentage: comm.pct,
      customer_name: `${pick(LEAD_FIRST)} ${pick(LEAD_FIRST)}`,
      customer_phone: `+6017${between(1000000, 9999999)}`,
      payment_status: status === "closed" ? "Paid" : status === "refund" ? "Refunded" : status === "pending" ? "Partial" : "Pending",
      deal_status: status,
      remarks: null,
      is_demo: true,
      created_at: bookingDate.toISOString(),
      updated_at: NOW_ISO,
    });
  }

  // Active inventory listings (currently on the market)
  const [ilo, ihi] = invPerTier[agent.tier];
  const nInv = between(ilo, ihi);
  for (let i = 0; i < nInv; i++) {
    const cat = pickSector();
    const area = areaFor();
    makeListing({
      agent, cat, area,
      status: pick(["available", "available", "available", "viewing_scheduled"]),
      ageDays: between(3, 130),
      withMedia: !!opts.rich,
      pool: poolFor(cat),
      views: between(40, 520),
      shares: between(3, 28),
      leads: between(0, 10),
    });
  }
}

// Azlan first (rich), then the other active agents.
generateForAgent(agents[0], { rich: true });
for (const a of activeAgents.slice(1)) generateForAgent(a);

// A few inactive agents keep some older inventory for realism.
for (const a of agents.filter((x) => x.status !== "active").slice(0, 8)) {
  const cats: ListingCategory[] = a.sectors.length ? a.sectors : ["subsale"];
  makeListing({
    agent: a, cat: pick(cats), area: a.area,
    status: pick(["expired", "withdrawn", "available"] as ListingStatus[]), ageDays: between(120, 220),
    views: between(20, 120), shares: between(0, 6), leads: between(0, 2),
  });
}

// ---------------------------------------------------------------------------
// Real listing (not demo) — supplied by Azlan.
// ---------------------------------------------------------------------------
{
  const id = "listing-excella-ampang";
  const createdAt = daysAgoISO(18);
  const real: ListingRow = {
    id,
    agent_id: "user-azlan",
    category: "subsale",
    title: "Shoplot 3.5 Tingkat, Excella Business Park, Ampang",
    slug: "shoplot-excella-business-park-ampang",
    property_type: "shop",
    area: "Ampang",
    address_private: "Excella Business Park, Jalan Ampang, 68000 Ampang, Selangor",
    address_public: "Excella Business Park, Jalan Ampang, Ampang",
    show_exact_address: true,
    map_url: "https://maps.google.com/?q=Excella+Business+Park+Ampang",
    price: 5150000,
    price_display: "RM 5,150,000",
    tenure: "leasehold",
    built_up_sqft: 14900,
    land_area_sqft: 3480,
    bedrooms: null,
    bathrooms: 6,
    carparks: 6,
    furnishing: "unfurnished",
    description:
      "Shoplot pejabat 3.5 tingkat di Excella Business Park, Ampang. Keluasan bangunan ±14,900 kaki persegi, keluasan tanah ±3,480 kaki persegi. Sesuai untuk HQ korporat, klinik, pusat latihan atau pelaburan komersial. Lokasi strategik dengan akses mudah ke Jalan Ampang, MRT & lebuh raya utama. Pegangan pajakan (leasehold). Disenaraikan oleh Chester Properties HQ — Super Ren Group.",
    top_selling_points: [
      "3.5 tingkat — ±14,900 kp keluasan bangunan",
      "Tanah ±3,480 kp",
      "Lokasi komersial premium, Jalan Ampang",
      "Sesuai HQ korporat / klinik / pusat latihan",
      "Akses mudah MRT & lebuh raya",
    ],
    facilities: ["Parking", "Lift", "24h Security", "Backup Genset"],
    amenities: ["Bank", "Restoran", "Hospital", "Shopping Mall"],
    nearby: ["Jalan Ampang", "MRT berhampiran", "AEON Ampang"],
    tags: ["commercial", "hot"],
    status: "available",
    visibility: "public",
    featured: true,
    show_agent_phone: true,
    enable_whatsapp_cta: true,
    enable_telegram_share: true,
    hero_image_url: "/demo/properties/commercial-excella.svg",
    internal_notes: "Listing sebenar Chester HQ. Co-broke dialu-alukan.",
    views_count: 96,
    shares_count: 14,
    leads_count: 0,
    is_demo: false,
    deleted_at: null,
    created_at: createdAt,
    updated_at: createdAt,
    published_at: createdAt,
  };
  demoListings.push(real);
  demoMedia[id] = [{
    id: `${id}-media-0`, listing_id: id, media_type: "image",
    url: "/demo/properties/commercial-excella.svg", thumbnail_url: null,
    caption: "Excella Business Park, Ampang", sort_order: 0, file_size: 320000,
    is_demo: false, created_at: createdAt,
  }];
  demoSubsaleDetails[id] = {
    id: `${id}-sd`, listing_id: id, asking_price: 5150000, valuation_estimate: 5000000,
    occupancy_status: "Vacant", maintenance_fee: 0, renovation_info: "Bare unit / original condition",
    facing_direction: "North", title_type: "Strata", viewing_availability: "Dengan temujanji",
    co_broke_allowed: true, private_commission_notes: "Co-broke 50/50. Hubungi Amirul untuk butiran.",
  };
}

// ---------------------------------------------------------------------------
// Viewings (derived from leads + listings) — a working Viewing Schedule.
// ---------------------------------------------------------------------------
const listingById = new Map(demoListings.map((l) => [l.id, l]));
let viewId = 0;

/** Build a datetime; dayOffset < 0 = past, > 0 = future. Office hours, on the half-hour. */
function viewingDateTime(dayOffset: number): string {
  const d = new Date(
    NOW.getFullYear(),
    NOW.getMonth(),
    NOW.getDate() + dayOffset,
    between(9, 18),
    pick([0, 30]),
    0,
  );
  return d.toISOString();
}

const VIEW_NOTES = [
  "Prospek minta lihat unit pada hujung minggu.",
  "Bawa salinan dokumen pinjaman.",
  "Berminat dengan unit high-floor.",
  "Akan datang bersama pasangan.",
  "Tanya tentang co-broke & komisen.",
  "Perlu confirm parking & maintenance fee.",
  null,
  null,
];

function makeViewing(opts: {
  lead: LeadRow;
  listing: ListingRow;
  dayOffset: number;
  status: ViewingStatus;
}): void {
  viewId += 1;
  const { lead, listing, dayOffset, status } = opts;
  demoViewings.push({
    id: `viewing-${viewId}`,
    listing_id: listing.id,
    lead_id: lead.id,
    agent_id: lead.agent_id,
    prospect_name: lead.name,
    prospect_phone: lead.phone,
    listing_title: listing.title,
    location: listing.address_public || listing.area,
    scheduled_at: viewingDateTime(dayOffset),
    status,
    notes: pick(VIEW_NOTES),
    is_demo: true,
    created_at: daysAgoISO(Math.max(0, -dayOffset) + between(1, 10)),
  });
}

for (const lead of demoLeads) {
  if (!lead.listing_id) continue;
  const listing = listingById.get(lead.listing_id);
  if (!listing) continue;

  switch (lead.status) {
    case "viewing":
      // Active viewing prospects — mostly upcoming, some just completed.
      if (chance(0.6)) {
        makeViewing({ lead, listing, dayOffset: between(0, 9), status: "scheduled" });
      } else {
        makeViewing({ lead, listing, dayOffset: -between(1, 6), status: pick(["completed", "interested"]) });
      }
      break;
    case "contacted":
      if (chance(0.5)) {
        makeViewing({ lead, listing, dayOffset: between(1, 12), status: "scheduled" });
      } else if (chance(0.3)) {
        makeViewing({ lead, listing, dayOffset: -between(2, 20), status: "rescheduled" });
      }
      break;
    case "negotiating":
      makeViewing({ lead, listing, dayOffset: -between(3, 30), status: "interested" });
      break;
    case "booked":
      makeViewing({ lead, listing, dayOffset: -between(10, 45), status: "interested" });
      break;
    case "closed":
      makeViewing({ lead, listing, dayOffset: -between(20, 90), status: "completed" });
      break;
    case "lost":
      makeViewing({
        lead,
        listing,
        dayOffset: -between(5, 60),
        status: pick(["not_interested", "no_show", "cancelled"]),
      });
      break;
    case "new":
      if (chance(0.18)) {
        makeViewing({ lead, listing, dayOffset: between(2, 14), status: "scheduled" });
      }
      break;
  }
}

// Ensure the flagship Excella listing has a few upcoming viewings under Amirul.
{
  const excella = listingById.get("listing-excella-ampang");
  if (excella) {
    const prospects = [
      { name: "Tan Wei Jie", phone: "+60128841220" },
      { name: "Hafiz Rahman", phone: "+60173360914" },
      { name: "Suresh Kumar", phone: "+60192207733" },
    ];
    prospects.forEach((p, i) => {
      leadId += 1;
      const lead: LeadRow = {
        id: `lead-${leadId}`,
        listing_id: excella.id,
        agent_id: "user-azlan",
        name: p.name,
        phone: p.phone,
        email: null,
        source: "whatsapp" as LeadSource,
        budget: "RM 5.0m – 5.2m",
        preferred_area: "Ampang",
        notes: "Prospek shoplot Excella Business Park.",
        status: "viewing" as LeadStatus,
        is_demo: false,
        created_at: daysAgoISO(between(2, 14)),
        updated_at: NOW_ISO,
      };
      demoLeads.push(lead);
      makeViewing({ lead, listing: excella, dayOffset: i + 1, status: "scheduled" });
    });
  }
}

/** Viewings scoped to one agent (ownerId). Omit ownerId for the full group. Sorted by time. */
export function demoGetViewings(ownerId?: string): ViewingRow[] {
  const rows = ownerId
    ? demoViewings.filter((v) => v.agent_id === ownerId)
    : demoViewings.slice();
  return rows.sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
  );
}

export function agentByUserId(userId: string): AgentProfileRow | undefined {
  return demoAgents.find((a) => a.user_id === userId);
}
