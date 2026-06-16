import { z } from "zod";
import {
  LISTING_CATEGORIES,
  PROPERTY_TYPES,
  TENURES,
  FURNISHINGS,
  VISIBILITIES,
  LISTING_STATUSES,
} from "@/lib/constants";

const optionalNumber = z
  .union([z.number(), z.string()])
  .transform((v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = typeof v === "string" ? Number(v.replace(/,/g, "")) : v;
    return Number.isNaN(n) ? null : n;
  })
  .nullable()
  .optional();

const optionalString = z.string().trim().max(2000).optional().or(z.literal(""));

// Step 1 — Basic info
export const listingBasicSchema = z.object({
  category: z.enum(LISTING_CATEGORIES, {
    required_error: "Pilih kategori listing",
  }),
  title: z.string().trim().min(4, "Tajuk diperlukan").max(160),
  property_type: z.enum(PROPERTY_TYPES, {
    required_error: "Pilih jenis hartanah",
  }),
  area: z.string().trim().min(2, "Kawasan diperlukan").max(120),
  address_private: optionalString,
  address_public: optionalString,
  show_exact_address: z.boolean().default(false),
  map_url: z.string().trim().url("URL peta tidak sah").or(z.literal("")).optional(),
  price: optionalNumber,
  price_display: z.string().trim().max(80).optional().or(z.literal("")),
  tenure: z.enum(TENURES).optional().nullable(),
  built_up_sqft: optionalNumber,
  land_area_sqft: optionalNumber,
  bedrooms: optionalNumber,
  bathrooms: optionalNumber,
  carparks: optionalNumber,
  furnishing: z.enum(FURNISHINGS).optional().nullable(),
});

// Step 2 — Category specific (all optional; relevance enforced in UI)
export const listingProjectSchema = z.object({
  project_name: optionalString,
  developer: optionalString,
  completion_year: z.string().trim().max(40).optional().or(z.literal("")),
  project_status: optionalString,
  unit_types: optionalString,
  starting_price: optionalNumber,
  maintenance_fee: optionalNumber,
  package_info: optionalString,
  booking_fee: optionalNumber,
  sales_gallery_link: z.string().trim().url().or(z.literal("")).optional(),
  brochure_url: z.string().trim().url().or(z.literal("")).optional(),
});

export const listingSubsaleSchema = z.object({
  asking_price: optionalNumber,
  valuation_estimate: optionalNumber,
  occupancy_status: optionalString,
  maintenance_fee: optionalNumber,
  renovation_info: optionalString,
  facing_direction: optionalString,
  title_type: optionalString,
  viewing_availability: optionalString,
  co_broke_allowed: z.boolean().optional().nullable(),
  private_commission_notes: optionalString,
});

export const listingRentalSchema = z.object({
  monthly_rental: optionalNumber,
  deposit_requirement: optionalString,
  minimum_tenancy: optionalString,
  move_in_date: z.string().trim().optional().or(z.literal("")),
  tenant_preference: optionalString,
  pet_allowed: z.boolean().optional().nullable(),
  cooking_allowed: z.boolean().optional().nullable(),
  parking_included: z.boolean().optional().nullable(),
  utilities_info: optionalString,
});

// Step 3 — Features & selling points
export const listingFeaturesSchema = z.object({
  facilities: z.array(z.string().trim().min(1)).max(40).default([]),
  amenities: z.array(z.string().trim().min(1)).max(40).default([]),
  nearby: z.array(z.string().trim().min(1)).max(40).default([]),
  top_selling_points: z
    .array(z.string().trim().min(1))
    .max(5, "Maksimum 5 selling points")
    .default([]),
  tags: z.array(z.string().trim().min(1)).max(20).default([]),
  description: optionalString,
  internal_notes: optionalString,
});

// Step 5 — Publish settings
export const listingPublishSchema = z.object({
  status: z.enum(LISTING_STATUSES).default("draft"),
  visibility: z.enum(VISIBILITIES).default("private"),
  show_exact_address: z.boolean().default(false),
  show_agent_phone: z.boolean().default(true),
  enable_whatsapp_cta: z.boolean().default(true),
  enable_telegram_share: z.boolean().default(true),
  featured: z.boolean().default(false),
});

// Full listing payload (server action input)
export const listingSchema = listingBasicSchema
  .merge(listingFeaturesSchema)
  .merge(listingPublishSchema)
  .merge(
    z.object({
      project: listingProjectSchema.optional(),
      subsale: listingSubsaleSchema.optional(),
      rental: listingRentalSchema.optional(),
    }),
  );

export type ListingBasicValues = z.infer<typeof listingBasicSchema>;
export type ListingFeaturesValues = z.infer<typeof listingFeaturesSchema>;
export type ListingPublishValues = z.infer<typeof listingPublishSchema>;
export type ListingFormValues = z.infer<typeof listingSchema>;
