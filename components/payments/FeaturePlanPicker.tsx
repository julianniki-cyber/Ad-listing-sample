import { formatPrice } from "@/lib/format";
import type { FeaturePlan } from "@/types";

export function FeaturePlanPicker({
  plans,
  selectedPlanId,
  onSelect,
}: {
  plans: FeaturePlan[];
  selectedPlanId: string | null;
  onSelect: (planId: string) => void;
}) {
  return (
    <div className="space-y-2">
      {plans.map((plan) => (
        <label
          key={plan.id}
          className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-colors ${
            selectedPlanId === plan.id
              ? "border-primary bg-primary-soft"
              : "border-border hover:border-primary/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="feature-plan"
              checked={selectedPlanId === plan.id}
              onChange={() => onSelect(plan.id)}
              className="accent-primary"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">{plan.name}</p>
              <p className="text-xs text-muted">Priority placement + featured badge</p>
            </div>
          </div>
          <p className="text-sm font-semibold text-primary">{formatPrice(plan.price_inr)}</p>
        </label>
      ))}
    </div>
  );
}
