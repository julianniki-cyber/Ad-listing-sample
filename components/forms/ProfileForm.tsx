"use client";

import { useState, type FormEvent } from "react";
import { updateProfile } from "@/app/(dashboard)/dashboard/actions";
import { profileSchema } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Profile } from "@/types";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const parsed = profileSchema.safeParse({ fullName, phone });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setLoading(true);
    const result = await updateProfile(parsed.data);
    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }
    setSuccess(true);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Full name</label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Phone <span className="text-muted">(shown on your listings)</span>
        </label>
        <Input value={phone ?? ""} onChange={(e) => setPhone(e.target.value)} />
      </div>
      {error && <p className="text-sm text-primary">{error}</p>}
      {success && <p className="text-sm text-green-600">Profile updated.</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
