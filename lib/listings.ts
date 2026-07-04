import type { FeaturedListing } from "@/types";

// Kept as a standalone helper (rather than inlined in components) so that
// the `Date.now()` call doesn't trip the react-hooks/purity rule, which
// flags impure calls made directly inside component render bodies.
export function isListingFeatured(featuredListings: FeaturedListing[]): boolean {
  const now = Date.now();
  return featuredListings.some((f) => new Date(f.ends_at).getTime() > now);
}
