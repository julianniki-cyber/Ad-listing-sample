import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCreditLedger, getCreditPacks, getSellerCreditsBalance } from "@/lib/queries";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { formatRelativeDate } from "@/lib/format";
import { PaymentsDisabledNotice } from "@/components/payments/PaymentsDisabledNotice";
import { CreditPurchaseForm } from "@/components/credits/CreditPurchaseForm";

export default async function CreditsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "seller") redirect("/dashboard");

  const [balance, ledger] = await Promise.all([
    getSellerCreditsBalance(supabase, user.id),
    getCreditLedger(supabase, user.id),
  ]);

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-foreground">Credits</h1>
      <p className="mt-1 text-sm text-muted">
        Spend credits to reveal all bids on a Doopido Now request.
      </p>

      <div className="mt-6 rounded-2xl border border-border-soft bg-white p-4">
        <p className="text-sm font-semibold text-muted">Current balance</p>
        <p className="font-mono text-3xl font-extrabold text-primary">{balance}</p>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Buy more credits</h2>
        {isRazorpayConfigured() ? (
          <CreditPurchaseForm packs={await getCreditPacks(supabase)} />
        ) : (
          <PaymentsDisabledNotice />
        )}
      </div>

      {ledger.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-foreground">History</h2>
          <div className="space-y-2">
            {ledger.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-xl border border-border-soft bg-white px-3.5 py-2.5 text-sm"
              >
                <span className="font-medium text-muted">
                  {entry.reason === "purchase" ? "Purchased" : "Spent on reveal"} &middot;{" "}
                  {formatRelativeDate(entry.created_at)}
                </span>
                <span
                  className={`font-mono font-bold ${entry.delta > 0 ? "text-success-text" : "text-foreground"}`}
                >
                  {entry.delta > 0 ? "+" : ""}
                  {entry.delta}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
