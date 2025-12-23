"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { PracticeSession } from "./practice/PracticeSession";
import { MergeDialog } from "@/components/MergeDialog";
import { useUserProgress } from "@/hooks/useUserProgress";

export default function Home() {
  return (
    <>
      <Header />
      <main className="bg-gray-50 dark:bg-black min-h-screen p-8">
        <HomeContent />
      </main>
    </>
  );
}

function HomeContent() {
  const {
    isAnonymous,
    isLoading,
    currentUser,
    pendingMigration,
    handleMerge,
    handleDiscard,
  } = useUserProgress();
  const [hasCompletedPlacementTest, setHasCompletedPlacementTest] = useState(false);

  // Check if anonymous user has completed placement test
  useEffect(() => {
    if (isAnonymous) {
      const placementResult = localStorage.getItem("lexikey_placement_result");
      setHasCompletedPlacementTest(!!placementResult);
    }
  }, [isAnonymous]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Show merge dialog for existing users with anonymous data
  if (pendingMigration && currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <MergeDialog
          anonymousData={{
            totalWords: pendingMigration.totalWords,
            currentLevel: pendingMigration.currentLevel,
            struggleWordsCount: pendingMigration.struggleWords.length,
          }}
          accountData={{
            totalWords: currentUser.stats.totalWords,
            currentLevel: currentUser.stats.currentLevel,
          }}
          onMerge={handleMerge}
          onDiscard={handleDiscard}
        />
      </div>
    );
  }

  // For authenticated users who haven't taken the placement test, show the prompt
  if (!isAnonymous && currentUser && !currentUser.stats.hasCompletedPlacementTest) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 text-center">
          <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">
            Welcome to LexiKey!
          </h2>
          <p className="text-gray-700 dark:text-gray-400 mb-6">
            Take a quick placement test to personalize your learning experience.
          </p>
          <Link
            href="/placement-test"
            className="block w-full py-4 bg-blue-600 text-white text-center text-xl font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Take Placement Test
          </Link>
          <button
            onClick={() => {/* Skip for now - they can start practicing */}}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <Link href="/practice">Skip for now</Link>
          </button>
        </div>
      </div>
    );
  }

  // Show practice session for everyone (anonymous and authenticated)
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto">
      {/* Subtle placement test banner for anonymous users who haven't taken it */}
      {isAnonymous && !hasCompletedPlacementTest && (
        <div className="w-full mb-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Take a quick placement test to find your level
          </p>
          <Link
            href="/placement-test"
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 whitespace-nowrap"
          >
            Take Test →
          </Link>
        </div>
      )}
      <PracticeSession />
    </div>
  );
}
