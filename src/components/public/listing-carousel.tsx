import type { ListingRow } from "@/lib/database.types";
import { PublicListingCard } from "@/components/public/public-listing-card";

/**
 * A titled, horizontally scrollable row of listing cards.
 * Cards keep a fixed width and snap, so each segment stays tidy on mobile.
 */
export function ListingCarousel({
  title,
  listings,
  accent = false,
}: {
  title: string;
  listings: (ListingRow & { is_demo?: boolean })[];
  accent?: boolean;
}) {
  if (listings.length === 0) return null;
  return (
    <section className="mt-7">
      <div className="mb-3 flex items-center gap-2">
        {accent ? <span className="text-gold">★</span> : null}
        <h2 className="text-lg font-bold">{title}</h2>
        <span className="text-sm font-normal text-muted-foreground">
          ({listings.length})
        </span>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {listings.map((l, i) => (
          <div key={l.id} className="w-[260px] shrink-0 snap-start sm:w-[280px]">
            <PublicListingCard listing={l} index={i + 1} />
          </div>
        ))}
      </div>
    </section>
  );
}
