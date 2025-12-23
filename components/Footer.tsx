"use client";

import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-black dark:text-white">
              LexiKey
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Kinesthetic literacy intervention tool for learners of all ages.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-black dark:text-white uppercase tracking-wide">
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Copyright */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-black dark:text-white uppercase tracking-wide">
              About
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {currentYear} LexiKey. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Made for learners everywhere
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            LexiKey is an educational tool. Results may vary. Not a substitute for professional educational or therapeutic services.
          </p>
        </div>
      </div>
    </footer>
  );
}
