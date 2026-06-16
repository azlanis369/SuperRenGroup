// Deterministic in-memory demo dataset shaped exactly like the DB Row types,
// so the same components/queries work without any database. Built once at
// module load. Numbers are tuned so the dashboard & SWOT look meaningful.

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
const rnd = mulberry32(20260615);
const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const between = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
const daysAgoISO = (d: number) =>
  new Date(Date.now() - d * 86400000).toISOString();
const dateOnly = (iso: string) => iso.slice(0, 10);

const NOW = new Date().toISOString();

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------
type AgentSeed = {
  key: string;
  name: string;
  ren: string;
  areas: string[];
  spec: string[];
  bio: string;
};

const AGENT_SEEDS: AgentSeed[] = [
  { key: "aiman", name: "Aiman Hakimi", ren: "REN 12345", areas: ["KLCC", "KL City"], spec: ["subsale", "rental"], bio: "Pakar hartanah mewah di sekitar KLCC & pusat bandar KL." },
  { key: "aisyah", name: "Nur Aisyah Rahman", ren: "REN 23456", areas: ["Bangi", "Kajang", "Semenyih"], spec: ["project"], bio: "Fokus projek baharu di koridor selatan Selangor." },
  { key: "daniel", name: "Daniel Lim", ren: "REN 34567", areas: ["Petaling Jaya", "Subang Jaya"], spec: ["subsale", "rental"], bio: "Negotiator aktif di PJ & Subang dengan rekod tutup pantas." },
  { key: "siti", name: "Siti Hajar Osman", ren: "REN 45678", areas: ["Shah Alam", "Klang"], spec: ["subsale"], bio: "Pakar rumah teres & landed di Shah Alam dan Klang." },
  { key: "faris", name: "Faris Iskandar", ren: "REN 56789", areas: ["Setapak", "Wangsa Maju", "Gombak"], spec: ["subsale", "rental"], bio: "Khidmat mesra untuk kawasan utara KL." },
  { key: "michelle", name: "Michelle Tan", ren: "REN 67890", areas: ["Mont Kiara", "Desa ParkCity", "Kepong"], spec: ["rental", "subsale"], bio: "Hartanah premium & sewaan eksklusif di Mont Kiara." },
  { key: "harith", name: "Harith Zulkifli", ren: "REN 78901", areas: ["Cyberjaya", "Putrajaya", "Dengkil"], spec: ["rental", "project"], bio: "Spesialis sewaan pelajar & profesional di Cyberjaya." },
  { key: "kavitha", name: "Kavitha Raj", ren: "REN 89012", areas: ["Puchong", "Seri Kembangan", "Bukit Jalil"], spec: ["subsale", "project"], bio: "Membantu keluarga cari rumah idaman di selatan Klang Valley." },
];

export const demoUsers: UserRow[] = [
  { id: "user-superadmin", email: "superadmin@superren.demo", role: "super_admin", status: "active", created_at: NOW, last_login_at: NOW },
  { id: "user-admin", email: "admin@superren.demo", role: "admin", status: "active", created_at: NOW, last_login_at: NOW },
  ...AGENT_SEEDS.map((a, i) => ({
    id: `user-${a.key}`,
    email: `${a.key}@superren.demo`,
    role: "agent" as const,
    status: "active" as const,
    created_at: NOW,
    last_login_at: daysAgoISO(between(0, 6)),
  })),
];

export const demoAgents: AgentProfileRow[] = AGENT_SEEDS.map((a, i) => ({
  id: `profile-${a.key}`,
  user_id: `user-${a.key}`,
  full_name: a.name,
  display_name: a.name,
  slug: slugify(a.name),
  profile_photo_url: `/demo/agents/agent-${String(i + 1).padStart(2, "0")}.svg`,
  ren_number: a.ren,
  agency_name: "Super Ren Realty Demo",
  title: i % 2 === 0 ? "Senior Negotiator" : "Real Estate Negotiator",
  phone: `+60 12-${between(300, 999)} ${between(1000, 9999)}`,
  whatsapp: `+6012${between(3000000, 9999999)}`,
  email: `${a.key}@superren.demo`,
  bio: a.bio,
  service_areas: a.areas,
  specialization: a.spec,
  facebook_url: `https://facebook.com/${a.key}.superren`,
  instagram_url: `https://instagram.com/${a.key}.superren`,
  tiktok_url: null,
  website_url: null,
  telegram_username: `@${a.key}_superren`,
  qr_code_url: null,
  is_profile_public: true,
  is_demo: true,
  created_at: NOW,
  updated_at: NOW,
}));

