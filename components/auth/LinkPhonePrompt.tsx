"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { otpSchema, phoneSchema } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const DISMISS_KEY = "doopido:link-phone-dismissed";

export function LinkPhonePrompt() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<"prompt" | "phone" | "otp" | "done">("prompt");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY)) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && !user.phone) setVisible(true);
    });
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

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
    const { error: updateError } = await supabase.auth.updateUser({ phone: result.data.phone });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
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
      type: "phone_change",
    });
    setLoading(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    setStep("done");
  }

  if (!visible) return null;

  return (
    <div className="mb-6 rounded-xl border border-border bg-primary-soft p-4">
      {step === "prompt" && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-foreground">
            Add a phone number to log in faster next time with a one-time code.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setStep("phone")}>
              Add phone number
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Not now
            </Button>
          </div>
        </div>
      )}

      {step === "phone" && (
        <form onSubmit={handleSendCode} className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-foreground">Phone number</label>
            <Input
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Sending…" : "Send code"}
          </Button>
          {error && <p className="w-full text-sm text-primary">{error}</p>}
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyCode} className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-foreground">
              Enter the 6-digit code sent to {phone}
            </label>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          </div>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Verifying…" : "Verify"}
          </Button>
          {error && <p className="w-full text-sm text-primary">{error}</p>}
        </form>
      )}

      {step === "done" && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-foreground">
            Phone number linked — you can log in with it next time.
          </p>
          <Button size="sm" variant="ghost" onClick={dismiss}>
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
