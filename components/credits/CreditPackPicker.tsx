import { formatPrice } from "@/lib/format";
import type { CreditPack } from "@/types";

export function CreditPackPicker({
  packs,
  selectedPackId,
  onSelect,
}: {
  packs: CreditPack[];
  selectedPackId: string | null;
  onSelect: (packId: string) => void;
}) {
  return (
    <div className="space-y-2">
      {packs.map((pack) => (
        <label
          key={pack.id}
          className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-colors ${
            selectedPackId === pack.id
              ? "border-primary bg-primary-soft"
              : "border-border hover:border-primary/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="credit-pack"
              checked={selectedPackId === pack.id}
              onChange={() => onSelect(pack.id)}
              className="accent-primary"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">{pack.name}</p>
              <p className="text-xs text-muted">{pack.credits} credits</p>
            </div>
          </div>
          <p className="text-sm font-semibold text-primary">{formatPrice(pack.price_inr)}</p>
        </label>
      ))}
    </div>
  );
}
