import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkPhonePrompt } from "@/components/auth/LinkPhonePrompt";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/listings");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.role) redirect("/onboarding");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <LinkPhonePrompt />
      {children}
    </div>
  );
}
