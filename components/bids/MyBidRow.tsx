import Link from "next/link";
import { formatPrice, formatRelativeDate } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Bid, NeedPostWithRelations } from "@/types";

export function MyBidRow({
  bid,
  needPost,
}: {
  bid: Bid;
  needPost: NeedPostWithRelations | null;
}) {
  if (!needPost) return null;

  const won = needPost.accepted_bid_id === bid.id;
  const lost = needPost.status === "offer_accepted" && needPost.accepted_bid_id !== bid.id;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{needPost.headline}</p>
          {won && <Badge variant="success">Won</Badge>}
          {lost && <Badge variant="neutral">Not selected</Badge>}
          {!won && !lost && <Badge variant="neutral">Pending</Badge>}
        </div>
        <p className="text-xs text-muted">
          Your bid:{" "}
          <span className="font-mono font-bold text-foreground">{formatPrice(bid.amount)}</span>
          {" "}&middot; {formatRelativeDate(bid.created_at)}
        </p>
      </div>
      <Link href={`/now/${needPost.id}`}>
        <Button variant="secondary" size="sm">
          View
        </Button>
      </Link>
    </div>
  );
}
