"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAnonymousUser } from "./useAnonymousUser";
import { StruggleWord, AnonymousUserData } from "@/lib/types";

/**
 * Manages user progress data - handles both authenticated and anonymous users
 * Merges data sources and handles migration when anonymous users sign up
 */
export function useUserProgress() {
  const { user, isLoaded: isClerkLoaded } = useUser();

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
  const migrateAnonymousData = useMutation(api.users.migrateAnonymousData);
  const updateUserStats = useMutation(api.users.updateUserStats);
  const batchProcessWordResults = useMutation(api.struggleWords.batchProcessWordResults);

  // Fetch struggle words from DB (only for authenticated users)
  const userStruggleWords = useQuery(
    api.struggleWords.getUserStruggleWords,
    currentUser?._id ? { userId: currentUser._id } : "skip",
  );

  // Only determine anonymous mode after Clerk has loaded
  // This prevents flash of anonymous content while auth is loading
  const isAnonymous = isClerkLoaded ? !user?.id : false; // Assume authenticated until proven otherwise

  // Track pending migration for existing users (show dialog)
  const [pendingMigration, setPendingMigration] = useState<AnonymousUserData | null>(null);

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

  // Simple effect: show merge dialog when conditions are met
  // Don't reset pendingMigration once set - user must take action
  useEffect(() => {
    // Skip if dialog is already showing
    if (pendingMigration) return;

    // Wait for everything to load
    if (!isClerkLoaded || isAnonymousLoading) return;
    if (!user?.id) return;
    if (currentUser === undefined) return;

    // Check if there's anonymous data to migrate
    const anonData = getDataForMigration();
    if (!anonData || anonData.totalWords === 0) return;

    // Check if user exists and has data (existing user scenario)
    if (currentUser && currentUser.stats.totalWords > 0) {
      // Show merge dialog for existing users
      setPendingMigration(anonData);
    } else if (currentUser && currentUser.stats.totalWords === 0) {
      // New user with no data - auto merge
      migrateAnonymousData({
        clerkId: user.id,
        anonymousData: {
          currentLevel: anonData.currentLevel,
          totalWords: anonData.totalWords,
          totalSessions: anonData.totalSessions,
          struggleWords: anonData.struggleWords,
          lastPracticeDate: anonData.lastPracticeDate,
        },
      }).then(() => {
        clearAnonymousData();
      }).catch(err => console.error("[Migration] Auto-merge failed:", err));
    }
  }, [isClerkLoaded, isAnonymousLoading, user?.id, currentUser, pendingMigration, getDataForMigration, migrateAnonymousData, clearAnonymousData]);

  // Auto-create user if they don't exist in Convex yet
  useEffect(() => {
    if (!user) return;
    if (currentUser === undefined) return; // Still loading
    if (currentUser !== null) return; // User already exists

    // User doesn't exist in Convex - create them
    const anonData = getDataForMigration();
    const hasData = anonData && anonData.totalWords > 0;

    createUser({
      clerkId: user.id,
      name: user.fullName || user.firstName || "User",
      email: user.primaryEmailAddress?.emailAddress,
      role: "student",
      anonymousData: hasData ? {
        currentLevel: anonData.currentLevel,
        totalWords: anonData.totalWords,
        totalSessions: anonData.totalSessions,
        struggleWords: anonData.struggleWords,
        lastPracticeDate: anonData.lastPracticeDate,
      } : undefined,
    }).then(() => {
      if (hasData) clearAnonymousData();
    }).catch(err => {
      if (!err.message?.includes("already exists")) {
        console.error("[Migration] Failed to create user:", err);
      }
    });
  }, [user, currentUser, createUser, getDataForMigration, clearAnonymousData]);

  // Handle merge decision from dialog
  const handleMerge = useCallback(async (useAccountLevel: boolean) => {
    if (!pendingMigration || !currentUser || !user) return;

    const levelToUse = useAccountLevel
      ? currentUser.stats.currentLevel
      : pendingMigration.currentLevel;

    try {
      await migrateAnonymousData({
        clerkId: user.id,
        anonymousData: {
          currentLevel: levelToUse,
          totalWords: pendingMigration.totalWords,
          totalSessions: pendingMigration.totalSessions,
          struggleWords: pendingMigration.struggleWords,
          lastPracticeDate: pendingMigration.lastPracticeDate,
        },
      });
      clearAnonymousData();
      setPendingMigration(null);
    } catch (error) {
      console.error("[Migration] Merge failed:", error);
    }
  }, [pendingMigration, currentUser, user, migrateAnonymousData, clearAnonymousData]);

  // Handle discard decision from dialog
  const handleDiscard = useCallback(() => {
    clearAnonymousData();
    setPendingMigration(null);
  }, [clearAnonymousData]);

  // Loading state - wait for Clerk to load first, then check other conditions
  // This prevents flash of anonymous content while auth is loading
  // IMPORTANT: If pendingMigration is set, we're NOT loading - we need to show the dialog
  const isLoading = !isClerkLoaded
    ? true // Always show loading while Clerk is determining auth state
    : isAnonymous
      ? isAnonymousLoading
      : pendingMigration
        ? false // Have enough data to show merge dialog
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
    // For merge dialog
    pendingMigration,
    handleMerge,
    handleDiscard,
  };
}
