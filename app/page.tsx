import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getListingsFeed } from "@/lib/queries";
import { FilterBar } from "@/components/filters/FilterBar";
import { AdGrid } from "@/components/ads/AdGrid";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const filters = {
    category: params.category,
    city: params.city,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    q: params.q,
  };

  const supabase = await createClient();
  const [categories, { listings, hasMore }] = await Promise.all([
    getCategories(supabase),
    getListingsFeed(supabase, filters),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Suspense fallback={<div className="h-24" />}>
        <FilterBar categories={categories} />
      </Suspense>
      <div className="pt-6">
        <AdGrid initialListings={listings} initialHasMore={hasMore} filters={filters} />
      </div>
    </div>
  );
}
