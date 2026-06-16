// Demo Mode helpers. On automatically when running the zero-config local demo,
// or explicitly via NEXT_PUBLIC_DEMO_MODE=true against a real Supabase project.
import { LOCAL_DEMO } from "@/lib/demo-mode";

export const DEMO_MODE =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" || LOCAL_DEMO;

export const DEMO_AGENCY_NAME = "Super Ren Realty Demo";
export const DEMO_BADGE_TEXT = "Demo Mode — Sample Data Only";

/** Reset phrase the admin must type to confirm a demo data reset. */
export const DEMO_RESET_PHRASE = "RESET DEMO";

export function isDemoMode(): boolean {
  return DEMO_MODE;
}
