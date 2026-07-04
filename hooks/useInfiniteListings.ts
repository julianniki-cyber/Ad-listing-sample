"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getListingsFeed } from "@/lib/queries";
import type { ListingFeedItem, ListingFilters } from "@/types";

export function useInfiniteListings(
  initialListings: ListingFeedItem[],
  initialHasMore: boolean,
  filters: Omit<ListingFilters, "page">,
) {
  const [listings, setListings] = useState(initialListings);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const nextPage = page + 1;
      const { listings: more, hasMore: moreAvailable } = await getListingsFeed(supabase, {
        ...filters,
        page: nextPage,
      });
      setListings((prev) => [...prev, ...more]);
      setPage(nextPage);
      setHasMore(moreAvailable);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, filters]);

  return { listings, hasMore, loading, loadMore };
}
