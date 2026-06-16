"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { listingSchema, type ListingFormValues } from "@/lib/validations/listing";
import { uniqueSlug } from "@/lib/utils";
import type { ListingStatus } from "@/lib/constants";
import { LOCAL_DEMO } from "@/lib/demo-mode";
import {
  demoAddListing,
  demoUpdateListing,
  demoSetStatus,
  demoDeleteListing,
} from "@/lib/demo-data/queries";
import type { ListingRow } from "@/lib/database.types";

/** Build a ListingRow from validated form values for the in-memory demo. */
function demoListingRow(
  v: ListingFormValues,
  agentId: string,
  slug: string,
  hero: string | null,
): Omit<ListingRow, "id"> {
  const now = new Date().toISOString();
  return {
    agent_id: agentId,
    category: v.category,
    title: v.title,
    slug,
    property_type: v.property_type,
    area: v.area,
    address_private: v.address_private || null,
    address_public: v.address_public || null,
    show_exact_address: v.show_exact_address,
    map_url: v.map_url || null,
    price: v.price ?? null,
    price_display: v.price_display || null,
    tenure: v.tenure ?? null,
    built_up_sqft: v.built_up_sqft ?? null,
    land_area_sqft: v.land_area_sqft ?? null,
    bedrooms: v.bedrooms ?? null,
    bathrooms: v.bathrooms ?? null,
    carparks: v.carparks ?? null,
    furnishing: v.furnishing ?? null,
    description: v.description || null,
    top_selling_points: v.top_selling_points,
    facilities: v.facilities,
    amenities: v.amenities,
    nearby: v.nearby,
    tags: v.tags,
    status: v.status,
    visibility: v.visibility,
    featured: v.featured,
    show_agent_phone: v.show_agent_phone,
    enable_whatsapp_cta: v.enable_whatsapp_cta,
    enable_telegram_share: v.enable_telegram_share,
    hero_image_url: hero,
    internal_notes: v.internal_notes || null,
    views_count: 0,
    shares_count: 0,
    leads_count: 0,
    is_demo: true,
    deleted_at: null,
    created_at: now,
    updated_at: now,
    published_at: v.status !== "draft" ? now : null,
  };
}

export type ListingActionResult =
  | { ok: true; id: string; slug: string }
  | { ok: false; error: string };

type MediaInput = {
  url: string;
  thumbnail_url?: string | null;
  media_type?: "image" | "video";
  caption?: string | null;
  file_size?: number | null;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Insert (or upsert) the category-specific detail row using literal table names. */
async function saveDetail(
  supabase: SupabaseServerClient,
  category: string,
  listingId: string,
  values: ListingFormValues,
  upsert: boolean,
) {
  const onConflict = { onConflict: "listing_id" } as const;
  if (category === "project" && values.project) {
    const row = { listing_id: listingId, ...values.project };
    return upsert
      ? supabase.from("listing_project_details").upsert(row, onConflict)
      : supabase.from("listing_project_details").insert(row);
  }
  if (category === "subsale" && values.subsale) {
    const row = { listing_id: listingId, ...values.subsale };
    return upsert
      ? supabase.from("listing_subsale_details").upsert(row, onConflict)
      : supabase.from("listing_subsale_details").insert(row);
  }
  if (category === "rental" && values.rental) {
    const row = { listing_id: listingId, ...values.rental };
    return upsert
      ? supabase.from("listing_rental_details").upsert(row, onConflict)
      : supabase.from("listing_rental_details").insert(row);
  }
  return null;
}

/** Create a listing (with category detail + media) owned by the current user. */
export async function createListing(
  input: unknown,
  media: MediaInput[] = [],
): Promise<ListingActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Tidak dibenarkan." };

  const parsed = listingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Data tidak sah." };
  }
  const v = parsed.data;
  const slug = uniqueSlug(v.title);
  const heroFromMedia = media.find((m) => m.media_type !== "video")?.url ?? null;

  if (LOCAL_DEMO) {
    const row = demoAddListing(
      demoListingRow(v, user.id, slug, heroFromMedia),
      media.map((m, i) => ({
        media_type: m.media_type ?? "image",
        url: m.url,
        thumbnail_url: m.thumbnail_url ?? null,
        caption: m.caption ?? null,
        sort_order: i,
        file_size: m.file_size ?? null,
        is_demo: true,
      })),
    );
    revalidatePath("/listings");
    revalidatePath("/dashboard");
    return { ok: true, id: row.id, slug: row.slug };
  }

  const supabase = await createClient();

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      agent_id: user.id,
      category: v.category,
      title: v.title,
      slug,
      property_type: v.property_type,
      area: v.area,
      address_private: v.address_private || null,
      address_public: v.address_public || null,
      show_exact_address: v.show_exact_address,
      map_url: v.map_url || null,
      price: v.price ?? null,
      price_display: v.price_display || null,
      tenure: v.tenure ?? null,
      built_up_sqft: v.built_up_sqft ?? null,
      land_area_sqft: v.land_area_sqft ?? null,
      bedrooms: v.bedrooms ?? null,
      bathrooms: v.bathrooms ?? null,
      carparks: v.carparks ?? null,
      furnishing: v.furnishing ?? null,
      description: v.description || null,
      top_selling_points: v.top_selling_points,
      facilities: v.facilities,
      amenities: v.amenities,
      nearby: v.nearby,
      tags: v.tags,
      status: v.status,
      visibility: v.visibility,
      featured: v.featured,
      show_agent_phone: v.show_agent_phone,
      enable_whatsapp_cta: v.enable_whatsapp_cta,
      enable_telegram_share: v.enable_telegram_share,
      internal_notes: v.internal_notes || null,
      hero_image_url: heroFromMedia,
      published_at: v.status !== "draft" ? new Date().toISOString() : null,
    })
    .select("id, slug")
    .single();

  if (error || !listing) {
    return { ok: false, error: "Gagal mencipta listing. Cuba lagi." };
  }

  // Category detail row
  await saveDetail(supabase, v.category, listing.id, v, false);

  // Media rows
  if (media.length) {
    await supabase.from("listing_media").insert(
      media.map((m, i) => ({
        listing_id: listing.id,
        media_type: m.media_type ?? "image",
        url: m.url,
        thumbnail_url: m.thumbnail_url ?? null,
        caption: m.caption ?? null,
        sort_order: i,
        file_size: m.file_size ?? null,
      })),
    );
  }

  await supabase.from("listing_status_history").insert({
    listing_id: listing.id,
    old_status: null,
    new_status: v.status,
    changed_by: user.id,
  });

  revalidatePath("/listings");
  revalidatePath("/dashboard");
  return { ok: true, id: listing.id, slug: listing.slug };
}

