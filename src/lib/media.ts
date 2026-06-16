import type { ListingCategory } from "@/lib/constants";

/** Resolve a hero image URL, falling back to a category demo placeholder. */
export function resolveHero(
  heroUrl: string | null | undefined,
  category: ListingCategory,
  index = 1,
): string {
  if (heroUrl) return heroUrl;
  const nn = String(((index - 1) % 12) + 1).padStart(2, "0");
  return `/demo/properties/${category}-${nn}.svg`;
}

export function categoryPlaceholder(
  category: ListingCategory,
  index = 1,
): string {
  const nn = String(((index - 1) % 12) + 1).padStart(2, "0");
  return `/demo/properties/${category}-${nn}.svg`;
}
