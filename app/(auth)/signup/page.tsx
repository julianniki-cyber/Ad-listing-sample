import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Sign up</h1>
      <p className="mt-1 text-sm text-muted">Create an account to start posting ads.</p>
      <div className="mt-6">
        <SignupForm />
      </div>
      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary">
          Log in
        </Link>
      </p>
    </div>
  );
}
