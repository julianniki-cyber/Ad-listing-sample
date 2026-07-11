"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { revealBids } from "@/app/now/actions";
import { REVEAL_COST_CREDITS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";

export function RevealBidsPrompt({
  needPostId,
  bidCount,
  creditsBalance,
}: {
  needPostId: string;
  bidCount: number;
  creditsBalance: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAfford = creditsBalance >= REVEAL_COST_CREDITS;

  async function handleReveal() {
    setLoading(true);
    setError(null);
    const result = await revealBids(needPostId);
    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-dashed border-border p-4 text-center">
      <p className="text-sm font-medium text-foreground">
        {bidCount} bid{bidCount === 1 ? "" : "s"} received
      </p>
      <p className="mt-1 text-sm text-muted">
        Reveal all bids for {REVEAL_COST_CREDITS} credits (you have {creditsBalance}).
      </p>
      {error && <p className="mt-2 text-sm text-primary">{error}</p>}
      {canAfford ? (
        <Button className="mt-3" onClick={handleReveal} disabled={loading}>
          {loading ? "Revealing…" : `Reveal bids (${REVEAL_COST_CREDITS} credits)`}
        </Button>
      ) : (
        <Link href="/dashboard/credits" className="mt-3 inline-block">
          <Button variant="secondary">Buy more credits</Button>
        </Link>
      )}
    </div>
  );
}
