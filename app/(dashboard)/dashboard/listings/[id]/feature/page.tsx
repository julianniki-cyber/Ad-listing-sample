import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFeaturePlans, getListingById } from "@/lib/queries";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { PaymentsDisabledNotice } from "@/components/payments/PaymentsDisabledNotice";
import { FeatureCheckoutForm } from "@/components/payments/FeatureCheckoutForm";

export default async function FeatureListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const listing = await getListingById(supabase, id);
  if (!listing || listing.user_id !== user.id) notFound();

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-foreground">Feature &ldquo;{listing.title}&rdquo;</h1>
      <p className="mt-1 text-sm text-muted">
        Featured listings get priority placement and a badge for the duration you choose.
      </p>

      <div className="mt-6">
        {isRazorpayConfigured() ? (
          <FeatureCheckoutForm listingId={listing.id} plans={await getFeaturePlans(supabase)} />
        ) : (
          <PaymentsDisabledNotice />
        )}
      </div>
    </div>
  );
}
