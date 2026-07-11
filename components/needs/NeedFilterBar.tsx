"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Input } from "@/components/ui/Input";
import { CategoryPills } from "@/components/filters/CategoryPills";
import type { Category } from "@/types";

export function NeedFilterBar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const debouncedCity = useDebouncedValue(city);
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedCity) params.set("city", debouncedCity);
    else params.delete("city");
    router.push(`${pathname}?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedCity]);

  return (
    <div className="space-y-4 border-b border-border bg-white py-4">
      <Input
        type="text"
        placeholder="City"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="sm:max-w-[220px]"
      />
      <CategoryPills categories={categories} />
    </div>
  );
}
