"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Category } from "@/types";

export function CategoryPills({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");

  function selectCategory(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("category", slug);
    else params.delete("category");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        onClick={() => selectCategory(null)}
        className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-bold transition-colors ${
          !activeCategory
            ? "border-primary bg-primary text-white"
            : "border-border bg-white text-foreground hover:border-primary"
        }`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => selectCategory(category.slug)}
          className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-bold transition-colors ${
            activeCategory === category.slug
              ? "border-primary bg-primary text-white"
              : "border-border bg-white text-foreground hover:border-primary"
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
