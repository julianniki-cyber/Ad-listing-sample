"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { authSchema } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PhoneOtpFields } from "./PhoneOtpFields";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [useEmail, setUseEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function redirectAfterLogin() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile?.role) {
        router.push("/onboarding");
        router.refresh();
        return;
      }
    }

    const next = searchParams.get("next") ?? "/dashboard/listings";
    router.push(next);
    router.refresh();
  }

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword(result.data);
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    await redirectAfterLogin();
  }

  if (useEmail) {
    return (
      <div className="space-y-4">
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-primary">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Logging in…" : "Log in"}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => setUseEmail(false)}
          className="text-sm text-muted hover:text-primary"
        >
          Log in with phone instead
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PhoneOtpFields shouldCreateUser={false} onVerified={redirectAfterLogin} />
      <button
        type="button"
        onClick={() => setUseEmail(true)}
        className="text-sm text-muted hover:text-primary"
      >
        Have an existing email login? Use it here
      </button>
    </div>
  );
}
