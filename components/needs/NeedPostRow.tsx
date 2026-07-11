import Link from "next/link";
import { formatRelativeDate } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { NeedPostWithRelations } from "@/types";

export function NeedPostRow({ needPost }: { needPost: NeedPostWithRelations }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{needPost.headline}</p>
          <Badge variant={needPost.status === "open" ? "primary" : "neutral"}>
            {needPost.status === "open" ? "Open" : "Offer accepted"}
          </Badge>
        </div>
        <p className="text-xs text-muted">
          {needPost.category?.name} &middot; {needPost.location_city} &middot;{" "}
          {needPost.bid_count} bid{needPost.bid_count === 1 ? "" : "s"} &middot;{" "}
          {formatRelativeDate(needPost.created_at)}
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
