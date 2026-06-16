// Detects whether the app should run fully in-memory (zero-config demo) or
// against a real Supabase project.

/** True when a real Supabase project is configured. */
export const HAS_SUPABASE = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/**
 * Local demo runs entirely on the in-memory dataset — no database, no auth
 * backend. Enabled automatically whenever Supabase is not configured, so a
 * fresh `npm run dev` shows the full product immediately.
 */
export const LOCAL_DEMO = !HAS_SUPABASE;

/** Cookie used to remember which demo persona the visitor is browsing as. */
export const DEMO_ROLE_COOKIE = "srg_demo_role";
