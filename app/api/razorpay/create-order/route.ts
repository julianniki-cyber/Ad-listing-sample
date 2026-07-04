import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRazorpayClient, isRazorpayConfigured } from "@/lib/razorpay";

export async function POST(request: Request) {
  if (!isRazorpayConfigured()) {
    return NextResponse.json({ error: "payments_not_configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listingId, planId } = await request.json();
  if (!listingId || !planId) {
    return NextResponse.json({ error: "Missing listingId or planId" }, { status: 400 });
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id, user_id")
    .eq("id", listingId)
    .single();
  if (!listing || listing.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: plan } = await supabase
    .from("feature_plans")
    .select("*")
    .eq("id", planId)
    .eq("is_active", true)
    .single();
  if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const razorpay = getRazorpayClient()!;
  const amountPaise = Math.round(Number(plan.price_inr) * 100);

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    notes: { listingId, planId, userId: user.id },
  });

  const { error: insertError } = await supabase.from("payments").insert({
    user_id: user.id,
    listing_id: listingId,
    feature_plan_id: planId,
    razorpay_order_id: order.id,
    amount: plan.price_inr,
    status: "created",
  });
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    orderId: order.id,
    amount: amountPaise,
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID,
    plan,
  });
}
