"use client";

import { useState } from "react";
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
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(plans[0]?.id ?? null);

  return (
    <div className="space-y-6">
      <FeaturePlanPicker plans={plans} selectedPlanId={selectedPlanId} onSelect={setSelectedPlanId} />
      <RazorpayCheckoutButton listingId={listingId} planId={selectedPlanId} />
    </div>
  );
}
