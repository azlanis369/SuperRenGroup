// ============================================================================
// Demo seed script for "Super Ren Group" (Next.js + Supabase real-estate CRM).
//
// Run with:
//   npm run seed:demo     -> default: reset + seed fresh
//   npm run seed:reset    -> --reset (clear demo data, then seed)
//   npm run seed:clear    -> --clear (only delete demo data, then exit)
//
// Executed via `node --env-file=.env.local scripts/seed-demo.mjs`, so the env
// vars below are already injected into process.env.
//
// Everything created here is clearly sample data: listing titles start with
// "DEMO:", all rows carry is_demo=true (where the column exists), and demo
// accounts use the @superren.demo email domain. Buyer/customer names + phones
// are obviously dummy.
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import {
  AGENTS,
  ADMIN,
  SUPER_ADMIN,
  LISTINGS,
  DEMO_AGENCY,
  DEMO_PASSWORD,
  DEMO_EMAIL_DOMAIN,
  FACILITIES_POOL,
  AMENITIES_POOL,
} from "./demo-data.mjs";

// ---------------------------------------------------------------------------
// Env + client
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://superren.demo";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "\nMissing required env vars. Ensure .env.local defines:\n" +
      "  NEXT_PUBLIC_SUPABASE_URL\n" +
      "  SUPABASE_SERVICE_ROLE_KEY\n" +
      "(and optionally NEXT_PUBLIC_SITE_URL)\n\n" +
      "This script is meant to run via `npm run seed:demo`.\n"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const MODE = has("--clear")
  ? "clear"
  : "seed"; // default / --reset / --demo / --seed all seed (with a clear first)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Tiny deterministic PRNG (mulberry32) so dashboard numbers are reproducible.
function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = makeRng(20260615);
const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const pickSome = (arr, n) => {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
  }
  return out;
};

const NOW = new Date("2026-06-15T08:00:00Z").getTime();
const DAY = 24 * 60 * 60 * 1000;
// Random ISO timestamp within the last `maxDays` days (default 180 ~ 6 months).
function pastDate(maxDays = 180, minDays = 0) {
  const days = randInt(minDays, maxDays);
  return new Date(NOW - days * DAY).toISOString();
}
function isoToDate(iso) {
  return iso.slice(0, 10);
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/^demo:\s*/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
function shortId() {
  return Math.floor(rng() * 0xffffff)
    .toString(16)
    .padStart(6, "0");
}

// Insert in chunks to keep payloads reasonable.
async function insertChunked(table, rows, returning = false) {
  const out = [];
  const size = 200;
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    let q = supabase.from(table).insert(chunk);
    if (returning) q = q.select();
    const { data, error } = await q;
    if (error) throw new Error(`insert ${table}: ${error.message}`);
    if (returning && data) out.push(...data);
  }
  return out;
}

