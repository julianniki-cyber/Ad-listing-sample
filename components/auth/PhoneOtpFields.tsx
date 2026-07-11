"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { otpSchema, phoneSchema } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function PhoneOtpFields({
  shouldCreateUser,
  onVerified,
}: {
  shouldCreateUser: boolean;
  onVerified: () => void;
}) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const result = phoneSchema.safeParse({ phone });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid phone number");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: result.data.phone,
      options: { shouldCreateUser },
    });
    setLoading(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }
    setStep("otp");
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const result = otpSchema.safeParse({ token });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid code");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token: result.data.token,
      type: "sms",
    });
    setLoading(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    onVerified();
  }

  if (step === "phone") {
    return (
      <form onSubmit={handleSendCode} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Phone number</label>
          <Input
            type="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-primary">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending code…" : "Send code"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyCode} className="space-y-4">
      <p className="text-sm text-muted">
        Enter the 6-digit code sent to <span className="font-medium text-foreground">{phone}</span>.
      </p>
      <Input
        type="text"
        inputMode="numeric"
        placeholder="123456"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        maxLength={6}
        required
      />
      {error && <p className="text-sm text-primary">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Verifying…" : "Verify"}
      </Button>
      <button
        type="button"
        onClick={() => {
          setStep("phone");
          setToken("");
          setError(null);
        }}
        className="text-sm text-muted hover:text-primary"
      >
        Use a different number
      </button>
    </form>
  );
}
