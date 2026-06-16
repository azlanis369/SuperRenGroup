import type { Metadata } from "next";
import Link from "next/link";
import { Building2, PlusCircle } from "lucide-react";
import { requireOnboardedUser, isAdmin } from "@/lib/auth";
import { getListings } from "@/lib/data/listings";
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Listings</h1>
          <p className="text-muted-foreground">
            {admin ? "Semua listing kumpulan." : "Listing anda."}{" "}
            {listings.length} buah.
          </p>
        </div>
        <Button asChild className="hidden sm:flex">
          <Link href="/listings/new">
            <PlusCircle className="h-4 w-4" /> Add Listing
          </Link>
        </Button>
      </div>

      <ListingsToolbar />

      {listings.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Tiada listing dijumpai"
          description="Cipta listing pertama anda atau laraskan penapis."
          action={
            <Button asChild>
              <Link href="/listings/new">
                <PlusCircle className="h-4 w-4" /> Add Listing
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing, i) => (
            <ListingCard key={listing.id} listing={listing} index={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
