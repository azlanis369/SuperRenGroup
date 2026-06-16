import { createClient } from "@/lib/supabase/server";
import type { LeadRow } from "@/lib/database.types";
import type { LeadSource, LeadStatus } from "@/lib/constants";
import { LOCAL_DEMO } from "@/lib/demo-mode";
import { demoGetLeads, demoListingTitleMap } from "@/lib/demo-data/queries";
import { demoListings } from "@/lib/demo-data/dataset";

export type LeadFilters = {
  status?: LeadStatus;
  source?: LeadSource;
};

/**
 * List leads visible to the current user. RLS scopes owner/admin automatically.
 * Returns leads plus a map of listing_id -> listing title for interested listings.
 */
export async function getLeads(filters: LeadFilters = {}): Promise<{
  leads: LeadRow[];
  listingTitles: Map<string, string>;
}> {
  if (LOCAL_DEMO) {
    const leads = demoGetLeads(filters);
    return { leads, listingTitles: new Map(Object.entries(demoListingTitleMap())) };
  }
  const supabase = await createClient();
  let query = supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.source) query = query.eq("source", filters.source);

  const { data, error } = await query;
  const leads = (error ? [] : (data ?? [])) as LeadRow[];

  const listingIds = [
    ...new Set(leads.map((l) => l.listing_id).filter((id): id is string => !!id)),
  ];

  const listingTitles = new Map<string, string>();
  if (listingIds.length) {
    const { data: listings } = await supabase
      .from("listings")
      .select("id, title")
      .in("id", listingIds);
    for (const l of (listings ?? []) as { id: string; title: string }[]) {
      listingTitles.set(l.id, l.title);
    }
  }

  return { leads, listingTitles };
}

/** Lightweight listing options for the new-lead form (owner/admin via RLS). */
export async function getListingOptions(): Promise<{ id: string; title: string }[]> {
  if (LOCAL_DEMO)
    return demoListings
      .filter((l) => !l.deleted_at)
      .map((l) => ({ id: l.id, title: l.title }));
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select("id, title")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []) as { id: string; title: string }[];
}
