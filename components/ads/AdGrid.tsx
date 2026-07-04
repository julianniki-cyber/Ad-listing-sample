"use client";

import { useEffect, useRef } from "react";
import { useInfiniteListings } from "@/hooks/useInfiniteListings";
import type { ListingFeedItem, ListingFilters } from "@/types";
import { AdCard } from "./AdCard";
import { Button } from "@/components/ui/Button";

export function AdGrid({
  initialListings,
  initialHasMore,
  filters,
}: {
  initialListings: ListingFeedItem[];
  initialHasMore: boolean;
  filters: Omit<ListingFilters, "page">;
}) {
  const { listings, hasMore, loading, loadMore } = useInfiniteListings(
    initialListings,
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

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <p className="text-lg font-medium text-foreground">No ads found</p>
        <p className="text-sm text-muted">Try adjusting your filters or search.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5">
        {listings.map((listing) => (
          <div key={listing.id} className="mb-4 break-inside-avoid">
            <AdCard listing={listing} />
          </div>
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
