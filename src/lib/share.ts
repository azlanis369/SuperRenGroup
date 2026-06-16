import { absoluteUrl, formatPrice, toWaNumber } from "@/lib/utils";

type ShareListing = {
  title: string;
  slug: string;
  area: string;
  price?: number | null;
  price_display?: string | null;
  top_selling_points?: string[];
};

function priceText(l: ShareListing): string {
  if (l.price_display) return l.price_display;
  if (l.price) return formatPrice(l.price);
  return "Harga atas permintaan";
}

/** Build the standard WhatsApp share message (Malay template). */
export function buildShareMessage(l: ShareListing): string {
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
    `Hubungi saya jika berminat.`
  );
}

/** wa.me link that opens WhatsApp with the share message prefilled. */
export function buildWhatsAppShareUrl(l: ShareListing, phone?: string): string {
  const text = encodeURIComponent(buildShareMessage(l));
  const number = toWaNumber(phone);
  return number
    ? `https://wa.me/${number}?text=${text}`
    : `https://wa.me/?text=${text}`;
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

/** Telegram share — v1 copy/share text + share intent URL. */
export function buildTelegramShareUrl(l: ShareListing): string {
  const url = absoluteUrl(`/listing/${l.slug}`);
  const text = encodeURIComponent(buildShareMessage(l));
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`;
}

/** Public profile share for an agent digital business card. */
export function buildProfileShareUrl(slug: string): string {
  return absoluteUrl(`/agent/${slug}`);
}
