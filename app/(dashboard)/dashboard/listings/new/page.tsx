import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/queries";
import { ListingForm } from "@/components/forms/ListingForm";

export default async function NewListingPage() {
  const supabase = await createClient();
  const categories = await getCategories(supabase);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Post an ad</h1>
      <p className="mt-1 text-sm text-muted">
        You&apos;ll be able to add photos right after creating your listing.
      </p>
      <div className="mt-6 max-w-xl">
        <ListingForm mode="create" categories={categories} />
      </div>
    </div>
  );
}
