"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Input } from "@/components/ui/Input";
import type { Category } from "@/types";
import { CategoryPills } from "./CategoryPills";
import { PriceRangeInput } from "./PriceRangeInput";

export function FilterBar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");

  const debouncedQ = useDebouncedValue(q);
  const debouncedCity = useDebouncedValue(city);
  const debouncedMinPrice = useDebouncedValue(minPrice);
  const debouncedMaxPrice = useDebouncedValue(maxPrice);

  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    const setOrDelete = (key: string, value: string) => {
      if (value) params.set(key, value);
      else params.delete(key);
    };
    setOrDelete("q", debouncedQ);
    setOrDelete("city", debouncedCity);
    setOrDelete("minPrice", debouncedMinPrice);
    setOrDelete("maxPrice", debouncedMaxPrice);
    router.push(`${pathname}?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, debouncedCity, debouncedMinPrice, debouncedMaxPrice]);

  return (
    <div className="space-y-4 border-b border-border bg-white py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          type="search"
          placeholder="Search ads…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="sm:max-w-xs"
        />
        <Input
          type="text"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="sm:max-w-[160px]"
        />
        <PriceRangeInput
          minPrice={minPrice}
          maxPrice={maxPrice}
          onChange={({ minPrice, maxPrice }) => {
            setMinPrice(minPrice);
            setMaxPrice(maxPrice);
          }}
        />
      </div>
      <CategoryPills categories={categories} />
    </div>
  );
}