// ---------------------------------------------------------------------------
// Listing generation, tuned per analytics scenario
// ---------------------------------------------------------------------------
type Scenario =
  | "strength_subsale" // Shah Alam/Klang: high close, fast
  | "opportunity_project" // Bangi/Kajang/Semenyih: high interest
  | "weakness_rental" // Mont Kiara/KLCC: views high, leads low
  | "fast_rental" // Cyberjaya/Putrajaya: quick conversion
  | "low_media" // Setapak/Wangsa Maju/Ampang/Gombak: few photos
  | "general";

type Spec = {
  title: string;
  category: ListingCategory;
  area: string;
  agentKey: string;
  scenario: Scenario;
  type: PropertyType;
  price: number;
};

const T = (
  title: string,
  category: ListingCategory,
  area: string,
  agentKey: string,
  scenario: Scenario,
  type: PropertyType,
  price: number,
): Spec => ({ title, category, area, agentKey, scenario, type, price });

const SPECS: Spec[] = [
  // ---- Projects (15) ----
  T("DEMO: Aurora Heights Residence, Bangi", "project", "Bangi", "aisyah", "opportunity_project", "condo", 480000),
  T("DEMO: Southville Green Residence, Bangi", "project", "Bangi", "aisyah", "opportunity_project", "condo", 420000),
  T("DEMO: Semenyih Garden Heights", "project", "Semenyih", "aisyah", "opportunity_project", "apartment", 360000),
  T("DEMO: Kajang Sentral Suites", "project", "Kajang", "aisyah", "opportunity_project", "apartment", 530000),
  T("DEMO: KL Urban Suites, Setapak", "project", "Setapak", "faris", "low_media", "condo", 560000),
  T("DEMO: CyberLake Serviced Apartment, Cyberjaya", "project", "Cyberjaya", "harith", "fast_rental", "apartment", 450000),
  T("DEMO: Damansara Metro Residence, PJ", "project", "Petaling Jaya", "daniel", "general", "condo", 720000),
  T("DEMO: Bukit Jalil Parkview Suites", "project", "Bukit Jalil", "kavitha", "general", "condo", 690000),
  T("DEMO: Shah Alam Sentral Residences", "project", "Shah Alam", "siti", "general", "apartment", 410000),
  T("DEMO: Cheras City Link Residence", "project", "Cheras", "kavitha", "general", "condo", 540000),
  T("DEMO: Putrajaya Lakeview Homes", "project", "Putrajaya", "harith", "fast_rental", "condo", 620000),
  T("DEMO: Puchong Skypark Residence", "project", "Puchong", "kavitha", "general", "condo", 470000),
  T("DEMO: Gombak Hilltop Residence", "project", "Gombak", "faris", "low_media", "apartment", 380000),
  T("DEMO: Mont Kiara Sky Suites", "project", "Mont Kiara", "michelle", "weakness_rental", "condo", 1320000),
  T("DEMO: Rawang Emerald Park", "project", "Rawang", "kavitha", "general", "terrace", 520000),

  // ---- Subsale (15) ----
  T("DEMO: Renovated Double Storey Terrace, Shah Alam", "subsale", "Shah Alam", "siti", "strength_subsale", "terrace", 720000),
  T("DEMO: Corner Lot Terrace, Shah Alam", "subsale", "Shah Alam", "siti", "strength_subsale", "terrace", 850000),
  T("DEMO: Klang Double Storey Terrace", "subsale", "Klang", "siti", "strength_subsale", "terrace", 560000),
  T("DEMO: Spacious Terrace Near School, Klang", "subsale", "Klang", "siti", "strength_subsale", "terrace", 600000),
  T("DEMO: Freehold Condo Near LRT, Wangsa Maju", "subsale", "Wangsa Maju", "faris", "low_media", "condo", 430000),
  T("DEMO: Subsale Apartment, Ampang", "subsale", "Ampang", "faris", "low_media", "apartment", 320000),
  T("DEMO: Corner Lot Terrace, Puchong", "subsale", "Puchong", "kavitha", "general", "terrace", 680000),
  T("DEMO: Family Home Near MRT, Kajang", "subsale", "Kajang", "aisyah", "general", "terrace", 580000),
  T("DEMO: High Floor Condo, Mont Kiara", "subsale", "Mont Kiara", "michelle", "weakness_rental", "condo", 1450000),
  T("DEMO: Bangsar Condo with City View", "subsale", "Bangsar", "aiman", "general", "condo", 1280000),
  T("DEMO: Semi-D with Large Land, Rawang", "subsale", "Rawang", "kavitha", "general", "semi_d", 980000),
  T("DEMO: Townhouse Near School, Seri Kembangan", "subsale", "Seri Kembangan", "kavitha", "general", "terrace", 540000),
  T("DEMO: KLCC Luxury Condo, High Floor", "subsale", "KLCC", "aiman", "general", "condo", 2350000),
  T("DEMO: Damansara Bungalow with Pool", "subsale", "Damansara", "daniel", "general", "bungalow", 2800000),
  T("DEMO: Subang Jaya Terrace, Renovated", "subsale", "Subang Jaya", "daniel", "general", "terrace", 760000),

  // ---- Rental (15) ----
  T("DEMO: Fully Furnished Studio, KLCC", "rental", "KLCC", "aiman", "weakness_rental", "condo", 3200),
  T("DEMO: Luxury Condo for Rent, KLCC", "rental", "KLCC", "aiman", "weakness_rental", "condo", 5500),
  T("DEMO: Condo for Rent, Mont Kiara", "rental", "Mont Kiara", "michelle", "weakness_rental", "condo", 4800),
  T("DEMO: High Floor Suite, Mont Kiara", "rental", "Mont Kiara", "michelle", "weakness_rental", "condo", 6500),
  T("DEMO: Cyberjaya Studio Near University", "rental", "Cyberjaya", "harith", "fast_rental", "apartment", 1300),
  T("DEMO: Serviced Residence, Cyberjaya", "rental", "Cyberjaya", "harith", "fast_rental", "apartment", 1600),
  T("DEMO: Putrajaya Studio for Rent", "rental", "Putrajaya", "harith", "fast_rental", "apartment", 1450),
  T("DEMO: Family Rental Unit, Subang Jaya", "rental", "Subang Jaya", "daniel", "general", "condo", 2200),
  T("DEMO: Affordable Apartment, Setapak", "rental", "Setapak", "faris", "low_media", "apartment", 1500),
  T("DEMO: Apartment Near MRT, Cheras", "rental", "Cheras", "kavitha", "general", "apartment", 1800),
  T("DEMO: Serviced Residence, Bukit Jalil", "rental", "Bukit Jalil", "kavitha", "general", "condo", 2400),
  T("DEMO: Terrace House for Rent, Shah Alam", "rental", "Shah Alam", "siti", "general", "terrace", 2000),
  T("DEMO: Office Unit for Rent, Petaling Jaya", "rental", "Petaling Jaya", "daniel", "general", "office", 4500),
  T("DEMO: Shoplot Rental, Klang", "rental", "Klang", "siti", "general", "shop", 3800),
  T("DEMO: Cozy Apartment, Wangsa Maju", "rental", "Wangsa Maju", "faris", "low_media", "apartment", 1400),
];

