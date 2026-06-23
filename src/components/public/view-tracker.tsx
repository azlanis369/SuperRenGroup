"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

/** Fire-and-forget view increment for a public listing (once per mount). */
export function ViewTracker({ listingId }: { listingId: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track("view_listing_detail", { listingId });
    const key = `viewed:${listingId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // ignore storage errors
    }
    fetch("/api/public/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
      keepalive: true,
    }).catch(() => {});
  }, [listingId]);
  return null;
}
