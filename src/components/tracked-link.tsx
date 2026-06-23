"use client";

import { track, type TrackEvent } from "@/lib/analytics";

/**
 * An anchor that fires a tracking event on click. Use for server-rendered
 * CTAs (WhatsApp/Call links, profile intent buttons) that need analytics.
 */
export function TrackedLink({
  event,
  props,
  children,
  ...rest
}: {
  event: TrackEvent;
  props?: Record<string, string | number | null | undefined>;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a {...rest} onClick={() => track(event, props)}>
      {children}
    </a>
  );
}
