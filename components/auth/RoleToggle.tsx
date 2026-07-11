"use client";

import type { UserRole } from "@/types";

export function RoleToggle({
  role,
  onChange,
}: {
  role: UserRole;
  onChange: (role: UserRole) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {(["buyer", "seller"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-xl border p-4 text-left transition-colors ${
            role === option
              ? "border-primary bg-primary-soft"
              : "border-border hover:border-primary/50"
          }`}
        >
          <p className="text-sm font-semibold text-foreground capitalize">{option}</p>
          <p className="mt-1 text-xs text-muted">
            {option === "buyer"
              ? "Browse ads and post what you need — services find you."
              : "Post ads and bid on buyer requests to win jobs."}
          </p>
        </button>
      ))}
    </div>
  );
}
