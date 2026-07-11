"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createNeedPost } from "@/app/now/actions";
import { needPostSchema } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { Category } from "@/types";

export function NeedPostForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [budget, setBudget] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = needPostSchema.safeParse({
      headline,
      description,
      categoryId,
      budget,
      locationCity,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setLoading(true);
    const result = await createNeedPost(parsed.data);
    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    router.push(`/now/${result.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Headline</label>
        <Input
          placeholder="e.g. Looking for a Maths teacher"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Description</label>
        <Textarea
          rows={5}
          placeholder="What exactly do you need help with?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Type of service</label>
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Budget <span className="text-muted">(optional)</span>
          </label>
          <Input
            type="number"
            min={0}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">City</label>
          <Input
            value={locationCity}
            onChange={(e) => setLocationCity(e.target.value)}
            required
          />
        </div>
      </div>

      {error && <p className="text-sm text-primary">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Posting…" : "Post now"}
      </Button>
    </form>
  );
}
