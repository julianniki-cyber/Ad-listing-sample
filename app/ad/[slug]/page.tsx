import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getListingBySlug } from "@/lib/queries";
import { formatPrice, formatRelativeDate } from "@/lib/format";
import { isListingFeatured } from "@/lib/listings";
import { AdGallery } from "@/components/ads/AdGallery";
import { FeaturedBadge } from "@/components/ads/FeaturedBadge";

export default async function AdDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const listing = await getListingBySlug(supabase, slug);

  if (!listing || listing.status !== "published") {
    notFound();
  }

  await supabase.rpc("increment_listing_view", { p_listing_id: listing.id });

  const isFeatured = isListingFeatured(listing.featured_listings);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="grid gap-8 md:grid-cols-2">
        <AdGallery images={listing.listing_images} title={listing.title} />

        <div>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-semibold text-foreground">{listing.title}</h1>
            {isFeatured && <FeaturedBadge />}
          </div>
          <p className="mt-2 text-3xl font-bold text-primary">{formatPrice(listing.price)}</p>

          <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted">
            <span>{listing.category?.name}</span>
            <span>&middot;</span>
            <span>
              {listing.location_city}
              {listing.location_state ? `, ${listing.location_state}` : ""}
            </span>
            <span>&middot;</span>
            <span>{formatRelativeDate(listing.created_at)}</span>
          </div>

          <div className="mt-6 rounded-2xl border border-border p-4">
            <p className="text-sm font-medium text-foreground">
              {listing.profile?.full_name ?? "Seller"}
            </p>
            {listing.profile?.phone && (
              <p className="mt-1 text-sm text-muted">{listing.profile.phone}</p>
            )}
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-foreground">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
              {listing.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
