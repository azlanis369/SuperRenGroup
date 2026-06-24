"use client";

import { useMemo, useState } from "react";
import { Search, X, Building2 } from "lucide-react";
import type { ListingRow } from "@/lib/database.types";
import { cn } from "@/lib/utils";
import {
  transactionTypeOf,
  propertyKindOf,
  type TransactionType,
  type PropertyKind,
} from "@/lib/segment";
import { PublicListingCard } from "@/components/public/public-listing-card";

type TxFilter = "all" | TransactionType;
type PropFilter = "all" | PropertyKind;
type StatusSet = "active" | "sold";

const TX_ORDER: TransactionType[] = ["Subsale", "Rental"];
const PROP_ORDER: PropertyKind[] = ["Residential", "Commercial", "Land"];

/**
 * Frontend-only listing browser: filter by transaction type × property type ×
 * status, plus keyword search and price range. Works on data already on the
 * page — no extra requests.
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
  const [tx, setTx] = useState<TxFilter>("all");
  const [prop, setProp] = useState<PropFilter>("all");
  const [statusSet, setStatusSet] = useState<StatusSet>("active");
  const [q, setQ] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const base = statusSet === "sold" ? portfolio : active;

  // Only offer chips for values that actually exist in the current pool.
  const txPresent = useMemo(() => {
    const s = new Set(base.map((l) => transactionTypeOf(l)));
    return TX_ORDER.filter((t) => s.has(t));
  }, [base]);
  const propPresent = useMemo(() => {
    const s = new Set(base.map((l) => propertyKindOf(l)));
    return PROP_ORDER.filter((p) => s.has(p));
  }, [base]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const lo = min ? Number(min) : null;
    const hi = max ? Number(max) : null;
    return base.filter((l) => {
      if (tx !== "all" && transactionTypeOf(l) !== tx) return false;
      if (prop !== "all" && propertyKindOf(l) !== prop) return false;
      if (needle && !`${l.title} ${l.area}`.toLowerCase().includes(needle))
        return false;
      const price = Number(l.price) || 0;
      if (lo !== null && price < lo) return false;
      if (hi !== null && price > hi) return false;
      return true;
    });
  }, [base, tx, prop, q, min, max]);

  return (
    <section className="mt-7">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-bold">Semua Listing</h2>
        <span className="text-sm font-normal text-muted-foreground">
          ({rows.length})
        </span>
      </div>

      <div className="space-y-2">
        {/* Status set toggle */}
        {portfolio.length ? (
          <ChipRow label="Status">
            <Chip
              active={statusSet === "active"}
              onClick={() => { setStatusSet("active"); setTx("all"); setProp("all"); }}
            >
              Aktif <span className="opacity-70">{active.length}</span>
            </Chip>
            <Chip
              active={statusSet === "sold"}
              onClick={() => { setStatusSet("sold"); setTx("all"); setProp("all"); }}
            >
              Sold / Rented <span className="opacity-70">{portfolio.length}</span>
            </Chip>
          </ChipRow>
        ) : null}

        {/* Transaction type */}
        {txPresent.length > 1 ? (
          <ChipRow label="Transaksi">
            <Chip active={tx === "all"} onClick={() => setTx("all")}>Semua</Chip>
            {txPresent.map((t) => (
              <Chip key={t} active={tx === t} onClick={() => setTx(tx === t ? "all" : t)}>
                {t}
              </Chip>
            ))}
          </ChipRow>
        ) : null}

        {/* Property type */}
        {propPresent.length > 1 ? (
          <ChipRow label="Jenis Hartanah">
            <Chip active={prop === "all"} onClick={() => setProp("all")}>Semua</Chip>
            {propPresent.map((p) => (
              <Chip key={p} active={prop === p} onClick={() => setProp(prop === p ? "all" : p)}>
                {p}
              </Chip>
            ))}
          </ChipRow>
        ) : null}
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

function ChipRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-24 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
