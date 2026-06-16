import type { Metadata } from "next";
import Link from "next/link";
import {
  Handshake,
  CheckCircle2,
  Wallet,
  Clock,
  Phone,
} from "lucide-react";
import { requireOnboardedUser } from "@/lib/auth";
import { getDeals } from "@/lib/data/deals";
import { formatDate, formatPrice } from "@/lib/utils";
import type { DealRow } from "@/lib/database.types";
import type { BadgeProps } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/empty-state";
import { DemoBadge } from "@/components/demo-badge";

export const metadata: Metadata = { title: "Deals" };

const DEAL_STATUS_LABELS: Record<DealRow["deal_status"], string> = {
  booked: "Booked",
  processing: "Processing",
  closed: "Closed",
  cancelled: "Cancelled",
};

const DEAL_STATUS_TONE: Record<
  DealRow["deal_status"],
  NonNullable<BadgeProps["tone"]>
> = {
  booked: "gold",
  processing: "warning",
  closed: "success",
  cancelled: "danger",
};

export default async function DealsPage() {
  await requireOnboardedUser();
  const { deals, listingTitles } = await getDeals();

  const closed = deals.filter((d) => d.deal_status === "closed");
  const totalCommission = closed.reduce(
    (sum, d) => sum + (Number(d.commission_amount) || 0),
    0,
  );
  const closeDurations = closed
    .filter((d) => d.booking_date && d.closed_date)
    .map((d) =>
      Math.max(
        0,
        Math.round(
          (new Date(d.closed_date!).getTime() -
            new Date(d.booking_date!).getTime()) /
            86400000,
        ),
      ),
    );
  const avgDaysToClose =
    closeDurations.length > 0
      ? Math.round(closeDurations.reduce((a, b) => a + b, 0) / closeDurations.length)
      : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Deals</h1>
        <p className="text-muted-foreground">Jejak booking & jualan anda.</p>
        <DemoBadge className="mt-2" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Jumlah Deal" value={deals.length} icon={Handshake} />
        <StatCard
          label="Closed Deals"
          value={closed.length}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Total Commission"
          value={formatPrice(totalCommission)}
          hint="deal closed"
          icon={Wallet}
          tone="gold"
        />
        <StatCard
          label="Avg Days to Close"
          value={avgDaysToClose}
          hint="hari"
          icon={Clock}
        />
      </div>

      {deals.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="Tiada deal lagi"
          description="Deal akan muncul di sini apabila booking atau jualan direkodkan."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {deals.map((deal) => {
            const price =
              deal.deal_type === "rental" ? deal.rental_price : deal.sold_price;
            return (
              <Card key={deal.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <Badge tone={deal.deal_type === "rental" ? "info" : "primary"}>
                    {deal.deal_type === "rental" ? "Rental" : "Sale"}
                  </Badge>
                  <Badge tone={DEAL_STATUS_TONE[deal.deal_status]}>
                    {DEAL_STATUS_LABELS[deal.deal_status]}
                  </Badge>
                </div>

                {deal.listing_id && listingTitles.has(deal.listing_id) ? (
                  <Link
                    href={`/listings/${deal.listing_id}`}
                    className="mt-3 line-clamp-2 block font-semibold leading-tight hover:text-primary"
                  >
                    {listingTitles.get(deal.listing_id)}
                  </Link>
                ) : (
                  <p className="mt-3 font-semibold leading-tight text-muted-foreground">
                    Listing
                  </p>
                )}

                <p className="mt-2 text-lg font-bold">{formatPrice(price)}</p>
                <p className="text-sm text-muted-foreground">
                  Komisen: {formatPrice(deal.commission_amount)}
                  {deal.commission_percentage
                    ? ` (${deal.commission_percentage}%)`
                    : ""}
                </p>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                  {deal.booking_date ? (
                    <span>Booking: {formatDate(deal.booking_date)}</span>
                  ) : null}
                  {deal.closed_date ? (
                    <span>Closed: {formatDate(deal.closed_date)}</span>
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
                      <a
                        href={`tel:${deal.customer_phone}`}
                        className="flex items-center gap-1.5 text-primary hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {deal.customer_phone}
                      </a>
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
