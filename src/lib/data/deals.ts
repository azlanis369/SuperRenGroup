import { createClient } from "@/lib/supabase/server";
import type { DealRow } from "@/lib/database.types";
import { LOCAL_DEMO } from "@/lib/demo-mode";
import { demoGetDeals, demoListingTitleMap } from "@/lib/demo-data/queries";

/**
 * List deals visible to the current user. RLS scopes owner/admin automatically.
 * Returns deals plus a map of listing_id -> listing title.
 */
export async function getDeals(
  scope: { ownerId?: string } = {},
): Promise<{
  deals: DealRow[];
  listingTitles: Map<string, string>;
}> {
  if (LOCAL_DEMO) {
    return {
      deals: demoGetDeals(scope.ownerId),
      listingTitles: new Map(Object.entries(demoListingTitleMap())),
    };
  }
  const supabase = await createClient();
  let query = supabase
    .from("deals")
    .select("*")
    .order("closed_date", { ascending: false, nullsFirst: false })
    .order("booking_date", { ascending: false, nullsFirst: false })
    .limit(200);
  if (scope.ownerId) query = query.eq("agent_id", scope.ownerId);
  const { data, error } = await query;

  const deals = (error ? [] : (data ?? [])) as DealRow[];

  const listingIds = [
    ...new Set(deals.map((d) => d.listing_id).filter((id): id is string => !!id)),
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

  return { deals, listingTitles };
}
