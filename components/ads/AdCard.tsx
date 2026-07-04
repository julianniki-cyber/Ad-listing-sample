import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { ListingFeedItem } from "@/types";
import { FeaturedBadge } from "./FeaturedBadge";

export function AdCard({ listing }: { listing: ListingFeedItem }) {
  return (
    <Link
      href={`/ad/${listing.slug}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative overflow-hidden bg-zinc-100">
        {listing.thumbnail_url ? (
          // Intentionally a plain <img>, not next/image: the masonry layout relies on
          // each image's natural intrinsic aspect ratio for variable card heights.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.thumbnail_url}
            alt={listing.title}
            loading="lazy"
            className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center text-muted">
            No image
          </div>
        )}
        {listing.is_featured && (
          <div className="absolute left-2 top-2">
            <FeaturedBadge />
          </div>
        )}
      </div>

      <div className="space-y-1 p-3">
        <p className="text-base font-semibold text-primary">{formatPrice(listing.price)}</p>
        <p className="truncate text-sm font-medium text-foreground">{listing.title}</p>
        <p className="truncate text-xs text-muted">{listing.location_city}</p>
      </div>
    </Link>
  );
}
