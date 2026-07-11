import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRazorpayConfigured } from "@/lib/razorpay";

// Safety net alongside /api/razorpay/verify and /api/razorpay/credits/verify:
// reconciles payment state from Razorpay's server-to-server webhook in case
// the browser closed before the client-side verify call fired. Configure
// this URL + a webhook secret in the Razorpay dashboard once you have a
// live account (see SETUP.md). Handles both flows (featuring a listing,
// buying credits) since they share one order-id namespace on Razorpay.
export async function POST(request: Request) {
  if (!isRazorpayConfigured() || !process.env.RAZORPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "payments_not_configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  if (!signature || signature !== expectedSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const admin = createAdminClient();

  if (event.event !== "payment.captured" && event.event !== "payment.failed") {
    return NextResponse.json({ ok: true });
  }

  const payment = event.payload?.payment?.entity;
  const orderId = payment?.order_id;
  if (!orderId) return NextResponse.json({ ok: true });

  const { data: featurePaymentRow } = await admin
    .from("payments")
    .select("*, feature_plan:feature_plans(duration_days)")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();

  if (featurePaymentRow) {
    if (featurePaymentRow.status === "paid") return NextResponse.json({ ok: true });

    if (event.event === "payment.failed") {
      await admin.from("payments").update({ status: "failed" }).eq("id", featurePaymentRow.id);
      return NextResponse.json({ ok: true });
    }

    await admin
      .from("payments")
      .update({ status: "paid", razorpay_payment_id: payment.id })
      .eq("id", featurePaymentRow.id);

    const durationDays = featurePaymentRow.feature_plan?.duration_days ?? 7;
    const endsAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    await admin.from("featured_listings").upsert(
      {
        listing_id: featurePaymentRow.listing_id,
        payment_id: featurePaymentRow.id,
        starts_at: new Date().toISOString(),
        ends_at: endsAt,
      },
      { onConflict: "listing_id" },
    );
    return NextResponse.json({ ok: true });
  }

  const { data: creditPaymentRow } = await admin
    .from("credit_payments")
    .select("id, status")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();

  if (creditPaymentRow) {
    if (creditPaymentRow.status === "paid") return NextResponse.json({ ok: true });

    if (event.event === "payment.failed") {
      await admin.from("credit_payments").update({ status: "failed" }).eq("id", creditPaymentRow.id);
      return NextResponse.json({ ok: true });
    }

    await admin
      .from("credit_payments")
      .update({ razorpay_payment_id: payment.id })
      .eq("id", creditPaymentRow.id);

    await admin.rpc("grant_purchased_credits", { p_payment_id: creditPaymentRow.id });
  }

  return NextResponse.json({ ok: true });
}
