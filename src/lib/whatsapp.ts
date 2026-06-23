// Helpers to open WhatsApp in a chosen app: regular WhatsApp or WhatsApp
// Business. Not every agent uses WhatsApp Business, so the app to launch is a
// per-agent choice (remembered in localStorage; see WhatsAppProvider).
//
// On Android we can target a specific package via an `intent://` URL, so the
// chosen app actually opens. On iOS/desktop there is no reliable per-app
// targeting — both apps share the same links — so we fall back to wa.me and the
// system decides which app handles it.

import { toWaNumber } from "@/lib/utils";

export type WaApp = "regular" | "business";

/** localStorage value: a fixed choice, or "ask" to prompt each time. */
export type WaPref = WaApp | "ask";

export const WA_PREF_KEY = "srg-wa-app";

const WA_PACKAGE: Record<WaApp, string> = {
  regular: "com.whatsapp",
  business: "com.whatsapp.w4b",
};

export function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent);
}

/** The universal wa.me link (works everywhere; can't force a specific app). */
function waMeUrl(phoneDigits: string, text: string): string {
  const t = encodeURIComponent(text);
  return phoneDigits
    ? `https://wa.me/${phoneDigits}?text=${t}`
    : `https://wa.me/?text=${t}`;
}

/**
 * Build the best URL to open the requested WhatsApp app with `text` prefilled
 * (and addressed to `phone` if given). On Android this is a package-targeted
 * intent: URL; elsewhere it's the universal wa.me link.
 */
export function buildWaUrl(opts: {
  phone?: string | null;
  text: string;
  app: WaApp;
}): string {
  const digits = toWaNumber(opts.phone ?? "");
  const fallback = waMeUrl(digits, opts.text);

  if (!isAndroid()) return fallback;

  const params = [
    digits ? `phone=${digits}` : "",
    `text=${encodeURIComponent(opts.text)}`,
  ]
    .filter(Boolean)
    .join("&");

  return (
    `intent://send?${params}` +
    `#Intent;scheme=whatsapp;package=${WA_PACKAGE[opts.app]};` +
    `S.browser_fallback_url=${encodeURIComponent(fallback)};end`
  );
}

/** Open a built URL. intent: URLs must navigate; web URLs open in a new tab. */
export function launchWa(url: string): void {
  if (url.startsWith("intent:")) {
    window.location.href = url;
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