const FACILITIES = ["Swimming Pool", "Gym", "24h Security", "Playground", "Surau", "BBQ Area", "Sauna", "Multipurpose Hall"];
const AMENITIES = ["Shopping Mall", "School", "Hospital", "Bank", "Restoran", "Pasar"];
const SELLING = ["Lokasi strategik", "Hampir pengangkutan awam", "Kawasan selamat 24 jam", "Harga bawah pasaran", "Pemandangan menarik", "Sesuai untuk keluarga", "Pulangan sewa tinggi", "Senang dapat penyewa"];

const STATUS_BY_SCENARIO: Record<Scenario, ListingStatus[]> = {
  strength_subsale: ["sold", "sold", "booked", "available", "spa_in_progress"],
  opportunity_project: ["available", "interested", "viewing_scheduled", "booked", "available"],
  weakness_rental: ["available", "available", "interested", "withdrawn", "available"],
  fast_rental: ["rented", "rented", "booked", "available", "rented"],
  low_media: ["available", "available", "interested", "expired", "available"],
  general: ["available", "viewing_scheduled", "booked", "sold", "rented", "available"],
};

function metricsFor(scenario: Scenario): { views: number; shares: number; leads: number; mediaCount: number; ageDays: number } {
  switch (scenario) {
    case "weakness_rental":
      return { views: between(180, 420), shares: between(20, 45), leads: between(0, 2), mediaCount: between(6, 9), ageDays: between(40, 120) };
    case "opportunity_project":
      return { views: between(120, 260), shares: between(35, 70), leads: between(8, 16), mediaCount: between(6, 9), ageDays: between(10, 90) };
    case "strength_subsale":
      return { views: between(80, 180), shares: between(12, 30), leads: between(6, 12), mediaCount: between(7, 10), ageDays: between(5, 60) };
    case "fast_rental":
      return { views: between(90, 200), shares: between(18, 36), leads: between(7, 14), mediaCount: between(5, 8), ageDays: between(3, 45) };
    case "low_media":
      return { views: between(40, 110), shares: between(4, 12), leads: between(1, 4), mediaCount: 4, ageDays: between(20, 100) };
    default:
      return { views: between(60, 200), shares: between(10, 30), leads: between(3, 9), mediaCount: between(5, 9), ageDays: between(5, 150) };
  }
}

