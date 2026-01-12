"use client";

import { useState, useEffect } from "react";
import { useUserProgress } from "@/hooks/useUserProgress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

const PROGRESS_COLLAPSED_KEY = "lexikey_progress_collapsed";

export function ProgressView() {
  const {
    isLoading,
    isAnonymous,
    currentUser,
    anonymousUser,
    effectiveStruggleWords,
    effectiveLevel,
  } = useUserProgress();

  const [isOpen, setIsOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(PROGRESS_COLLAPSED_KEY);
    if (saved !== null) {
      setIsOpen(saved !== "true");
    }
  }, []);

  // Save collapsed state to localStorage
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    localStorage.setItem(PROGRESS_COLLAPSED_KEY, (!open).toString());
  };

  if (isLoading || !mounted) {
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
    <Collapsible
      open={isOpen}
      onOpenChange={handleOpenChange}
      className="w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 mb-6"
    >
      <div className="flex items-center justify-between p-4">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Your Progress
        </h3>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
            <span className="sr-only">Toggle progress</span>
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <div className="px-4 pb-4">
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
      </CollapsibleContent>
    </Collapsible>
  );
}
