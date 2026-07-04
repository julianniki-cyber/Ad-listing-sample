-- =====================================================================
-- Doopido — Supabase schema
-- Run this entire script once in the Supabase SQL editor on a fresh project.
-- Safe to re-run pieces with "if not exists" / "on conflict" guards where noted.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------
create type public.listing_status as enum ('draft', 'published', 'sold', 'deleted');
create type public.payment_status as enum ('created', 'paid', 'failed');

-- ---------------------------------------------------------------------
-- TABLE: profiles  (1:1 with auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- TABLE: categories  (editable via SQL, not hardcoded in app code)
-- ---------------------------------------------------------------------
create table public.categories (
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
create table public.listings (
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

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- TABLE: listing_images  (up to 6 per listing, enforced by trigger below)
-- ---------------------------------------------------------------------
create table public.listing_images (
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

create trigger trg_enforce_max_listing_images
  before insert on public.listing_images
  for each row execute function public.enforce_max_listing_images();

-- ---------------------------------------------------------------------
-- TABLE: feature_plans  (tiers editable via SQL, no code change needed)
-- ---------------------------------------------------------------------
create table public.feature_plans (
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
create table public.payments (
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

create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- TABLE: featured_listings  (write-only via server/service-role path;
-- kept separate from `listings` so a normal owner-update policy can
-- NEVER let a user grant themselves featured status)
-- ---------------------------------------------------------------------
create table public.featured_listings (
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
create index idx_listings_user            on public.listings(user_id);
create index idx_listings_category        on public.listings(category_id);
create index idx_listings_status_created  on public.listings(status, created_at desc);
create index idx_listings_location_city   on public.listings(lower(location_city));
create index idx_listings_price           on public.listings(price);
create index idx_listings_search_vector   on public.listings using gin(search_vector);

create index idx_listing_images_listing   on public.listing_images(listing_id, sort_order);

create index idx_featured_listings_ends   on public.featured_listings(ends_at desc);

create index idx_payments_user            on public.payments(user_id);
create index idx_payments_listing         on public.payments(listing_id);

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
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- categories: public read of active rows only; no client write policies at all
-- (admin edits happen via SQL editor / service role, which bypasses RLS)
create policy "Categories are viewable by everyone"
  on public.categories for select using (is_active = true);

-- listings: anyone can read published ads; owners can also read their own drafts
create policy "Published listings are viewable by everyone"
  on public.listings for select
  using (status = 'published' or auth.uid() = user_id);

create policy "Authenticated users can create their own listings"
  on public.listings for insert
  with check (auth.uid() = user_id);

create policy "Owners can update their own listings"
  on public.listings for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Owners can delete their own listings"
  on public.listings for delete
  using (auth.uid() = user_id);

-- listing_images: readable if the parent listing is published or owned
create policy "Images are viewable if listing is published or owned"
  on public.listing_images for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_images.listing_id
        and (l.status = 'published' or l.user_id = auth.uid())
    )
  );

create policy "Owners can add images to their own listings"
  on public.listing_images for insert
  with check (
    exists (select 1 from public.listings l
            where l.id = listing_images.listing_id and l.user_id = auth.uid())
  );

create policy "Owners can update their own listing images"
  on public.listing_images for update
  using (
    exists (select 1 from public.listings l
            where l.id = listing_images.listing_id and l.user_id = auth.uid())
  );

create policy "Owners can delete their own listing images"
  on public.listing_images for delete
  using (
    exists (select 1 from public.listings l
            where l.id = listing_images.listing_id and l.user_id = auth.uid())
  );

-- feature_plans: public read of active plans; no client write policies
create policy "Active feature plans are viewable by everyone"
  on public.feature_plans for select using (is_active = true);

-- payments: users can see + create their own "created" rows; only the
-- server (service-role client in the verify/webhook route) can mark them paid/failed
create policy "Users can view their own payments"
  on public.payments for select using (auth.uid() = user_id);

create policy "Users can create their own pending payments"
  on public.payments for insert
  with check (auth.uid() = user_id and status = 'created');

-- featured_listings: public read (to show "Featured" badge + drive ordering);
-- NO insert/update/delete policy for anon/authenticated at all —
-- only the service-role key (used server-side after signature verification) can write.
create policy "Featured status is viewable by everyone"
  on public.featured_listings for select using (true);

-- ---------------------------------------------------------------------
-- STORAGE: public bucket for listing images
-- Path convention enforced by policy: "{auth.uid()}/{listing_id}/{filename}"
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

create policy "Public read access to listing images"
  on storage.objects for select
  using (bucket_id = 'listing-images');

create policy "Authenticated users can upload to their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owners can update their own images"
  on storage.objects for update
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

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
-- End of schema
-- =====================================================================
