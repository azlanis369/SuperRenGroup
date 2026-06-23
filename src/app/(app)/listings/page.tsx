import type { Metadata } from "next";
import Link from "next/link";
import { Building2, PlusCircle } from "lucide-react";
import { requireOnboardedUser, isAdmin } from "@/lib/auth";
import { getListings } from "@/lib/data/listings";
import { getDict } from "@/lib/i18n/server";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingsToolbar } from "@/components/listings/listings-toolbar";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Listings" };

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; area?: string }>;
}) {
  const user = await requireOnboardedUser();
  const sp = await searchParams;
  const admin = isAdmin(user.role);

  const listings = await getListings(
    { tab: sp.tab, q: sp.q, area: sp.area },
    { ownerOnly: !admin, ownerId: user.id },
  );

  const stamp = user.profile
    ? {
        name: user.profile.display_name || user.profile.full_name,
        phone: user.profile.whatsapp || user.profile.phone,
        ren: user.profile.ren_number,
        agency: user.profile.agency_name,
      }
    : undefined;
  const dict = await getDict();
  const t = dict.listings;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground">
            {admin ? t.subtitleAdmin : t.subtitleAgent} {t.count(listings.length)}
          </p>
        </div>
        <Button asChild className="hidden sm:flex">
          <Link href="/listings/new">
            <PlusCircle className="h-4 w-4" /> {dict.common.addListing}
          </Link>
        </Button>
      </div>

      <ListingsToolbar />

      {listings.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t.emptyTitle}
          description={t.emptyDesc}
          action={
            <Button asChild>
              <Link href="/listings/new">
                <PlusCircle className="h-4 w-4" /> {dict.common.addListing}
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing, i) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              index={i + 1}
              agent={stamp}
            />
          ))}
        </div>
      )}
    </div>
  );
}
