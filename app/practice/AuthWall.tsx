"use client";

import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { Header } from "@/components/Header";

export function AuthWall() {
  return (
    <>
      <Header />
      <main className="bg-gray-50 dark:bg-black min-h-screen p-8 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 text-center">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-bold mb-4 text-black dark:text-white">
            Sign In Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to be signed in to practice and save your progress.
          </p>
          <div className="space-y-4">
            <SignInButton mode="modal">
              <button className="w-full py-4 bg-blue-600 text-white text-xl font-bold rounded-lg hover:bg-blue-700 transition-colors">
                Sign In to Practice
              </button>
            </SignInButton>
            <Link
              href="/placement-test"
              className="block w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-center text-lg font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Take Placement Test (No Sign In Required)
            </Link>
            <Link
              href="/"
              className="block text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
