"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { DEMO_MODE, DEMO_RESET_PHRASE } from "@/lib/demo";
import { LOCAL_DEMO } from "@/lib/demo-mode";
import { createAdminClient } from "@/lib/supabase/admin";

export type DemoActionResult = { ok: true; message: string } | { ok: false; error: string };

// FK-safe deletion order for demo rows. Listing detail tables (project/subsale/
// rental) carry no is_demo flag and are removed via ON DELETE CASCADE when their
// parent listing is deleted, so they are intentionally omitted here.
const DEMO_TABLES = [
  "listing_status_history",
  "deals",
  "leads",
  "shares",
  "listing_media",
  "listings",
  "agent_profiles",
] as const;

/**
 * Clear all demo data (is_demo = true) and the demo auth users.
 * Requires admin role, Demo Mode on, and the exact confirmation phrase.
 * Uses the service-role client (RLS bypass) — admin-gated above.
 */
export async function clearDemoData(confirm: string): Promise<DemoActionResult> {
  await requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
  if (!DEMO_MODE) {
    return { ok: false, error: "Demo Mode tidak aktif." };
  }
  if (confirm.trim() !== DEMO_RESET_PHRASE) {
    return { ok: false, error: `Sila taip "${DEMO_RESET_PHRASE}" untuk sahkan.` };
  }

  if (LOCAL_DEMO) {
    return {
      ok: true,
      message:
        "Demo tempatan menggunakan data dalam-memori — mulakan semula pelayan (restart) untuk reset penuh.",
    };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      ok: false,
      error: "SUPABASE_SERVICE_ROLE_KEY tidak ditetapkan di server.",
    };
  }

  for (const table of DEMO_TABLES) {
    await admin.from(table).delete().eq("is_demo", true);
  }

  // Delete demo auth users (emails @superren.demo)
  try {
    const { data } = await admin.auth.admin.listUsers();
    const demoUsers = (data?.users ?? []).filter((u) =>
      (u.email ?? "").endsWith("@superren.demo"),
    );
    for (const u of demoUsers) {
      await admin.auth.admin.deleteUser(u.id);
    }
  } catch {
    // ignore — profiles already removed above
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/listings");
  return { ok: true, message: "Data demo telah dibersihkan." };
}
