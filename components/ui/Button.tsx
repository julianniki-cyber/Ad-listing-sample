import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dark";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary-hover hover:shadow-md hover:shadow-primary/30 disabled:bg-primary/50 disabled:shadow-none",
  dark: "bg-foreground text-background hover:bg-foreground/85 disabled:opacity-50",
  secondary:
    "bg-white text-foreground border-[1.5px] border-foreground hover:bg-surface-alt disabled:opacity-50",
  ghost: "bg-transparent text-foreground hover:bg-surface-alt disabled:opacity-50",
  danger:
    "bg-white text-primary border border-primary hover:bg-primary-soft disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