// Dummy Malay/mixed customer names + phones (clearly sample).
const FIRST_NAMES = [
  "Ahmad", "Siti", "Mohd", "Nurul", "Lim", "Tan", "Raj", "Aisyah",
  "Faizal", "Hafiz", "Wong", "Devi", "Sara", "Iskandar", "Hanim", "Zul",
  "Amir", "Farah", "Chong", "Kumar", "Maya", "Iman", "Adam", "Liyana",
];
const LAST_NAMES = [
  "bin Abdullah", "binti Ismail", "Tan", "a/l Suppiah", "Lee",
  "bin Razak", "binti Yusof", "Ng", "a/p Krishnan", "bin Hassan",
];
function dummyName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)} (Demo)`;
}
function dummyPhone() {
  return `+601${randInt(0, 9)}${String(randInt(1000000, 9999999))}`;
}

const LEAD_SOURCES = [
  "whatsapp", "public_form", "manual", "telegram",
  "referral", "walk_in", "facebook", "tiktok", "instagram",
];
const LEAD_STATUSES = [
  "new", "contacted", "viewing", "negotiating", "booked", "closed", "lost",
];
const SHARE_CHANNELS = ["whatsapp", "telegram", "copy_link", "website"];

const PREFERRED_AREAS = [
  "Bangi", "Kajang", "Shah Alam", "Mont Kiara", "KLCC", "Cyberjaya",
  "Puchong", "Cheras", "Setapak", "Petaling Jaya", "Klang", "Putrajaya",
];
const BUDGETS = [
  "RM300k - RM450k", "RM450k - RM600k", "RM600k - RM800k",
  "RM800k - RM1.2M", "RM1,200 - RM2,000/bln", "RM2,000 - RM4,000/bln",
  "RM4,000 - RM8,000/bln",
];
const LEAD_NOTES = [
  "Berminat untuk lawat unit hujung minggu ini.",
  "Sedang bandingkan beberapa pilihan, minta info loan.",
  "Cari rumah untuk keluarga, perlu dekat sekolah.",
  "Pelaburan, fokus pada potensi sewaan.",
  "Minta gambar tambahan dan pelan lantai.",
  "First-time buyer, perlu nasihat pembiayaan.",
  "",
];

// ---------------------------------------------------------------------------
// Auth user lookup / creation (idempotent)
// ---------------------------------------------------------------------------
async function listAllAuthUsers() {
  const all = [];
  let page = 1;
  // perPage max is 1000; loop until a short page.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw new Error(`listUsers: ${error.message}`);
    const batch = data?.users ?? [];
    all.push(...batch);
    if (batch.length < 1000) break;
    page += 1;
  }
  return all;
}

async function ensureAuthUser(email, existingByEmail) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });
  if (!error && data?.user) return data.user.id;

  const msg = (error?.message || "").toLowerCase();
  if (msg.includes("already") || msg.includes("registered") || msg.includes("exist")) {
    const found = existingByEmail.get(email.toLowerCase());
    if (found) return found.id;
    // refresh listing once if not found in the cached map
    const refreshed = await listAllAuthUsers();
    const hit = refreshed.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
    if (hit) return hit.id;
  }
  throw new Error(`createUser(${email}): ${error?.message || "unknown error"}`);
}

// ---------------------------------------------------------------------------
// CLEAR
// ---------------------------------------------------------------------------
async function clearDemo() {
  console.log("Clearing existing demo data...");
  // FK-safe delete order: children first.
  const tables = [
    "listing_status_history",
    "deals",
    "leads",
    "shares",
    "listing_media",
    "listing_project_details",
    "listing_subsale_details",
    "listing_rental_details",
    "listings",
    "agent_profiles",
  ];
  for (const t of tables) {
    const { error } = await supabase.from(t).delete().eq("is_demo", true);
    if (error) throw new Error(`clear ${t}: ${error.message}`);
    console.log(`  - cleared ${t} (is_demo=true)`);
  }

  // public.users demo rows: identified by @superren.demo email.
  {
    const { error } = await supabase
      .from("users")
      .delete()
      .ilike("email", `%@${DEMO_EMAIL_DOMAIN}`);
    if (error) throw new Error(`clear users: ${error.message}`);
    console.log("  - cleared users (@superren.demo)");
  }

  // Delete demo auth users (cascades nothing now; users row already gone).
  const authUsers = await listAllAuthUsers();
  let deleted = 0;
  for (const u of authUsers) {
    if ((u.email || "").toLowerCase().endsWith(`@${DEMO_EMAIL_DOMAIN}`)) {
      const { error } = await supabase.auth.admin.deleteUser(u.id);
      if (error) throw new Error(`deleteUser(${u.email}): ${error.message}`);
      deleted += 1;
    }
  }
  console.log(`  - deleted ${deleted} demo auth users`);
  console.log("Demo data cleared.\n");
}

// ---------------------------------------------------------------------------
// SEED
// ---------------------------------------------------------------------------
async function seedDemo() {
  // -- 1. Auth users + role/status -------------------------------------------
  const existing = await listAllAuthUsers();
  const existingByEmail = new Map(
    existing.map((u) => [(u.email || "").toLowerCase(), u])
  );

  // super admin + admin
  const superAdminId = await ensureAuthUser(SUPER_ADMIN.email, existingByEmail);
  const adminId = await ensureAuthUser(ADMIN.email, existingByEmail);

  // agents -> map key => userId
  const agentIdByKey = {};
  for (const agent of AGENTS) {
    agentIdByKey[agent.key] = await ensureAuthUser(agent.email, existingByEmail);
  }

  // Set roles/status on public.users (trigger created them as agent/pending).
  const roleUpdates = [
    { id: superAdminId, role: "super_admin" },
    { id: adminId, role: "admin" },
    ...AGENTS.map((a) => ({ id: agentIdByKey[a.key], role: "agent" })),
  ];
  for (const u of roleUpdates) {
    const { error } = await supabase
      .from("users")
      .update({ role: u.role, status: "active", last_login_at: pastDate(20) })
      .eq("id", u.id);
    if (error) throw new Error(`update users role (${u.id}): ${error.message}`);
  }
  console.log(`✓ auth users: 1 super_admin, 1 admin, ${AGENTS.length} agents (all active)`);

  // -- 2. Agent profiles ------------------------------------------------------
  // The trigger auto-inserted blank agent_profiles rows (unique slug). Update
  // them with the real data. We update by user_id.
  for (const a of AGENTS) {
    const { error } = await supabase
      .from("agent_profiles")
      .update({
        full_name: a.full_name,
        display_name: a.full_name,
        slug: a.slug,
        profile_photo_url: a.photo,
        ren_number: a.ren_number,
        agency_name: DEMO_AGENCY,
        title: a.title,
        phone: a.phone,
        whatsapp: a.whatsapp,
        email: a.email,
        bio: a.bio,
        service_areas: a.service_areas,
        specialization: a.specialization,
        facebook_url: a.facebook_url,
        instagram_url: a.instagram_url,
        tiktok_url: a.tiktok_url,
        website_url: a.website_url,
        telegram_username: a.telegram_username,
        qr_code_url: null,
        is_profile_public: true,
        is_demo: true,
      })
      .eq("user_id", agentIdByKey[a.key]);
    if (error) throw new Error(`update profile ${a.key}: ${error.message}`);
  }

  // Admin profile (optional) — give it minimal data, public off.
  {
    const { error } = await supabase
      .from("agent_profiles")
      .update({
        full_name: ADMIN.full_name,
        display_name: ADMIN.full_name,
        agency_name: DEMO_AGENCY,
        is_profile_public: false,
        is_demo: true,
      })
      .eq("user_id", adminId);
    if (error) throw new Error(`update admin profile: ${error.message}`);
  }
  // Super admin profile flagged demo too (so clear removes it).
  {
    const { error } = await supabase
      .from("agent_profiles")
      .update({ full_name: SUPER_ADMIN.full_name, is_demo: true, is_profile_public: false })
      .eq("user_id", superAdminId);
    if (error) throw new Error(`update superadmin profile: ${error.message}`);
  }
  console.log(`✓ agent profiles: ${AGENTS.length} agents updated (+ admin/super_admin flagged demo)`);

  // -- 3. Listings ------------------------------------------------------------
  const slugSeen = new Set();
  const catIndex = { project: 0, subsale: 0, rental: 0 };

  const listingRows = LISTINGS.map((l, idx) => {
    const agentId = agentIdByKey[l.agent];
    catIndex[l.cat] += 1;
    const nn = pad2(((catIndex[l.cat] - 1) % 12) + 1);
    const hero = `/demo/properties/${l.cat}-${nn}.svg`;

    let slug = `${slugify(l.title)}-${shortId()}`;
    while (slugSeen.has(slug)) slug = `${slugify(l.title)}-${shortId()}`;
    slugSeen.add(slug);

    const isDraft = l.status === "draft";
    const createdIso = pastDate(180, 5);
    const publishedIso = isDraft ? null : createdIso;

    // Analytics scenario shaping ------------------------------------------
    let views, shares, leads;
    switch (l.analytics) {
      case "high_share_med_conv": // Bangi cluster: high shares, high leads
        views = randInt(900, 1600);
        shares = randInt(40, 70);
        leads = randInt(10, 18);
        break;
      case "strong_close": // Shah Alam/Klang terrace: strong close
        views = randInt(500, 900);
        shares = randInt(15, 30);
        leads = randInt(8, 14);
        break;
      case "high_view_low_conv": // Mont Kiara/KLCC: high views, low conv
        views = randInt(1800, 3200);
        shares = randInt(20, 40);
        leads = randInt(2, 5);
        break;
      case "fast_conv": // Cyberjaya/Putrajaya studio: fast/high conv
        views = randInt(400, 800);
        shares = randInt(10, 22);
        leads = randInt(9, 15);
        break;
      case "low_media": // few media -> insight; otherwise moderate
        views = randInt(300, 700);
        shares = randInt(8, 18);
        leads = randInt(3, 7);
        break;
      default:
        views = randInt(250, 1200);
        shares = randInt(5, 30);
        leads = randInt(2, 10);
    }
    if (isDraft) {
      views = randInt(0, 30);
      shares = 0;
      leads = 0;
    }

    const priceDisplay =
      l.cat === "rental"
        ? `RM ${l.price.toLocaleString("en-MY")} / bulan`
        : `RM ${l.price.toLocaleString("en-MY")}`;

    return {
      _meta: { ...l, agentId, hero, idx },
      row: {
        agent_id: agentId,
        category: l.cat,
        title: l.title,
        slug,
        property_type: l.property_type,
        area: l.area,
        address_private: `No ${randInt(1, 99)}, Jalan ${l.area} ${randInt(1, 20)}/${randInt(1, 9)}, ${l.area} (sample address)`,
        address_public: `${l.area}, Selangor / Kuala Lumpur (sample)`,
        show_exact_address: false,
        map_url: `https://maps.google.com/?q=${encodeURIComponent(l.area)}`,
        price: l.price,
        price_display: priceDisplay,
        tenure: l.tenure,
        built_up_sqft: l.built_up ?? null,
        land_area_sqft: l.land_area ?? null,
        bedrooms: l.bedrooms ?? null,
        bathrooms: l.bathrooms ?? null,
        carparks: l.carparks ?? null,
        furnishing: l.furnishing,
        description:
          `${l.title.replace(/^DEMO:\s*/, "")} — unit contoh untuk demo. ` +
          `Hartanah di ${l.area} dengan kemudahan lengkap dan lokasi strategik. ` +
          `Sila hubungi ejen untuk maklumat lanjut. (Data demo)`,
        top_selling_points: l.selling,
        facilities: pickSome(FACILITIES_POOL, randInt(4, 6)),
        amenities: pickSome(AMENITIES_POOL, randInt(4, 6)),
        nearby: [
          `${l.area} LRT/MRT (sample)`,
          `${l.area} Mall (sample)`,
          `Sekolah Kebangsaan ${l.area} (sample)`,
        ],
        tags: ["demo", l.cat, l.area.toLowerCase().replace(/\s+/g, "-")],
        status: l.status,
        visibility: "public",
        featured: l.analytics === "high_share_med_conv" || l.analytics === "strong_close",
        show_agent_phone: true,
        enable_whatsapp_cta: true,
        enable_telegram_share: true,
        hero_image_url: hero,
        internal_notes: "Demo listing — auto-seeded.",
        views_count: views,
        shares_count: shares,
        leads_count: leads,
        is_demo: true,
        created_at: createdIso,
        updated_at: createdIso,
        published_at: publishedIso,
      },
    };
  });

  const insertedListings = await insertChunked(
    "listings",
    listingRows.map((r) => r.row),
    true
  );
  // Map inserted rows back to metadata via slug (slug is unique).
  const metaBySlug = new Map(listingRows.map((r) => [r.row.slug, r._meta]));
  const listings = insertedListings.map((row) => ({
    id: row.id,
    slug: row.slug,
    meta: metaBySlug.get(row.slug),
    row,
  }));
  const counts = {
    project: listings.filter((l) => l.meta.cat === "project").length,
    subsale: listings.filter((l) => l.meta.cat === "subsale").length,
    rental: listings.filter((l) => l.meta.cat === "rental").length,
  };
  console.log(
    `✓ listings: ${listings.length} (project ${counts.project}, subsale ${counts.subsale}, rental ${counts.rental})`
  );

  // -- 4. Category detail rows ------------------------------------------------
  const projectDetails = [];
  const subsaleDetails = [];
  const rentalDetails = [];
  for (const l of listings) {
    const m = l.meta;
    if (m.cat === "project") {
      projectDetails.push({
        listing_id: l.id,
        project_name: m.title.replace(/^DEMO:\s*/, "").split(",")[0].trim(),
        developer: `${pick(["Sime", "EcoWorld", "Mah Sing", "SP Setia", "Gamuda"])} Demo Developer`,
        completion_year: String(randInt(2025, 2028)),
        project_status: pick(["under_construction", "completed", "new_launch"]),
        unit_types: `${m.bedrooms || 2}R${m.bathrooms || 2}B`,
        starting_price: m.price - randInt(10000, 40000),
        maintenance_fee: Math.round((m.built_up || 1000) * 0.33),
        package_info: "Rebate 5%, free legal fee SPA & loan (sample package).",
        booking_fee: 5000,
        sales_gallery_link: `${SITE_URL}/demo/gallery`,
        brochure_url: `${SITE_URL}/demo/brochure.pdf`,
      });
    } else if (m.cat === "subsale") {
      subsaleDetails.push({
        listing_id: l.id,
        asking_price: m.price,
        valuation_estimate: m.price - randInt(0, 30000),
        occupancy_status: pick(["owner_occupied", "tenanted", "vacant"]),
        maintenance_fee: m.property_type === "condo" || m.property_type === "apartment"
          ? Math.round((m.built_up || 1000) * 0.3)
          : 0,
        renovation_info: pick([
          "Newly renovated kitchen & bathrooms (sample).",
          "Original condition, well maintained (sample).",
          "Partial renovation, new flooring (sample).",
        ]),
        facing_direction: pick(["North", "South", "East", "West", "North-East"]),
        title_type: pick(["individual", "strata", "master"]),
        viewing_availability: "Weekends & weekday evenings (by appointment).",
        co_broke_allowed: rng() > 0.3,
        private_commission_notes: "Co-broke 50/50, 2% total (sample, server-only).",
      });
    } else {
      rentalDetails.push({
        listing_id: l.id,
        monthly_rental: m.price,
        deposit_requirement: "2 months deposit + 1 month advance + 0.5 utility (sample).",
        minimum_tenancy: pick(["6 months", "12 months", "24 months"]),
        move_in_date: pick(["Immediate", "Next month", "Negotiable"]),
        tenant_preference: pick([
          "Working professionals / family",
          "Students welcome",
          "No pets, no smoking",
          "Open to all (sample)",
        ]),
        pet_allowed: rng() > 0.6,
        cooking_allowed: rng() > 0.2,
        parking_included: (m.carparks || 0) > 0,
        utilities_info: "Tenant pays own electricity & water; wifi included (sample).",
      });
    }
  }
  if (projectDetails.length) await insertChunked("listing_project_details", projectDetails);
  if (subsaleDetails.length) await insertChunked("listing_subsale_details", subsaleDetails);
  if (rentalDetails.length) await insertChunked("listing_rental_details", rentalDetails);
  console.log(
    `✓ detail rows: project ${projectDetails.length}, subsale ${subsaleDetails.length}, rental ${rentalDetails.length}`
  );

  // -- 5. Listing media -------------------------------------------------------
  const mediaRows = [];
  for (const l of listings) {
    const m = l.meta;
    // low_media scenario -> only 4 images (triggers "add more photos" insight).
    const count = m.analytics === "low_media" ? 4 : randInt(5, 8);
    for (let i = 0; i < count; i++) {
      const nn = pad2(((i + m.idx) % 12) + 1);
      mediaRows.push({
        listing_id: l.id,
        media_type: "image",
        url: i === 0 ? m.hero : `/demo/properties/${m.cat}-${nn}.svg`,
        thumbnail_url: null,
        caption: i === 0 ? "Hero Image (Sample)" : "Sample Unit",
        sort_order: i,
        file_size: randInt(120000, 480000),
        is_demo: true,
        created_at: l.row.created_at,
      });
    }
  }
  await insertChunked("listing_media", mediaRows);
  console.log(`✓ listing media: ${mediaRows.length} rows`);

  // -- 6. Shares --------------------------------------------------------------
  const shareRows = [];
  for (const l of listings) {
    const total = l.row.shares_count;
    for (let i = 0; i < total; i++) {
      shareRows.push({
        listing_id: l.id,
        agent_id: l.meta.agentId,
        channel: pick(SHARE_CHANNELS),
        shared_at: pastDate(180),
        visitor_token: `demo-${shortId()}`,
        metadata: { demo: true, ua: "demo-seed" },
        is_demo: true,
      });
    }
  }
  await insertChunked("shares", shareRows);
  console.log(`✓ shares: ${shareRows.length} rows`);

  // -- 7. Leads ---------------------------------------------------------------
  // Generate per-listing according to leads_count, ensuring >= 120 total and
  // spread across all agents. Mostly tied to a listing; a few standalone.
  const leadRows = [];
  for (const l of listings) {
    const n = l.row.leads_count;
    for (let i = 0; i < n; i++) {
      // Conversion shaping via status distribution per scenario.
      let status;
      const a = l.meta.analytics;
      if (a === "fast_conv" || a === "strong_close") {
        status = pick(["contacted", "viewing", "negotiating", "booked", "closed", "closed"]);
      } else if (a === "high_view_low_conv") {
        status = pick(["new", "new", "contacted", "lost", "lost"]);
      } else if (a === "high_share_med_conv") {
        status = pick(["new", "contacted", "contacted", "viewing", "negotiating", "lost"]);
      } else {
        status = pick(LEAD_STATUSES);
      }
      leadRows.push({
        listing_id: l.id,
        agent_id: l.meta.agentId,
        name: dummyName(),
        phone: dummyPhone(),
        email: `lead${shortId()}@example.demo`,
        source: pick(LEAD_SOURCES),
        budget: pick(BUDGETS),
        preferred_area: rng() > 0.4 ? l.meta.area : pick(PREFERRED_AREAS),
        notes: pick(LEAD_NOTES),
        status,
        is_demo: true,
        created_at: pastDate(180),
      });
    }
  }
  // Top-up standalone leads (no listing) spread across agents to guarantee >=120.
  const allAgentIds = AGENTS.map((a) => agentIdByKey[a.key]);
  while (leadRows.length < 130) {
    leadRows.push({
      listing_id: null,
      agent_id: pick(allAgentIds),
      name: dummyName(),
      phone: dummyPhone(),
      email: `lead${shortId()}@example.demo`,
      source: pick(LEAD_SOURCES),
      budget: pick(BUDGETS),
      preferred_area: pick(PREFERRED_AREAS),
      notes: pick(LEAD_NOTES),
      status: pick(LEAD_STATUSES),
      is_demo: true,
      created_at: pastDate(180),
    });
  }
  const insertedLeads = await insertChunked("leads", leadRows, true);
  console.log(`✓ leads: ${insertedLeads.length} rows`);

  // Index closed leads per listing so deals can reference one.
  const closedLeadByListing = new Map();
  for (const lead of insertedLeads) {
    if (lead.status === "closed" && lead.listing_id && !closedLeadByListing.has(lead.listing_id)) {
      closedLeadByListing.set(lead.listing_id, lead.id);
    }
  }

  // -- 8. Deals ---------------------------------------------------------------
  // Build deals from listing outcomes. Ensure >= 25 and closed commission >=180k.
  const dealRows = [];
  function buildDeal(l, dealStatus) {
    const m = l.meta;
    const isRental = m.cat === "rental";
    const dealType = isRental ? "rental" : "sale";
    const bookingIso = pastDate(170, 10);
    const bookingDate = isoToDate(bookingIso);

    let closedDate = null;
    let commissionAmount = 0;
    const commissionPct = isRental ? null : 2;

    if (dealStatus === "closed") {
      // close 5–40 days after booking; strong_close clusters faster.
      const daysToClose =
        m.analytics === "strong_close" ? randInt(5, 18) : randInt(10, 45);
      closedDate = isoToDate(new Date(new Date(bookingIso).getTime() + daysToClose * DAY).toISOString());
    }

    const soldPrice = isRental ? null : m.price;
    const rentalPrice = isRental ? m.price : null;
    if (isRental) {
      commissionAmount = m.price; // ~1 month rental as commission
    } else {
      commissionAmount = Math.round(m.price * 0.02);
    }

    return {
      listing_id: l.id,
      agent_id: m.agentId,
      lead_id: closedLeadByListing.get(l.id) || null,
      deal_type: dealType,
      booking_date: bookingDate,
      closed_date: closedDate,
      sold_price: soldPrice,
      rental_price: rentalPrice,
      commission_amount: commissionAmount,
      commission_percentage: commissionPct,
      customer_name: dummyName(),
      customer_phone: dummyPhone(),
      payment_status:
        dealStatus === "closed"
          ? "paid"
          : dealStatus === "cancelled"
            ? "refunded"
            : pick(["pending", "partial"]),
      deal_status: dealStatus,
      remarks: `Demo deal (${dealType}) — sample customer.`,
      is_demo: true,
      created_at: bookingIso,
    };
  }

  for (const l of listings) {
    const m = l.meta;
    if (m.outcome === "sold" || m.outcome === "rented") {
      dealRows.push(buildDeal(l, "closed"));
    } else if (m.outcome === "cancelled") {
      dealRows.push(buildDeal(l, "cancelled"));
    } else if (l.row.status === "booked") {
      dealRows.push(buildDeal(l, "booked"));
    }
  }

  // Add some processing/booked deals on available listings to reach >=25 and
  // diversify deal_status. Pick listings deterministically.
  const openListings = listings.filter(
    (l) => l.meta.outcome === "open" && l.row.status !== "draft" && l.row.status !== "withdrawn"
  );
  let oi = 0;
  while (dealRows.length < 28 && oi < openListings.length) {
    const l = openListings[oi++];
    if (dealRows.some((d) => d.listing_id === l.id)) continue;
    dealRows.push(buildDeal(l, pick(["booked", "processing", "processing"])));
  }

  // Ensure closed-commission total >= 180,000 by promoting extra sale deals to closed.
  function closedCommissionTotal() {
    return dealRows
      .filter((d) => d.deal_status === "closed")
      .reduce((s, d) => s + (d.commission_amount || 0), 0);
  }
  oi = 0;
  while (closedCommissionTotal() < 200000 && oi < openListings.length) {
    const l = openListings[oi++];
    if (l.meta.cat === "rental") continue;
    if (dealRows.some((d) => d.listing_id === l.id)) continue;
    dealRows.push(buildDeal(l, "closed"));
  }

  const insertedDeals = await insertChunked("deals", dealRows, true);
  const closedTotal = closedCommissionTotal();
  const closedCount = dealRows.filter((d) => d.deal_status === "closed").length;
  console.log(
    `✓ deals: ${insertedDeals.length} rows (${closedCount} closed, commission RM ${closedTotal.toLocaleString("en-MY")})`
  );

  // -- 9. Status history ------------------------------------------------------
  // For listings whose status moved beyond 'available', record the transition(s).
  const historyRows = [];
  const FLOW = {
    available: ["draft", "available"],
    viewing_scheduled: ["available", "viewing_scheduled"],
    booked: ["available", "viewing_scheduled", "booked"],
    sold: ["available", "viewing_scheduled", "booked", "sold"],
    rented: ["available", "viewing_scheduled", "booked", "rented"],
    withdrawn: ["available", "withdrawn"],
    failed: ["available", "booked", "failed"],
  };
  for (const l of listings) {
    const flow = FLOW[l.row.status];
    if (!flow || flow.length < 2) continue;
    let when = new Date(l.row.created_at).getTime();
    for (let i = 1; i < flow.length; i++) {
      when += randInt(2, 25) * DAY;
      historyRows.push({
        listing_id: l.id,
        old_status: flow[i - 1],
        new_status: flow[i],
        changed_by: l.meta.agentId,
        changed_at: new Date(Math.min(when, NOW)).toISOString(),
        notes: `Status moved to ${flow[i]} (demo).`,
        is_demo: true,
      });
    }
  }
  await insertChunked("listing_status_history", historyRows);
  console.log(`✓ status history: ${historyRows.length} rows`);

  // -- Summary ----------------------------------------------------------------
  console.log("\n=========== Demo seed complete ===========");
  console.log(`  agents:        ${AGENTS.length} (+ 1 admin, 1 super_admin)`);
  console.log(`  listings:      ${listings.length}`);
  console.log(`  media:         ${mediaRows.length}`);
  console.log(`  shares:        ${shareRows.length}`);
  console.log(`  leads:         ${insertedLeads.length}`);
  console.log(`  deals:         ${insertedDeals.length} (closed commission RM ${closedTotal.toLocaleString("en-MY")})`);
  console.log("\n  Demo logins (password for all: " + DEMO_PASSWORD + "):");
  console.log(`    super admin: ${SUPER_ADMIN.email}`);
  console.log(`    admin:       ${ADMIN.email}`);
  for (const a of AGENTS) console.log(`    agent:       ${a.email}  (${a.full_name})`);
  console.log("==========================================\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`Super Ren demo seed — mode: ${MODE === "clear" ? "--clear" : "seed/reset"}`);
  console.log(`Target: ${SUPABASE_URL}\n`);

  // clear always runs first (clear-only exits; seed/reset clears then seeds).
  await clearDemo();

  if (MODE === "clear") {
    console.log("Done (clear only).");
    return;
  }
  await seedDemo();
}

main().catch((err) => {
  console.error("\nSeed failed:", err.message);
  process.exit(1);
});
