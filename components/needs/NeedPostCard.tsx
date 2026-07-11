import Link from "next/link";
import { formatPrice, formatRelativeDate } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import type { NeedPostFeedItem } from "@/types";

export function NeedPostCard({ needPost }: { needPost: NeedPostFeedItem }) {
  return (
    <Link
      href={`/now/${needPost.id}`}
      className="block rounded-2xl border border-border bg-white p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">{needPost.headline}</h3>
        <Badge variant="neutral">{needPost.category_name}</Badge>
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-muted">{needPost.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
        <span>{needPost.location_city}</span>
        <span>&middot;</span>
        <span>{formatRelativeDate(needPost.created_at)}</span>
        <span>&middot;</span>
        <span>{needPost.bid_count} bid{needPost.bid_count === 1 ? "" : "s"}</span>
        {needPost.budget !== null && (
          <>
            <span>&middot;</span>
            <span className="font-medium text-primary">Budget: {formatPrice(needPost.budget)}</span>
          </>
        )}
      </div>
    </Link>
  );
}
