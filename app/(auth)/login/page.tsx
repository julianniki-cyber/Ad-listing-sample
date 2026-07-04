import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Log in</h1>
      <p className="mt-1 text-sm text-muted">Welcome back to Doopido.</p>
      <div className="mt-6">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
      <p className="mt-6 text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-primary">
          Sign up
        </Link>
      </p>
    </div>
  );
}
