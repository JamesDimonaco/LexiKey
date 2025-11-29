"use client";

import { useState } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ModeToggle } from "@/components/mode-toggle";
import { AccessibilitySettings } from "@/components/AccessibilitySettings";

export function Header() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-950 p-4 border-b-2 border-gray-200 dark:border-gray-800 flex flex-row justify-between items-center">
        <Link
          href="/"
          className="text-xl font-bold text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          LexiKey
        </Link>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSettings(true)}
            className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            ⚙️ Settings
          </button>
          <ModeToggle />
          <UserButton />
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl z-10"
            >
              ✕
            </button>
            <AccessibilitySettings onClose={() => setShowSettings(false)} />
          </div>
        </div>
      )}
    </>
  );
}
