import Image from "next/image";
import Link from "next/link";
import {
  BedDouble,
  Bath,
  Maximize,
  Eye,
  Share2,
  Users,
  Pencil,
  ExternalLink,
} from "lucide-react";
import type { ListingRow } from "@/lib/database.types";
import {
  CATEGORY_LABELS,
  PROPERTY_TYPE_LABELS,
  type PropertyType,
} from "@/lib/constants";
import { formatDate, formatPrice } from "@/lib/utils";
import { resolveHero } from "@/lib/media";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { DemoTag } from "@/components/demo-badge";
import { ShareButton } from "@/components/listings/share-button";

export function ListingCard({
  listing,
  index = 1,
  manage = true,
}: {
  listing: ListingRow & { is_demo?: boolean };
  index?: number;
  manage?: boolean;
}) {
  const hero = resolveHero(listing.hero_image_url, listing.category, index);
  const priceText = listing.price_display || formatPrice(listing.price);

  return (
    <Card className="group overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <Image
          src={hero}
          alt={listing.title}
          fill
          sizes="(max-width: 768px) 100vw, 360px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 flex gap-1.5">
          <Badge tone="primary">{CATEGORY_LABELS[listing.category]}</Badge>
          {listing.is_demo ? <DemoTag>Demo</DemoTag> : null}
        </div>
        <div className="absolute right-2 top-2">
          <StatusBadge status={listing.status} />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <p className="text-lg font-bold text-white drop-shadow">{priceText}</p>
        </div>
      </div>

      <div className="p-4">
        <Link href={`/listings/${listing.id}`}>
          <h3 className="line-clamp-1 font-semibold leading-tight hover:text-primary">
            {listing.title}
          </h3>
        </Link>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {listing.area} ·{" "}
          {PROPERTY_TYPE_LABELS[listing.property_type as PropertyType] ??
            listing.property_type}
        </p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {listing.bedrooms ? (
            <span className="flex items-center gap-1">
              <BedDouble className="h-4 w-4" /> {listing.bedrooms}
            </span>
          ) : null}
          {listing.bathrooms ? (
            <span className="flex items-center gap-1">
              <Bath className="h-4 w-4" /> {listing.bathrooms}
            </span>
          ) : null}
          {listing.built_up_sqft ? (
            <span className="flex items-center gap-1">
              <Maximize className="h-4 w-4" />{" "}
              {Number(listing.built_up_sqft).toLocaleString()} sqft
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> {listing.views_count}
          </span>
          <span className="flex items-center gap-1">
            <Share2 className="h-3.5 w-3.5" /> {listing.shares_count}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {listing.leads_count}
          </span>
          <span className="ml-auto">{formatDate(listing.created_at)}</span>
        </div>

        {manage ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/listings/${listing.id}`}>
                <ExternalLink className="h-4 w-4" /> View
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/listings/${listing.id}/edit`}>
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            </Button>
            <ShareButton listing={listing} />
          </div>
        ) : null}
      </div>
    </Card>
  );
}
