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
  ShieldCheck,
  Home,
  Key,
  Search,
  Users,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { getPublicAgent } from "@/lib/data/agents";
import { absoluteUrl, sanitizeText, toWaNumber } from "@/lib/utils";
import { SEGMENT_ORDER, SEGMENT_LABELS, segmentOf } from "@/lib/segment";
import { LOCAL_DEMO } from "@/lib/demo-mode";
import { teamMemberIds } from "@/lib/demo-data/dataset";
import { Logo } from "@/components/brand";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DemoTag } from "@/components/demo-badge";
import { QrCode } from "@/components/public/qr-code";
import { TrackedLink } from "@/components/tracked-link";
import { ListingCarousel } from "@/components/public/listing-carousel";
import { ProfileShareButton } from "@/components/public/profile-share-button";

// Listing statuses safe to show publicly.
const ACTIVE_STATUSES = [
  "available",
  "interested",
  "viewing_scheduled",
  "booked",
  "loan_in_progress",
  "spa_in_progress",
];
const PORTFOLIO_STATUSES = ["sold", "rented"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicAgent(slug);
  if (!data) return { title: "Profil tidak dijumpai" };
  const p = data.profile;
  const name = p.display_name || p.full_name;
  const areas = (p.service_areas ?? []).slice(0, 5).join(", ");
  const title = `${name}${p.ren_number ? ` ${p.ren_number}` : ""} | Ampang & KL Property Negotiator`;
  const description = sanitizeText(
    `${name}, Real Estate Negotiator${p.agency_name ? ` bersama ${p.agency_name}` : ""}, membantu pemilik, pembeli & penyewa hartanah sekitar ${areas || "Ampang & Kuala Lumpur"}.`,
  );
  const image = p.profile_photo_url
    ? p.profile_photo_url.startsWith("http")
      ? p.profile_photo_url
      : absoluteUrl(p.profile_photo_url)
    : absoluteUrl("/demo/og-default.svg");
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: image }], url: absoluteUrl(`/agent/${slug}`), type: "profile" },
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
  const firstName = name.split(" ")[0];
  const profileUrl = absoluteUrl(`/agent/${slug}`);
  const wa = profile.whatsapp ? toWaNumber(profile.whatsapp) : null;
  const intent = (msg: string) =>
    wa ? `https://wa.me/${wa}?text=${encodeURIComponent(msg)}` : "#";

  // Listing hygiene: only public-safe statuses, split active vs portfolio.
  const active = listings.filter((l) => ACTIVE_STATUSES.includes(l.status));
  const portfolio = listings
    .filter((l) => PORTFOLIO_STATUSES.includes(l.status))
    .slice(0, 12);
  const featured = active.filter((l) => l.featured).slice(0, 8);
  const bySegment = SEGMENT_ORDER.map((seg) => ({
    seg,
    items: active.filter((l) => segmentOf(l) === seg),
  })).filter((g) => g.items.length > 0);

  const teamCount = LOCAL_DEMO
    ? Math.max(0, teamMemberIds(profile.user_id).length - 1)
    : 0;

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

  const ctas = [
    { label: "Saya Nak Jual Rumah", icon: Home, event: "profile_cta_sell" as const, msg: `Salam ${firstName}, saya pemilik rumah di kawasan Ampang/KL dan ingin tahu anggaran harga pasaran serta cara tuan boleh bantu jualkan unit saya.` },
    { label: "Saya Nak Sewakan Unit", icon: Key, event: "profile_cta_rent" as const, msg: `Salam ${firstName}, saya ada unit untuk disewakan dan ingin tahu cara tuan boleh bantu cari tenant yang sesuai.` },
    { label: "Saya Nak Cari Rumah", icon: Search, event: "profile_cta_buy" as const, msg: `Salam ${firstName}, saya sedang mencari rumah sekitar Ampang/KL. Boleh bantu cadangkan unit yang sesuai dengan bajet dan keperluan saya?` },
    { label: "Saya Nak Join Team", icon: Users, event: "profile_cta_join_team" as const, msg: `Salam ${firstName}, saya berminat untuk tahu lebih lanjut tentang peluang menyertai team hartanah tuan.` },
  ];

  // JSON-LD — RealEstateAgent
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name,
    jobTitle: profile.title ?? "Real Estate Negotiator",
    description: profile.bio ?? undefined,
    telephone: profile.phone ?? undefined,
    email: profile.email ?? undefined,
    url: profileUrl,
    image: profile.profile_photo_url ? absoluteUrl(profile.profile_photo_url) : undefined,
    areaServed: profile.service_areas ?? [],
    worksFor: profile.agency_name
      ? { "@type": "Organization", name: profile.agency_name }
      : undefined,
    sameAs: [profile.facebook_url, profile.instagram_url, profile.website_url].filter(Boolean),
  };

  const stats = [
    teamCount > 0 ? { n: teamCount, label: "Ahli Team" } : null,
    { n: (profile.service_areas ?? []).length, label: "Kawasan Fokus" },
    { n: active.length, label: "Listing Aktif" },
    { n: portfolio.length, label: "Sold / Rented" },
  ].filter(Boolean) as { n: number; label: string }[];

  return (
    <div className="min-h-screen bg-background pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Public top nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-medium text-muted-foreground sm:flex">
            <a href="#listings" className="hover:text-foreground">Listings</a>
            <a href="#about" className="hover:text-foreground">About</a>
            <a href={intent(`Salam ${firstName}, saya ada pertanyaan.`)} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Contact</a>
          </nav>
          <ProfileShareButton url={profileUrl} name={name} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        {/* Hero / Business card */}
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

            <p className="mt-3 text-sm text-muted-foreground">
              {profile.bio
                ? sanitizeText(profile.bio)
                : `Saya membantu pemilik, pembeli dan penyewa di ${(profile.service_areas ?? ["Ampang"])[0]} serta sekitar Kuala Lumpur membuat keputusan hartanah dengan lebih jelas — daripada semakan harga pasaran, pemasaran, saringan prospek, viewing, rundingan sehingga proses jual/sewa selesai.`}
            </p>

            {/* Intent CTAs */}
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ctas.map((c) => {
                const Icon = c.icon;
                return (
                  <Button key={c.label} asChild variant="success" className="justify-start">
                    <TrackedLink event={c.event} href={intent(c.msg)} target="_blank" rel="noopener noreferrer">
                      <Icon className="h-4 w-4" /> {c.label}
                    </TrackedLink>
                  </Button>
                );
              })}
            </div>

            {/* Direct contact + socials + QR */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {profile.whatsapp ? (
                <Button asChild size="sm">
                  <TrackedLink event="click_whatsapp_profile" href={intent(`Salam ${firstName}, saya ada pertanyaan tentang hartanah.`)} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </TrackedLink>
                </Button>
              ) : null}
              {profile.phone ? (
                <Button asChild variant="outline" size="sm">
                  <TrackedLink event="click_call_profile" href={`tel:${toWaNumber(profile.phone)}`}>
                    <Phone className="h-4 w-4" /> Call
                  </TrackedLink>
                </Button>
              ) : null}
              {profile.email ? (
                <Button asChild variant="outline" size="sm">
                  <a href={`mailto:${profile.email}`}>
                    <Mail className="h-4 w-4" /> Email
                  </a>
                </Button>
              ) : null}
              <div className="ml-auto flex flex-col items-center rounded-xl border border-border p-2">
                <QrCode value={profileUrl} size={80} />
                <span className="mt-1 text-[10px] text-muted-foreground">Imbas profil</span>
              </div>
            </div>
            {socials.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
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
            ) : null}
          </div>
        </div>

        {/* Social proof */}
        {stats.length ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center">
                <p className="text-2xl font-extrabold text-primary">{s.n}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        ) : null}

        {/* Trust / REN verification */}
        <section id="about" className="mt-6 rounded-2xl border border-gold/30 bg-gold/5 p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <ShieldCheck className="h-5 w-5 text-gold" /> Pengesahan REN
          </h2>
          <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            <Row k="Nama" v={name} />
            {profile.ren_number ? <Row k="REN" v={profile.ren_number} /> : null}
            {profile.agency_name ? <Row k="Agensi" v={profile.agency_name} /> : null}
            {profile.title ? <Row k="Jawatan" v={profile.title} /> : null}
            {profile.service_areas?.length ? (
              <Row k="Kawasan" v={profile.service_areas.join(", ")} />
            ) : null}
          </dl>
          <a
            href="https://www.lppeh.gov.my/semakan-pendaftaran/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gold bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-gold/10"
          >
            <BadgeCheck className="h-4 w-4 text-gold" /> Semak REN / BOVAEP
          </a>
          <p className="mt-2 text-xs text-muted-foreground">
            Sila sahkan butiran profesional sebelum membuat sebarang transaksi.
          </p>
        </section>

        {/* Who I help */}
        <section className="mt-6">
          <h2 className="mb-3 text-lg font-bold">Siapa Yang Saya Bantu</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <HelpCard icon={Home} title="Pemilik Rumah" desc="Untuk pemilik yang mahu jual atau sewakan unit dengan strategi pemasaran lebih tersusun." />
            <HelpCard icon={Search} title="Buyer / Tenant" desc={`Untuk pembeli atau penyewa yang mahu cari rumah sekitar ${(profile.service_areas ?? ["Ampang"]).slice(0, 3).join(", ")}.`} />
            <HelpCard icon={Users} title="Agent Baru / Team" desc="Untuk individu yang mahu belajar sistem kerja hartanah bersama team yang lebih terarah." />
          </div>
        </section>

        {/* Listings */}
        <div id="listings">
          {featured.length ? (
            <ListingCarousel title="Listing Unggulan" listings={featured} accent />
          ) : null}
          {bySegment.map((group) => (
            <ListingCarousel
              key={group.seg}
              title={SEGMENT_LABELS[group.seg]}
              listings={group.items}
            />
          ))}
          {active.length === 0 ? (
            <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Tiada listing aktif buat masa ini. Hubungi saya untuk keperluan anda.
            </p>
          ) : null}
        </div>

        {/* Recently sold / rented */}
        {portfolio.length ? (
          <ListingCarousel title="Recently Sold / Rented" listings={portfolio} />
        ) : null}

        {/* FAQ */}
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold">Soalan Lazim</h2>
          <div className="space-y-2">
            <Faq q="Kawasan mana yang dicover?" a={`Fokus utama ialah ${(profile.service_areas ?? ["Ampang"]).join(", ")} dan kawasan sekitar Kuala Lumpur.`} />
            <Faq q="Boleh bantu jual dan sewa?" a="Ya. Fokus meliputi subsale, rental dan commercial property bergantung kepada jenis unit dan lokasi." />
            <Faq q="Boleh bantu semak harga pasaran?" a="Ya. Pemilik boleh hubungi saya untuk semakan awal harga pasaran sebelum membuat keputusan jual atau sewa." />
            <Faq q="Apa beza listing aktif dan sold/rented?" a="Listing aktif ialah unit yang masih tersedia untuk enquiry. Sold/rented pula ialah rekod portfolio transaksi terdahulu." />
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-8 rounded-2xl bg-gradient-to-br from-primary to-primary/85 p-6 text-center text-primary-foreground">
          <Building2 className="mx-auto h-8 w-8 text-gold" />
          <h2 className="mt-2 text-xl font-bold">Sedia untuk langkah seterusnya?</h2>
          <p className="mt-1 text-sm text-white/85">
            Hubungi {firstName} untuk semakan harga, pemasaran listing, atau mencari unit idaman anda.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button asChild variant="gold">
              <TrackedLink event="click_whatsapp_profile" href={intent(`Salam ${firstName}, saya ingin berbincang tentang hartanah.`)} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> WhatsApp {firstName}
              </TrackedLink>
            </Button>
          </div>
        </section>

        <p className="mt-8 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/40 p-4 text-center text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Profil ini dikongsi oleh agent berdaftar. Sila sahkan butiran profesional di mana perlu.
        </p>
      </main>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-gold/15 py-1 last:border-0 sm:border-0">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium text-foreground">{v}</dd>
    </div>
  );
}

function HelpCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-2 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border border-border bg-card p-4">
      <summary className="cursor-pointer list-none font-semibold text-foreground marker:hidden">
        {q}
      </summary>
      <p className="mt-2 text-sm text-muted-foreground">{a}</p>
    </details>
  );
}
