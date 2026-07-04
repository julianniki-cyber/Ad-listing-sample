import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyListings } from "@/lib/queries";
import { Button } from "@/components/ui/Button";
import { ListingRow } from "@/components/dashboard/ListingRow";

export default async function MyListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const listings = await getMyListings(supabase, user!.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">My listings</h1>
        <Link href="/dashboard/listings/new">
          <Button>Post an ad</Button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-2 text-center">
          <p className="text-foreground">You haven&apos;t posted any ads yet.</p>
          <Link href="/dashboard/listings/new">
            <Button>Post your first ad</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {listings.map((listing) => (
            <ListingRow key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
