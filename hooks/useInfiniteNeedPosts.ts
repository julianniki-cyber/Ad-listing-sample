"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getNeedPostsFeed } from "@/lib/queries";
import type { NeedPostFeedItem, NeedPostFilters } from "@/types";

export function useInfiniteNeedPosts(
  initialNeedPosts: NeedPostFeedItem[],
  initialHasMore: boolean,
  filters: Omit<NeedPostFilters, "page">,
) {
  const [needPosts, setNeedPosts] = useState(initialNeedPosts);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const nextPage = page + 1;
      const { needPosts: more, hasMore: moreAvailable } = await getNeedPostsFeed(supabase, {
        ...filters,
        page: nextPage,
      });
      setNeedPosts((prev) => [...prev, ...more]);
      setPage(nextPage);
      setHasMore(moreAvailable);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, filters]);

  return { needPosts, hasMore, loading, loadMore };
}
