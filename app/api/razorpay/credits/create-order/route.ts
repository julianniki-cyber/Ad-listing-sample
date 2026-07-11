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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "seller") {
    return NextResponse.json({ error: "Only sellers can buy credits" }, { status: 403 });
  }

  const { packId } = await request.json();
  if (!packId) {
    return NextResponse.json({ error: "Missing packId" }, { status: 400 });
  }

  const { data: pack } = await supabase
    .from("credit_packs")
    .select("*")
    .eq("id", packId)
    .eq("is_active", true)
    .single();
  if (!pack) return NextResponse.json({ error: "Invalid credit pack" }, { status: 400 });

  const razorpay = getRazorpayClient()!;
  const amountPaise = Math.round(Number(pack.price_inr) * 100);

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    notes: { packId, userId: user.id },
  });

  const { error: insertError } = await supabase.from("credit_payments").insert({
    user_id: user.id,
    credit_pack_id: packId,
    razorpay_order_id: order.id,
    amount: pack.price_inr,
    credits: pack.credits,
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
    pack,
  });
}
