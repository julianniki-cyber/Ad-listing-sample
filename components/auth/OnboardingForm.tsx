"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { completeProfile } from "@/app/(dashboard)/dashboard/actions";
import { Button } from "@/components/ui/Button";
import { RoleToggle } from "./RoleToggle";
import { BuyerSignupFields, type BuyerFieldsValue } from "./BuyerSignupFields";
import { SellerSignupFields, type SellerFieldsValue } from "./SellerSignupFields";
import type { UserRole } from "@/types";

export function OnboardingForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("buyer");
  const [buyerFields, setBuyerFields] = useState<BuyerFieldsValue>({ fullName: "", email: "" });
  const [sellerFields, setSellerFields] = useState<SellerFieldsValue>({
    fullName: "",
    email: "",
    whatsappNumber: "",
    businessName: "",
  });
  const [aadhaarImagePath, setAadhaarImagePath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (role === "seller" && !aadhaarImagePath) {
      setError("Please upload your Aadhaar card before continuing.");
      return;
    }

    setLoading(true);
    const result =
      role === "buyer"
        ? await completeProfile({ role: "buyer", ...buyerFields })
        : await completeProfile({
            role: "seller",
            ...sellerFields,
            aadhaarImagePath: aadhaarImagePath ?? undefined,
          });
    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <RoleToggle role={role} onChange={setRole} />
      {role === "buyer" ? (
        <BuyerSignupFields value={buyerFields} onChange={setBuyerFields} />
      ) : (
        <SellerSignupFields
          value={sellerFields}
          onChange={setSellerFields}
          userId={userId}
          onAadhaarUploaded={setAadhaarImagePath}
        />
      )}
      {error && <p className="text-sm text-primary">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Finishing up…" : "Continue"}
      </Button>
    </form>
  );
}
