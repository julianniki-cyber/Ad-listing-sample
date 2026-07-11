"use client";

import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase/client";
import { deleteListingImage } from "@/app/(dashboard)/dashboard/actions";
import {
  ALLOWED_IMAGE_TYPES,
  LISTING_IMAGES_BUCKET,
  MAX_IMAGES_PER_LISTING,
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGE_SIZE_MB,
} from "@/lib/constants";
import type { ListingImage } from "@/types";

export function ImageUploader({
  listingId,
  userId,
  initialImages,
}: {
  listingId: string;
  userId: string;
  initialImages: ListingImage[];
}) {
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remainingSlots = MAX_IMAGES_PER_LISTING - images.length;

  async function handleFilesSelected(e: ChangeEvent<HTMLInputElement>) {
    setError(null);
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    if (files.length > remainingSlots) {
      setError(`You can add up to ${MAX_IMAGES_PER_LISTING} images per listing.`);
      return;
    }

    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setError("Only JPG, PNG, or WebP images are allowed.");
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        setError(`Each image must be under ${MAX_IMAGE_SIZE_MB}MB.`);
        return;
      }
    }

    setUploading(true);
    const supabase = createClient();

    try {
      let sortOrder = images.length;
      for (const file of files) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${userId}/${listingId}/${nanoid(10)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(LISTING_IMAGES_BUCKET)
          .upload(path, file);
        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from(LISTING_IMAGES_BUCKET).getPublicUrl(path);

        const { data: row, error: insertError } = await supabase
          .from("listing_images")
          .insert({
            listing_id: listingId,
            storage_path: path,
            url: publicUrl,
            sort_order: sortOrder,
          })
          .select("*")
          .single();
        if (insertError) throw insertError;

        setImages((prev) => [...prev, row as ListingImage]);
        sortOrder += 1;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(imageId: string) {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    const result = await deleteListingImage(imageId);
    if ("error" in result) setError(result.error);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((image) => (
          <div key={image.id} className="group relative aspect-square overflow-hidden rounded-xl bg-surface-alt">
            <Image src={image.url} alt="" fill className="object-cover" sizes="150px" />
            <button
              type="button"
              onClick={() => handleDelete(image.id)}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remove image"
            >
              &times;
            </button>
          </div>
        ))}

        {remainingSlots > 0 && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border text-center text-xs text-muted hover:border-primary hover:text-primary">
            {uploading ? "Uploading…" : "+ Add photo"}
            <input
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(",")}
              multiple
              className="hidden"
              onChange={handleFilesSelected}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      <p className="text-xs text-muted">
        Up to {MAX_IMAGES_PER_LISTING} images, {MAX_IMAGE_SIZE_MB}MB each (JPG, PNG, WebP).
      </p>

      {error && <p className="text-sm text-primary">{error}</p>}
    </div>
  );
}
