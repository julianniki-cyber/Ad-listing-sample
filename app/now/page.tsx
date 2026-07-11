import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getNeedPostsFeed } from "@/lib/queries";
import { NeedFilterBar } from "@/components/needs/NeedFilterBar";
import { NeedPostList } from "@/components/needs/NeedPostList";

export default async function NeedPostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const filters = { category: params.category, city: params.city };

  const supabase = await createClient();
  const [categories, { needPosts, hasMore }] = await Promise.all([
    getCategories(supabase),
    getNeedPostsFeed(supabase, filters),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Doopido Now</h1>
        <p className="mt-1 text-sm text-muted">
          Buyers post what they need — browse open requests and place your bid.
        </p>
      </div>
      <Suspense fallback={<div className="h-24" />}>
        <NeedFilterBar categories={categories} />
      </Suspense>
      <div className="pt-6">
        <NeedPostList initialNeedPosts={needPosts} initialHasMore={hasMore} filters={filters} />
      </div>
    </div>
  );
}
