import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

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
 */
export function useSyncPlacementData() {
  const { user, isLoaded } = useUser();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : "skip",
  );
  const createUser = useMutation(api.users.createUser);
  const updateUserStats = useMutation(api.users.updateUserStats);

  useEffect(() => {
    if (!isLoaded || !user) return;

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
            });
            console.log("✅ User created");
            // Don't sync placement data here - it will happen on next render when currentUser exists
            return;
          } catch (error: any) {
            // User might already exist (webhook created it)
            if (!error.message?.includes("already exists")) {
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
              currentLevel: placementResult.determinedLevel,
              hasCompletedPlacementTest: true,
              struggleGroups: placementResult.identifiedStruggleGroups,
            },
          });

          console.log("✅ Placement test synced successfully!");
          localStorage.removeItem("lexikey_placement_result");
        }
      } catch (error) {
        console.error("Failed to sync placement data:", error);
      }
    };

    syncData();
  }, [isLoaded, user, currentUser, createUser, updateUserStats]);
}
