export function PaymentsDisabledNotice() {
  return (
    <div className="rounded-2xl border border-dashed border-border p-6 text-center">
      <p className="text-sm font-medium text-foreground">Payments are not configured yet</p>
      <p className="mt-1 text-sm text-muted">
        Featuring listings will be available once the site owner sets up Razorpay. Check back
        soon!
      </p>
    </div>
  );
}
