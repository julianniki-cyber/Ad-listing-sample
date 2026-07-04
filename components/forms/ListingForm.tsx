"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createListing, updateListing } from "@/app/(dashboard)/dashboard/actions";
import { listingSchema } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { Category, Listing } from "@/types";

export function ListingForm({
  mode,
  categories,
  listing,
}: {
  mode: "create" | "edit";
  categories: Category[];
  listing?: Listing;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(listing?.title ?? "");
  const [description, setDescription] = useState(listing?.description ?? "");
  const [price, setPrice] = useState(listing ? String(listing.price) : "");
  const [categoryId, setCategoryId] = useState(listing?.category_id ?? categories[0]?.id ?? "");
  const [locationCity, setLocationCity] = useState(listing?.location_city ?? "");
  const [locationState, setLocationState] = useState(listing?.location_state ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = listingSchema.safeParse({
      title,
      description,
      price,
      categoryId,
      locationCity,
      locationState,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setLoading(true);
    const result =
      mode === "create"
        ? await createListing(parsed.data)
        : await updateListing(listing!.id, parsed.data);
    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    if (mode === "create" && "id" in result) {
      router.push(`/dashboard/listings/${result.id}/edit?created=1`);
    } else {
      router.push("/dashboard/listings");
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Description</label>
        <Textarea
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Price (INR)</label>
          <Input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Category</label>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">City</label>
          <Input
            value={locationCity}
            onChange={(e) => setLocationCity(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            State <span className="text-muted">(optional)</span>
          </label>
          <Input value={locationState ?? ""} onChange={(e) => setLocationState(e.target.value)} />
        </div>
      </div>

      {error && <p className="text-sm text-primary">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : mode === "create" ? "Create listing" : "Save changes"}
      </Button>
    </form>
  );
}
