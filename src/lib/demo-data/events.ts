// In-memory event sink for demo mode. Persists within a server process only
// (resets on restart / not shared across serverless invocations) — enough to
// prove the tracking pipeline without a database.

import type { TrackEvent } from "@/lib/analytics";

export type DemoEvent = {
  event: TrackEvent;
  props: Record<string, unknown>;
  at: string;
};

const MAX = 500;
const buffer: DemoEvent[] = [];

export function recordDemoEvent(event: TrackEvent, props: Record<string, unknown>): void {
  buffer.push({ event, props, at: new Date().toISOString() });
  if (buffer.length > MAX) buffer.splice(0, buffer.length - MAX);
}

export function demoEventCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of buffer) counts[e.event] = (counts[e.event] ?? 0) + 1;
  return counts;
}

export function demoEventTotal(): number {
  return buffer.length;
}
