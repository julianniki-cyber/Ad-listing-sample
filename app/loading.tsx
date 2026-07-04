import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="mb-4 h-56 w-full break-inside-avoid" />
        ))}
      </div>
    </div>
  );
}
