import { LOCAL_DEMO } from "@/lib/demo-mode";
import {
  demoGetViewings,
  type ViewingRow,
  type ViewingStatus,
} from "@/lib/demo-data/dataset";

export type { ViewingRow, ViewingStatus };

/**
 * List viewings visible to the current user.
 * Demo mode is fully in-memory. A Supabase-backed `viewings` table can be wired
 * in later (see PANDUAN-GO-LIVE.md); until then the live path returns empty.
 */
export async function getViewings(
  scope: { ownerId?: string } = {},
): Promise<ViewingRow[]> {
  if (LOCAL_DEMO) return demoGetViewings(scope.ownerId);
  // No Supabase `viewings` table yet — return empty rather than crash.
  return [];
}
