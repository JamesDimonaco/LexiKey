import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAnonymousUser } from "./useAnonymousUser";

/**
 * Hook to sync localStorage placement test data to Convex when user signs in
 *
 * This runs automatically when:
 * 1. User signs in after taking placement test
 * 2. User returns to site and is authenticated
 *
 * Flow:
 * - Check if placement data exists in localStorage
 * - Check if user already has placement test completed in Convex
 * - If localStorage has data but Convex doesn't, sync it
 * - Clear localStorage after successful sync
 *
 * The `lexikey_placement_result` snapshot is written once, at the end of the
 * test, and never updated again — so it goes stale the moment a practice
 * session moves the level. `lexikey-anonymous-user` (the anon progress store)
 * is kept current by every session, so it's the source of truth for level and
 * struggle words; the placement snapshot only supplies what that store never
 * tracked — the completed flag and the struggle-group list.
 */
export function useSyncPlacementData() {
  const { user, isLoaded } = useUser();
  // Convex verifies the caller, so wait for its own auth token rather than
  // Clerk's — Clerk resolves first and the query would be rejected.
  const { isAuthenticated: isConvexAuthed } = useConvexAuth();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isConvexAuthed && user?.id ? { clerkId: user.id } : "skip",
  );
  const createUser = useMutation(api.users.createUser);
  const updateUserStats = useMutation(api.users.updateUserStats);
  const {
    isLoading: isAnonymousLoading,
    getDataForMigration,
    clearData: clearAnonymousData,
  } = useAnonymousUser();

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (isAnonymousLoading) return; // Wait for the anon store to load before reading it

    // Don't proceed if query hasn't finished loading yet
    // When query is skipped (user?.id is falsy), currentUser is undefined
    // When query is loading, currentUser is undefined
    // When query finishes with no user, currentUser is null (after our fix)
    // When query finishes with user found, currentUser is the user object
    if (!user.id) return; // Query is skipped, don't proceed
    if (currentUser === undefined) return; // Query is still loading, wait

    const syncData = async () => {
      // Check for localStorage placement data
      const localData = localStorage.getItem("lexikey_placement_result");
      if (!localData) return;

      try {
        const placementResult = JSON.parse(localData);
        // Read the anon store straight from localStorage rather than context
        // state: the placement page writes the new level with a raw
        // setItem, so the React state is still the pre-test value here.
        const anonData = getDataForMigration();
        // Prefer the live store's level (moved by any practice sessions since
        // the test) — fall back to the frozen snapshot if the store is gone.
        const currentLevel =
          anonData?.currentLevel ?? placementResult.determinedLevel;
        const struggleGroups = placementResult.identifiedStruggleGroups;

        // If user doesn't exist in Convex yet, create them first
        // Now we can safely check for null (query finished, no user found)
        if (currentUser === null) {
          console.log("👤 Creating user in Convex...");
          try {
            await createUser({
              clerkId: user.id,
              name: user.fullName || user.firstName || "User",
              email: user.primaryEmailAddress?.emailAddress,
              role: "student",
              anonymousData: {
                currentLevel,
                totalWords: anonData?.totalWords ?? 0,
                totalSessions: anonData?.totalSessions ?? 0,
                struggleWords: anonData?.struggleWords ?? [],
                lastPracticeDate: anonData?.lastPracticeDate ?? null,
                listenLevel: anonData?.listenLevel,
                inaudibleWords: anonData?.inaudibleWords,
                thresholdParams: anonData?.thresholdParams,
                listenThresholdParams: anonData?.listenThresholdParams,
                hasCompletedPlacementTest: true,
                struggleGroups,
              },
            });
            console.log("✅ User created");
            clearAnonymousData();
            localStorage.removeItem("lexikey_placement_result");
            return;
          } catch (error) {
            // User might already exist (webhook created it)
            const message = error instanceof Error ? error.message : String(error);
            if (!message.includes("already exists")) {
              console.error("Failed to create user:", error);
              return;
            }
          }
        }

        // Now sync placement data if user exists
        if (currentUser) {
          // Check if user already has placement test completed
          if (currentUser.stats.hasCompletedPlacementTest) {
            // Already synced or completed online
            localStorage.removeItem("lexikey_placement_result");
            return;
          }

          console.log(
            "🔄 Syncing placement test from localStorage to Convex...",
          );

          // Sync to Convex
          await updateUserStats({
            userId: currentUser._id,
            stats: {
              currentLevel,
              hasCompletedPlacementTest: true,
              struggleGroups,
            },
          });

          console.log("✅ Placement test synced successfully!");
          // Deliberately NOT clearing the anon store here: this path only
          // wrote the level, the flag and the struggle groups. Words,
          // sessions, the struggle bucket and threshold calibration are still
          // only in localStorage, and useUserProgress migrates them on the
          // next visit. Clearing now would destroy them.
          localStorage.removeItem("lexikey_placement_result");
        }
      } catch (error) {
        console.error("Failed to sync placement data:", error);
      }
    };

    syncData();
  }, [
    isLoaded,
    user,
    currentUser,
    createUser,
    updateUserStats,
    getDataForMigration,
    isAnonymousLoading,
    clearAnonymousData,
  ]);
}
