"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAnonymousUser } from "./useAnonymousUser";
import { StruggleWord } from "@/lib/types";

/**
 * Manages user progress data - handles both authenticated and anonymous users
 * Merges data sources and handles migration when anonymous users sign up
 */
export function useUserProgress() {
  const { user } = useUser();

  // Anonymous user support
  const {
    anonymousUser,
    isLoading: isAnonymousLoading,
    updateStats: updateAnonymousStats,
    getDataForMigration,
    clearData: clearAnonymousData,
  } = useAnonymousUser();

  // Authenticated user queries (skip if not signed in)
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : "skip",
  );
  const createUser = useMutation(api.users.createUser);
  const updateUserStats = useMutation(api.users.updateUserStats);
  const batchProcessWordResults = useMutation(api.struggleWords.batchProcessWordResults);

  // Fetch struggle words from DB (only for authenticated users)
  const userStruggleWords = useQuery(
    api.struggleWords.getUserStruggleWords,
    currentUser?._id ? { userId: currentUser._id } : "skip",
  );

  // Determine if we're in anonymous mode
  const isAnonymous = !user?.id;

  // Get effective user data (from DB or localStorage)
  const effectiveLevel = isAnonymous
    ? (anonymousUser?.currentLevel ?? 5)
    : (currentUser?.stats.currentLevel ?? 5);

  const effectiveStruggleWords: StruggleWord[] = isAnonymous
    ? (anonymousUser?.struggleWords ?? [])
    : (userStruggleWords ?? []).map((sw) => ({
        word: sw.word,
        phonicsGroup: sw.phonicsGroup,
        consecutiveCorrect: sw.consecutiveCorrect,
      }));

  // Auto-create user if they don't exist in Convex
  // Also migrate anonymous data if available
  useEffect(() => {
    if (!user || currentUser !== null) return;

    const createUserIfNeeded = async () => {
      try {
        // Check for anonymous data to migrate
        const anonData = getDataForMigration();
        const anonymousData = anonData ? {
          currentLevel: anonData.currentLevel,
          totalWords: anonData.totalWords,
          totalSessions: anonData.totalSessions,
          struggleWords: anonData.struggleWords,
          lastPracticeDate: anonData.lastPracticeDate,
        } : undefined;

        await createUser({
          clerkId: user.id,
          name: user.fullName || user.firstName || "User",
          email: user.primaryEmailAddress?.emailAddress,
          role: "student",
          anonymousData,
        });

        // Clear anonymous data after successful migration
        if (anonData) {
          clearAnonymousData();
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (!errorMessage?.includes("already exists")) {
          console.error("Failed to create user:", error);
        }
      }
    };

    createUserIfNeeded();
  }, [user, currentUser, createUser, getDataForMigration, clearAnonymousData]);

  // Loading state
  const isLoading = isAnonymous
    ? isAnonymousLoading
    : (!currentUser || userStruggleWords === undefined);

  return {
    isAnonymous,
    isLoading,
    effectiveLevel,
    effectiveStruggleWords,
    currentUser,
    anonymousUser,
    // For saving results
    updateAnonymousStats,
    updateUserStats,
    batchProcessWordResults,
  };
}
