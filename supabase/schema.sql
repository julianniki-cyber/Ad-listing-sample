-- =====================================================================
-- Doopido — Supabase schema
-- Paste this ENTIRE file into the Supabase SQL editor and run it. Every
-- statement is idempotent (guarded enum creation, `if not exists` on
-- tables/indexes, `drop ... if exists` before triggers/policies), so it
-- is safe to run on a fresh project AND safe to re-run on a project that
-- already has some or all of this applied (e.g. after adding a new
-- section further down the file, or after a partial failure).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- ENUM TYPES (guarded — CREATE TYPE has no IF NOT EXISTS)
-- ---------------------------------------------------------------------
do $$ begin
  create type public.listing_status as enum ('draft', 'published', 'sold', 'deleted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('created', 'paid', 'failed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- TABLE: profiles  (1:1 with auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- TABLE: categories  (editable via SQL, not hardcoded in app code)
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  icon        text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- TABLE: listings
-- ---------------------------------------------------------------------
create table if not exists public.listings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  category_id     uuid not null references public.categories(id) on delete restrict,
  title           text not null check (char_length(title) between 3 and 120),
  slug            text not null unique,
  description     text not null check (char_length(description) between 10 and 5000),
  price           numeric(12,2) not null check (price >= 0),
  location_city   text not null,
  location_state  text,
  status          public.listing_status not null default 'published',
  view_count      int not null default 0,
  search_vector   tsvector,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Keep full-text search vector current (title weighted higher than description).
create or replace function public.listings_search_vector_update()
returns trigger language plpgsql as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B');
  return new;
end;
$$;

drop trigger if exists trg_listings_search_vector on public.listings;
create trigger trg_listings_search_vector
  before insert or update of title, description on public.listings
  for each row execute function public.listings_search_vector_update();

-- generic updated_at helper, reused by several tables below
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_listings_updated_at on public.listings;
create trigger trg_listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- TABLE: listing_images  (up to 6 per listing, enforced by trigger below)
-- ---------------------------------------------------------------------
create table if not exists public.listing_images (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references public.listings(id) on delete cascade,
  storage_path text not null,          -- e.g. "{user_id}/{listing_id}/{filename}"
  url          text not null,          -- public storage URL, cached for fast reads
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

create or replace function public.enforce_max_listing_images()
returns trigger language plpgsql as $$
declare
  img_count int;
begin
  select count(*) into img_count
  from public.listing_images
  where listing_id = new.listing_id;

  if img_count >= 6 then
    raise exception 'A listing can have at most 6 images';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_max_listing_images on public.listing_images;
create trigger trg_enforce_max_listing_images
  before insert on public.listing_images
  for each row execute function public.enforce_max_listing_images();

-- ---------------------------------------------------------------------
-- TABLE: feature_plans  (tiers editable via SQL, no code change needed)
-- ---------------------------------------------------------------------
create table if not exists public.feature_plans (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  price_inr     numeric(10,2) not null check (price_inr >= 0),
  duration_days int not null check (duration_days > 0),
  is_active     boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- TABLE: payments  (Razorpay order/payment audit trail)
-- ---------------------------------------------------------------------
create table if not exists public.payments (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(id) on delete cascade,
  listing_id         uuid not null references public.listings(id) on delete cascade,
  feature_plan_id    uuid not null references public.feature_plans(id) on delete restrict,
  razorpay_order_id  text not null unique,
  razorpay_payment_id text,
  razorpay_signature  text,
  amount             numeric(10,2) not null,
  status             public.payment_status not null default 'created',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- TABLE: featured_listings  (write-only via server/service-role path;
-- kept separate from `listings` so a normal owner-update policy can
-- NEVER let a user grant themselves featured status)
-- ---------------------------------------------------------------------
create table if not exists public.featured_listings (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null unique references public.listings(id) on delete cascade,
  payment_id  uuid not null references public.payments(id) on delete restrict,
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz not null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------
create index if not exists idx_listings_user            on public.listings(user_id);
create index if not exists idx_listings_category        on public.listings(category_id);
create index if not exists idx_listings_status_created  on public.listings(status, created_at desc);
create index if not exists idx_listings_location_city   on public.listings(lower(location_city));
create index if not exists idx_listings_price           on public.listings(price);
create index if not exists idx_listings_search_vector   on public.listings using gin(search_vector);

create index if not exists idx_listing_images_listing   on public.listing_images(listing_id, sort_order);

create index if not exists idx_featured_listings_ends   on public.featured_listings(ends_at desc);

create index if not exists idx_payments_user            on public.payments(user_id);
create index if not exists idx_payments_listing         on public.payments(listing_id);

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.categories        enable row level security;
alter table public.listings          enable row level security;
alter table public.listing_images    enable row level security;
alter table public.feature_plans     enable row level security;
alter table public.payments          enable row level security;
alter table public.featured_listings enable row level security;

-- profiles: public read (needed to show seller name), owner-only write
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- categories: public read of active rows only; no client write policies at all
-- (admin edits happen via SQL editor / service role, which bypasses RLS)
drop policy if exists "Categories are viewable by everyone" on public.categories;
create policy "Categories are viewable by everyone"
  on public.categories for select using (is_active = true);

-- listings: anyone can read published ads; owners can also read their own drafts
drop policy if exists "Published listings are viewable by everyone" on public.listings;
create policy "Published listings are viewable by everyone"
  on public.listings for select
  using (status = 'published' or auth.uid() = user_id);

-- NOTE: the insert policy below ("Authenticated users can create their own
-- listings") is intentionally replaced by a seller-only version in the
-- Phase 2 section further down this file — that DROP+CREATE there is what
-- actually takes effect after a full run. It's recreated here too so this
-- Phase 1 section stays correct and re-runnable in isolation.
drop policy if exists "Authenticated users can create their own listings" on public.listings;
create policy "Authenticated users can create their own listings"
  on public.listings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Owners can update their own listings" on public.listings;
create policy "Owners can update their own listings"
  on public.listings for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Owners can delete their own listings" on public.listings;
create policy "Owners can delete their own listings"
  on public.listings for delete
  using (auth.uid() = user_id);

-- listing_images: readable if the parent listing is published or owned
drop policy if exists "Images are viewable if listing is published or owned" on public.listing_images;
create policy "Images are viewable if listing is published or owned"
  on public.listing_images for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_images.listing_id
        and (l.status = 'published' or l.user_id = auth.uid())
    )
  );

drop policy if exists "Owners can add images to their own listings" on public.listing_images;
create policy "Owners can add images to their own listings"
  on public.listing_images for insert
  with check (
    exists (select 1 from public.listings l
            where l.id = listing_images.listing_id and l.user_id = auth.uid())
  );

drop policy if exists "Owners can update their own listing images" on public.listing_images;
create policy "Owners can update their own listing images"
  on public.listing_images for update
  using (
    exists (select 1 from public.listings l
            where l.id = listing_images.listing_id and l.user_id = auth.uid())
  );

drop policy if exists "Owners can delete their own listing images" on public.listing_images;
create policy "Owners can delete their own listing images"
  on public.listing_images for delete
  using (
    exists (select 1 from public.listings l
            where l.id = listing_images.listing_id and l.user_id = auth.uid())
  );

-- feature_plans: public read of active plans; no client write policies
drop policy if exists "Active feature plans are viewable by everyone" on public.feature_plans;
create policy "Active feature plans are viewable by everyone"
  on public.feature_plans for select using (is_active = true);

-- payments: users can see + create their own "created" rows; only the
-- server (service-role client in the verify/webhook route) can mark them paid/failed
drop policy if exists "Users can view their own payments" on public.payments;
create policy "Users can view their own payments"
  on public.payments for select using (auth.uid() = user_id);

drop policy if exists "Users can create their own pending payments" on public.payments;
create policy "Users can create their own pending payments"
  on public.payments for insert
  with check (auth.uid() = user_id and status = 'created');

-- featured_listings: public read (to show "Featured" badge + drive ordering);
-- NO insert/update/delete policy for anon/authenticated at all —
-- only the service-role key (used server-side after signature verification) can write.
drop policy if exists "Featured status is viewable by everyone" on public.featured_listings;
create policy "Featured status is viewable by everyone"
  on public.featured_listings for select using (true);

-- ---------------------------------------------------------------------
-- STORAGE: public bucket for listing images
-- Path convention enforced by policy: "{auth.uid()}/{listing_id}/{filename}"
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read access to listing images" on storage.objects;
create policy "Public read access to listing images"
  on storage.objects for select
  using (bucket_id = 'listing-images');

drop policy if exists "Authenticated users can upload to their own folder" on storage.objects;
create policy "Authenticated users can upload to their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Owners can update their own images" on storage.objects;
create policy "Owners can update their own images"
  on storage.objects for update
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Owners can delete their own images" on storage.objects;
create policy "Owners can delete their own images"
  on storage.objects for delete
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------
-- VIEW: listings_feed
-- Convenience read view joining category, seller, thumbnail, and featured
-- status so the app can query the browse grid and search in one round trip.
-- security_invoker means it runs with the *querying* role's permissions, so
-- the RLS policies on public.listings above still apply through this view
-- (an anon caller still only sees status = 'published' rows, etc).
-- ---------------------------------------------------------------------
create or replace view public.listings_feed
with (security_invoker = true) as
select
  l.id,
  l.user_id,
  l.category_id,
  l.title,
  l.slug,
  l.description,
  l.price,
  l.location_city,
  l.location_state,
  l.status,
  l.view_count,
  l.search_vector,
  l.created_at,
  l.updated_at,
  c.name as category_name,
  c.slug as category_slug,
  p.full_name as seller_name,
  img.url as thumbnail_url,
  fl.ends_at as featured_until,
  (fl.ends_at is not null and fl.ends_at > now()) as is_featured
from public.listings l
join public.categories c on c.id = l.category_id
left join public.profiles p on p.id = l.user_id
left join lateral (
  select li.url
  from public.listing_images li
  where li.listing_id = l.id
  order by li.sort_order asc
  limit 1
) img on true
left join public.featured_listings fl on fl.listing_id = l.id;

grant select on public.listings_feed to anon, authenticated;

-- ---------------------------------------------------------------------
-- RPC: increment_listing_view
-- security definer so anonymous visitors (who have no update grant on
-- listings) can bump the view counter on the ad detail page; scoped to
-- published listings only so it can't be used to probe draft/deleted ids.
-- ---------------------------------------------------------------------
create or replace function public.increment_listing_view(p_listing_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.listings
  set view_count = view_count + 1
  where id = p_listing_id and status = 'published';
end;
$$;

grant execute on function public.increment_listing_view(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- SEED DATA
-- ---------------------------------------------------------------------
insert into public.categories (name, slug, sort_order) values
  ('Electronics',      'electronics',      1),
  ('Mobile Phones',    'mobile-phones',    2),
  ('Vehicles',         'vehicles',         3),
  ('Property',         'property',         4),
  ('Home & Furniture', 'home-furniture',   5),
  ('Fashion',          'fashion',          6),
  ('Jobs',             'jobs',             7),
  ('Services',         'services',         8),
  ('Pets',             'pets',             9),
  ('Books & Hobbies',  'books-hobbies',    10),
  ('Others',           'others',           11)
on conflict (slug) do nothing;

insert into public.feature_plans (name, price_inr, duration_days, sort_order) values
  ('7 Days',  99,  7,  1),
  ('15 Days', 179, 15, 2),
  ('30 Days', 299, 30, 3)
on conflict do nothing;

-- =====================================================================
-- End of Phase 1 schema
-- =====================================================================


-- =====================================================================
-- Doopido — Phase 2: buyer/seller roles, "Doopido Now" reverse
-- marketplace (need posts + bidding), credits, reviews.
--
-- This block is written to be safely re-run in full against the SAME
-- live project that already ran Phase 1 above (or against a partially-
-- applied Phase 2, if a previous attempt errored out partway). Every
-- statement is guarded: `if not exists` / `create or replace` / an
-- explicit `drop ... if exists` before each `create trigger` and
-- `create policy`, and idempotent `alter table ... add constraint` via
-- drop-then-add.
-- =====================================================================

-- ---------------------------------------------------------------------
-- ENUM TYPES (guarded — CREATE TYPE has no IF NOT EXISTS)
-- ---------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('buyer', 'seller');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.need_post_status as enum ('open', 'offer_accepted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.credit_ledger_reason as enum ('purchase', 'reveal_spend', 'admin_adjustment');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- profiles: add role + public seller-contact fields. Deliberately NOT
-- adding email/aadhaar here — see public.profile_private below, which is
-- owner-only. profiles has always been `select using (true)` (world
-- readable), so anything private cannot live on it.
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists role public.user_role;
alter table public.profiles add column if not exists whatsapp_number text;
alter table public.profiles add column if not exists business_name text;

alter table public.profiles drop constraint if exists chk_buyer_no_seller_fields;
alter table public.profiles
  add constraint chk_buyer_no_seller_fields
  check (role is distinct from 'buyer' or (whatsapp_number is null and business_name is null));

-- Enforce "one role per account, chosen at signup": role can be set once
-- (null -> buyer|seller) but never changed after that.
create or replace function public.prevent_role_change()
returns trigger language plpgsql as $$
begin
  if old.role is not null and new.role is distinct from old.role then
    raise exception 'Role cannot be changed after signup';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_prevent_role_change on public.profiles;
create trigger trg_profiles_prevent_role_change
  before update of role on public.profiles
  for each row execute function public.prevent_role_change();

-- Extend the Phase 1 signup trigger so phone flows straight through from
-- auth.users.phone (Supabase populates this automatically for phone-OTP
-- signups) as well as email signups (phone stays null there).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.phone);
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- TABLE: profile_private  (owner-only: email + Aadhaar doc path)
-- ---------------------------------------------------------------------
create table if not exists public.profile_private (
  profile_id          uuid primary key references public.profiles(id) on delete cascade,
  email               text,
  aadhaar_image_path  text,
  updated_at          timestamptz not null default now()
);

drop trigger if exists trg_profile_private_updated_at on public.profile_private;
create trigger trg_profile_private_updated_at
  before update on public.profile_private
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- TABLE: seller_verifications  (admin-flip only, zero client write
-- policy — same pattern as featured_listings in Phase 1)
-- ---------------------------------------------------------------------
create table if not exists public.seller_verifications (
  profile_id   uuid primary key references public.profiles(id) on delete cascade,
  is_verified  boolean not null default false,
  verified_at  timestamptz,
  verified_by  uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists trg_seller_verifications_updated_at on public.seller_verifications;
create trigger trg_seller_verifications_updated_at
  before update on public.seller_verifications
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- TABLE: seller_credits  (balance is locked with `for update` inside the
-- reveal_bids()/grant_purchased_credits() RPCs below to stay race-free)
-- ---------------------------------------------------------------------
create table if not exists public.seller_credits (
  profile_id  uuid primary key references public.profiles(id) on delete cascade,
  balance     int not null default 0 check (balance >= 0),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_seller_credits_updated_at on public.seller_credits;
create trigger trg_seller_credits_updated_at
  before update on public.seller_credits
  for each row execute function public.set_updated_at();

-- Auto-provision seller_verifications + seller_credits the moment a
-- profile's role becomes 'seller' — mirrors handle_new_user() auto-
-- creating profiles on auth.users insert.
create or replace function public.handle_seller_role_set()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role = 'seller' and (old.role is distinct from 'seller') then
    insert into public.seller_verifications (profile_id) values (new.id) on conflict do nothing;
    insert into public.seller_credits (profile_id) values (new.id) on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_seller_role_set on public.profiles;
create trigger trg_profiles_seller_role_set
  after update of role on public.profiles
  for each row execute function public.handle_seller_role_set();

-- ---------------------------------------------------------------------
-- listings: restrict creation to sellers. Existing update/delete
-- owner-policies are untouched.
-- ---------------------------------------------------------------------
drop policy if exists "Authenticated users can create their own listings" on public.listings;
drop policy if exists "Sellers can create their own listings" on public.listings;

create policy "Sellers can create their own listings"
  on public.listings for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'seller')
  );

-- ---------------------------------------------------------------------
-- TABLE: need_posts  ("Doopido Now" buyer need-ads). No owner UPDATE
-- policy at all: every state transition after insert goes through the
-- accept_bid() RPC (security definer), so a raw client update can never
-- set status/accepted_bid_id itself.
-- ---------------------------------------------------------------------
create table if not exists public.need_posts (
  id              uuid primary key default gen_random_uuid(),
  buyer_id        uuid not null references public.profiles(id) on delete cascade,
  category_id     uuid not null references public.categories(id) on delete restrict,
  headline        text not null check (char_length(headline) between 3 and 120),
  description     text not null check (char_length(description) between 10 and 3000),
  budget          numeric(12,2) check (budget is null or budget >= 0),
  location_city   text not null,
  status          public.need_post_status not null default 'open',
  accepted_bid_id uuid,
  bid_count       int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists trg_need_posts_updated_at on public.need_posts;
create trigger trg_need_posts_updated_at
  before update on public.need_posts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- TABLE: bids  (one active bid per seller per need-post; upsert on
-- (need_post_id, seller_id) revises it)
-- ---------------------------------------------------------------------
create table if not exists public.bids (
  id            uuid primary key default gen_random_uuid(),
  need_post_id  uuid not null references public.need_posts(id) on delete cascade,
  seller_id     uuid not null references public.profiles(id) on delete cascade,
  amount        numeric(12,2) not null check (amount >= 0),
  message       text check (char_length(message) <= 1000),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (need_post_id, seller_id)
);

drop trigger if exists trg_bids_updated_at on public.bids;
create trigger trg_bids_updated_at
  before update on public.bids
  for each row execute function public.set_updated_at();

alter table public.need_posts
  drop constraint if exists fk_need_posts_accepted_bid,
  add constraint fk_need_posts_accepted_bid
    foreign key (accepted_bid_id) references public.bids(id) on delete set null;

-- Keep need_posts.bid_count current so "N bids received" can be shown to
-- every seller even before they reveal the bids themselves (the count
-- alone isn't the thing being sold — the bid rows are).
create or replace function public.update_need_post_bid_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.need_posts set bid_count = bid_count + 1 where id = new.need_post_id;
  elsif tg_op = 'DELETE' then
    update public.need_posts set bid_count = greatest(bid_count - 1, 0) where id = old.need_post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_bids_update_need_post_count on public.bids;
create trigger trg_bids_update_need_post_count
  after insert or delete on public.bids
  for each row execute function public.update_need_post_bid_count();

-- ---------------------------------------------------------------------
-- RPC: accept_bid — the ONLY way a need_post can transition to
-- offer_accepted. `for update` row-locks the need_post so two concurrent
-- accept calls can't both "win". Execute is revoked from PUBLIC and only
-- granted to `authenticated`, and auth.uid() is explicitly null-checked
-- (rather than relying solely on `<>` comparison, which evaluates to
-- NULL — not true — when auth.uid() is null, silently skipping the
-- exception for anonymous callers otherwise).
-- ---------------------------------------------------------------------
create or replace function public.accept_bid(p_need_post_id uuid, p_bid_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_buyer_id uuid;
  v_status   public.need_post_status;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  select buyer_id, status into v_buyer_id, v_status
  from public.need_posts where id = p_need_post_id for update;

  if v_buyer_id is null then raise exception 'Need post not found'; end if;
  if v_buyer_id <> v_uid then raise exception 'Not authorized'; end if;
  if v_status <> 'open' then raise exception 'This need post is no longer open'; end if;
  if not exists (select 1 from public.bids where id = p_bid_id and need_post_id = p_need_post_id) then
    raise exception 'Bid does not belong to this need post';
  end if;

  update public.need_posts
  set status = 'offer_accepted', accepted_bid_id = p_bid_id
  where id = p_need_post_id;
end;
$$;

revoke all on function public.accept_bid(uuid, uuid) from public;
grant execute on function public.accept_bid(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------
-- TABLE: bid_reveals  (the "grant" record — a seller has unlocked all
-- bids on one need_post. No client write policy; only reveal_bids()
-- below inserts here. Same shape as featured_listings.)
-- ---------------------------------------------------------------------
create table if not exists public.bid_reveals (
  id            uuid primary key default gen_random_uuid(),
  need_post_id  uuid not null references public.need_posts(id) on delete cascade,
  revealed_by   uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (need_post_id, revealed_by)
);

-- ---------------------------------------------------------------------
-- TABLE: credit_packs  (editable via SQL, analogous to feature_plans)
-- ---------------------------------------------------------------------
create table if not exists public.credit_packs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  credits     int not null check (credits > 0),
  price_inr   numeric(10,2) not null check (price_inr >= 0),
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- TABLE: credit_payments  (Razorpay order/payment audit trail —
-- analogous to `payments`)
-- ---------------------------------------------------------------------
create table if not exists public.credit_payments (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles(id) on delete cascade,
  credit_pack_id       uuid not null references public.credit_packs(id) on delete restrict,
  razorpay_order_id    text not null unique,
  razorpay_payment_id  text,
  razorpay_signature   text,
  amount               numeric(10,2) not null,
  credits              int not null,
  status               public.payment_status not null default 'created',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

drop trigger if exists trg_credit_payments_updated_at on public.credit_payments;
create trigger trg_credit_payments_updated_at
  before update on public.credit_payments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- TABLE: credit_ledger  (append-only audit trail behind seller_credits;
-- balance itself is materialized in seller_credits so the spend function
-- below can row-lock a single row instead of summing this table.)
-- ---------------------------------------------------------------------
create table if not exists public.credit_ledger (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid not null references public.profiles(id) on delete cascade,
  delta             int not null,
  reason            public.credit_ledger_reason not null,
  credit_payment_id uuid references public.credit_payments(id) on delete set null,
  need_post_id      uuid references public.need_posts(id) on delete set null,
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- RPC: grant_purchased_credits — called ONLY by the service-role
-- (admin) client from the credits verify route and the shared webhook,
-- after Razorpay signature verification. Execute is revoked from PUBLIC
-- and granted only to service_role: this function trusts its caller
-- completely (it does not re-verify a signature itself), so if a normal
-- authenticated/anon role could call it directly, anyone could grant
-- themselves free credits for a payment they never actually made. `for
-- update` + the `status='paid'` short-circuit makes verify+webhook
-- racing each other idempotent (no double credit).
-- ---------------------------------------------------------------------
create or replace function public.grant_purchased_credits(p_payment_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_payment record;
begin
  select * into v_payment from public.credit_payments where id = p_payment_id for update;
  if v_payment is null then raise exception 'Payment not found'; end if;
  if v_payment.status = 'paid' then return; end if;

  update public.credit_payments set status = 'paid', updated_at = now() where id = p_payment_id;

  insert into public.seller_credits (profile_id, balance)
  values (v_payment.user_id, v_payment.credits)
  on conflict (profile_id) do update
    set balance = public.seller_credits.balance + excluded.balance, updated_at = now();

  insert into public.credit_ledger (profile_id, delta, reason, credit_payment_id)
  values (v_payment.user_id, v_payment.credits, 'purchase', p_payment_id);
end;
$$;

revoke all on function public.grant_purchased_credits(uuid) from public;
grant execute on function public.grant_purchased_credits(uuid) to service_role;

-- ---------------------------------------------------------------------
-- RPC: reveal_bids — the single atomic "spend credits to unlock all bids
-- on one need_post" operation. `for update` on seller_credits prevents a
-- double-spend race; the unique constraint on bid_reveals is a second
-- line of defense. Reveal cost is a flat constant here — keep in sync
-- with REVEAL_COST_CREDITS in lib/constants.ts.
-- ---------------------------------------------------------------------
create or replace function public.reveal_bids(p_need_post_id uuid)
returns int
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_cost    int  := 5; -- keep in sync with REVEAL_COST_CREDITS
  v_balance int;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if not exists (select 1 from public.profiles where id = v_uid and role = 'seller') then
    raise exception 'Only sellers can reveal bids';
  end if;
  if not exists (select 1 from public.need_posts where id = p_need_post_id) then
    raise exception 'Need post not found';
  end if;

  if exists (select 1 from public.bid_reveals where need_post_id = p_need_post_id and revealed_by = v_uid) then
    select balance into v_balance from public.seller_credits where profile_id = v_uid;
    return v_balance;
  end if;

  select balance into v_balance from public.seller_credits where profile_id = v_uid for update;
  if v_balance is null then raise exception 'No credit account found'; end if;
  if v_balance < v_cost then raise exception 'Not enough credits'; end if;

  update public.seller_credits set balance = balance - v_cost, updated_at = now() where profile_id = v_uid;

  insert into public.credit_ledger (profile_id, delta, reason, need_post_id)
  values (v_uid, -v_cost, 'reveal_spend', p_need_post_id);

  insert into public.bid_reveals (need_post_id, revealed_by)
  values (p_need_post_id, v_uid);

  return v_balance - v_cost;
end;
$$;

revoke all on function public.reveal_bids(uuid) from public;
grant execute on function public.reveal_bids(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- TABLE: reviews  (one per completed deal, publicly visible)
-- ---------------------------------------------------------------------
create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  need_post_id  uuid not null unique references public.need_posts(id) on delete cascade,
  buyer_id      uuid not null references public.profiles(id) on delete cascade,
  seller_id     uuid not null references public.profiles(id) on delete cascade,
  is_positive   boolean not null,
  comment       text check (char_length(comment) <= 1000),
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------
create index if not exists idx_need_posts_status_created on public.need_posts(status, created_at desc);
create index if not exists idx_need_posts_category        on public.need_posts(category_id);
create index if not exists idx_need_posts_city             on public.need_posts(lower(location_city));
create index if not exists idx_need_posts_buyer            on public.need_posts(buyer_id);

create index if not exists idx_bids_need_post on public.bids(need_post_id);
create index if not exists idx_bids_seller    on public.bids(seller_id);

create index if not exists idx_bid_reveals_seller on public.bid_reveals(revealed_by);

create index if not exists idx_credit_payments_user on public.credit_payments(user_id);
create index if not exists idx_credit_ledger_profile on public.credit_ledger(profile_id, created_at desc);

create index if not exists idx_reviews_seller on public.reviews(seller_id);

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profile_private      enable row level security;
alter table public.seller_verifications enable row level security;
alter table public.seller_credits       enable row level security;
alter table public.need_posts           enable row level security;
alter table public.bids                 enable row level security;
alter table public.bid_reveals          enable row level security;
alter table public.credit_packs         enable row level security;
alter table public.credit_payments      enable row level security;
alter table public.credit_ledger        enable row level security;
alter table public.reviews              enable row level security;

-- profile_private: strictly owner-only, never public.
drop policy if exists "Users can view their own private profile data" on public.profile_private;
create policy "Users can view their own private profile data"
  on public.profile_private for select using (auth.uid() = profile_id);

drop policy if exists "Users can insert their own private profile data" on public.profile_private;
create policy "Users can insert their own private profile data"
  on public.profile_private for insert with check (auth.uid() = profile_id);

drop policy if exists "Users can update their own private profile data" on public.profile_private;
create policy "Users can update their own private profile data"
  on public.profile_private for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- seller_verifications: public read (drives a "Verified Seller" badge),
-- NO client write policy at all — admin/service-role only.
drop policy if exists "Verification status is viewable by everyone" on public.seller_verifications;
create policy "Verification status is viewable by everyone"
  on public.seller_verifications for select using (true);

-- seller_credits: owner-only read; no client write policy — only
-- reveal_bids()/grant_purchased_credits() (security definer) write here.
drop policy if exists "Sellers can view their own credit balance" on public.seller_credits;
create policy "Sellers can view their own credit balance"
  on public.seller_credits for select using (auth.uid() = profile_id);

-- need_posts: public read; buyer-role-gated insert; no update/delete
-- policy at all (state changes only via accept_bid()).
drop policy if exists "Need posts are viewable by everyone" on public.need_posts;
create policy "Need posts are viewable by everyone"
  on public.need_posts for select using (true);

drop policy if exists "Buyers can create their own need posts" on public.need_posts;
create policy "Buyers can create their own need posts"
  on public.need_posts for insert
  with check (
    auth.uid() = buyer_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'buyer')
  );

-- bids: seller can see + write their own bid while the post is open;
-- buyer sees all bids on their own post for free; other sellers see a
-- bid row only once they've paid to reveal it.
drop policy if exists "Bids are viewable by their seller, the post's buyer, or after reveal" on public.bids;
create policy "Bids are viewable by their seller, the post's buyer, or after reveal"
  on public.bids for select
  using (
    auth.uid() = seller_id
    or exists (select 1 from public.need_posts np where np.id = bids.need_post_id and np.buyer_id = auth.uid())
    or exists (select 1 from public.bid_reveals br where br.need_post_id = bids.need_post_id and br.revealed_by = auth.uid())
  );

drop policy if exists "Sellers can place a bid on an open need post" on public.bids;
create policy "Sellers can place a bid on an open need post"
  on public.bids for insert
  with check (
    auth.uid() = seller_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'seller')
    and exists (select 1 from public.need_posts np where np.id = bids.need_post_id and np.status = 'open')
  );

drop policy if exists "Sellers can revise their own bid while the need post is open" on public.bids;
create policy "Sellers can revise their own bid while the need post is open"
  on public.bids for update
  using (
    auth.uid() = seller_id
    and exists (select 1 from public.need_posts np where np.id = bids.need_post_id and np.status = 'open')
  )
  with check (auth.uid() = seller_id);

-- bid_reveals: a seller can see which posts they've personally revealed
-- (to render "already unlocked" state); no client write policy.
drop policy if exists "Sellers can see their own reveals" on public.bid_reveals;
create policy "Sellers can see their own reveals"
  on public.bid_reveals for select using (auth.uid() = revealed_by);

-- credit_packs: public read of active packs; no client write (SQL-editor only).
drop policy if exists "Active credit packs are viewable by everyone" on public.credit_packs;
create policy "Active credit packs are viewable by everyone"
  on public.credit_packs for select using (is_active = true);

-- credit_payments: same shape as payments — user creates/reads their own
-- "created" rows; only the server (service-role, after signature
-- verification) marks them paid.
drop policy if exists "Users can view their own credit payments" on public.credit_payments;
create policy "Users can view their own credit payments"
  on public.credit_payments for select using (auth.uid() = user_id);

drop policy if exists "Users can create their own pending credit payments" on public.credit_payments;
create policy "Users can create their own pending credit payments"
  on public.credit_payments for insert
  with check (auth.uid() = user_id and status = 'created');

-- credit_ledger: owner-only read; no client write (only the two RPCs
-- above insert here, both security definer).
drop policy if exists "Sellers can view their own credit history" on public.credit_ledger;
create policy "Sellers can view their own credit history"
  on public.credit_ledger for select using (auth.uid() = profile_id);

-- reviews: publicly visible; insertable only by the need_post's buyer,
-- only once the post is offer_accepted, and only naming the actual
-- winning seller — no update/delete policy (reviews are permanent for
-- MVP).
drop policy if exists "Reviews are viewable by everyone" on public.reviews;
create policy "Reviews are viewable by everyone"
  on public.reviews for select using (true);

drop policy if exists "Buyers can review their own completed deals" on public.reviews;
create policy "Buyers can review their own completed deals"
  on public.reviews for insert
  with check (
    auth.uid() = buyer_id
    and exists (
      select 1 from public.need_posts np
      join public.bids b on b.id = np.accepted_bid_id
      where np.id = reviews.need_post_id
        and np.buyer_id = auth.uid()
        and np.status = 'offer_accepted'
        and b.seller_id = reviews.seller_id
    )
  );

-- ---------------------------------------------------------------------
-- STORAGE: private bucket for seller verification documents (Aadhaar).
-- Unlike listing-images, no public-read policy — owner-only select, and
-- the admin reviews files via the Supabase Dashboard Storage browser
-- (service role bypasses RLS there), not via any in-app admin UI.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('seller-documents', 'seller-documents', false)
on conflict (id) do nothing;

drop policy if exists "Sellers can upload their own verification documents" on storage.objects;
create policy "Sellers can upload their own verification documents"
  on storage.objects for insert
  with check (
    bucket_id = 'seller-documents'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Sellers can view their own verification documents" on storage.objects;
create policy "Sellers can view their own verification documents"
  on storage.objects for select
  using (bucket_id = 'seller-documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Sellers can replace their own verification documents" on storage.objects;
create policy "Sellers can replace their own verification documents"
  on storage.objects for update
  using (bucket_id = 'seller-documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Sellers can delete their own verification documents" on storage.objects;
create policy "Sellers can delete their own verification documents"
  on storage.objects for delete
  using (bucket_id = 'seller-documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- VIEW: need_posts_feed — browse/filter convenience view, same shape and
-- security_invoker rationale as listings_feed. bid_count is a plain
-- column (not a join through RLS-protected bids), so the "N bids
-- received" teaser is visible to every seller even before they reveal.
-- ---------------------------------------------------------------------
create or replace view public.need_posts_feed
with (security_invoker = true) as
select
  np.*,
  c.name as category_name,
  c.slug as category_slug,
  p.full_name as buyer_name
from public.need_posts np
join public.categories c on c.id = np.category_id
left join public.profiles p on p.id = np.buyer_id;

grant select on public.need_posts_feed to anon, authenticated;

-- ---------------------------------------------------------------------
-- SEED DATA
-- ---------------------------------------------------------------------
insert into public.credit_packs (name, credits, price_inr, sort_order) values
  ('Starter', 10, 99,  1),
  ('Growth',  30, 249, 2),
  ('Pro',     75, 499, 3)
on conflict do nothing;

-- =====================================================================
-- End of Phase 2 schema
-- =====================================================================