function fix(t: PropertyType): PropertyType {
  // normalize any placeholder types
  return (["condo", "apartment", "terrace", "semi_d", "bungalow", "shop", "office", "land", "other"] as PropertyType[]).includes(t)
    ? t
    : "condo";
}

export const demoListings: ListingRow[] = [];
export const demoMedia: Record<string, ListingMediaRow[]> = {};
export const demoProjectDetails: Record<string, ListingProjectDetailRow> = {};
export const demoSubsaleDetails: Record<string, ListingSubsaleDetailRow> = {};
export const demoRentalDetails: Record<string, ListingRentalDetailRow> = {};

const catCounter: Record<ListingCategory, number> = { project: 0, subsale: 0, rental: 0 };

SPECS.forEach((spec, idx) => {
  const id = `listing-${idx + 1}`;
  const agentUserId = `user-${spec.agentKey}`;
  const m = metricsFor(spec.scenario);
  catCounter[spec.category] += 1;
  const heroN = String((catCounter[spec.category] - 1) % 12 + 1).padStart(2, "0");
  const status = pick(STATUS_BY_SCENARIO[spec.scenario]);
  const beds = spec.category === "rental" && spec.type === "office" ? 0 : between(1, 5);
  const baths = Math.max(1, beds - between(0, 1));
  const sqft = spec.type === "office" || spec.type === "shop" ? between(800, 2500) : between(650, 2200);
  const createdAt = daysAgoISO(m.ageDays);
  const sellingPts = [...SELLING].sort(() => rnd() - 0.5).slice(0, 5);

  const listing: ListingRow = {
    id,
    agent_id: agentUserId,
    category: spec.category,
    title: spec.title,
    slug: slugify(spec.title.replace("DEMO:", "")) + "-" + (idx + 1),
    property_type: fix(spec.type),
    area: spec.area,
    address_private: `No. ${between(1, 99)}, Jalan ${spec.area} ${between(1, 20)}`,
    address_public: `Berhampiran pusat ${spec.area}`,
    show_exact_address: false,
    map_url: "https://maps.google.com",
    price: spec.price,
    price_display: spec.category === "rental" ? `RM ${spec.price.toLocaleString()}/bulan` : null,
    tenure: pick(["freehold", "leasehold"]),
    built_up_sqft: sqft,
    land_area_sqft: ["terrace", "semi_d", "bungalow"].includes(spec.type) ? between(1400, 4000) : null,
    bedrooms: beds || null,
    bathrooms: baths,
    carparks: between(1, 3),
    furnishing: pick(["unfurnished", "partly_furnished", "fully_furnished"]),
    description:
      `${spec.title.replace("DEMO: ", "")} — unit contoh untuk tujuan demo sahaja. ` +
      `Terletak di ${spec.area}, sesuai untuk pelaburan atau kediaman. Hubungi agent untuk tempahan viewing.`,
    top_selling_points: sellingPts,
    facilities: [...FACILITIES].sort(() => rnd() - 0.5).slice(0, between(3, 6)),
    amenities: [...AMENITIES].sort(() => rnd() - 0.5).slice(0, between(2, 5)),
    nearby: [`${spec.area} MRT ${between(3, 12)} min`, `Mall ${spec.area}`, `Sekolah berhampiran`],
    tags: pick([["hot"], ["value-buy"], ["urgent", "nego"], ["new"], []]),
    status,
    visibility: "public",
    featured: rnd() < 0.25,
    show_agent_phone: true,
    enable_whatsapp_cta: true,
    enable_telegram_share: true,
    hero_image_url: `/demo/properties/${spec.category}-${heroN}.svg`,
    internal_notes: "Nota dalaman demo.",
    views_count: m.views,
    shares_count: m.shares,
    leads_count: m.leads,
    is_demo: true,
    deleted_at: null,
    created_at: createdAt,
    updated_at: status === "sold" || status === "rented" ? daysAgoISO(Math.max(1, m.ageDays - between(5, 20))) : createdAt,
    published_at: status === "draft" ? null : createdAt,
  };
  demoListings.push(listing);

  // Media
  demoMedia[id] = Array.from({ length: m.mediaCount }).map((_, i) => {
    const nn = String(((catCounter[spec.category] - 1 + i) % 12) + 1).padStart(2, "0");
    return {
      id: `${id}-media-${i}`,
      listing_id: id,
      media_type: "image" as const,
      url: `/demo/properties/${spec.category}-${nn}.svg`,
      thumbnail_url: null,
      caption: i === 0 ? "Hero · Sample Unit" : "Sample Unit",
      sort_order: i,
      file_size: between(120000, 480000),
      is_demo: true,
      created_at: createdAt,
    };
  });

  // Category details
  if (spec.category === "project") {
    demoProjectDetails[id] = {
      id: `${id}-pd`, listing_id: id,
      project_name: spec.title.replace("DEMO: ", ""), developer: pick(["Sunrise Demo Sdn Bhd", "GreenBuild Demo", "Metro Demo Devt"]),
      completion_year: String(between(2026, 2028)), project_status: pick(["New Launch", "Under Construction", "Completed"]),
      unit_types: "Type A, B, C", starting_price: spec.price, maintenance_fee: between(200, 450),
      package_info: "Rebate 5% + percuma legal fee (demo)", booking_fee: 5000,
      sales_gallery_link: "https://example.com/gallery", brochure_url: null,
    };
  } else if (spec.category === "subsale") {
    demoSubsaleDetails[id] = {
      id: `${id}-sd`, listing_id: id, asking_price: spec.price, valuation_estimate: Math.round(spec.price * 0.97),
      occupancy_status: pick(["Owner occupied", "Tenanted", "Vacant"]), maintenance_fee: between(0, 350),
      renovation_info: pick(["Fully renovated", "Partially renovated", "Original condition"]),
      facing_direction: pick(["North", "South", "East", "West"]), title_type: pick(["Individual", "Strata", "Master"]),
      viewing_availability: "Hujung minggu", co_broke_allowed: true, private_commission_notes: "Co-broke 50/50 (demo).",
    };
  } else {
    demoRentalDetails[id] = {
      id: `${id}-rd`, listing_id: id, monthly_rental: spec.price, deposit_requirement: "2 bulan + 1 utiliti",
      minimum_tenancy: "12 bulan", move_in_date: dateOnly(daysAgoISO(-between(7, 30))),
      tenant_preference: pick(["Profesional", "Keluarga", "Pelajar", "Semua"]),
      pet_allowed: rnd() < 0.4, cooking_allowed: rnd() < 0.7, parking_included: true, utilities_info: "Tidak termasuk utiliti.",
    };
  }
});

