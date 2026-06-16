import { absoluteUrl, formatPrice, toWaNumber } from "@/lib/utils";

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

function priceText(l: ShareListing): string {
  if (l.price_display) return l.price_display;
  if (l.price) return formatPrice(l.price);
  return "Harga atas permintaan";
}

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

/** Build the standard WhatsApp share message (Malay template) with agent stamp. */
export function buildShareMessage(l: ShareListing, agent?: AgentStamp): string {
  const url = absoluteUrl(`/listing/${l.slug}`);
  const points = (l.top_selling_points ?? []).slice(0, 3);
  const highlights =
    points.length > 0
      ? `\n\nHighlight:\n${points.map((p, i) => `${i + 1}. ${p}`).join("\n")}`
      : "";

  return (
    `Hi, saya ingin kongsikan listing ini:\n\n` +
    `${l.title}\n${priceText(l)}\n${l.area}` +
    highlights +
    `\n\nLihat gambar & details:\n${url}\n\n` +
    `Hubungi saya jika berminat.` +
    buildAgentStamp(agent)
  );
}

/** wa.me link that opens WhatsApp with the share message (incl. stamp) prefilled. */
export function buildWhatsAppShareUrl(
  l: ShareListing,
  agent?: AgentStamp,
): string {
  const text = encodeURIComponent(buildShareMessage(l, agent));
  return `https://wa.me/?text=${text}`;
}

/** wa.me link a public viewer uses to contact the agent about a listing. */
export function buildInquiryWhatsAppUrl(
  agentPhone: string,
  listing: ShareListing,
): string {
  const url = absoluteUrl(`/listing/${listing.slug}`);
  const text = encodeURIComponent(
    `Hi, saya berminat dengan listing ini:\n\n${listing.title}\n${priceText(
      listing,
    )}\n${listing.area}\n\n${url}`,
  );
  return `https://wa.me/${toWaNumber(agentPhone)}?text=${text}`;
}

/** Telegram share — copy/share text (incl. stamp) + share intent URL. */
export function buildTelegramShareUrl(l: ShareListing, agent?: AgentStamp): string {
  const url = absoluteUrl(`/listing/${l.slug}`);
  const text = encodeURIComponent(buildShareMessage(l, agent));
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`;
}

/** Public profile share for an agent digital business card. */
export function buildProfileShareUrl(slug: string): string {
  return absoluteUrl(`/agent/${slug}`);
}
