import { type TextareaHTMLAttributes, forwardRef } from "react";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = "", ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={`w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm font-medium text-foreground placeholder:font-normal placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${className}`}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
