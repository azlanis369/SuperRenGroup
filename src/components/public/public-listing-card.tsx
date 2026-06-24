import Image from "next/image";
import Link from "next/link";
import { BedDouble, Bath, Car, Maximize, MessageCircle } from "lucide-react";
import type { ListingRow } from "@/lib/database.types";
import { formatPrice, toWaNumber, absoluteUrl } from "@/lib/utils";
import { transactionTypeOf, propertyKindOf } from "@/lib/segment";
import { resolveHero } from "@/lib/media";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { TrackedLink } from "@/components/tracked-link";

export function PublicListingCard({
  listing,
  index = 1,
  waNumber,
}: {
  listing: ListingRow & { is_demo?: boolean };
  index?: number;
  waNumber?: string | null;
}) {
  const hero = resolveHero(listing.hero_image_url, listing.category, index);
  const priceText = listing.price_display || formatPrice(listing.price);
  const wa = waNumber ? toWaNumber(waNumber) : null;
  const waMsg = [
    "Salam, saya berminat dengan listing ini:",
    "",
    `Listing: ${listing.title}`,
    `Jenis: ${transactionTypeOf(listing)} ${propertyKindOf(listing)}`,
    `Harga: ${priceText}`,
    `Lokasi: ${listing.area}`,
    `Link: ${absoluteUrl(`/listing/${listing.slug}`)}`,
    "",
    "Boleh kongsi detail lanjut & susun viewing?",
  ].join("\n");

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
      <Link href={`/listing/${listing.slug}`} className="group block">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          <Image
            src={hero}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 50vw, 280px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
            <Badge tone="primary">{transactionTypeOf(listing)}</Badge>
            <Badge tone="gold">{propertyKindOf(listing)}</Badge>
          </div>
          <div className="absolute right-2 top-2">
            <StatusBadge status={listing.status} />
          </div>
        </div>
        <div className="p-3">
          <p className="whitespace-nowrap font-bold tabular-nums text-primary">
            {priceText}
          </p>
          <h3 className="line-clamp-1 text-sm font-semibold">
            {listing.development_name || listing.title}
          </h3>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {listing.development_name ? listing.title : listing.area}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {listing.bedrooms ? (
              <span className="flex items-center gap-1">
                <BedDouble className="h-3.5 w-3.5" /> {listing.bedrooms}
              </span>
            ) : null}
            {listing.bathrooms ? (
              <span className="flex items-center gap-1">
                <Bath className="h-3.5 w-3.5" /> {listing.bathrooms}
              </span>
            ) : null}
            {listing.carparks ? (
              <span className="flex items-center gap-1">
                <Car className="h-3.5 w-3.5" /> {listing.carparks}
              </span>
            ) : null}
            {listing.built_up_sqft ? (
              <span className="flex items-center gap-1">
                <Maximize className="h-3.5 w-3.5" />{" "}
                {Number(listing.built_up_sqft).toLocaleString()}
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      {/* Card actions */}
      <div className="mt-auto flex gap-1.5 p-3 pt-0">
        <Link
          href={`/listing/${listing.slug}`}
          className="flex flex-1 items-center justify-center rounded-lg border border-border bg-card px-2 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
        >
          View Details
        </Link>
        {wa ? (
          <TrackedLink
            event="click_whatsapp_listing"
            props={{ listingId: listing.id }}
            href={`https://wa.me/${wa}?text=${encodeURIComponent(waMsg)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </TrackedLink>
        ) : null}
      </div>
    </div>
  );
}
