"use client";

import { useMemo, useState } from "react";
import { Search, X, Building2 } from "lucide-react";
import type { ListingRow } from "@/lib/database.types";
import { cn } from "@/lib/utils";
import { type Segment, SEGMENT_LABELS, SEGMENT_ORDER, segmentOf } from "@/lib/segment";
import { PublicListingCard } from "@/components/public/public-listing-card";

type Filter = "all" | Segment | "sold";

/**
 * Frontend-only listing browser for the public profile: category chips,
 * keyword search (title/area) and a price range. Works on the data already on
 * the page — no extra requests.
 */
export function ListingExplorer({
  active,
  portfolio,
  waNumber,
}: {
  active: (ListingRow & { is_demo?: boolean })[];
  portfolio: (ListingRow & { is_demo?: boolean })[];
  waNumber?: string | null;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  // Which segment chips to show (only those present in active listings).
  const segments = useMemo(() => {
    const present = new Set(active.map((l) => segmentOf(l)));
    return SEGMENT_ORDER.filter((s) => present.has(s));
  }, [active]);

  const rows = useMemo(() => {
    const base = filter === "sold" ? portfolio : active;
    const needle = q.trim().toLowerCase();
    const lo = min ? Number(min) : null;
    const hi = max ? Number(max) : null;
    return base.filter((l) => {
      if (filter !== "all" && filter !== "sold" && segmentOf(l) !== filter)
        return false;
      if (needle) {
        const hay = `${l.title} ${l.area}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      const price = Number(l.price) || 0;
      if (lo !== null && price < lo) return false;
      if (hi !== null && price > hi) return false;
      return true;
    });
  }, [filter, q, min, max, active, portfolio]);

  const chips: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "Semua", count: active.length },
    ...segments.map((s) => ({
      key: s as Filter,
      label: SEGMENT_LABELS[s],
      count: active.filter((l) => segmentOf(l) === s).length,
    })),
    ...(portfolio.length
      ? [{ key: "sold" as Filter, label: "Sold / Rented", count: portfolio.length }]
      : []),
  ];

  return (
    <section className="mt-7">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-bold">Semua Listing</h2>
        <span className="text-sm font-normal text-muted-foreground">
          ({rows.length})
        </span>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              filter === c.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {c.label}
            <span className="opacity-70">{c.count}</span>
          </button>
        ))}
      </div>

      {/* Search + price range */}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari kawasan atau tajuk…"
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-9 text-sm outline-none focus:border-primary"
          />
          {q ? (
            <button
              onClick={() => setQ("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Kosongkan"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          <input
            value={min}
            onChange={(e) => setMin(e.target.value)}
            inputMode="numeric"
            placeholder="Min RM"
            className="w-24 rounded-lg border border-border bg-card px-2 py-2 text-sm outline-none focus:border-primary"
          />
          <span className="text-muted-foreground">–</span>
          <input
            value={max}
            onChange={(e) => setMax(e.target.value)}
            inputMode="numeric"
            placeholder="Max RM"
            className="w-24 rounded-lg border border-border bg-card px-2 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <Building2 className="mx-auto mb-2 h-6 w-6 opacity-50" />
          Tiada listing sepadan dengan tapisan.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((l, i) => (
            <PublicListingCard key={l.id} listing={l} index={i + 1} waNumber={waNumber} />
          ))}
        </div>
      )}
    </section>
  );
}
