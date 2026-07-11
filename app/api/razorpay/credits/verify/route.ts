import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRazorpayConfigured } from "@/lib/razorpay";

export async function POST(request: Request) {
  if (!isRazorpayConfigured()) {
    return NextResponse.json({ error: "payments_not_configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing verification fields" }, { status: 400 });
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: payment } = await admin
    .from("credit_payments")
    .select("id, user_id")
    .eq("razorpay_order_id", razorpay_order_id)
    .single();

  if (!payment || payment.user_id !== user.id) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  await admin
    .from("credit_payments")
    .update({ razorpay_payment_id, razorpay_signature })
    .eq("id", payment.id);

  const { error: grantError } = await admin.rpc("grant_purchased_credits", {
    p_payment_id: payment.id,
  });
  if (grantError) return NextResponse.json({ error: grantError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
