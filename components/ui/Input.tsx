import { type InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm font-medium text-foreground placeholder:font-normal placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${className}`}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
