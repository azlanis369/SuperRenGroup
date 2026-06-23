// Demo-only persistent override for the signed-in persona's profile.
// In demo mode there is no database, and in-memory mutations don't survive
// across serverless invocations — so profile edits are stored in a cookie
// (small text fields only). The profile photo is kept in the browser's
// localStorage instead (see lib/demo-photo.ts) because images are too large
// for a cookie. This makes profile edits "stick" for the public profile so the
// demo feels real.

import { cookies } from "next/headers";
import type { AgentProfileRow } from "@/lib/database.types";

export const PROFILE_OVERRIDE_COOKIE = "srg_demo_profile";

const FIELDS = [
  "full_name",
  "display_name",
  "ren_number",
  "agency_name",
  "title",
  "phone",
  "whatsapp",
  "email",
  "bio",
  "service_areas",
  "specialization",
  "facebook_url",
  "instagram_url",
  "tiktok_url",
  "website_url",
  "telegram_username",
  "is_profile_public",
] as const;

export type ProfileOverride = Partial<
  Pick<AgentProfileRow, (typeof FIELDS)[number]>
> & { user_id: string };

/** Build a serialisable override from a saved profile payload. */
export function buildProfileOverride(
  userId: string,
  data: Record<string, unknown>,
): ProfileOverride {
  const out: ProfileOverride = { user_id: userId };
  for (const f of FIELDS) {
    if (f in data) (out as Record<string, unknown>)[f] = data[f];
  }
  return out;
}

/** Read the current persona's profile override from the cookie (if any). */
export async function readProfileOverride(): Promise<ProfileOverride | null> {
  try {
    const raw = (await cookies()).get(PROFILE_OVERRIDE_COOKIE)?.value;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProfileOverride;
    return parsed && typeof parsed.user_id === "string" ? parsed : null;
  } catch {
    return null;
  }
}

/** Merge an override onto a base profile when it belongs to the same user. */
export function applyProfileOverride(
  profile: AgentProfileRow,
  override: ProfileOverride | null,
): AgentProfileRow {
  if (!override || override.user_id !== profile.user_id) return profile;
  const patch: Record<string, unknown> = {};
  for (const f of FIELDS) {
    const v = (override as Record<string, unknown>)[f];
    if (v !== undefined) patch[f] = v;
  }
  return { ...profile, ...patch, updated_at: new Date().toISOString() };
}
