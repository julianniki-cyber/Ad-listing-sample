export type ListingStatus = "draft" | "published" | "sold" | "deleted";
export type PaymentStatus = "created" | "paid" | "failed";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ListingImage {
  id: string;
  listing_id: string;
  storage_path: string;
  url: string;
  sort_order: number;
}

export interface FeaturePlan {
  id: string;
  name: string;
  price_inr: number;
  duration_days: number;
  is_active: boolean;
  sort_order: number;
}

export interface FeaturedListing {
  id: string;
  listing_id: string;
  payment_id: string;
  starts_at: string;
  ends_at: string;
}

export interface Listing {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  location_city: string;
  location_state: string | null;
  status: ListingStatus;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface ListingWithRelations extends Listing {
  category: Category | null;
  listing_images: ListingImage[];
  profile: Profile | null;
  featured_listings: FeaturedListing[];
}

// Row shape of the public.listings_feed view (see supabase/schema.sql)
export interface ListingFeedItem {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  location_city: string;
  location_state: string | null;
  status: ListingStatus;
  view_count: number;
  created_at: string;
  updated_at: string;
  category_name: string;
  category_slug: string;
  seller_name: string | null;
  thumbnail_url: string | null;
  featured_until: string | null;
  is_featured: boolean;
}

export interface ListingFilters {
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  page?: number;
}
