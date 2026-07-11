import { type SelectHTMLAttributes, forwardRef } from "react";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";
