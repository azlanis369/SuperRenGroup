import { createClient } from "@/lib/supabase/server";
import type {
  ListingRow,
  ListingMediaRow,
  ListingProjectDetailRow,
  ListingSubsaleDetailRow,
  ListingRentalDetailRow,
} from "@/lib/database.types";
import type { ListingCategory, ListingStatus } from "@/lib/constants";
import { LOCAL_DEMO } from "@/lib/demo-mode";
import {
  demoGetListings,
  demoGetListingBySlug,
  demoGetListingById,
} from "@/lib/demo-data/queries";

export type ListingFilters = {
  category?: ListingCategory;
  status?: ListingStatus;
  tab?: string;
  area?: string;
  q?: string;
  agentId?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
};

const TAB_STATUS_MAP: Record<string, ListingStatus[]> = {
  available: ["available"],
  booked: ["booked", "loan_in_progress", "spa_in_progress"],
  sold: ["sold", "rented"],
  draft: ["draft"],
};

/**
 * List the current user's listings (or, for admins via RLS, all listings)
 * with filters applied. RLS scopes visibility automatically.
 */
export async function getListings(
  filters: ListingFilters = {},
  opts: { ownerOnly?: boolean; ownerId?: string; limit?: number } = {},
): Promise<ListingRow[]> {
  if (LOCAL_DEMO) return demoGetListings(filters, opts).slice(0, opts.limit ?? 60);
  const supabase = await createClient();
  let query = supabase
    .from("listings")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 60);

  if (opts.ownerOnly && opts.ownerId) query = query.eq("agent_id", opts.ownerId);
  if (filters.agentId) query = query.eq("agent_id", filters.agentId);

  // Tab filtering
  if (filters.tab && filters.tab !== "all") {
    if (["project", "subsale", "rental"].includes(filters.tab)) {
      query = query.eq("category", filters.tab as ListingCategory);
    } else if (TAB_STATUS_MAP[filters.tab]) {
      query = query.in("status", TAB_STATUS_MAP[filters.tab]);
    }
  }

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.area) query = query.ilike("area", `%${filters.area}%`);
  if (filters.q) query = query.ilike("title", `%${filters.q}%`);
  if (filters.minPrice) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice) query = query.lte("price", filters.maxPrice);
  if (filters.bedrooms) query = query.gte("bedrooms", filters.bedrooms);

  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}

/** Fetch a single listing by slug for public consumption (RLS-guarded). */
export async function getPublicListingBySlug(slug: string) {
  if (LOCAL_DEMO) return demoGetListingBySlug(slug);
  const supabase = await createClient();
  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (!listing) return null;

  const [{ data: media }, { data: project }, { data: subsale }, { data: rental }] =
    await Promise.all([
      supabase
        .from("listing_media")
        .select("*")
        .eq("listing_id", listing.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("listing_project_details")
        .select("*")
        .eq("listing_id", listing.id)
        .maybeSingle(),
      supabase
        .from("listing_subsale_details")
        .select("*")
        .eq("listing_id", listing.id)
        .maybeSingle(),
      supabase
        .from("listing_rental_details")
        .select("*")
        .eq("listing_id", listing.id)
        .maybeSingle(),
    ]);

  return {
    listing: listing as ListingRow,
    media: (media ?? []) as ListingMediaRow[],
    project: project as ListingProjectDetailRow | null,
    subsale: subsale as ListingSubsaleDetailRow | null,
    rental: rental as ListingRentalDetailRow | null,
  };
}

/** Fetch listing + details for editing (owner/admin only via RLS). */
export async function getListingForEdit(id: string) {
  if (LOCAL_DEMO) return demoGetListingById(id);
  const supabase = await createClient();
  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!listing) return null;

  const [{ data: media }, { data: project }, { data: subsale }, { data: rental }] =
    await Promise.all([
      supabase
        .from("listing_media")
        .select("*")
        .eq("listing_id", id)
        .order("sort_order", { ascending: true }),
      supabase.from("listing_project_details").select("*").eq("listing_id", id).maybeSingle(),
      supabase.from("listing_subsale_details").select("*").eq("listing_id", id).maybeSingle(),
      supabase.from("listing_rental_details").select("*").eq("listing_id", id).maybeSingle(),
    ]);

  return {
    listing: listing as ListingRow,
    media: (media ?? []) as ListingMediaRow[],
    project: project as ListingProjectDetailRow | null,
    subsale: subsale as ListingSubsaleDetailRow | null,
    rental: rental as ListingRentalDetailRow | null,
  };
}
