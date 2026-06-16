-- ============================================================================
-- Super Ren Group — Phase 1 schema
-- Postgres / Supabase. Run via Supabase SQL editor or CLI migration.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('super_admin', 'admin', 'agent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_status as enum ('pending', 'active', 'deactivated');
exception when duplicate_object then null; end $$;

do $$ begin
  create type listing_category as enum ('project', 'subsale', 'rental');
exception when duplicate_object then null; end $$;

do $$ begin
  create type listing_status as enum (
    'draft','available','interested','viewing_scheduled','booked',
    'loan_in_progress','spa_in_progress','sold','rented',
    'withdrawn','expired','failed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type listing_visibility as enum ('private','public','team');
exception when duplicate_object then null; end $$;

do $$ begin
  create type media_type as enum ('image','video');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lead_status as enum ('new','contacted','viewing','negotiating','booked','closed','lost');
exception when duplicate_object then null; end $$;

do $$ begin
  create type deal_type as enum ('sale','rental');
exception when duplicate_object then null; end $$;

do $$ begin
  create type deal_status as enum ('booked','processing','closed','cancelled');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- App-level user record (mirrors auth.users id)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role user_role not null default 'agent',
  status user_status not null default 'pending',
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists public.agent_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  full_name text not null default '',
  display_name text,
  slug text not null unique,
  profile_photo_url text,
  ren_number text,
  agency_name text,
  title text,
  phone text,
  whatsapp text,
  email text,
  bio text,
  service_areas text[] not null default '{}',
  specialization text[] not null default '{}',
  facebook_url text,
  instagram_url text,
  tiktok_url text,
  website_url text,
  telegram_username text,
  qr_code_url text,
  is_profile_public boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.users(id) on delete cascade,
  category listing_category not null,
  title text not null,
  slug text not null unique,
  property_type text not null,
  area text not null,
  address_private text,
  address_public text,
  show_exact_address boolean not null default false,
  map_url text,
  price numeric,
  price_display text,
  tenure text,
  built_up_sqft numeric,
  land_area_sqft numeric,
  bedrooms numeric,
  bathrooms numeric,
  carparks numeric,
  furnishing text,
  description text,
  top_selling_points text[] not null default '{}',
  facilities text[] not null default '{}',
  amenities text[] not null default '{}',
  nearby text[] not null default '{}',
  tags text[] not null default '{}',
  status listing_status not null default 'draft',
  visibility listing_visibility not null default 'private',
  featured boolean not null default false,
  show_agent_phone boolean not null default true,
  enable_whatsapp_cta boolean not null default true,
  enable_telegram_share boolean not null default true,
  hero_image_url text,
  internal_notes text,
  views_count integer not null default 0,
  shares_count integer not null default 0,
  leads_count integer not null default 0,
  is_demo boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.listing_project_details (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null unique references public.listings(id) on delete cascade,
  project_name text,
  developer text,
  completion_year text,
  project_status text,
  unit_types text,
  starting_price numeric,
  maintenance_fee numeric,
  package_info text,
  booking_fee numeric,
  sales_gallery_link text,
  brochure_url text
);

create table if not exists public.listing_subsale_details (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null unique references public.listings(id) on delete cascade,
  asking_price numeric,
  valuation_estimate numeric,
  occupancy_status text,
  maintenance_fee numeric,
  renovation_info text,
  facing_direction text,
  title_type text,
  viewing_availability text,
  co_broke_allowed boolean,
  private_commission_notes text
);

create table if not exists public.listing_rental_details (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null unique references public.listings(id) on delete cascade,
  monthly_rental numeric,
  deposit_requirement text,
  minimum_tenancy text,
  move_in_date text,
  tenant_preference text,
  pet_allowed boolean,
  cooking_allowed boolean,
  parking_included boolean,
  utilities_info text
);

create table if not exists public.listing_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  media_type media_type not null default 'image',
  url text not null,
  thumbnail_url text,
  caption text,
  sort_order integer not null default 0,
  file_size bigint,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.shares (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  agent_id uuid not null references public.users(id) on delete cascade,
  channel text not null,
  shared_at timestamptz not null default now(),
  visitor_token text,
  metadata jsonb,
  is_demo boolean not null default false
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  agent_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  source text not null default 'manual',
  budget text,
  preferred_area text,
  notes text,
  status lead_status not null default 'new',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  agent_id uuid not null references public.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  deal_type deal_type not null,
  booking_date date,
  closed_date date,
  sold_price numeric,
  rental_price numeric,
  commission_amount numeric,
  commission_percentage numeric,
  customer_name text,
  customer_phone text,
  payment_status text,
  deal_status deal_status not null default 'booked',
  remarks text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_status_history (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  old_status listing_status,
  new_status listing_status not null,
  changed_by uuid references public.users(id) on delete set null,
  changed_at timestamptz not null default now(),
  notes text,
  is_demo boolean not null default false
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes (per performance requirements)
-- ---------------------------------------------------------------------------
create index if not exists idx_listings_agent on public.listings(agent_id);
create index if not exists idx_listings_status on public.listings(status);
create index if not exists idx_listings_category on public.listings(category);
create index if not exists idx_listings_area on public.listings(area);
create index if not exists idx_listings_created on public.listings(created_at);
create index if not exists idx_listings_visibility on public.listings(visibility);
create index if not exists idx_media_listing on public.listing_media(listing_id);
create index if not exists idx_shares_listing on public.shares(listing_id);
create index if not exists idx_shares_agent on public.shares(agent_id);
create index if not exists idx_leads_agent on public.leads(agent_id);
create index if not exists idx_leads_listing on public.leads(listing_id);
create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_deals_agent on public.deals(agent_id);
create index if not exists idx_deals_listing on public.deals(listing_id);
create index if not exists idx_deals_status on public.deals(deal_status);
create index if not exists idx_profiles_slug on public.agent_profiles(slug);

-- ---------------------------------------------------------------------------
-- Helper functions for RLS
-- ---------------------------------------------------------------------------
create or replace function public.current_app_role()
returns user_role
language sql stable security definer set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.is_app_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select role in ('admin','super_admin') from public.users where id = auth.uid()),
    false
  );
$$;

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_profiles_updated on public.agent_profiles;
create trigger trg_profiles_updated before update on public.agent_profiles
  for each row execute function public.set_updated_at();
drop trigger if exists trg_listings_updated on public.listings;
create trigger trg_listings_updated before update on public.listings
  for each row execute function public.set_updated_at();
drop trigger if exists trg_leads_updated on public.leads;
create trigger trg_leads_updated before update on public.leads
  for each row execute function public.set_updated_at();
drop trigger if exists trg_deals_updated on public.deals;
create trigger trg_deals_updated before update on public.deals
  for each row execute function public.set_updated_at();

-- Auto-create app user + empty profile when an auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  base_slug text;
begin
  insert into public.users (id, email, role, status)
  values (new.id, new.email, 'agent', 'pending')
  on conflict (id) do nothing;

  base_slug := 'agent-' || substr(new.id::text, 1, 8);
  insert into public.agent_profiles (user_id, full_name, email, slug)
  values (new.id, '', new.email, base_slug)
  on conflict (user_id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.agent_profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_project_details enable row level security;
alter table public.listing_subsale_details enable row level security;
alter table public.listing_rental_details enable row level security;
alter table public.listing_media enable row level security;
alter table public.shares enable row level security;
alter table public.leads enable row level security;
alter table public.deals enable row level security;
alter table public.listing_status_history enable row level security;
alter table public.audit_logs enable row level security;

-- users: self read; admin read all; self can update last_login
drop policy if exists users_self_read on public.users;
create policy users_self_read on public.users for select
  using (id = auth.uid() or public.is_app_admin());
drop policy if exists users_self_update on public.users;
create policy users_self_update on public.users for update
  using (id = auth.uid() or public.is_app_admin());

-- agent_profiles: public can read public profiles; owner & admin full
drop policy if exists profiles_public_read on public.agent_profiles;
create policy profiles_public_read on public.agent_profiles for select
  using (is_profile_public = true or user_id = auth.uid() or public.is_app_admin());
drop policy if exists profiles_owner_write on public.agent_profiles;
create policy profiles_owner_write on public.agent_profiles for update
  using (user_id = auth.uid() or public.is_app_admin());
drop policy if exists profiles_owner_insert on public.agent_profiles;
create policy profiles_owner_insert on public.agent_profiles for insert
  with check (user_id = auth.uid() or public.is_app_admin());

-- listings: public can read public+non-draft; owner & admin full access
drop policy if exists listings_public_read on public.listings;
create policy listings_public_read on public.listings for select
  using (
    (visibility = 'public' and status <> 'draft' and deleted_at is null)
    or agent_id = auth.uid()
    or public.is_app_admin()
  );
drop policy if exists listings_owner_insert on public.listings;
create policy listings_owner_insert on public.listings for insert
  with check (agent_id = auth.uid() or public.is_app_admin());
drop policy if exists listings_owner_update on public.listings;
create policy listings_owner_update on public.listings for update
  using (agent_id = auth.uid() or public.is_app_admin());
drop policy if exists listings_owner_delete on public.listings;
create policy listings_owner_delete on public.listings for delete
  using (agent_id = auth.uid() or public.is_app_admin());

-- helper: can the current user see this listing row (detail tables follow listing)
create or replace function public.can_read_listing(l_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists(
    select 1 from public.listings l
    where l.id = l_id
      and (
        (l.visibility = 'public' and l.status <> 'draft' and l.deleted_at is null)
        or l.agent_id = auth.uid()
        or public.is_app_admin()
      )
  );
$$;

create or replace function public.owns_listing(l_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists(
    select 1 from public.listings l
    where l.id = l_id and (l.agent_id = auth.uid() or public.is_app_admin())
  );
$$;

-- detail tables: read follows listing read; write follows ownership
do $$
declare t text;
begin
  foreach t in array array['listing_project_details','listing_subsale_details','listing_rental_details'] loop
    execute format('drop policy if exists %1$s_read on public.%1$s', t);
    execute format('create policy %1$s_read on public.%1$s for select using (public.can_read_listing(listing_id))', t);
    execute format('drop policy if exists %1$s_write on public.%1$s', t);
    execute format('create policy %1$s_write on public.%1$s for all using (public.owns_listing(listing_id)) with check (public.owns_listing(listing_id))', t);
  end loop;
end $$;

-- subsale private commission notes are protected at the app layer (server only).

-- listing_media: read follows listing read; write follows ownership
drop policy if exists media_read on public.listing_media;
create policy media_read on public.listing_media for select
  using (public.can_read_listing(listing_id));
drop policy if exists media_write on public.listing_media;
create policy media_write on public.listing_media for all
  using (public.owns_listing(listing_id))
  with check (public.owns_listing(listing_id));

-- shares: anyone may insert a share (public tracking); owner+admin read
drop policy if exists shares_insert on public.shares;
create policy shares_insert on public.shares for insert with check (true);
drop policy if exists shares_read on public.shares;
create policy shares_read on public.shares for select
  using (agent_id = auth.uid() or public.is_app_admin());

-- leads: public can insert (inquiry form); owner+admin read/update
drop policy if exists leads_insert on public.leads;
create policy leads_insert on public.leads for insert with check (true);
drop policy if exists leads_read on public.leads;
create policy leads_read on public.leads for select
  using (agent_id = auth.uid() or public.is_app_admin());
drop policy if exists leads_update on public.leads;
create policy leads_update on public.leads for update
  using (agent_id = auth.uid() or public.is_app_admin());
drop policy if exists leads_delete on public.leads;
create policy leads_delete on public.leads for delete
  using (agent_id = auth.uid() or public.is_app_admin());

-- deals: owner+admin only (sensitive). Never public.
drop policy if exists deals_all on public.deals;
create policy deals_all on public.deals for all
  using (agent_id = auth.uid() or public.is_app_admin())
  with check (agent_id = auth.uid() or public.is_app_admin());

-- status history: owner+admin read; insert by owner
drop policy if exists history_read on public.listing_status_history;
create policy history_read on public.listing_status_history for select
  using (public.owns_listing(listing_id));
drop policy if exists history_insert on public.listing_status_history;
create policy history_insert on public.listing_status_history for insert
  with check (public.owns_listing(listing_id));

-- audit logs: admin read; any authenticated insert
drop policy if exists audit_read on public.audit_logs;
create policy audit_read on public.audit_logs for select
  using (public.is_app_admin());
drop policy if exists audit_insert on public.audit_logs;
create policy audit_insert on public.audit_logs for insert
  with check (auth.uid() is not null);
