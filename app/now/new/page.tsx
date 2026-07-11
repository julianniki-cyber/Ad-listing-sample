import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/queries";
import { NeedPostForm } from "@/components/needs/NeedPostForm";

export default async function NewNeedPostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/now/new");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.role) redirect("/onboarding");
  if (profile.role !== "buyer") redirect("/now");

  const categories = await getCategories(supabase);

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold text-foreground">Doopido Now</h1>
      <p className="mt-1 text-sm text-muted">
        Tell sellers what you need — they&apos;ll bid to win the job.
      </p>
      <div className="mt-6">
        <NeedPostForm categories={categories} />
      </div>
    </div>
  );
}
