import type { SupabaseClient } from "@supabase/supabase-js";
import { LISTINGS_PAGE_SIZE, NEED_POSTS_PAGE_SIZE } from "./constants";
import type {
  BidWithSeller,
  Category,
  CreditLedgerEntry,
  CreditPack,
  FeaturePlan,
  ListingFeedItem,
  ListingFilters,
  ListingWithRelations,
  NeedPostFeedItem,
  NeedPostFilters,
  NeedPostWithRelations,
  Profile,
  Review,
} from "@/types";

export async function getCategories(supabase: SupabaseClient): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getFeaturePlans(supabase: SupabaseClient): Promise<FeaturePlan[]> {
  const { data, error } = await supabase
    .from("feature_plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getListingsFeed(
  supabase: SupabaseClient,
  filters: ListingFilters,
): Promise<{ listings: ListingFeedItem[]; hasMore: boolean }> {
  const page = filters.page ?? 0;
  const from = page * LISTINGS_PAGE_SIZE;
  const to = from + LISTINGS_PAGE_SIZE - 1;

  let query = supabase
    .from("listings_feed")
    .select("*")
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.category) query = query.eq("category_slug", filters.category);
  if (filters.city) query = query.ilike("location_city", `%${filters.city}%`);
  if (filters.minPrice !== undefined) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte("price", filters.maxPrice);
  if (filters.q) query = query.textSearch("search_vector", filters.q, { type: "websearch" });

  const { data, error } = await query;
  if (error) throw error;

  const listings = data ?? [];
  return { listings, hasMore: listings.length === LISTINGS_PAGE_SIZE };
}

export async function getListingBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<ListingWithRelations | null> {
  const { data, error } = await supabase
    .from("listings")
    .select(
      "*, category:categories(*), listing_images(*), profile:profiles(*), featured_listings(*)",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data as ListingWithRelations | null;
}

export async function getListingById(
  supabase: SupabaseClient,
  id: string,
): Promise<ListingWithRelations | null> {
  const { data, error } = await supabase
    .from("listings")
    .select(
      "*, category:categories(*), listing_images(*), profile:profiles(*), featured_listings(*)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as ListingWithRelations | null;
}

export async function getProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

export async function getNeedPostsFeed(
  supabase: SupabaseClient,
  filters: NeedPostFilters,
): Promise<{ needPosts: NeedPostFeedItem[]; hasMore: boolean }> {
  const page = filters.page ?? 0;
  const from = page * NEED_POSTS_PAGE_SIZE;
  const to = from + NEED_POSTS_PAGE_SIZE - 1;

  let query = supabase
    .from("need_posts_feed")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.category) query = query.eq("category_slug", filters.category);
  if (filters.city) query = query.ilike("location_city", `%${filters.city}%`);

  const { data, error } = await query;
  if (error) throw error;

  const needPosts = data ?? [];
  return { needPosts, hasMore: needPosts.length === NEED_POSTS_PAGE_SIZE };
}

export async function getNeedPostById(
  supabase: SupabaseClient,
  id: string,
): Promise<NeedPostWithRelations | null> {
  const { data, error } = await supabase
    .from("need_posts")
    .select("*, category:categories(*), buyer:profiles!need_posts_buyer_id_fkey(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as NeedPostWithRelations | null;
}

export async function getMyNeedPosts(
  supabase: SupabaseClient,
  buyerId: string,
): Promise<NeedPostWithRelations[]> {
  const { data, error } = await supabase
    .from("need_posts")
    .select("*, category:categories(*), buyer:profiles!need_posts_buyer_id_fkey(*)")
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as NeedPostWithRelations[]) ?? [];
}

export async function getBidsForNeedPost(
  supabase: SupabaseClient,
  needPostId: string,
): Promise<BidWithSeller[]> {
  const { data, error } = await supabase
    .from("bids")
    .select("*, seller:profiles!bids_seller_id_fkey(*)")
    .eq("need_post_id", needPostId)
    .order("amount", { ascending: true });

  if (error) throw error;
  return (data as BidWithSeller[]) ?? [];
}

export async function getMyBid(
  supabase: SupabaseClient,
  needPostId: string,
  sellerId: string,
): Promise<BidWithSeller | null> {
  const { data, error } = await supabase
    .from("bids")
    .select("*, seller:profiles!bids_seller_id_fkey(*)")
    .eq("need_post_id", needPostId)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (error) throw error;
  return data as BidWithSeller | null;
}

export async function getMyBids(
  supabase: SupabaseClient,
  sellerId: string,
): Promise<(BidWithSeller & { need_post: NeedPostWithRelations | null })[]> {
  const { data, error } = await supabase
    .from("bids")
    .select(
      "*, seller:profiles!bids_seller_id_fkey(*), need_post:need_posts(*, category:categories(*), buyer:profiles!need_posts_buyer_id_fkey(*))",
    )
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as (BidWithSeller & { need_post: NeedPostWithRelations | null })[]) ?? [];
}

export async function hasRevealedBids(
  supabase: SupabaseClient,
  needPostId: string,
  sellerId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("bid_reveals")
    .select("id")
    .eq("need_post_id", needPostId)
    .eq("revealed_by", sellerId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function getCreditPacks(supabase: SupabaseClient): Promise<CreditPack[]> {
  const { data, error } = await supabase
    .from("credit_packs")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getSellerCreditsBalance(
  supabase: SupabaseClient,
  profileId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("seller_credits")
    .select("balance")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) throw error;
  return data?.balance ?? 0;
}

export async function getCreditLedger(
  supabase: SupabaseClient,
  profileId: string,
): Promise<CreditLedgerEntry[]> {
  const { data, error } = await supabase
    .from("credit_ledger")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

export async function getReviewForNeedPost(
  supabase: SupabaseClient,
  needPostId: string,
): Promise<Review | null> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("need_post_id", needPostId)
    .maybeSingle();

  if (error) throw error;
  return data as Review | null;
}

export async function getMyListings(
  supabase: SupabaseClient,
  userId: string,
): Promise<ListingWithRelations[]> {
  const { data, error } = await supabase
    .from("listings")
    .select(
      "*, category:categories(*), listing_images(*), profile:profiles(*), featured_listings(*)",
    )
    .eq("user_id", userId)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as ListingWithRelations[]) ?? [];
}
