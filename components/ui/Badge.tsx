import type { ReactNode } from "react";

export function Badge({
  children,
  variant = "primary",
}: {
  children: ReactNode;
  variant?: "primary" | "neutral";
}) {
  const classes =
    variant === "primary"
      ? "bg-primary text-white"
      : "bg-zinc-100 text-foreground";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      {children}
    </span>
  );
}
