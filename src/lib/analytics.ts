// Lightweight, fire-and-forget event tracking for key agent/prospect actions.
// Client-safe: only uses fetch. Events are posted to /api/track which persists
// them (in-memory in demo mode, or an `events` table once Supabase is wired).

export const TRACK_EVENTS = [
  "click_whatsapp_profile",
  "click_whatsapp_listing",
  "click_whatsapp_followup",
  "click_call_profile",
  "click_call_listing",
  "click_call_deal",
  "click_share_listing",
  "click_autobot",
  "copy_autobot_message",
  "send_sms_deal",
  "view_listing_detail",
  "edit_listing",
  "add_property_started",
  "add_property_completed",
  "deal_status_changed",
  "profile_cta_sell",
  "profile_cta_rent",
  "profile_cta_buy",
  "profile_cta_join_team",
] as const;

export type TrackEvent = (typeof TRACK_EVENTS)[number];

/** Fire-and-forget. Never throws; safe to call from any client handler. */
export function track(
  event: TrackEvent,
  props?: Record<string, string | number | null | undefined>,
): void {
  if (typeof window === "undefined") return;
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, props: props ?? {} }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // never let tracking break the UI
  }
}
