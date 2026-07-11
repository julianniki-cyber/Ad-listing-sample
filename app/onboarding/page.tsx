import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/auth/OnboardingForm";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role) redirect("/dashboard");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Almost there</h1>
      <p className="mt-1 text-sm text-muted">
        Tell us a bit about yourself to finish setting up your account.
      </p>
      <div className="mt-6">
        <OnboardingForm userId={user.id} />
      </div>
    </div>
  );
}
