import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyBids } from "@/lib/queries";
import { Button } from "@/components/ui/Button";
import { MyBidRow } from "@/components/bids/MyBidRow";

export default async function MyBidsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const bids = await getMyBids(supabase, user!.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">My bids</h1>
        <Link href="/now">
          <Button>Browse requests</Button>
        </Link>
      </div>

      {bids.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-2 text-center">
          <p className="text-foreground">You haven&apos;t placed any bids yet.</p>
          <Link href="/now">
            <Button>Browse open requests</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {bids.map((bid) => (
            <MyBidRow key={bid.id} bid={bid} needPost={bid.need_post} />
          ))}
        </div>
      )}
    </div>
  );
}
