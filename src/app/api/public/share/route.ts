import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SHARE_CHANNELS, type ShareChannel } from "@/lib/constants";
import { LOCAL_DEMO } from "@/lib/demo-mode";

/** Record a share event and bump the listing's share counter. Public endpoint. */
export async function POST(request: Request) {
  if (LOCAL_DEMO) return NextResponse.json({ ok: true });
  let body: { listingId?: string; channel?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const { listingId, channel } = body;
  if (
    !listingId ||
    !channel ||
    !SHARE_CHANNELS.includes(channel as ShareChannel)
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = await createClient();

  // Look up the listing's agent so the share is attributed correctly.
  const { data: listing } = await supabase
    .from("listings")
    .select("id, agent_id, shares_count")
    .eq("id", listingId)
    .maybeSingle();
  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await supabase.from("shares").insert({
    listing_id: listing.id,
    agent_id: listing.agent_id,
    channel: channel as ShareChannel,
  });

  await supabase
    .from("listings")
    .update({ shares_count: (listing.shares_count ?? 0) + 1 })
    .eq("id", listing.id);

  return NextResponse.json({ ok: true });
}
