import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getBidsForNeedPost,
  getMyBid,
  getNeedPostById,
  getReviewForNeedPost,
  getSellerCreditsBalance,
  hasRevealedBids,
} from "@/lib/queries";
import { formatPrice, formatRelativeDate } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { BidForm } from "@/components/bids/BidForm";
import { BidList } from "@/components/bids/BidList";
import { RevealBidsPrompt } from "@/components/bids/RevealBidsPrompt";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReviewDisplay } from "@/components/reviews/ReviewDisplay";

export default async function NeedPostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const needPost = await getNeedPostById(supabase, id);
  if (!needPost) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: "buyer" | "seller" | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    role = profile?.role ?? null;
  }

  const isBuyerOwner = user?.id === needPost.buyer_id;
  const isSeller = role === "seller";
  const isOpen = needPost.status === "open";

  const bids = await getBidsForNeedPost(supabase, id);
  const myBid = isSeller && user ? await getMyBid(supabase, id, user.id) : null;
  const revealed = isSeller && user ? await hasRevealedBids(supabase, id, user.id) : false;
  const creditsBalance = isSeller && user ? await getSellerCreditsBalance(supabase, user.id) : 0;

  const acceptedBid = needPost.accepted_bid_id
    ? bids.find((b) => b.id === needPost.accepted_bid_id)
    : null;
  const review = !isOpen ? await getReviewForNeedPost(supabase, id) : null;

  // A seller who hasn't revealed sees, at most, their own bid row via RLS —
  // show the reveal prompt whenever there's more to see than that.
  const showRevealPrompt =
    isSeller && !isBuyerOwner && !revealed && needPost.bid_count > (myBid ? 1 : 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground">{needPost.headline}</h1>
        <Badge variant={isOpen ? "primary" : "neutral"}>
          {isOpen ? "Open" : "Offer accepted"}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted">
        <span>{needPost.category?.name}</span>
        <span>&middot;</span>
        <span>{needPost.location_city}</span>
        <span>&middot;</span>
        <span>{formatRelativeDate(needPost.created_at)}</span>
        {needPost.budget !== null && (
          <>
            <span>&middot;</span>
            <span className="font-medium text-primary">Budget: {formatPrice(needPost.budget)}</span>
          </>
        )}
      </div>

      <p className="mt-6 whitespace-pre-wrap text-sm text-foreground">{needPost.description}</p>
      <p className="mt-4 text-sm text-muted">Posted by {needPost.buyer?.full_name ?? "Buyer"}</p>

      {!isOpen && acceptedBid && (
        <div className="mt-6 rounded-2xl border border-primary bg-primary-soft p-4">
          <p className="text-sm font-medium text-foreground">
            Offer accepted: {acceptedBid.seller?.business_name ?? acceptedBid.seller?.full_name} at{" "}
            {formatPrice(acceptedBid.amount)}
          </p>
        </div>
      )}

      <div className="mt-8 space-y-6">
        <h2 className="text-lg font-semibold text-foreground">Bids</h2>

        {isSeller && isOpen && <BidForm needPostId={id} existingBid={myBid} />}

        {showRevealPrompt && (
          <RevealBidsPrompt needPostId={id} bidCount={needPost.bid_count} creditsBalance={creditsBalance} />
        )}

        <BidList needPostId={id} bids={bids} canAccept={isBuyerOwner && isOpen} acceptedBidId={needPost.accepted_bid_id} />

        {!user && (
          <p className="text-sm text-muted">Log in as a seller to place a bid on this request.</p>
        )}
      </div>

      {!isOpen && isBuyerOwner && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Review</h2>
          {review ? (
            <ReviewDisplay review={review} />
          ) : acceptedBid ? (
            <ReviewForm needPostId={id} sellerId={acceptedBid.seller_id} />
          ) : null}
        </div>
      )}

      {!isOpen && !isBuyerOwner && review && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Review</h2>
          <ReviewDisplay review={review} />
        </div>
      )}
    </div>
  );
}
