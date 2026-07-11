"use client";

import { useState, type ChangeEvent } from "react";
import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase/client";
import { ALLOWED_IMAGE_TYPES, AADHAAR_DOCS_BUCKET, MAX_IMAGE_SIZE_BYTES, MAX_IMAGE_SIZE_MB } from "@/lib/constants";

export function AadhaarUploader({
  userId,
  onUploaded,
}: {
  userId: string;
  onUploaded: (storagePath: string | null) => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, or WebP images are allowed.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError(`File must be under ${MAX_IMAGE_SIZE_MB}MB.`);
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${nanoid(10)}.${ext}`;

    const { error: uploadError } = await supabase.storage.from(AADHAAR_DOCS_BUCKET).upload(path, file);
    setUploading(false);

    if (uploadError) {
      setError(uploadError.message);
      onUploaded(null);
      return;
    }

    setFileName(file.name);
    onUploaded(path);
  }

  return (
    <div className="space-y-2">
      <label className="mb-1 block text-sm font-medium text-foreground">
        Aadhaar card (for verification)
      </label>
      <label className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border text-center text-xs text-muted hover:border-primary hover:text-primary">
        {uploading ? "Uploading…" : fileName ? `Uploaded: ${fileName}` : "Tap to upload a photo"}
        <input
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          className="hidden"
          onChange={handleFileSelected}
          disabled={uploading}
        />
      </label>
      <p className="text-xs text-muted">
        Kept private — only used to verify your business and shown only to you.
      </p>
      {error && <p className="text-sm text-primary">{error}</p>}
    </div>
  );
}
