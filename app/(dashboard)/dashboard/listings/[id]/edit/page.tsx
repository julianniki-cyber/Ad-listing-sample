import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getListingById } from "@/lib/queries";
import { ListingForm } from "@/components/forms/ListingForm";
import { ImageUploader } from "@/components/forms/ImageUploader";

export default async function EditListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [categories, listing] = await Promise.all([
    getCategories(supabase),
    getListingById(supabase, id),
  ]);

  if (!listing || listing.user_id !== user.id) notFound();

  return (
    <div>
      {created === "1" && (
        <div className="mb-6 rounded-xl bg-primary-soft p-4 text-sm text-primary">
          Listing created! Add some photos to help buyers notice it.
        </div>
      )}

      <h1 className="text-2xl font-semibold text-foreground">Edit listing</h1>

      <div className="mt-6 max-w-xl space-y-8">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Photos</h2>
          <ImageUploader
            listingId={listing.id}
            userId={user.id}
            initialImages={listing.listing_images}
          />
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Details</h2>
          <ListingForm mode="edit" categories={categories} listing={listing} />
        </div>
      </div>
    </div>
  );
}
