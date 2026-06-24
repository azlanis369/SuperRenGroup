"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// useLayoutEffect on the client, useEffect on the server (avoids the SSR warning).
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Counts up to `value` (ease-out) when scrolled into view. Renders the real
 * value on the server (correct for no-JS / crawlers); on the client it resets
 * to 0 before paint and animates. Respects prefers-reduced-motion.
 */
export function AnimatedStat({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const [n, setN] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    )?.matches;
    if (reduce) return; // keep the real value, no animation
    setN(0);
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || done.current) return;
        done.current = true;
        const dur = 1500;
        const start = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          setN(Math.round(value * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {n}
    </span>
  );
}
