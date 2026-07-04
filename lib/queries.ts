import type { SupabaseClient } from "@supabase/supabase-js";
import { LISTINGS_PAGE_SIZE } from "./constants";
import type {
  Category,
  FeaturePlan,
  ListingFeedItem,
  ListingFilters,
  ListingWithRelations,
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
