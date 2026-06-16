import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Pencil,
  ExternalLink,
  Eye,
  Share2,
  Users,
  BedDouble,
  Bath,
  Car,
  Maximize,
} from "lucide-react";
import { requireOnboardedUser } from "@/lib/auth";
import { getListingForEdit } from "@/lib/data/listings";
import {
  CATEGORY_LABELS,
  PROPERTY_TYPE_LABELS,
  FURNISHING_LABELS,
  TENURE_LABELS,
  type PropertyType,
  type Furnishing,
  type Tenure,
} from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { resolveHero } from "@/lib/media";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { DemoBadge, DemoTag } from "@/components/demo-badge";
import { ShareButton } from "@/components/listings/share-button";
import { StatusChanger } from "@/components/listings/status-changer";

export const metadata: Metadata = { title: "Listing" };

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOnboardedUser();
  const { id } = await params;
  const data = await getListingForEdit(id);
  if (!data) notFound();
  const { listing, media } = data;
  const isDemo = (listing as { is_demo?: boolean }).is_demo;
  const gallery = media.length
    ? media
    : [{ id: "ph", url: resolveHero(null, listing.category), media_type: "image" as const, caption: null }];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge tone="primary">{CATEGORY_LABELS[listing.category]}</Badge>
            <StatusBadge status={listing.status} />
            {isDemo ? <DemoTag>Demo Listing</DemoTag> : null}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{listing.title}</h1>
          <p className="text-muted-foreground">{listing.area}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/listing/${listing.slug}`} target="_blank">
              <ExternalLink className="h-4 w-4" /> Awam
            </Link>
          </Button>
          <ShareButton listing={listing} />
          <Button asChild size="sm">
            <Link href={`/listings/${listing.id}/edit`}>
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          </Button>
        </div>
      </div>

      {isDemo ? <DemoBadge /> : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Gallery */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {gallery.slice(0, 6).map((m, i) => (
              <div
                key={m.id}
                className={`relative overflow-hidden rounded-lg bg-muted ${
                  i === 0 ? "col-span-2 row-span-2 aspect-square sm:aspect-[4/3]" : "aspect-square"
                }`}
              >
                {m.media_type === "video" ? (
                  <video src={m.url} controls className="h-full w-full object-cover" />
                ) : (
                  <Image src={m.url} alt={m.caption ?? listing.title} fill sizes="400px" className="object-cover" />
                )}
              </div>
            ))}
          </div>

          {/* Key facts */}
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
              <Fact icon={BedDouble} label="Bilik" value={listing.bedrooms} />
              <Fact icon={Bath} label="Bilik air" value={listing.bathrooms} />
              <Fact icon={Car} label="Parking" value={listing.carparks} />
              <Fact
                icon={Maximize}
                label="Built-up"
                value={listing.built_up_sqft ? `${Number(listing.built_up_sqft).toLocaleString()} sqft` : null}
              />
            </CardContent>
          </Card>

          {listing.description ? (
            <Card>
              <CardHeader>
                <CardTitle>Deskripsi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {listing.description}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {listing.top_selling_points?.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Selling Points</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm">
                  {listing.top_selling_points.map((p, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-gold">{i + 1}.</span> {p}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-5">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Harga</p>
              <p className="text-2xl font-bold">
                {listing.price_display || formatPrice(listing.price)}
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <Row label="Jenis" value={PROPERTY_TYPE_LABELS[listing.property_type as PropertyType]} />
                <Row label="Tenure" value={listing.tenure ? TENURE_LABELS[listing.tenure as Tenure] : "—"} />
                <Row label="Furnishing" value={listing.furnishing ? FURNISHING_LABELS[listing.furnishing as Furnishing] : "—"} />
                <Row label="Visibility" value={listing.visibility} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tukar Status</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusChanger listingId={listing.id} current={listing.status} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-around p-4 text-center">
              <Stat icon={Eye} label="Views" value={listing.views_count} />
              <Stat icon={Share2} label="Shares" value={listing.shares_count} />
              <Stat icon={Users} label="Leads" value={listing.leads_count} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string | null;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div>
        <p className="text-sm font-semibold">{value ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium capitalize">{value}</dd>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div>
      <Icon className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