/** Update an existing listing (owner/admin via RLS). */
export async function updateListing(
  id: string,
  input: unknown,
  media: MediaInput[] | null = null,
): Promise<ListingActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Tidak dibenarkan." };

  const parsed = listingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Data tidak sah." };
  }
  const v = parsed.data;
  const heroFromMedia = media?.find((m) => m.media_type !== "video")?.url;

  if (LOCAL_DEMO) {
    demoUpdateListing(id, {
      category: v.category,
      title: v.title,
      property_type: v.property_type,
      area: v.area,
      price: v.price ?? null,
      price_display: v.price_display || null,
      status: v.status,
      visibility: v.visibility,
      featured: v.featured,
      description: v.description || null,
      top_selling_points: v.top_selling_points,
      ...(heroFromMedia ? { hero_image_url: heroFromMedia } : {}),
    });
    revalidatePath("/listings");
    revalidatePath(`/listings/${id}`);
    revalidatePath("/dashboard");
    return { ok: true, id, slug: id };
  }

  const supabase = await createClient();

  const { data: listing, error } = await supabase
    .from("listings")
    .update({
      category: v.category,
      title: v.title,
      property_type: v.property_type,
      area: v.area,
      address_private: v.address_private || null,
      address_public: v.address_public || null,
      show_exact_address: v.show_exact_address,
      map_url: v.map_url || null,
      price: v.price ?? null,
      price_display: v.price_display || null,
      tenure: v.tenure ?? null,
      built_up_sqft: v.built_up_sqft ?? null,
      land_area_sqft: v.land_area_sqft ?? null,
      bedrooms: v.bedrooms ?? null,
      bathrooms: v.bathrooms ?? null,
      carparks: v.carparks ?? null,
      furnishing: v.furnishing ?? null,
      description: v.description || null,
      top_selling_points: v.top_selling_points,
      facilities: v.facilities,
      amenities: v.amenities,
      nearby: v.nearby,
      tags: v.tags,
      status: v.status,
      visibility: v.visibility,
      featured: v.featured,
      show_agent_phone: v.show_agent_phone,
      enable_whatsapp_cta: v.enable_whatsapp_cta,
      enable_telegram_share: v.enable_telegram_share,
      internal_notes: v.internal_notes || null,
      ...(heroFromMedia ? { hero_image_url: heroFromMedia } : {}),
    })
    .eq("id", id)
    .select("id, slug")
    .single();

  if (error || !listing) {
    return { ok: false, error: "Gagal mengemas kini listing." };
  }

  await saveDetail(supabase, v.category, id, v, true);

  if (media) {
    await supabase.from("listing_media").delete().eq("listing_id", id);
    if (media.length) {
      await supabase.from("listing_media").insert(
        media.map((m, i) => ({
          listing_id: id,
          media_type: m.media_type ?? "image",
          url: m.url,
          thumbnail_url: m.thumbnail_url ?? null,
          caption: m.caption ?? null,
          sort_order: i,
          file_size: m.file_size ?? null,
        })),
      );
    }
  }

  revalidatePath("/listings");
  revalidatePath(`/listings/${id}`);
  revalidatePath("/dashboard");
  return { ok: true, id: listing.id, slug: listing.slug };
}

/** Change only the status of a listing and log it. */
export async function updateListingStatus(
  id: string,
  status: ListingStatus,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Tidak dibenarkan." };

  if (LOCAL_DEMO) {
    demoSetStatus(id, status);
    revalidatePath("/listings");
    revalidatePath(`/listings/${id}`);
    revalidatePath("/dashboard");
    return { ok: true };
  }

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("listings")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("listings")
    .update({
      status,
      ...(status !== "draft" ? { published_at: new Date().toISOString() } : {}),
    })
    .eq("id", id);
  if (error) return { ok: false, error: "Gagal mengemas kini status." };

  await supabase.from("listing_status_history").insert({
    listing_id: id,
    old_status: current?.status ?? null,
    new_status: status,
    changed_by: user.id,
  });

  revalidatePath("/listings");
  revalidatePath(`/listings/${id}`);
  return { ok: true };
}

/** Soft-delete a listing. */
export async function deleteListing(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Tidak dibenarkan." };

  if (LOCAL_DEMO) {
    demoDeleteListing(id);
    revalidatePath("/listings");
    return { ok: true };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("listings")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: "Gagal memadam listing." };
  revalidatePath("/listings");
  return { ok: true };
}
