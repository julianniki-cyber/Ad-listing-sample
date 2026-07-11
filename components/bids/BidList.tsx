"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptBid } from "@/app/now/actions";
import { formatPrice, formatRelativeDate } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { BidWithSeller } from "@/types";

export function BidList({
  needPostId,
  bids,
  canAccept,
  acceptedBidId,
}: {
  needPostId: string;
  bids: BidWithSeller[];
  canAccept: boolean;
  acceptedBidId: string | null;
}) {
  const router = useRouter();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (bids.length === 0) {
    return <p className="text-sm text-muted">No bids yet.</p>;
  }

  const sorted = [...bids].sort((a, b) => a.amount - b.amount);
  const bestBidId = sorted[0]?.id;

  async function handleAccept(bidId: string) {
    setAcceptingId(bidId);
    setError(null);
    const result = await acceptBid(needPostId, bidId);
    setAcceptingId(null);

    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-primary">{error}</p>}
      {sorted.map((bid) => (
        <div key={bid.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">
                {bid.seller?.business_name ?? bid.seller?.full_name ?? "Seller"}
              </p>
              {bid.id === bestBidId && <Badge variant="dark">Best bid so far</Badge>}
              {bid.id === acceptedBidId && <Badge variant="success">Accepted</Badge>}
            </div>
            {bid.message && <p className="mt-1 text-sm text-muted">{bid.message}</p>}
            <p className="mt-1 text-xs text-muted">{formatRelativeDate(bid.created_at)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <p className="font-mono text-sm font-bold text-primary">{formatPrice(bid.amount)}</p>
            {canAccept && (
              <Button
                size="sm"
                onClick={() => handleAccept(bid.id)}
                disabled={acceptingId !== null}
              >
                {acceptingId === bid.id ? "Accepting…" : "Accept"}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
