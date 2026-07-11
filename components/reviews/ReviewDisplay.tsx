import { Badge } from "@/components/ui/Badge";
import { formatRelativeDate } from "@/lib/format";
import type { Review } from "@/types";

export function ReviewDisplay({ review }: { review: Review }) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex items-center gap-2">
        <Badge variant={review.is_positive ? "primary" : "neutral"}>
          {review.is_positive ? "Liked" : "Disliked"}
        </Badge>
        <span className="text-xs text-muted">{formatRelativeDate(review.created_at)}</span>
      </div>
      {review.comment && <p className="mt-2 text-sm text-foreground">{review.comment}</p>}
    </div>
  );
}
