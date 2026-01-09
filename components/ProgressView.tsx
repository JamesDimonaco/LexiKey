"use client";

import { useUserProgress } from "@/hooks/useUserProgress";

export function ProgressView() {
  const {
    isLoading,
    isAnonymous,
    currentUser,
    anonymousUser,
    effectiveStruggleWords,
    effectiveLevel,
  } = useUserProgress();

  if (isLoading) {
    return null;
  }

  // Get stats from the appropriate source
  const totalWords = isAnonymous
    ? (anonymousUser?.totalWords ?? 0)
    : (currentUser?.stats.totalWords ?? 0);

  const totalSessions = isAnonymous
    ? (anonymousUser?.totalSessions ?? 0)
    : (currentUser?.stats.totalSessions ?? 0);

  const struggleCount = effectiveStruggleWords.length;

  // Don't show if user hasn't practiced yet
  if (totalWords === 0 && totalSessions === 0) {
    return null;
  }

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 mb-6">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        Your Progress
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Words Practiced */}
        <div className="text-center">
          <div className="text-2xl font-bold text-black dark:text-white">
            {totalWords.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Words Practiced
          </div>
        </div>

        {/* Sessions */}
        <div className="text-center">
          <div className="text-2xl font-bold text-black dark:text-white">
            {totalSessions}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Sessions
          </div>
        </div>

        {/* Current Level */}
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {effectiveLevel}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Current Level
          </div>
        </div>

        {/* Words in Review */}
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {struggleCount}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            In Review
          </div>
        </div>
      </div>

      {/* Sign up prompt for anonymous users */}
      {isAnonymous && totalWords > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-4 pt-3 border-t border-gray-200 dark:border-gray-800">
          Sign in to save your progress across devices
        </p>
      )}
    </div>
  );
}
