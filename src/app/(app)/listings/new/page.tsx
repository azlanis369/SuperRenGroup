import type { Metadata } from "next";
import { requireOnboardedUser } from "@/lib/auth";
import { ListingForm } from "@/components/listings/listing-form";

export const metadata: Metadata = { title: "Add Listing" };

export default async function NewListingPage() {
  await requireOnboardedUser();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Listing</h1>
        <p className="text-muted-foreground">
          Isi maklumat hartanah langkah demi langkah.
        </p>
      </div>
      <ListingForm mode="create" />
    </div>
  );
}
