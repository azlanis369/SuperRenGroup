import { absoluteUrl, formatPrice, toWaNumber } from "@/lib/utils";
import type { Lang } from "@/lib/i18n/translations";

type ShareListing = {
  title: string;
  slug: string;
  area: string;
  price?: number | null;
  price_display?: string | null;
  top_selling_points?: string[];
};

/** Mandatory agent identity stamp appended to every shared listing message. */
export type AgentStamp = {
  name: string;
  phone?: string | null;
  ren?: string | null;
  agency?: string | null;
};

function priceText(l: ShareListing, lang: Lang = "ms"): string {
  if (l.price_display) return l.price_display;
  if (l.price) return formatPrice(l.price);
  return lang === "en" ? "Price on request" : "Harga atas permintaan";
}

const SHARE_T = {
  ms: {
    intro: "Hi, saya ingin kongsikan listing ini:",
    highlight: "Highlight:",
    view: "Lihat gambar & details:",
    contact: "Hubungi saya jika berminat.",
  },
  en: {
    intro: "Hi, I'd like to share this listing:",
    highlight: "Highlights:",
    view: "View photos & details:",
    contact: "Contact me if interested.",
  },
} as const;

/** Malaysian local phone format, e.g. "+60 17-690 0696" -> "0176900696". */
function phoneLocal(phone?: string | null): string {
  const wa = toWaNumber(phone ?? "");
  if (!wa) return "";
  return wa.startsWith("60") ? "0" + wa.slice(2) : wa;
}

/** The 4-info agent stamp (name, phone, REN, agency) that must persist. */
export function buildAgentStamp(a?: AgentStamp | null): string {
  if (!a?.name) return "";
  const phone = phoneLocal(a.phone);
  const line1 = phone ? `${a.name} - ${phone}` : a.name;
  const line2 = [a.ren, a.agency].filter(Boolean).join(" | ");
  return `\n\n${line1}` + (line2 ? `\n${line2}` : "");
}

/** Build the standard WhatsApp share message (UI language) with agent stamp. */
export function buildShareMessage(
  l: ShareListing,
  agent?: AgentStamp,
  lang: Lang = "ms",
): string {
  const url = absoluteUrl(`/listing/${l.slug}`);
  const tt = SHARE_T[lang];
  const points = (l.top_selling_points ?? []).slice(0, 3);
  const highlights =
    points.length > 0
      ? `\n\n${tt.highlight}\n${points.map((p, i) => `${i + 1}. ${p}`).join("\n")}`
      : "";

  return (
    `${tt.intro}\n\n` +
    `${l.title}\n${priceText(l, lang)}\n${l.area}` +
    highlights +
    `\n\n${tt.view}\n${url}\n\n` +
    `${tt.contact}` +
    buildAgentStamp(agent)
  );
}

/** wa.me link that opens WhatsApp with the share message (incl. stamp) prefilled. */
export function buildWhatsAppShareUrl(
  l: ShareListing,
  agent?: AgentStamp,
  lang: Lang = "ms",
): string {
  const text = encodeURIComponent(buildShareMessage(l, agent, lang));
  return `https://wa.me/?text=${text}`;
}

/** wa.me link a public viewer uses to contact the agent about a listing. */
export function buildInquiryWhatsAppUrl(
  agentPhone: string,
  listing: ShareListing,
  lang: Lang = "ms",
): string {
  const url = absoluteUrl(`/listing/${listing.slug}`);
  const body =
    lang === "en"
      ? `Hi, I'm interested in this listing: ${listing.title} (${priceText(
          listing,
          lang,
        )}, ${listing.area}). Could you share more details and arrange a viewing?\n\n${url}`
      : `Salam, saya berminat dengan listing ${listing.title} (${priceText(
          listing,
        )}, ${listing.area}). Boleh kongsi detail dan susun viewing?\n\n${url}`;
  return `https://wa.me/${toWaNumber(agentPhone)}?text=${encodeURIComponent(body)}`;
}

/** Telegram share — copy/share text (incl. stamp) + share intent URL. */
export function buildTelegramShareUrl(
  l: ShareListing,
  agent?: AgentStamp,
  lang: Lang = "ms",
): string {
  const url = absoluteUrl(`/listing/${l.slug}`);
  const text = encodeURIComponent(buildShareMessage(l, agent, lang));
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`;
}

/** Public profile share for an agent digital business card. */
export function buildProfileShareUrl(slug: string): string {
  return absoluteUrl(`/agent/${slug}`);
}

/** A short, polite follow-up message an agent sends to a customer/lead. */
export function buildFollowUpMessage(
  customerName?: string | null,
  listingTitle?: string | null,
  agent?: AgentStamp,
  lang: Lang = "ms",
): string {
  const hi = customerName ? `Hi ${customerName},` : "Hi,";
  if (lang === "en") {
    const who = agent?.name
      ? ` I'm ${agent.name}${agent.agency ? ` from ${agent.agency}` : ""}.`
      : "";
    const re = listingTitle ? ` regarding "${listingTitle}"` : "";
    return `${hi}${who} I'd like to follow up${re}. Still interested? Happy to help with the next steps. 😊`;
  }
  const who = agent?.name
    ? ` Saya ${agent.name}${agent.agency ? ` dari ${agent.agency}` : ""}.`
    : "";
  const re = listingTitle ? ` berkenaan "${listingTitle}"` : "";
  return `${hi}${who} Saya ingin follow up${re}. Masih berminat? Boleh saya bantu untuk langkah seterusnya? 😊`;
}
