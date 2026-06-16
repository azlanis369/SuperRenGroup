import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MessageCircle,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Globe,
  Send,
  MapPin,
  BadgeCheck,
} from "lucide-react";
import { getPublicAgent } from "@/lib/data/agents";
import { LISTING_CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import { absoluteUrl, sanitizeText, toWaNumber } from "@/lib/utils";
import { Logo } from "@/components/brand";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DemoTag } from "@/components/demo-badge";
import { QrCode } from "@/components/public/qr-code";
import { PublicListingCard } from "@/components/public/public-listing-card";
import { ProfileShareButton } from "@/components/public/profile-share-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicAgent(slug);
  if (!data) return { title: "Profil tidak dijumpai" };
  const name = data.profile.display_name || data.profile.full_name;
  const title = `${name}${data.profile.agency_name ? ` · ${data.profile.agency_name}` : ""}`;
  const description = sanitizeText(
    data.profile.bio || `Real estate negotiator. ${data.listings.length} listing aktif.`,
  );
  const image = data.profile.profile_photo_url
    ? data.profile.profile_photo_url.startsWith("http")
      ? data.profile.profile_photo_url
      : absoluteUrl(data.profile.profile_photo_url)
    : absoluteUrl("/demo/og-default.svg");
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: image }], url: absoluteUrl(`/agent/${slug}`) },
    twitter: { card: "summary", title, description, images: [image] },
  };
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicAgent(slug);
  if (!data) notFound();
  const { profile, listings } = data;
  const isDemo = (profile as { is_demo?: boolean }).is_demo;
  const name = profile.display_name || profile.full_name;
  const profileUrl = absoluteUrl(`/agent/${slug}`);

  const featured = listings.filter((l) => l.featured);
  const byCategory = LISTING_CATEGORIES.map((cat) => ({
    cat,
    items: listings.filter((l) => l.category === cat),
  })).filter((g) => g.items.length > 0);

  const socials = [
    { url: profile.facebook_url, icon: Facebook, label: "Facebook" },
    { url: profile.instagram_url, icon: Instagram, label: "Instagram" },
    { url: profile.website_url, icon: Globe, label: "Website" },
    {
      url: profile.telegram_username
        ? `https://t.me/${profile.telegram_username.replace(/^@/, "")}`
        : null,
      icon: Send,
      label: "Telegram",
    },
  ].filter((s) => s.url);

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/">
            <Logo />
          </Link>
          <ProfileShareButton url={profileUrl} name={name} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        {/* Business card */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="h-24 bg-gradient-to-r from-primary to-primary/80" />
          <div className="px-5 pb-5">
            <div className="-mt-12 flex items-end justify-between">
              <Avatar className="h-24 w-24 border-4 border-card shadow-md">
                {profile.profile_photo_url ? (
                  <AvatarImage src={profile.profile_photo_url} alt={name} />
                ) : null}
                <AvatarFallback className="text-2xl">
                  {name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </AvatarFallback>
              </Avatar>
              {isDemo ? <DemoTag>Demo Profile</DemoTag> : null}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{name}</h1>
              {profile.ren_number ? (
                <Badge tone="gold">
                  <BadgeCheck className="mr-1 h-3.5 w-3.5" /> {profile.ren_number}
                </Badge>
              ) : null}
            </div>
            {profile.title || profile.agency_name ? (
              <p className="text-sm text-muted-foreground">
                {[profile.title, profile.agency_name].filter(Boolean).join(" · ")}
              </p>
            ) : null}
            {profile.service_areas?.length ? (
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {profile.service_areas.join(", ")}
              </p>
            ) : null}

            {profile.bio ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {sanitizeText(profile.bio)}
              </p>
            ) : null}

            {/* CTA buttons */}
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {profile.whatsapp ? (
                <Button asChild variant="success">
                  <a
                    href={`https://wa.me/${toWaNumber(profile.whatsapp)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                </Button>
              ) : null}
              {profile.phone ? (
                <Button asChild variant="outline">
                  <a href={`tel:${toWaNumber(profile.phone)}`}>
                    <Phone className="h-4 w-4" /> Call
                  </a>
                </Button>
              ) : null}
              {profile.email ? (
                <Button asChild variant="outline">
                  <a href={`mailto:${profile.email}`}>
                    <Mail className="h-4 w-4" /> Email
                  </a>
                </Button>
              ) : null}
            </div>

            {/* Socials + QR */}
            <div className="mt-4 flex items-end justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {socials.map((s) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={s.label}
                      href={s.url as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-gold hover:text-foreground"
                      aria-label={s.label}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
              <div className="flex flex-col items-center rounded-xl border border-border p-2">
                <QrCode value={profileUrl} size={96} />
                <span className="mt-1 text-[10px] text-muted-foreground">
                  Imbas profil
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Featured */}
        {featured.length ? (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-bold">Listing Unggulan</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.slice(0, 6).map((l, i) => (
                <PublicListingCard key={l.id} listing={l} index={i + 1} />
              ))}
            </div>
          </section>
        ) : null}

        {/* By category */}
        {byCategory.map((group) => (
          <section key={group.cat} className="mt-8">
            <h2 className="mb-3 text-lg font-bold">
              {CATEGORY_LABELS[group.cat]}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({group.items.length})
              </span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((l, i) => (
                <PublicListingCard key={l.id} listing={l} index={i + 1} />
              ))}
            </div>
          </section>
        ))}

        {listings.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Tiada listing awam buat masa ini.
          </p>
        ) : null}

        <p className="mt-10 rounded-xl border border-border bg-muted/40 p-4 text-center text-xs text-muted-foreground">
          Profil ini dikongsi oleh agent. Sila sahkan butiran profesional di mana
          perlu.
        </p>
      </main>
    </div>
  );
}
