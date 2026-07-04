"use client";

import { Input } from "@/components/ui/Input";

export function PriceRangeInput({
  minPrice,
  maxPrice,
  onChange,
}: {
  minPrice: string;
  maxPrice: string;
  onChange: (next: { minPrice: string; maxPrice: string }) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={0}
        placeholder="Min price"
        value={minPrice}
        onChange={(e) => onChange({ minPrice: e.target.value, maxPrice })}
        className="w-28"
      />
      <span className="text-muted">–</span>
      <Input
        type="number"
        min={0}
        placeholder="Max price"
        value={maxPrice}
        onChange={(e) => onChange({ minPrice, maxPrice: e.target.value })}
        className="w-28"
      />
    </div>
  );
}
