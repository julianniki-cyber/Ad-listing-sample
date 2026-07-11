"use client";

import { useRouter } from "next/navigation";
import { RazorpayCheckoutButton } from "@/components/payments/RazorpayCheckoutButton";
import type { CreditPack } from "@/types";

export function CreditCheckoutButton({ pack }: { pack: CreditPack | undefined }) {
  const router = useRouter();

  return (
    <RazorpayCheckoutButton
      createOrderUrl="/api/razorpay/credits/create-order"
      verifyUrl="/api/razorpay/credits/verify"
      requestBody={{ packId: pack?.id }}
      description={`${pack?.credits ?? 0} Doopido credits`}
      buttonLabel="Buy credits"
      disabled={!pack}
      onSuccess={() => {
        router.push("/dashboard/credits?purchased=1");
        router.refresh();
      }}
    />
  );
}
