import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Malaysian Ringgit, e.g. 450000 -> "RM 450,000". */
export function formatPrice(
  value: number | null | undefined,
  opts: { withCents?: boolean } = {},
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: opts.withCents ? 2 : 0,
    maximumFractionDigits: opts.withCents ? 2 : 0,
  })
    .format(value)
    .replace("MYR", "RM")
    .replace("RM ", "RM ");
}

/** Compact number formatting, e.g. 1500 -> "1.5k". */
export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined) return "0";
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Build a URL-safe slug from arbitrary text. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Append a short random suffix to keep slugs unique. */
export function uniqueSlug(input: string): string {
  const base = slugify(input) || "item";
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

/** Days between a past date and now. */
export function daysSince(date: string | Date | null | undefined): number {
  if (!date) return 0;
  const then = new Date(date).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - then) / (1000 * 60 * 60 * 24)));
}

/** Format an ISO date as a friendly short date. */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Sanitize free text for safe display on public pages (strip angle brackets). */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return "";
  return input.replace(/[<>]/g, "").trim();
}

/** Build an absolute URL from a path using the configured site URL. */
export function absoluteUrl(path = ""): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Normalize a Malaysian phone number to wa.me format (digits only, 60 prefix). */
export function toWaNumber(phone: string | null | undefined): string {
  if (!phone) return "";
  let digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("0")) digits = `6${digits}`;
  else if (!digits.startsWith("60") && digits.startsWith("1"))
    digits = `60${digits}`;
  return digits;
}
