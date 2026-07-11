"use client";

import { Input } from "@/components/ui/Input";
import { AadhaarUploader } from "./AadhaarUploader";

export interface SellerFieldsValue {
  fullName: string;
  email: string;
  whatsappNumber: string;
  businessName: string;
}

export function SellerSignupFields({
  value,
  onChange,
  userId,
  onAadhaarUploaded,
}: {
  value: SellerFieldsValue;
  onChange: (value: SellerFieldsValue) => void;
  userId: string;
  onAadhaarUploaded: (storagePath: string | null) => void;
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
        <label className="mb-1 block text-sm font-medium text-foreground">Business name</label>
        <Input
          value={value.businessName}
          onChange={(e) => onChange({ ...value, businessName: e.target.value })}
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
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">WhatsApp number</label>
        <Input
          type="tel"
          placeholder="+91 98765 43210"
          value={value.whatsappNumber}
          onChange={(e) => onChange({ ...value, whatsappNumber: e.target.value })}
          required
        />
      </div>
      <AadhaarUploader userId={userId} onUploaded={onAadhaarUploaded} />
    </div>
  );
}
