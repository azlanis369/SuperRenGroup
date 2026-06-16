// Display "segments" for grouping listings on the public profile & catalog.
// These refine the three sales categories (subsale/rental/project) by asset
// type so Commercial (shop/office) and Tanah (land) surface as their own groups.

import type { ListingRow } from "@/lib/database.types";

export type Segment =
  | "subsale"
  | "commercial"
  | "tanah"
  | "rental"
  | "project";

export const SEGMENT_LABELS: Record<Segment, string> = {
  subsale: "Subsale",
  commercial: "Commercial",
  tanah: "Tanah",
  rental: "Rental",
  project: "Project",
};

/** Display order requested by the group. */
export const SEGMENT_ORDER: Segment[] = [
  "subsale",
  "commercial",
  "tanah",
  "rental",
  "project",
];

/** Classify a listing into a display segment. */
export function segmentOf(
  l: Pick<ListingRow, "category" | "property_type">,
): Segment {
  if (l.property_type === "land") return "tanah";
  if (l.property_type === "shop" || l.property_type === "office")
    return "commercial";
  if (l.category === "project") return "project";
  if (l.category === "rental") return "rental";
  return "subsale";
}
