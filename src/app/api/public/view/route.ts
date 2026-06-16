import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LOCAL_DEMO } from "@/lib/demo-mode";

/**
 * Increment a public listing's view counter. Uses the service-role client
 * because anonymous visitors have no RLS write access to listings.
 */
export async function POST(request: Request) {
  if (LOCAL_DEMO) return NextResponse.json({ ok: true });
  let listingId: unknown;
  try {
    ({ listingId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (typeof listingId !== "string") {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("listings")
      .select("id, views_count, visibility, status")
      .eq("id", listingId)
      .maybeSingle();
    // Only count views on publicly visible listings.
    if (!data || data.visibility !== "public" || data.status === "draft") {
      return NextResponse.json({ ok: true });
    }
    await admin
      .from("listings")
      .update({ views_count: (data.views_count ?? 0) + 1 })
      .eq("id", listingId);
  } catch {
    // Service role not configured — skip silently.
  }
  return NextResponse.json({ ok: true });
}
