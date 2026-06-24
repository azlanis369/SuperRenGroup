import { LOCAL_DEMO } from "@/lib/demo-mode";
import { getLeads } from "@/lib/data/leads";
import { getDeals } from "@/lib/data/deals";
import { demoListings } from "@/lib/demo-data/dataset";

export type ContactRole = "prospect" | "client";
export type ContactSegment = "buyer" | "tenant";

export type ContactRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: ContactRole; // prospect (lead) vs client (transacted)
  segment: ContactSegment; // buyer vs tenant
  area: string | null;
  budget: string | null;
  status: string; // original lead/deal status (for the Autobot)
  listingId: string | null;
  listingTitle: string | null;
  dealType?: "sale" | "rental";
};

const normPhone = (p: string | null | undefined) => (p ?? "").replace(/\D/g, "");

/**
 * Unified client / contact directory: transacted customers (from deals) plus
 * prospects (from leads), de-duplicated by phone. The "buyer vs tenant"
 * segment is inferred from the linked listing (rental → tenant).
 * Demo-only for now; a Supabase `contacts` table can back this later.
 */
export async function getContacts(
  scope: { ownerId?: string } = {},
  opts: { admin?: boolean; userId?: string } = {},
): Promise<ContactRow[]> {
  if (!LOCAL_DEMO) return [];

  const [leadsRes, dealsRes] = await Promise.all([getLeads({}), getDeals(scope)]);
  const catById = new Map(demoListings.map((l) => [l.id, l.category]));
  const titles = new Map<string, string>([
    ...leadsRes.listingTitles,
    ...dealsRes.listingTitles,
  ]);
  const leads = leadsRes.leads.filter(
    (l) => opts.admin || l.agent_id === opts.userId,
  );

  const byKey = new Map<string, ContactRow>();

  // Clients (transacted) take priority over prospects with the same phone.
  for (const d of dealsRes.deals) {
    const key = normPhone(d.customer_phone) || `deal-${d.id}`;
    byKey.set(key, {
      id: `deal-${d.id}`,
      name: d.customer_name ?? "—",
      phone: d.customer_phone,
      email: null,
      role: "client",
      segment: d.deal_type === "rental" ? "tenant" : "buyer",
      area: d.listing_id
        ? (demoListings.find((l) => l.id === d.listing_id)?.area ?? null)
        : null,
      budget: null,
      status: d.deal_status,
      listingId: d.listing_id,
      listingTitle: d.listing_id ? (titles.get(d.listing_id) ?? null) : null,
      dealType: d.deal_type,
    });
  }

  for (const l of leads) {
    const key = normPhone(l.phone) || `lead-${l.id}`;
    if (byKey.has(key)) continue; // already a client
    const cat = l.listing_id ? catById.get(l.listing_id) : null;
    byKey.set(key, {
      id: `lead-${l.id}`,
      name: l.name,
      phone: l.phone,
      email: l.email,
      role: "prospect",
      segment: cat === "rental" ? "tenant" : "buyer",
      area: l.preferred_area ?? null,
      budget: l.budget ?? null,
      status: l.status,
      listingId: l.listing_id,
      listingTitle: l.listing_id ? (titles.get(l.listing_id) ?? null) : null,
    });
  }

  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}
