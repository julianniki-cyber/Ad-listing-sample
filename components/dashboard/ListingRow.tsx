"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteListing } from "@/app/(dashboard)/dashboard/actions";
import { formatPrice } from "@/lib/format";
import { isListingFeatured } from "@/lib/listings";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import type { ListingWithRelations } from "@/types";

export function ListingRow({ listing }: { listing: ListingWithRelations }) {
  const router = useRouter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isFeatured = isListingFeatured(listing.featured_listings);
  const thumbnail = [...listing.listing_images].sort((a, b) => a.sort_order - b.sort_order)[0];

  async function handleDelete() {
    setDeleting(true);
    await deleteListing(listing.id);
    setDeleting(false);
    setConfirmingDelete(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border p-4">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-alt">
        {thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail.url} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{listing.title}</p>
          {isFeatured && <Badge>Featured</Badge>}
          {listing.status === "sold" && <Badge variant="neutral">Sold</Badge>}
        </div>
        <p className="font-mono text-sm font-bold text-primary">{formatPrice(listing.price)}</p>
        <p className="text-xs text-muted">{listing.location_city}</p>
      </div>

      <div className="flex shrink-0 gap-2">
        <Link href={`/ad/${listing.slug}`}>
          <Button variant="ghost" size="sm">
            View
          </Button>
        </Link>
        <Link href={`/dashboard/listings/${listing.id}/edit`}>
          <Button variant="secondary" size="sm">
            Edit
          </Button>
        </Link>
        {!isFeatured && (
          <Link href={`/dashboard/listings/${listing.id}/feature`}>
            <Button variant="secondary" size="sm">
              Feature
            </Button>
          </Link>
        )}
        <Button variant="danger" size="sm" onClick={() => setConfirmingDelete(true)}>
          Delete
        </Button>
      </div>

      <Modal open={confirmingDelete} onClose={() => setConfirmingDelete(false)}>
        <h2 className="text-lg font-semibold text-foreground">Delete this listing?</h2>
        <p className="mt-2 text-sm text-muted">
          This will remove &ldquo;{listing.title}&rdquo; from Doopido. This can&apos;t be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