// ---------------------------------------------------------------------------
// Leads (~130)
// ---------------------------------------------------------------------------
const LEAD_NAMES = ["Ahmad", "Siti", "Lim", "Tan", "Raj", "Nurul", "Hafiz", "Wong", "Aina", "Zul", "Farah", "Daniel", "Mei", "Iskandar", "Kavin", "Hana", "Syafiq", "Amir", "Chong", "Devi"];
const LEAD_STATUS_BY_SCENARIO: Record<Scenario, LeadStatus[]> = {
  strength_subsale: ["closed", "booked", "negotiating", "viewing", "contacted"],
  opportunity_project: ["new", "contacted", "viewing", "negotiating", "lost"],
  weakness_rental: ["new", "lost", "new", "contacted", "lost"],
  fast_rental: ["closed", "booked", "viewing", "contacted", "closed"],
  low_media: ["new", "lost", "contacted"],
  general: ["new", "contacted", "viewing", "negotiating", "booked", "closed", "lost"],
};

export const demoLeads: LeadRow[] = [];
let leadN = 0;
for (const spec of SPECS) {
  const listing = demoListings.find((l) => l.title === spec.title)!;
  const count = listing.leads_count;
  for (let i = 0; i < count && demoLeads.length < 135; i++) {
    leadN++;
    demoLeads.push({
      id: `lead-${leadN}`,
      listing_id: listing.id,
      agent_id: listing.agent_id,
      name: `${pick(LEAD_NAMES)} ${pick(LEAD_NAMES)}`,
      phone: `+6013${between(1000000, 9999999)}`,
      email: rnd() < 0.5 ? `prospek${leadN}@example.com` : null,
      source: pick(LEAD_SOURCES as unknown as LeadSource[]),
      budget: `RM ${between(2, 18) * 100}k`,
      preferred_area: spec.area,
      notes: "Lead contoh (demo).",
      status: pick(LEAD_STATUS_BY_SCENARIO[spec.scenario]),
      is_demo: true,
      created_at: daysAgoISO(between(0, 170)),
      updated_at: NOW,
    });
  }
}

