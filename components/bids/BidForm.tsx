"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { placeBid } from "@/app/now/actions";
import { bidSchema } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import type { Bid } from "@/types";

export function BidForm({ needPostId, existingBid }: { needPostId: string; existingBid: Bid | null }) {
  const router = useRouter();
  const [amount, setAmount] = useState(existingBid ? String(existingBid.amount) : "");
  const [message, setMessage] = useState(existingBid?.message ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = bidSchema.safeParse({ amount, message });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setLoading(true);
    const result = await placeBid(needPostId, parsed.data);
    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-border p-4">
      <p className="text-sm font-semibold text-foreground">
        {existingBid ? "Revise your bid" : "Place a bid"}
      </p>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Your price (INR)</label>
        <Input
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Message <span className="text-muted">(optional)</span>
        </label>
        <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>
      {error && <p className="text-sm text-primary">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : existingBid ? "Update bid" : "Submit bid"}
      </Button>
    </form>
  );
}
