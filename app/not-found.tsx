import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-xl font-semibold text-foreground">Page not found</h1>
      <p className="text-sm text-muted">The ad or page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/">
        <Button>Back to browsing</Button>
      </Link>
    </div>
  );
}