// ---------------------------------------------------------------------------
// Deals (~30) from booked/sold/rented listings
// ---------------------------------------------------------------------------
export const demoDeals: DealRow[] = [];
let dealN = 0;
for (const listing of demoListings) {
  const isClosed = listing.status === "sold" || listing.status === "rented";
  const isBooked = ["booked", "loan_in_progress", "spa_in_progress"].includes(listing.status);
  if (!isClosed && !isBooked) continue;
  dealN++;
  const isRental = listing.category === "rental";
  const price = listing.price ?? 0;
  const commission = isRental ? price : Math.round(price * 0.02);
  const bookingAgo = between(20, 90);
  const closeDays = listing.area === "Shah Alam" || listing.area === "Klang"
    ? between(6, 16)
    : listing.area === "Cyberjaya" || listing.area === "Putrajaya"
      ? between(5, 14)
      : between(18, 40);
  const closed = isClosed;
  demoDeals.push({
    id: `deal-${dealN}`,
    listing_id: listing.id,
    agent_id: listing.agent_id,
    lead_id: null,
    deal_type: isRental ? "rental" : "sale",
    booking_date: dateOnly(daysAgoISO(bookingAgo)),
    closed_date: closed ? dateOnly(daysAgoISO(Math.max(1, bookingAgo - closeDays))) : null,
    sold_price: isRental ? null : price,
    rental_price: isRental ? price : null,
    commission_amount: commission,
    commission_percentage: isRental ? null : 2,
    customer_name: `${pick(LEAD_NAMES)} ${pick(LEAD_NAMES)} (demo)`,
    customer_phone: `+6017${between(1000000, 9999999)}`,
    payment_status: closed ? "Paid" : "Pending",
    deal_status: closed ? "closed" : listing.status === "booked" ? "booked" : "processing",
    remarks: "Deal contoh (demo).",
    is_demo: true,
    created_at: daysAgoISO(bookingAgo),
    updated_at: NOW,
  });
}
// A couple of cancelled deals for realism
if (demoDeals.length > 2) {
  demoDeals[1] = { ...demoDeals[1], deal_status: "cancelled", closed_date: null, payment_status: "Cancelled" };
}

// ---------------------------------------------------------------------------
// Shares (sized per listing.shares_count)
// ---------------------------------------------------------------------------
const CHANNELS = ["whatsapp", "telegram", "copy_link", "website"] as const;
export const demoShares: ShareRow[] = [];
let shareN = 0;
for (const listing of demoListings) {
  for (let i = 0; i < listing.shares_count; i++) {
    shareN++;
    demoShares.push({
      id: `share-${shareN}`,
      listing_id: listing.id,
      agent_id: listing.agent_id,
      channel: pick(CHANNELS as unknown as ShareRow["channel"][]),
      shared_at: daysAgoISO(between(0, 170)),
      visitor_token: null,
      metadata: null,
      is_demo: true,
    });
  }
}

export function agentByUserId(userId: string): AgentProfileRow | undefined {
  return demoAgents.find((a) => a.user_id === userId);
}
