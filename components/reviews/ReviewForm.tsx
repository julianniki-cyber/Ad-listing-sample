"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { submitReview } from "@/app/now/actions";
import { reviewSchema } from "@/lib/validations";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export function ReviewForm({ needPostId, sellerId }: { needPostId: string; sellerId: string }) {
  const router = useRouter();
  const [isPositive, setIsPositive] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (isPositive === null) {
      setError("Choose like or dislike first.");
      return;
    }

    const parsed = reviewSchema.safeParse({ isPositive, comment });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setLoading(true);
    const result = await submitReview(needPostId, sellerId, parsed.data);
    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-border p-4">
      <p className="text-sm font-semibold text-foreground">How was your experience?</p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={isPositive === true ? "primary" : "secondary"}
          size="sm"
          onClick={() => setIsPositive(true)}
        >
          Like
        </Button>
        <Button
          type="button"
          variant={isPositive === false ? "primary" : "secondary"}
          size="sm"
          onClick={() => setIsPositive(false)}
        >
          Dislike
        </Button>
      </div>
      <Textarea
        rows={3}
        placeholder="Tell others about your experience (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {error && <p className="text-sm text-primary">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  );
}
