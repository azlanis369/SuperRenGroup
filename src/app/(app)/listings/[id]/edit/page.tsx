import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireOnboardedUser } from "@/lib/auth";
import { getListingForEdit } from "@/lib/data/listings";
import { ListingForm } from "@/components/listings/listing-form";
import type { ListingFormValues } from "@/lib/validations/listing";
import type { MediaItem } from "@/components/listings/media-uploader";

export const metadata: Metadata = { title: "Edit Listing" };

function num(v: unknown): number | null {
  return v === null || v === undefined ? null : Number(v);
}

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOnboardedUser();
  const { id } = await params;
  const data = await getListingForEdit(id);
  if (!data) notFound();
  const { listing, media, project, subsale, rental } = data;

  const defaults: Partial<ListingFormValues> = {
    category: listing.category,
    title: listing.title,
    property_type: listing.property_type,
    area: listing.area,
    address_private: listing.address_private ?? "",
    address_public: listing.address_public ?? "",
    show_exact_address: listing.show_exact_address,
    map_url: listing.map_url ?? "",
    price: num(listing.price),
    price_display: listing.price_display ?? "",
    tenure: listing.tenure ?? undefined,
    built_up_sqft: num(listing.built_up_sqft),
    land_area_sqft: num(listing.land_area_sqft),
    bedrooms: num(listing.bedrooms),
    bathrooms: num(listing.bathrooms),
    carparks: num(listing.carparks),
    furnishing: listing.furnishing ?? undefined,
    description: listing.description ?? "",
    top_selling_points: listing.top_selling_points ?? [],
    facilities: listing.facilities ?? [],
    amenities: listing.amenities ?? [],
    nearby: listing.nearby ?? [],
    tags: listing.tags ?? [],
    status: listing.status,
    visibility: listing.visibility,
    featured: listing.featured,
    show_agent_phone: listing.show_agent_phone,
    enable_whatsapp_cta: listing.enable_whatsapp_cta,
    enable_telegram_share: listing.enable_telegram_share,
    internal_notes: listing.internal_notes ?? "",
    project: project
      ? {
          project_name: project.project_name ?? "",
          developer: project.developer ?? "",
          completion_year: project.completion_year ?? "",
          project_status: project.project_status ?? "",
          unit_types: project.unit_types ?? "",
          starting_price: num(project.starting_price),
          maintenance_fee: num(project.maintenance_fee),
          package_info: project.package_info ?? "",
          booking_fee: num(project.booking_fee),
          sales_gallery_link: project.sales_gallery_link ?? "",
          brochure_url: project.brochure_url ?? "",
        }
      : undefined,
    subsale: subsale
      ? {
          asking_price: num(subsale.asking_price),
          valuation_estimate: num(subsale.valuation_estimate),
          occupancy_status: subsale.occupancy_status ?? "",
          maintenance_fee: num(subsale.maintenance_fee),
          renovation_info: subsale.renovation_info ?? "",
          facing_direction: subsale.facing_direction ?? "",
          title_type: subsale.title_type ?? "",
          viewing_availability: subsale.viewing_availability ?? "",
          co_broke_allowed: subsale.co_broke_allowed ?? null,
          private_commission_notes: subsale.private_commission_notes ?? "",
        }
      : undefined,
    rental: rental
      ? {
          monthly_rental: num(rental.monthly_rental),
          deposit_requirement: rental.deposit_requirement ?? "",
          minimum_tenancy: rental.minimum_tenancy ?? "",
          move_in_date: rental.move_in_date ?? "",
          tenant_preference: rental.tenant_preference ?? "",
          pet_allowed: rental.pet_allowed ?? null,
          cooking_allowed: rental.cooking_allowed ?? null,
          parking_included: rental.parking_included ?? null,
          utilities_info: rental.utilities_info ?? "",
        }
      : undefined,
  };

  const initialMedia: MediaItem[] = media.map((m) => ({
    id: m.id,
    url: m.url,
    media_type: m.media_type,
    caption: m.caption,
    file_size: m.file_size,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Listing</h1>
        <p className="text-muted-foreground">{listing.title}</p>
      </div>
      <ListingForm
        mode="edit"
        listingId={id}
        defaults={defaults}
        initialMedia={initialMedia}
      />
    </div>
  );
}
