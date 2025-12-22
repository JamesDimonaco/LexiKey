"use client";

import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { ModeToggle } from "@/components/mode-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-950 p-4 border-b-2 border-gray-200 dark:border-gray-800 flex flex-row justify-between items-center">
      <Link
        href="/"
        className="text-xl font-bold text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        LexiKey
      </Link>
      <div className="flex items-center gap-4">
        <Link
          href="/settings"
          className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Settings
        </Link>
        <ModeToggle />
        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
}
