export type ListingStatus = "draft" | "published" | "sold" | "deleted";
export type PaymentStatus = "created" | "paid" | "failed";
export type UserRole = "buyer" | "seller";
export type NeedPostStatus = "open" | "offer_accepted";
export type CreditLedgerReason = "purchase" | "reveal_spend" | "admin_adjustment";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole | null;
  whatsapp_number: string | null;
  business_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfilePrivate {
  profile_id: string;
  email: string | null;
  aadhaar_image_path: string | null;
}

export interface SellerVerification {
  profile_id: string;
  is_verified: boolean;
  verified_at: string | null;
}

export interface SellerCredits {
  profile_id: string;
  balance: number;
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

export interface NeedPost {
  id: string;
  buyer_id: string;
  category_id: string;
  headline: string;
  description: string;
  budget: number | null;
  location_city: string;
  status: NeedPostStatus;
  accepted_bid_id: string | null;
  bid_count: number;
  created_at: string;
  updated_at: string;
}

// Row shape of the public.need_posts_feed view (see supabase/schema.sql)
export interface NeedPostFeedItem extends NeedPost {
  category_name: string;
  category_slug: string;
  buyer_name: string | null;
}

export interface NeedPostWithRelations extends NeedPost {
  category: Category | null;
  buyer: Profile | null;
}

export interface Bid {
  id: string;
  need_post_id: string;
  seller_id: string;
  amount: number;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface BidWithSeller extends Bid {
  seller: Profile | null;
}

export interface BidReveal {
  id: string;
  need_post_id: string;
  revealed_by: string;
}

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price_inr: number;
  is_active: boolean;
  sort_order: number;
}

export interface CreditPayment {
  id: string;
  user_id: string;
  credit_pack_id: string;
  razorpay_order_id: string;
  amount: number;
  credits: number;
  status: PaymentStatus;
  created_at: string;
}

export interface CreditLedgerEntry {
  id: string;
  profile_id: string;
  delta: number;
  reason: CreditLedgerReason;
  created_at: string;
}

export interface Review {
  id: string;
  need_post_id: string;
  buyer_id: string;
  seller_id: string;
  is_positive: boolean;
  comment: string | null;
  created_at: string;
}

export interface NeedPostFilters {
  category?: string;
  city?: string;
  page?: number;
}
