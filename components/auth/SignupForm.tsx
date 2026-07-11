"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { completeProfile } from "@/app/(dashboard)/dashboard/actions";
import { Button } from "@/components/ui/Button";
import { RoleToggle } from "./RoleToggle";
import { PhoneOtpFields } from "./PhoneOtpFields";
import { BuyerSignupFields, type BuyerFieldsValue } from "./BuyerSignupFields";
import { SellerSignupFields, type SellerFieldsValue } from "./SellerSignupFields";
import type { UserRole } from "@/types";

type Step = "role" | "phone" | "profile";

export function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<UserRole>("buyer");
  const [userId, setUserId] = useState<string | null>(null);
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

  async function handlePhoneVerified() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
    setStep("profile");
  }

  async function handleProfileSubmit(e: FormEvent) {
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

  if (step === "role") {
    return (
      <div className="space-y-6">
        <RoleToggle role={role} onChange={setRole} />
        <Button onClick={() => setStep("phone")} className="w-full">
          Continue
        </Button>
      </div>
    );
  }

  if (step === "phone") {
    return <PhoneOtpFields shouldCreateUser={true} onVerified={handlePhoneVerified} />;
  }

  return (
    <form onSubmit={handleProfileSubmit} className="space-y-4">
      {role === "buyer" ? (
        <BuyerSignupFields value={buyerFields} onChange={setBuyerFields} />
      ) : (
        <SellerSignupFields
          value={sellerFields}
          onChange={setSellerFields}
          userId={userId ?? ""}
          onAadhaarUploaded={setAadhaarImagePath}
        />
      )}
      {error && <p className="text-sm text-primary">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Finishing up…" : "Complete signup"}
      </Button>
    </form>
  );
}
