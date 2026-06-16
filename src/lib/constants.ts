// Central domain constants for Super Ren Group.

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  AGENT: "agent",
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export const USER_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  DEACTIVATED: "deactivated",
} as const;
export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export const LISTING_CATEGORIES = ["project", "subsale", "rental"] as const;
export type ListingCategory = (typeof LISTING_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ListingCategory, string> = {
  project: "Project",
  subsale: "Subsale",
  rental: "Rental",
};

export const PROPERTY_TYPES = [
  "condo",
  "apartment",
  "terrace",
  "semi_d",
  "bungalow",
  "shop",
  "office",
  "land",
  "other",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  condo: "Condo",
  apartment: "Apartment",
  terrace: "Terrace",
  semi_d: "Semi-D",
  bungalow: "Bungalow",
  shop: "Shop",
  office: "Office",
  land: "Land",
  other: "Other",
};

export const TENURES = [
  "freehold",
  "leasehold",
  "malay_reserve",
  "other",
] as const;
export type Tenure = (typeof TENURES)[number];

export const TENURE_LABELS: Record<Tenure, string> = {
  freehold: "Freehold",
  leasehold: "Leasehold",
  malay_reserve: "Malay Reserve",
  other: "Other",
};

export const FURNISHINGS = [
  "unfurnished",
  "partly_furnished",
  "fully_furnished",
] as const;
export type Furnishing = (typeof FURNISHINGS)[number];

export const FURNISHING_LABELS: Record<Furnishing, string> = {
  unfurnished: "Unfurnished",
  partly_furnished: "Partly Furnished",
  fully_furnished: "Fully Furnished",
};

export const LISTING_STATUSES = [
  "draft",
  "available",
  "interested",
  "viewing_scheduled",
  "booked",
  "loan_in_progress",
  "spa_in_progress",
  "sold",
  "rented",
  "withdrawn",
  "expired",
  "failed",
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  draft: "Draft",
  available: "Available",
  interested: "Interested",
  viewing_scheduled: "Viewing Scheduled",
  booked: "Booked",
  loan_in_progress: "Loan In Progress",
  spa_in_progress: "SPA / Tenancy In Progress",
  sold: "Sold",
  rented: "Rented",
  withdrawn: "Withdrawn",
  expired: "Expired",
  failed: "Failed",
};

/** Tailwind tone per status, used for badges. */
export const LISTING_STATUS_TONE: Record<
  ListingStatus,
  "neutral" | "info" | "warning" | "success" | "danger" | "gold"
> = {
  draft: "neutral",
  available: "success",
  interested: "info",
  viewing_scheduled: "info",
  booked: "gold",
  loan_in_progress: "warning",
  spa_in_progress: "warning",
  sold: "success",
  rented: "success",
  withdrawn: "danger",
  expired: "danger",
  failed: "danger",
};

/** Statuses that count as a closed (won) deal. */
export const CLOSED_STATUSES: ListingStatus[] = ["sold", "rented"];

export const VISIBILITIES = ["private", "public", "team"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  private: "Private only",
  public: "Public link",
  team: "Team only",
};

export const SPECIALIZATIONS = [
  "project",
  "subsale",
  "rental",
  "commercial",
  "land",
] as const;
export type Specialization = (typeof SPECIALIZATIONS)[number];

export const LEAD_SOURCES = [
  "whatsapp",
  "public_form",
  "manual",
  "telegram",
  "referral",
  "walk_in",
  "facebook",
  "tiktok",
  "instagram",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "viewing",
  "negotiating",
  "booked",
  "closed",
  "lost",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const SHARE_CHANNELS = [
  "whatsapp",
  "telegram",
  "copy_link",
  "website",
] as const;
export type ShareChannel = (typeof SHARE_CHANNELS)[number];

export const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "listing-media";

export const MEDIA_LIMITS = {
  maxPhotos: 10,
  maxVideos: 1,
  maxPhotoBytes: 2 * 1024 * 1024, // 2MB after compression
  maxVideoBytes: 100 * 1024 * 1024, // 100MB
  acceptedImageTypes: ["image/jpeg", "image/png", "image/webp"],
  acceptedVideoTypes: ["video/mp4", "video/quicktime", "video/webm"],
};
