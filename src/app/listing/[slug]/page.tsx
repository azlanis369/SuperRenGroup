import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BedDouble,
  Bath,
  Car,
  Maximize,
  Sofa,
  MapPin,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { getPublicListingBySlug } from "@/lib/data/listings";
import { getListingAgent, getPublicAgent } from "@/lib/data/agents";
import {
  CATEGORY_LABELS,
  PROPERTY_TYPE_LABELS,
  FURNISHING_LABELS,
  TENURE_LABELS,
  type PropertyType,
  type Furnishing,
  type Tenure,
} from "@/lib/constants";
import { formatPrice, absoluteUrl, sanitizeText } from "@/lib/utils";
import { resolveHero } from "@/lib/media";
import { buildInquiryWhatsAppUrl } from "@/lib/share";
import { Logo } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { DemoTag } from "@/components/demo-badge";
import { ListingGallery } from "@/components/public/listing-gallery";
import { AgentContactCard } from "@/components/public/agent-contact-card";
import { ShareButton } from "@/components/listings/share-button";
import { ViewTracker } from "@/components/public/view-tracker";
import { PublicListingCard } from "@/components/public/public-listing-card";
import type { ListingRow } from "@/lib/database.types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicListingBySlug(slug);
  if (!data || data.listing.visibility !== "public") {
    return { title: "Listing tidak dijumpai" };
  }
  const l = data.listing;
  const price = l.price_display || formatPrice(l.price);
  const title = `${l.title} — ${price}`;
  const description = sanitizeText(
    `${l.area}. ${(l.top_selling_points ?? []).slice(0, 3).join(" · ")}`,
  );
  const image = l.hero_image_url
    ? l.hero_image_url.startsWith("http")
      ? l.hero_image_url
      : absoluteUrl(l.hero_image_url)
    : absoluteUrl(resolveHero(null, l.category));

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image }],
      type: "website",
      url: absoluteUrl(`/listing/${slug}`),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function PublicListingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicListingBySlug(slug);
  if (!data || data.listing.visibility !== "public" || data.listing.status === "draft") {
    notFound();
  }
  const { listing, media } = data;
  const isDemo = (listing as { is_demo?: boolean }).is_demo;
  const agent = await getListingAgent(listing.agent_id);

  const gallery = media.length
    ? media
    : [{ id: "ph", url: resolveHero(null, listing.category), media_type: "image" as const, caption: null }];

  // Similar listings from the same agent
  let similar: ListingRow[] = [];
  if (agent) {
    const pub = await getPublicAgent(agent.slug);
    similar = (pub?.listings ?? []).filter((x) => x.id !== listing.id).slice(0, 4);
  }

  const whatsappUrl = agent
    ? buildInquiryWhatsAppUrl(agent.whatsapp || agent.phone || "", listing)
    : "#";

  return (
    <div className="min-h-screen bg-background pb-16">
      <ViewTracker listingId={listing.id} />
      <PublicHeader />

      <main className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <ListingGallery media={gallery} title={listing.title} />

            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge tone="primary">{CATEGORY_LABELS[listing.category]}</Badge>
                <StatusBadge status={listing.status} />
                {isDemo ? <DemoTag>Demo Listing</DemoTag> : null}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-balance">
                {listing.title}
              </h1>
              <p className="mt-1 flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {listing.show_exact_address && listing.address_public
                  ? listing.address_public
                  : listing.area}
              </p>
              <p className="mt-3 text-3xl font-bold text-primary">
                {listing.price_display || formatPrice(listing.price)}
              </p>
            </div>

            {/* Key facts */}
            <Card>
              <CardContent className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3">
                <Fact icon={BedDouble} label="Bilik tidur" value={listing.bedrooms} />
                <Fact icon={Bath} label="Bilik air" value={listing.bathrooms} />
                <Fact icon={Car} label="Parking" value={listing.carparks} />
                <Fact
                  icon={Maximize}
                  label="Built-up"
                  value={listing.built_up_sqft ? `${Number(listing.built_up_sqft).toLocaleString()} sqft` : null}
                />
                <Fact
                  icon={Sofa}
                  label="Furnishing"
                  value={listing.furnishing ? FURNISHING_LABELS[listing.furnishing as Furnishing] : null}
                />
                <Fact
                  icon={Building2}
                  label="Tenure"
                  value={listing.tenure ? TENURE_LABELS[listing.tenure as Tenure] : null}
                />
              </CardContent>
            </Card>

            {listing.description ? (
              <Section title="Deskripsi">
                <p className="whitespace-pre-line text-muted-foreground">
                  {sanitizeText(listing.description)}
                </p>
              </Section>
            ) : null}

            {listing.top_selling_points?.length ? (
              <Section title="Kelebihan utama">
                <ul className="space-y-2">
                  {listing.top_selling_points.map((p, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                      <span>{sanitizeText(p)}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {listing.facilities?.length ? (
              <Section title="Kemudahan">
                <TagList items={listing.facilities} />
              </Section>
            ) : null}
            {listing.amenities?.length ? (
              <Section title="Kemudahan sekitar">
                <TagList items={listing.amenities} />
              </Section>
            ) : null}
            {listing.nearby?.length ? (
              <Section title="Berhampiran">
                <TagList items={listing.nearby} />
              </Section>
            ) : null}

            {listing.show_exact_address && listing.map_url ? (
              <Section title="Lokasi">
                <a
                  href={listing.map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline"
                >
                  <MapPin className="h-4 w-4" /> Lihat di peta
                </a>
              </Section>
            ) : null}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            {agent ? (
              <AgentContactCard
                agent={agent}
                whatsappUrl={whatsappUrl}
                showPhone={listing.show_agent_phone}
                enableWhatsApp={listing.enable_whatsapp_cta}
              />
            ) : null}
            <ShareButton listing={listing} variant="outline" size="default" label="Kongsi listing ini" />
          </div>
        </div>

        {similar.length ? (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-bold">Listing lain dari agent ini</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((s, i) => (
                <PublicListingCard key={s.id} listing={s} index={i + 1} />
              ))}
            </div>
          </section>
        ) : null}

        <Disclaimer />
      </main>
    </div>
  );
}

function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/">
          <Logo />
        </Link>
        <span className="text-xs text-muted-foreground">Property Catalog</span>
      </div>
    </header>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <div className="text-sm">{children}</div>
    </section>
  );
}

function TagList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it, i) => (
        <span
          key={i}
          className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
        >
          {sanitizeText(it)}
        </span>
      ))}
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
  if (!value) return null;
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div>
        <p className="text-sm font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function Disclaimer() {
  return (
    <p className="mt-10 rounded-xl border border-border bg-muted/40 p-4 text-center text-xs text-muted-foreground">
      Listing ini dikongsi oleh agent. Sila sahkan butiran profesional di mana
      perlu. Maklumat hartanah tertakluk kepada perubahan tanpa notis.
    </p>
  );
}
