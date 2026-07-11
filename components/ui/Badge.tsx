import type { ReactNode } from "react";

type Variant = "primary" | "neutral" | "dark" | "success";

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-white",
  neutral: "bg-surface-alt text-secondary-text",
  dark: "bg-foreground text-background",
  success: "bg-success-soft text-success-text border border-success-border",
};

export function Badge({
  children,
  variant = "primary",
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
