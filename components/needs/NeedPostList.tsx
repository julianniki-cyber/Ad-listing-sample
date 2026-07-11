"use client";

import { useEffect, useRef } from "react";
import { useInfiniteNeedPosts } from "@/hooks/useInfiniteNeedPosts";
import type { NeedPostFeedItem, NeedPostFilters } from "@/types";
import { NeedPostCard } from "./NeedPostCard";
import { Button } from "@/components/ui/Button";

export function NeedPostList({
  initialNeedPosts,
  initialHasMore,
  filters,
}: {
  initialNeedPosts: NeedPostFeedItem[];
  initialHasMore: boolean;
  filters: Omit<NeedPostFilters, "page">;
}) {
  const { needPosts, hasMore, loading, loadMore } = useInfiniteNeedPosts(
    initialNeedPosts,
    initialHasMore,
    filters,
  );
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (needPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <p className="text-lg font-medium text-foreground">No open requests right now</p>
        <p className="text-sm text-muted">Check back soon, or try a different filter.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {needPosts.map((needPost) => (
          <NeedPostCard key={needPost.id} needPost={needPost} />
        ))}
      </div>

      <div ref={sentinelRef} className="h-1" />

      {hasMore && (
        <div className="flex justify-center py-8">
          <Button variant="secondary" onClick={loadMore} disabled={loading}>
            {loading ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
