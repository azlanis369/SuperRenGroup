// Hand-maintained Supabase schema types for Super Ren Group.
// Keep in sync with supabase/migrations.

import type {
  ListingCategory,
  ListingStatus,
  PropertyType,
  Tenure,
  Furnishing,
  Visibility,
  Role,
  UserStatus,
  LeadSource,
  LeadStatus,
  ShareChannel,
} from "@/lib/constants";

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export type UserRow = {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  created_at: string;
  last_login_at: string | null;
};

export type AgentProfileRow = {
  id: string;
  user_id: string;
  full_name: string;
  display_name: string | null;
  slug: string;
  profile_photo_url: string | null;
  ren_number: string | null;
  agency_name: string | null;
  title: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  bio: string | null;
  service_areas: string[];
  specialization: string[];
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  website_url: string | null;
  telegram_username: string | null;
  qr_code_url: string | null;
  is_profile_public: boolean;
  is_demo: boolean;
} & Timestamps;

export type ListingRow = {
  id: string;
  agent_id: string;
  category: ListingCategory;
  title: string;
  slug: string;
  property_type: PropertyType;
  area: string;
  address_private: string | null;
  address_public: string | null;
  show_exact_address: boolean;
  map_url: string | null;
  price: number | null;
  price_display: string | null;
  tenure: Tenure | null;
  built_up_sqft: number | null;
  land_area_sqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  carparks: number | null;
  furnishing: Furnishing | null;
  description: string | null;
  top_selling_points: string[];
  facilities: string[];
  amenities: string[];
  nearby: string[];
  tags: string[];
  status: ListingStatus;
  visibility: Visibility;
  featured: boolean;
  show_agent_phone: boolean;
  enable_whatsapp_cta: boolean;
  enable_telegram_share: boolean;
  hero_image_url: string | null;
  internal_notes: string | null;
  views_count: number;
  shares_count: number;
  leads_count: number;
  is_demo: boolean;
  deleted_at: string | null;
  published_at: string | null;
} & Timestamps;

export type ListingProjectDetailRow = {
  id: string;
  listing_id: string;
  project_name: string | null;
  developer: string | null;
  completion_year: string | null;
  project_status: string | null;
  unit_types: string | null;
  starting_price: number | null;
  maintenance_fee: number | null;
  package_info: string | null;
  booking_fee: number | null;
  sales_gallery_link: string | null;
  brochure_url: string | null;
};

export type ListingSubsaleDetailRow = {
  id: string;
  listing_id: string;
  asking_price: number | null;
  valuation_estimate: number | null;
  occupancy_status: string | null;
  maintenance_fee: number | null;
  renovation_info: string | null;
  facing_direction: string | null;
  title_type: string | null;
  viewing_availability: string | null;
  co_broke_allowed: boolean | null;
  private_commission_notes: string | null;
};

export type ListingRentalDetailRow = {
  id: string;
  listing_id: string;
  monthly_rental: number | null;
  deposit_requirement: string | null;
  minimum_tenancy: string | null;
  move_in_date: string | null;
  tenant_preference: string | null;
  pet_allowed: boolean | null;
  cooking_allowed: boolean | null;
  parking_included: boolean | null;
  utilities_info: string | null;
};

export type ListingMediaRow = {
  id: string;
  listing_id: string;
  media_type: "image" | "video";
  url: string;
  thumbnail_url: string | null;
  caption: string | null;
  sort_order: number;
  file_size: number | null;
  is_demo: boolean;
  created_at: string;
};

export type ShareRow = {
  id: string;
  listing_id: string;
  agent_id: string;
  channel: ShareChannel;
  shared_at: string;
  visitor_token: string | null;
  metadata: Record<string, unknown> | null;
  is_demo: boolean;
};

export type LeadRow = {
  id: string;
  listing_id: string | null;
  agent_id: string;
  name: string;
  phone: string;
  email: string | null;
  source: LeadSource;
  budget: string | null;
  preferred_area: string | null;
  notes: string | null;
  status: LeadStatus;
  is_demo: boolean;
} & Timestamps;

export type DealRow = {
  id: string;
  listing_id: string;
  agent_id: string;
  lead_id: string | null;
  deal_type: "sale" | "rental";
  booking_date: string | null;
  closed_date: string | null;
  sold_price: number | null;
  rental_price: number | null;
  commission_amount: number | null;
  commission_percentage: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  payment_status: string | null;
  deal_status: "booked" | "processing" | "closed" | "cancelled";
  remarks: string | null;
  is_demo: boolean;
} & Timestamps;

export type ListingStatusHistoryRow = {
  id: string;
  listing_id: string;
  old_status: ListingStatus | null;
  new_status: ListingStatus;
  changed_by: string | null;
  changed_at: string;
  notes: string | null;
  is_demo: boolean;
};

export type AuditLogRow = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type TableShape<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      users: TableShape<UserRow>;
      agent_profiles: TableShape<AgentProfileRow>;
      listings: TableShape<ListingRow>;
      listing_project_details: TableShape<ListingProjectDetailRow>;
      listing_subsale_details: TableShape<ListingSubsaleDetailRow>;
      listing_rental_details: TableShape<ListingRentalDetailRow>;
      listing_media: TableShape<ListingMediaRow>;
      shares: TableShape<ShareRow>;
      leads: TableShape<LeadRow>;
      deals: TableShape<DealRow>;
      listing_status_history: TableShape<ListingStatusHistoryRow>;
      audit_logs: TableShape<AuditLogRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
