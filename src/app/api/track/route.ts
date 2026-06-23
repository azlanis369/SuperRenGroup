import { NextResponse } from "next/server";
import { LOCAL_DEMO } from "@/lib/demo-mode";
import { TRACK_EVENTS, type TrackEvent } from "@/lib/analytics";
import { recordDemoEvent } from "@/lib/demo-data/events";

/**
 * Record a product analytics event (click_whatsapp_*, profile_cta_*, etc.).
 * Demo mode keeps an in-memory buffer; a Supabase `events` table can be wired
 * later (see PANDUAN-GO-LIVE.md) — until then the live path is a no-op.
 */
export async function POST(request: Request) {
  let body: { event?: string; props?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const { event, props } = body;
  if (!event || !TRACK_EVENTS.includes(event as TrackEvent)) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  if (LOCAL_DEMO) {
    recordDemoEvent(event as TrackEvent, props ?? {});
  }
  // Real mode: insert into an `events` table here once it exists.

  return NextResponse.json({ ok: true });
}
