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
  Award,
  TrendingUp,
  UserPlus,
  Sparkles,
} from "lucide-react";
import { getPublicAgent } from "@/lib/data/agents";
import { absoluteUrl, sanitizeText, toWaNumber } from "@/lib/utils";
import { ListingExplorer } from "@/components/public/listing-explorer";
import { LOCAL_DEMO } from "@/lib/demo-mode";
import { teamMemberIds } from "@/lib/demo-data/dataset";
import { Logo } from "@/components/brand";
import { DemoAvatar } from "@/components/public/demo-avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode } from "@/components/public/qr-code";
import { TrackedLink } from "@/components/tracked-link";
import { ListingCarousel } from "@/components/public/listing-carousel";
import { ProfileShareButton } from "@/components/public/profile-share-button";
import { ProfileStickyCta } from "@/components/public/profile-sticky-cta";
import { LeadCaptureForm } from "@/components/public/lead-capture-form";

// Listing statuses safe to show publicly.
const ACTIVE_STATUSES = [
  "available",
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
  const role = p.title ?? "Ejen Hartanah";
  // Layout template already appends "· Super Ren Group", so strip the org here.
  const roleShort = role.split(" · ")[0];
  const areas = (p.service_areas ?? []).slice(0, 5).join(", ");
  const title = `${name}${p.ren_number ? ` · ${p.ren_number}` : ""} | ${roleShort}`;
  const ogTitle = `${name}${p.ren_number ? ` · ${p.ren_number}` : ""} | ${role}`;
  const description = sanitizeText(
    `${name}, ${role}${p.agency_name ? ` · ${p.agency_name}` : ""}. Pakar jual, sewa & komersial hartanah sekitar ${areas || "Ampang & Kuala Lumpur"}.`,
  );
  const image = p.profile_photo_url
    ? p.profile_photo_url.startsWith("http")
      ? p.profile_photo_url
      : absoluteUrl(p.profile_photo_url)
    : absoluteUrl("/demo/og-default.svg");
  return {
    title,
    description,
    openGraph: { title: ogTitle, description, images: [{ url: image }], url: absoluteUrl(`/agent/${slug}`), type: "profile" },
    twitter: { card: "summary", title: ogTitle, description, images: [image] },
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
    { label: "Saya Nak Jual Rumah", sub: "Semak harga pasaran & strategi jualan.", icon: Home, event: "profile_cta_sell" as const, msg: `Hi ${firstName}, saya berminat untuk jual rumah. Boleh bantu semak harga pasaran dan strategi jualan?` },
    { label: "Saya Nak Sewakan Unit", sub: "Cari tenant dan urus enquiry.", icon: Key, event: "profile_cta_rent" as const, msg: `Hi ${firstName}, saya berminat untuk sewakan unit. Boleh bantu semak potensi rental dan cari tenant?` },
    { label: "Saya Nak Cari Rumah", sub: "Beli atau sewa sekitar Ampang / KL.", icon: Search, event: "profile_cta_buy" as const, msg: `Hi ${firstName}, saya sedang mencari rumah sekitar Ampang / KL. Boleh bantu saya?` },
    { label: "Saya Nak Join Team", sub: "Sertai team hartanah Amirul.", icon: Users, event: "profile_cta_join_team" as const, msg: `Hi ${firstName}, saya berminat untuk tahu lebih lanjut tentang peluang join team Super Ren Group.` },
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
    <div className="min-h-screen bg-background pb-28 lg:pb-16">
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
              <DemoAvatar
                userId={profile.user_id}
                src={profile.profile_photo_url}
                name={name}
                className="h-24 w-24 border-4 border-card shadow-md"
                fallbackClassName="text-2xl"
              />
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

            {/* Positioning headline */}
            <p className="mt-2 text-base font-semibold text-foreground">
              Pakar Jual, Sewa &amp; Komersial Hartanah Ampang / KL
            </p>
            <p className="text-sm text-muted-foreground">
              Bantu pemilik rumah, buyer, tenant dan agent baru dengan sistem
              pemasaran hartanah yang lebih tersusun.
            </p>

            {/* Micro trust row */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.ren_number ? <TrustChip>{profile.ren_number}</TrustChip> : null}
              {profile.agency_name ? <TrustChip>{profile.agency_name}</TrustChip> : null}
              <TrustChip>Fokus Ampang / KL</TrustChip>
              {profile.title ? (
                <TrustChip>{profile.title.split(" · ")[0]}</TrustChip>
              ) : null}
            </div>
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

            {/* Intent CTAs — "Saya mahu…" */}
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-foreground">Saya mahu…</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {ctas.map((c) => {
                  const Icon = c.icon;
                  return (
                    <TrackedLink
                      key={c.label}
                      event={c.event}
                      href={intent(c.msg)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 rounded-xl border border-emerald-600/30 bg-emerald-50/60 p-3 text-left transition-colors hover:bg-emerald-100/70"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-foreground">
                          {c.label}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {c.sub}
                        </span>
                      </span>
                    </TrackedLink>
                  );
                })}
              </div>
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
            href="https://www.lppeh.gov.my/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gold bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-gold/10"
          >
            <BadgeCheck className="h-4 w-4 text-gold" /> Semak di Portal Rasmi LPPEH
          </a>
          <p className="mt-2 text-xs text-muted-foreground">
            Buka portal rasmi LPPEH, pilih semakan ejen/REN berdaftar, dan cari
            mengikut No. REN, IC atau nama. Sila sahkan sebelum sebarang
            transaksi.
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

        {/* Why choose me — trust */}
        <section className="mt-6">
          <h2 className="mb-3 text-lg font-bold">Kenapa Pilih {firstName}?</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <HelpCard
              icon={BadgeCheck}
              title="REN Berdaftar"
              desc={`${profile.ren_number ?? "REN berdaftar"}${profile.agency_name ? ` di bawah ${profile.agency_name}` : ""}.`}
            />
            <HelpCard
              icon={MapPin}
              title="Fokus Kawasan Ampang / KL"
              desc={(profile.service_areas ?? ["Ampang"]).join(", ") + "."}
            />
            <HelpCard
              icon={Award}
              title="Team & Sistem"
              desc={`${profile.title ?? "Group Team Manager"} dengan sokongan ${profile.agency_name ?? "Super Ren Group"}.`}
            />
            <HelpCard
              icon={TrendingUp}
              title="Rekod Listing & Transaksi"
              desc={`${active.length} listing aktif dan ${portfolio.length} sold/rented dipaparkan di halaman ini.`}
            />
          </div>
        </section>

        {/* Listings */}
        <div id="listings">
          {featured.length ? (
            <ListingCarousel title="Listing Unggulan" listings={featured} accent waNumber={profile.whatsapp} />
          ) : null}

          {active.length || portfolio.length ? (
            <ListingExplorer
              active={active}
              portfolio={portfolio}
              waNumber={profile.whatsapp}
            />
          ) : (
            <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Tiada listing aktif buat masa ini. Hubungi saya untuk keperluan anda.
            </p>
          )}
        </div>

        {/* Lead capture */}
        <section className="mt-8">
          <LeadCaptureForm waNumber={wa} firstName={firstName} />
        </section>

        {/* Join team */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-gold/30 bg-gold/5 p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <UserPlus className="h-5 w-5 text-gold" /> Nak Join Team {firstName}?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sesuai untuk individu yang mahu belajar sistem kerja hartanah dengan
            lebih tersusun — sama ada agent baru, part-time, atau REN aktif yang
            mahu berkembang bersama team.
          </p>
          <ul className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
            {[
              "Bimbingan asas kerja hartanah",
              "Support listing dan pemasaran",
              "Fokus kawasan Ampang / KL",
              "Sistem follow-up & kerja tersusun",
              "Sesuai untuk agent baru",
              "Bina momentum bersama team",
            ].map((b) => (
              <li key={b} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <Button asChild variant="gold" className="mt-4">
            <TrackedLink
              event="profile_cta_join_team"
              href={intent(`Hi ${firstName}, saya berminat untuk tahu lebih lanjut tentang peluang join team Super Ren Group.`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <UserPlus className="h-4 w-4" /> Saya Berminat Join Team
            </TrackedLink>
          </Button>
        </section>

        {/* FAQ */}
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold">Soalan Lazim</h2>
          <div className="space-y-2">
            <Faq q="Kawasan mana yang dicover?" a={`Fokus utama ialah ${(profile.service_areas ?? ["Ampang"]).join(", ")} dan kawasan sekitar Kuala Lumpur.`} />
            <Faq q="Boleh bantu jual dan sewa?" a="Ya. Fokus meliputi subsale, rental dan commercial property bergantung kepada jenis unit dan lokasi." />
            <Faq q="Boleh bantu semak harga pasaran?" a="Ya. Pemilik boleh hubungi saya untuk semakan awal harga pasaran sebelum membuat keputusan jual atau sewa." />
            <Faq q="Dokumen apa diperlukan jika saya mahu jual rumah?" a="Biasanya salinan geran/strata title jika ada, IC owner, maklumat loan, bil cukai pintu/cukai tanah, dan butiran unit. Saya boleh bantu semak keperluan awal." />
            <Faq q="Berapa lama proses jual rumah?" a="Bergantung kepada harga, lokasi, keadaan pasaran, dokumen dan pembeli. Semakan awal boleh bantu tetapkan strategi harga dan pemasaran." />
            <Faq q="Boleh bantu commercial property?" a="Ya, halaman ini turut memaparkan listing komersial dan saya boleh bantu pemilik atau buyer untuk hartanah komersial sekitar Ampang / KL." />
            <Faq q="Adakah saya perlu bayar untuk semakan awal?" a="Untuk semakan awal, anda boleh hubungi saya dahulu bagi memahami situasi unit dan keperluan anda." />
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
            {profile.phone ? (
              <Button asChild variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
                <TrackedLink event="click_call_profile" href={`tel:${toWaNumber(profile.phone)}`}>
                  <Phone className="h-4 w-4" /> Call
                </TrackedLink>
              </Button>
            ) : null}
          </div>
        </section>

        <p className="mt-8 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/40 p-4 text-center text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          Maklumat hartanah tertakluk kepada perubahan tanpa notis. Sila sahkan
          harga, status dan butiran dengan ejen sebelum membuat keputusan.
        </p>
      </main>

      <ProfileStickyCta
        whatsappUrl={intent(`Salam ${firstName}, saya ada pertanyaan tentang hartanah.`)}
        phone={profile.phone}
        url={profileUrl}
        name={name}
      />
    </div>
  );
}

function TrustChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/5 px-2.5 py-1 text-[11px] font-medium text-foreground">
      <BadgeCheck className="h-3 w-3 text-gold" />
      {children}
    </span>
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
