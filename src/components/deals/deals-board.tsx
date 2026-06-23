"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Handshake, X } from "lucide-react";
import {
  DEAL_STATUSES,
  DEAL_STATUS_TONE,
  type DealStatus,
} from "@/lib/constants";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import type { DealRow } from "@/lib/database.types";
import type { AgentStamp } from "@/lib/share";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FollowUpActions } from "@/components/deals/follow-up-actions";

const DOT: Record<DealStatus, string> = {
  booked: "bg-gold",
  pending: "bg-amber-400",
  closed: "bg-emerald-500",
  cancelled: "bg-red-400",
  refund: "bg-sky-400",
  others: "bg-slate-400",
};

type StatusFilter = DealStatus | "all";
type TypeFilter = "all" | "sale" | "rental";
type SortKey = "recent" | "value";

function dealPrice(d: DealRow): number {
  return Number(d.deal_type === "rental" ? d.rental_price : d.sold_price) || 0;
}

export function DealsBoard({
  deals,
  titles,
  agent,
}: {
  deals: DealRow[];
  titles: Record<string, string>;
  agent?: AgentStamp;
}) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [type, setType] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [q, setQ] = useState("");
  const { t } = useLanguage();
  const td = t.deals;
  const statusLabel = t.dealStatusLabel;

  // counts per status (respecting type + search, but not the status filter itself)
  const base = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return deals.filter((d) => {
      if (type !== "all" && d.deal_type !== type) return false;
      if (needle) {
        const title = (titles[d.listing_id ?? ""] ?? "").toLowerCase();
        const cust = (d.customer_name ?? "").toLowerCase();
        if (!title.includes(needle) && !cust.includes(needle)) return false;
      }
      return true;
    });
  }, [deals, type, q, titles]);

  const counts = useMemo(() => {
    const m = new Map<StatusFilter, number>();
    m.set("all", base.length);
    for (const s of DEAL_STATUSES) m.set(s, 0);
    for (const d of base) m.set(d.deal_status, (m.get(d.deal_status) ?? 0) + 1);
    return m;
  }, [base]);

  const rows = useMemo(() => {
    const list = base.filter((d) => status === "all" || d.deal_status === status);
    return list.sort((a, b) =>
      sort === "value"
        ? dealPrice(b) - dealPrice(a)
        : (b.closed_date ?? b.booking_date ?? "").localeCompare(
            a.closed_date ?? a.booking_date ?? "",
          ),
    );
  }, [base, status, sort]);

  return (
    <div className="space-y-4">
      {/* Pipeline status filter */}
      <div className="flex flex-wrap gap-2">
        <Chip active={status === "all"} onClick={() => setStatus("all")}>
          {t.common.all}{" "}
          <span className="ml-1 opacity-70">{counts.get("all") ?? 0}</span>
        </Chip>
        {DEAL_STATUSES.map((s) => (
          <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
            <span className={cn("h-2 w-2 rounded-full", DOT[s])} />
            {statusLabel[s]}
            <span className="ml-0.5 opacity-70">{counts.get(s) ?? 0}</span>
          </Chip>
        ))}
      </div>

      {/* Search + type + sort */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={td.searchPlaceholder}
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
        <div className="flex gap-1.5">
          <Seg active={type === "all"} onClick={() => setType("all")}>
            {t.common.all}
          </Seg>
          <Seg active={type === "sale"} onClick={() => setType("sale")}>
            {td.sale}
          </Seg>
          <Seg active={type === "rental"} onClick={() => setType("rental")}>
            {td.rental}
          </Seg>
          <Seg
            active={sort === "value"}
            onClick={() => setSort(sort === "value" ? "recent" : "value")}
          >
            {sort === "value" ? td.sortValue : `↕ ${td.sort}`}
          </Seg>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {td.showing(rows.length, deals.length)}
      </p>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          <Handshake className="mx-auto mb-2 h-6 w-6 opacity-50" />
          {td.noMatch}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((deal) => {
            const price = dealPrice(deal);
            const title = deal.listing_id ? titles[deal.listing_id] : null;
            return (
              <Card key={deal.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <Badge tone={deal.deal_type === "rental" ? "info" : "primary"}>
                    {deal.deal_type === "rental" ? td.rental : td.sale}
                  </Badge>
                  <Badge tone={DEAL_STATUS_TONE[deal.deal_status]}>
                    {statusLabel[deal.deal_status]}
                  </Badge>
                </div>

                {title ? (
                  <Link
                    href={`/listings/${deal.listing_id}`}
                    className="mt-3 line-clamp-2 block font-semibold leading-tight hover:text-primary"
                  >
                    {title}
                  </Link>
                ) : (
                  <p className="mt-3 font-semibold leading-tight text-muted-foreground">
                    Listing
                  </p>
                )}

                <p className="mt-2 whitespace-nowrap text-lg font-bold tabular-nums">
                  {formatPrice(price)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {td.commissionLabel}:{" "}
                  <span className="whitespace-nowrap tabular-nums">
                    {formatPrice(deal.commission_amount)}
                    {deal.commission_percentage
                      ? ` (${deal.commission_percentage}%)`
                      : ""}
                  </span>
                </p>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                  {deal.booking_date ? (
                    <span>{td.booking}: {formatDate(deal.booking_date)}</span>
                  ) : null}
                  {deal.closed_date ? (
                    <span>{td.closedOn}: {formatDate(deal.closed_date)}</span>
                  ) : null}
                </div>

                {deal.customer_name || deal.customer_phone ? (
                  <div className="mt-3 border-t border-border pt-3 text-sm">
                    {deal.customer_name ? (
                      <p className="font-medium text-foreground">
                        {deal.customer_name}
                      </p>
                    ) : null}
                    {deal.customer_phone ? (
                      <>
                        <p className="text-xs text-muted-foreground">
                          {deal.customer_phone}
                        </p>
                        <FollowUpActions
                          phone={deal.customer_phone}
                          kind="deal"
                          status={deal.deal_status}
                          customerName={deal.customer_name}
                          listingTitle={title}
                          priceText={formatPrice(price)}
                          agent={agent}
                        />
                      </>
                    ) : null}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
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

function Seg({
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
        "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-secondary",
      )}
    >
      {children}
    </button>
  );
}
