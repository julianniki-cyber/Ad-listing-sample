"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { listingSchema, profileSchema, type ListingInput, type ProfileInput } from "@/lib/validations";
import { slugify } from "@/lib/slugify";

type ActionResult<T = { ok: true }> = T | { error: string };

export async function createListing(
  input: ListingInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const parsed = listingSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const slug = slugify(parsed.data.title);

  const { data, error } = await supabase
    .from("listings")
    .insert({
      user_id: user.id,
      category_id: parsed.data.categoryId,
      title: parsed.data.title,
      slug,
      description: parsed.data.description,
      price: parsed.data.price,
      location_city: parsed.data.locationCity,
      location_state: parsed.data.locationState || null,
      status: "published",
    })
    .select("id, slug")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/dashboard/listings");
  return data;
}

export async function updateListing(
  listingId: string,
  input: ListingInput,
): Promise<ActionResult> {
  const parsed = listingSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { error } = await supabase
    .from("listings")
    .update({
      category_id: parsed.data.categoryId,
      title: parsed.data.title,
      description: parsed.data.description,
      price: parsed.data.price,
      location_city: parsed.data.locationCity,
      location_state: parsed.data.locationState || null,
    })
    .eq("id", listingId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/dashboard/listings");
  return { ok: true };
}

export async function deleteListing(listingId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { error } = await supabase
    .from("listings")
    .update({ status: "deleted" })
    .eq("id", listingId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/dashboard/listings");
  return { ok: true };
}

export async function deleteListingImage(imageId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { data: image } = await supabase
    .from("listing_images")
    .select("storage_path")
    .eq("id", imageId)
    .single();

  const { error } = await supabase.from("listing_images").delete().eq("id", imageId);
  if (error) return { error: error.message };

  if (image?.storage_path) {
    await supabase.storage.from("listing-images").remove([image.storage_path]);
  }

  return { ok: true };
}

export async function updateProfile(input: ProfileInput): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName, phone: parsed.data.phone || null })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/profile");
  return { ok: true };
}
