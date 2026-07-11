"use client";

import { useState } from "react";
import { CreditPackPicker } from "./CreditPackPicker";
import { CreditCheckoutButton } from "./CreditCheckoutButton";
import type { CreditPack } from "@/types";

export function CreditPurchaseForm({ packs }: { packs: CreditPack[] }) {
  const [selectedPackId, setSelectedPackId] = useState<string | null>(packs[0]?.id ?? null);
  const selectedPack = packs.find((pack) => pack.id === selectedPackId);

  return (
    <div className="space-y-6">
      <CreditPackPicker packs={packs} selectedPackId={selectedPackId} onSelect={setSelectedPackId} />
      <CreditCheckoutButton pack={selectedPack} />
    </div>
  );
}
