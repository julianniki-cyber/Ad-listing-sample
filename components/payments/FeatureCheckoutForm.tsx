"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FeaturePlanPicker } from "./FeaturePlanPicker";
import { RazorpayCheckoutButton } from "./RazorpayCheckoutButton";
import type { FeaturePlan } from "@/types";

export function FeatureCheckoutForm({
  listingId,
  plans,
}: {
  listingId: string;
  plans: FeaturePlan[];
}) {
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(plans[0]?.id ?? null);
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);

  return (
    <div className="space-y-6">
      <FeaturePlanPicker plans={plans} selectedPlanId={selectedPlanId} onSelect={setSelectedPlanId} />
      <RazorpayCheckoutButton
        createOrderUrl="/api/razorpay/create-order"
        verifyUrl="/api/razorpay/verify"
        requestBody={{ listingId, planId: selectedPlanId }}
        description={`Feature listing — ${selectedPlan?.name ?? ""}`}
        buttonLabel="Feature this ad"
        disabled={!selectedPlanId}
        onSuccess={() => {
          router.push("/dashboard/listings?featured=1");
          router.refresh();
        }}
      />
    </div>
  );
}
