// Query + mutation helpers over the in-memory demo dataset. In `next dev` the
// module stays resident across requests, so additions persist for the session.

import type {
  ListingRow,
  ListingMediaRow,
  LeadRow,
} from "@/lib/database.types";
import type { ListingCategory, ListingStatus, LeadStatus } from "@/lib/constants";
import type { ListingFilters } from "@/lib/data/listings";
import {
  demoListings,
  demoMedia,
  demoLeads,
  demoDeals,
  demoShares,
  demoAgents,
  demoProjectDetails,
  demoSubsaleDetails,
  demoRentalDetails,
  agentByUserId,
} from "@/lib/demo-data/dataset";

const TAB_STATUS_MAP: Record<string, ListingStatus[]> = {
  available: ["available"],
  booked: ["booked", "loan_in_progress", "spa_in_progress"],
  sold: ["sold", "rented"],
  draft: ["draft"],
};

export function demoGetListings(
  filters: ListingFilters = {},
  opts: { ownerOnly?: boolean; ownerId?: string } = {},
): ListingRow[] {
  let rows = demoListings.filter((l) => !l.deleted_at);
  if (opts.ownerOnly && opts.ownerId)
    rows = rows.filter((l) => l.agent_id === opts.ownerId);
  if (filters.agentId) rows = rows.filter((l) => l.agent_id === filters.agentId);

  if (filters.tab && filters.tab !== "all") {
    if (["project", "subsale", "rental"].includes(filters.tab)) {
      rows = rows.filter((l) => l.category === filters.tab);
    } else if (TAB_STATUS_MAP[filters.tab]) {
      rows = rows.filter((l) => TAB_STATUS_MAP[filters.tab!].includes(l.status));
    }
  }
  if (filters.category) rows = rows.filter((l) => l.category === filters.category);
  if (filters.status) rows = rows.filter((l) => l.status === filters.status);
  if (filters.area)
    rows = rows.filter((l) => l.area.toLowerCase().includes(filters.area!.toLowerCase()));
  if (filters.q)
    rows = rows.filter((l) => l.title.toLowerCase().includes(filters.q!.toLowerCase()));

  return [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function demoGetListingBySlug(slug: string) {
  const listing = demoListings.find((l) => l.slug === slug && !l.deleted_at);
  if (!listing) return null;
  return {
    listing,
    media: demoMedia[listing.id] ?? [],
    project: demoProjectDetails[listing.id] ?? null,
    subsale: demoSubsaleDetails[listing.id] ?? null,
    rental: demoRentalDetails[listing.id] ?? null,
  };
}

export function demoGetListingById(id: string) {
  const listing = demoListings.find((l) => l.id === id);
  if (!listing) return null;
  return {
    listing,
    media: demoMedia[listing.id] ?? [],
    project: demoProjectDetails[listing.id] ?? null,
    subsale: demoSubsaleDetails[listing.id] ?? null,
    rental: demoRentalDetails[listing.id] ?? null,
  };
}

export function demoScopedData(ownerId?: string) {
  const listings = ownerId
    ? demoListings.filter((l) => l.agent_id === ownerId && !l.deleted_at)
    : demoListings.filter((l) => !l.deleted_at);
  const leads = ownerId ? demoLeads.filter((l) => l.agent_id === ownerId) : demoLeads;
  const deals = ownerId ? demoDeals.filter((d) => d.agent_id === ownerId) : demoDeals;
  const shares = ownerId ? demoShares.filter((s) => s.agent_id === ownerId) : demoShares;
  return { listings, leads, deals, shares };
}

export function demoGetPublicAgent(slug: string) {
  const profile = demoAgents.find((a) => a.slug === slug && a.is_profile_public);
  if (!profile) return null;
  const listings = demoListings
    .filter(
      (l) =>
        l.agent_id === profile.user_id &&
        l.visibility === "public" &&
        l.status !== "draft" &&
        !l.deleted_at,
    )
    .sort((a, b) =>
      a.featured === b.featured
        ? b.created_at.localeCompare(a.created_at)
        : a.featured
          ? -1
          : 1,
    );
  return { profile, listings };
}

export function demoGetListingAgent(userId: string) {
  return agentByUserId(userId) ?? null;
}

export function demoGetLeads(filters: { status?: string; source?: string } = {}) {
  let rows = [...demoLeads];
  if (filters.status) rows = rows.filter((l) => l.status === filters.status);
  if (filters.source) rows = rows.filter((l) => l.source === filters.source);
  return rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function demoGetDeals() {
  return [...demoDeals].sort((a, b) =>
    (b.closed_date ?? b.booking_date ?? "").localeCompare(
      a.closed_date ?? a.booking_date ?? "",
    ),
  );
}

export function demoListingTitleMap(): Record<string, string> {
  return Object.fromEntries(demoListings.map((l) => [l.id, l.title]));
}

// ---- Mutations (persist within the dev server process) --------------------

let counter = 1000;
const nextId = () => `local-${counter++}`;

export function demoAddListing(
  listing: Omit<ListingRow, "id">,
  media: Omit<ListingMediaRow, "id" | "listing_id" | "created_at">[],
): ListingRow {
  const id = nextId();
  const row: ListingRow = { ...listing, id } as ListingRow;
  demoListings.unshift(row);
  demoMedia[id] = media.map((m, i) => ({
    ...m,
    id: `${id}-m${i}`,
    listing_id: id,
    created_at: new Date().toISOString(),
  }));
  return row;
}

export function demoUpdateListing(id: string, patch: Partial<ListingRow>) {
  const i = demoListings.findIndex((l) => l.id === id);
  if (i >= 0) demoListings[i] = { ...demoListings[i], ...patch, updated_at: new Date().toISOString() };
}

export function demoSetStatus(id: string, status: ListingStatus) {
  demoUpdateListing(id, { status });
}

export function demoDeleteListing(id: string) {
  demoUpdateListing(id, { deleted_at: new Date().toISOString() });
}

export function demoAddLead(lead: Omit<LeadRow, "id" | "created_at" | "updated_at">): LeadRow {
  const now = new Date().toISOString();
  const row: LeadRow = { ...lead, id: nextId(), created_at: now, updated_at: now };
  demoLeads.unshift(row);
  return row;
}

export function demoSetLeadStatus(id: string, status: LeadStatus) {
  const i = demoLeads.findIndex((l) => l.id === id);
  if (i >= 0) demoLeads[i] = { ...demoLeads[i], status, updated_at: new Date().toISOString() };
}

export type { ListingCategory };
