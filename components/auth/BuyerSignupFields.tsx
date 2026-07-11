"use client";

import { Input } from "@/components/ui/Input";

export interface BuyerFieldsValue {
  fullName: string;
  email: string;
}

export function BuyerSignupFields({
  value,
  onChange,
}: {
  value: BuyerFieldsValue;
  onChange: (value: BuyerFieldsValue) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Full name</label>
        <Input
          value={value.fullName}
          onChange={(e) => onChange({ ...value, fullName: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
        <Input
          type="email"
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
          required
        />
      </div>
    </div>
  );
}
