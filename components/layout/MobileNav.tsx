"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoutButton } from "./LogoutButton";

export function MobileNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        aria-label="Toggle menu"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-zinc-100"
      >
        <span className="sr-only">Menu</span>
        <div className="space-y-1.5">
          <span className="block h-0.5 w-5 bg-foreground" />
          <span className="block h-0.5 w-5 bg-foreground" />
          <span className="block h-0.5 w-5 bg-foreground" />
        </div>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-16 z-40 flex flex-col gap-4 border-b border-border bg-white p-4 shadow-sm">
          <Link href="/" onClick={() => setOpen(false)} className="text-sm font-medium">
            Browse
          </Link>
          <Link
            href="/dashboard/listings/new"
            onClick={() => setOpen(false)}
            className="text-sm font-medium"
          >
            Post an ad
          </Link>
          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard/listings"
                onClick={() => setOpen(false)}
                className="text-sm font-medium"
              >
                My listings
              </Link>
              <Link
                href="/dashboard/profile"
                onClick={() => setOpen(false)}
                className="text-sm font-medium"
              >
                Edit profile
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)} className="text-sm font-medium">
                Log in
              </Link>
              <Link href="/signup" onClick={() => setOpen(false)} className="text-sm font-medium">
                Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
