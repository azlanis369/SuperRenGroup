import Image from "next/image";
import Link from "next/link";
import { BedDouble, Bath, Maximize } from "lucide-react";
import type { ListingRow } from "@/lib/database.types";
import { formatPrice } from "@/lib/utils";
import { SEGMENT_LABELS, segmentOf } from "@/lib/segment";
import { resolveHero } from "@/lib/media";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";

export function PublicListingCard({
  listing,
  index = 1,
}: {
  listing: ListingRow & { is_demo?: boolean };
  index?: number;
}) {
  const hero = resolveHero(listing.hero_image_url, listing.category, index);
  return (
    <Link
      href={`/listing/${listing.slug}`}
      className="group block overflow-hidden rounded-xl border border-border bg-card shadow-card transition-shadow hover:shadow-elevated"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <Image
          src={hero}
          alt={listing.title}
          fill
          sizes="(max-width: 768px) 50vw, 280px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 flex gap-1.5">
          <Badge tone="primary">{SEGMENT_LABELS[segmentOf(listing)]}</Badge>
        </div>
        <div className="absolute right-2 top-2">
          <StatusBadge status={listing.status} />
        </div>
      </div>
      <div className="p-3">
        <p className="font-bold text-primary">
          {listing.price_display || formatPrice(listing.price)}
        </p>
        <h3 className="line-clamp-1 text-sm font-semibold">{listing.title}</h3>
        <p className="text-xs text-muted-foreground">{listing.area}</p>
        <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
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
          {listing.built_up_sqft ? (
            <span className="flex items-center gap-1">
              <Maximize className="h-3.5 w-3.5" />{" "}
              {Number(listing.built_up_sqft).toLocaleString()}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
