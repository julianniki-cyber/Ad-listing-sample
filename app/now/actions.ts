"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { bidSchema, needPostSchema, reviewSchema, type BidInput, type NeedPostInput, type ReviewInput } from "@/lib/validations";

type ActionResult<T = { ok: true }> = T | { error: string };

export async function createNeedPost(
  input: NeedPostInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = needPostSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { data, error } = await supabase
    .from("need_posts")
    .insert({
      buyer_id: user.id,
      category_id: parsed.data.categoryId,
      headline: parsed.data.headline,
      description: parsed.data.description,
      budget: parsed.data.budget === "" ? null : parsed.data.budget,
      location_city: parsed.data.locationCity,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/now");
  revalidatePath("/dashboard/needs");
  return data;
}

export async function placeBid(needPostId: string, input: BidInput): Promise<ActionResult> {
  const parsed = bidSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { error } = await supabase.from("bids").upsert(
    {
      need_post_id: needPostId,
      seller_id: user.id,
      amount: parsed.data.amount,
      message: parsed.data.message || null,
    },
    { onConflict: "need_post_id,seller_id" },
  );

  if (error) return { error: error.message };

  revalidatePath(`/now/${needPostId}`);
  revalidatePath("/dashboard/bids");
  return { ok: true };
}

export async function acceptBid(needPostId: string, bidId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { error } = await supabase.rpc("accept_bid", {
    p_need_post_id: needPostId,
    p_bid_id: bidId,
  });
  if (error) return { error: error.message };

  revalidatePath(`/now/${needPostId}`);
  revalidatePath("/dashboard/needs");
  revalidatePath("/dashboard/bids");
  return { ok: true };
}

export async function revealBids(needPostId: string): Promise<ActionResult<{ balance: number }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { data, error } = await supabase.rpc("reveal_bids", { p_need_post_id: needPostId });
  if (error) return { error: error.message };

  revalidatePath(`/now/${needPostId}`);
  return { balance: data as number };
}

export async function submitReview(
  needPostId: string,
  sellerId: string,
  input: ReviewInput,
): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { error } = await supabase.from("reviews").insert({
    need_post_id: needPostId,
    buyer_id: user.id,
    seller_id: sellerId,
    is_positive: parsed.data.isPositive,
    comment: parsed.data.comment || null,
  });

  if (error) return { error: error.message };

  revalidatePath(`/now/${needPostId}`);
  return { ok: true };
}
