import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSellerCreditsBalance } from "@/lib/queries";
import { Button } from "@/components/ui/Button";
import { LogoutButton } from "./LogoutButton";
import { MobileNav } from "./MobileNav";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: "buyer" | "seller" | null = null;
  let creditsBalance: number | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    role = profile?.role ?? null;
    if (role === "seller") {
      creditsBalance = await getSellerCreditsBalance(supabase, user.id);
    }
  }

  const postHref = role === "seller" ? "/dashboard/listings/new" : "/now/new";
  const postLabel = role === "seller" ? "Post an ad" : "Post a need";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-primary">
          Doopido
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm font-semibold text-foreground hover:text-primary">
            Browse
          </Link>
          <Link href="/now">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-[var(--primary-gradient-from)] to-[var(--primary-gradient-to)] px-4 py-1.5 text-xs font-extrabold text-white shadow-sm shadow-primary/30 transition-shadow hover:shadow-md hover:shadow-primary/40">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Doopido Now
            </span>
          </Link>
          {user && role === "seller" && (
            <>
              <Link
                href="/dashboard/listings"
                className="text-sm font-semibold text-foreground hover:text-primary"
              >
                My listings
              </Link>
              <Link
                href="/dashboard/bids"
                className="text-sm font-semibold text-foreground hover:text-primary"
              >
                My bids
              </Link>
              <Link
                href="/dashboard/credits"
                className="font-mono text-xs font-bold text-secondary-text hover:text-primary"
              >
                {creditsBalance !== null ? `${creditsBalance} cr` : "Credits"}
              </Link>
            </>
          )}
          {user && role === "buyer" && (
            <Link
              href="/dashboard/needs"
              className="text-sm font-semibold text-foreground hover:text-primary"
            >
              My needs
            </Link>
          )}
          {user && (
            <Link
              href="/dashboard/profile"
              className="text-sm font-semibold text-foreground hover:text-primary"
            >
              Profile
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <LogoutButton />
              <Link href={postHref}>
                <Button variant="secondary" size="sm">
                  {postLabel}
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-foreground hover:text-primary">
                Log in
              </Link>
              <Link href="/signup">
                <Button variant="secondary" size="sm">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>

        <MobileNav isLoggedIn={Boolean(user)} role={role} />
      </div>
    </header>
  );
}
