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
    user?.id ? { clerkId: user.id } : "skip"
  );
  const updateUserStats = useMutation(api.users.updateUserStats);

  useEffect(() => {
    if (!isLoaded || !user || !currentUser) return;

    // Check if user already has placement test completed
    if (currentUser.stats.hasCompletedPlacementTest) {
      // Already synced or completed online
      localStorage.removeItem("lexikey_placement_result");
      return;
    }

    // Check for localStorage placement data
    const localData = localStorage.getItem("lexikey_placement_result");
    if (!localData) return;

    try {
      const placementResult = JSON.parse(localData);

      console.log("🔄 Syncing placement test from localStorage to Convex...");

      // Sync to Convex
      updateUserStats({
        userId: currentUser._id,
        stats: {
          currentLevel: placementResult.determinedLevel,
          hasCompletedPlacementTest: true,
          struggleGroups: placementResult.identifiedStruggleGroups,
        },
      })
        .then(() => {
          console.log("✅ Placement test synced successfully!");
          localStorage.removeItem("lexikey_placement_result");
        })
        .catch((error) => {
          console.error("❌ Failed to sync placement test:", error);
        });
    } catch (error) {
      console.error("Failed to parse localStorage placement data:", error);
      localStorage.removeItem("lexikey_placement_result");
    }
  }, [isLoaded, user, currentUser, updateUserStats]);
}
