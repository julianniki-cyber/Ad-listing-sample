import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyNeedPosts } from "@/lib/queries";
import { Button } from "@/components/ui/Button";
import { NeedPostRow } from "@/components/needs/NeedPostRow";

export default async function MyNeedPostsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const needPosts = await getMyNeedPosts(supabase, user!.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">My needs</h1>
        <Link href="/now/new">
          <Button>Post a need</Button>
        </Link>
      </div>

      {needPosts.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-2 text-center">
          <p className="text-foreground">You haven&apos;t posted any needs yet.</p>
          <Link href="/now/new">
            <Button>Post your first need</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {needPosts.map((needPost) => (
            <NeedPostRow key={needPost.id} needPost={needPost} />
          ))}
        </div>
      )}
    </div>
  );
}
