import { v } from "convex/values";
import { query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireUser } from "./authHelpers";

/**
 * Struggle Words (Simple Bucket System)
 *
 * Words are added when user struggles (hesitation past their adaptive
 * threshold OR backspaces >3). The threshold isn't a flat 1.5s: it's computed
 * per word by getHesitationThreshold (lib/thresholdCalculator.ts) from the
 * user's own typing speed, calibrated separately for reading vs listening —
 * listening thresholds add a quadratic length term, since holding a heard
 * word in memory costs more per extra letter than reading one does.
 * Words graduate (get removed) after 3 consecutive correct attempts
 * Any mistake resets the consecutive counter to 0
 *
 * Each miss also records the input mode it happened in. Listening and reading
 * are different skills — a word only ever missed on dictation is a listening
 * problem, not a spelling one, and the split is what tells them apart.
 */

/** Increment the miss counter for the mode this struggle happened in */
function missCounter(
  existing: { listenMisses?: number; seeMisses?: number } | null,
  inputMode: "see" | "listen"
) {
  return inputMode === "listen"
    ? { listenMisses: (existing?.listenMisses ?? 0) + 1 }
    : { seeMisses: (existing?.seeMisses ?? 0) + 1 };
}

// ====================
// QUERIES
// ====================

/**
 * Get all struggle words for a user (raw data)
 */
export const getUserStruggleWords = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    await requireUser(ctx, userId);

    const words = await ctx.db
      .query("userStruggleWords")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return words;
  },
});

// ====================
// SESSION RESULTS
// ====================

/**
 * Apply a finished session's word results to the review bucket.
 * Called from practiceSessions.finishSession, inside its transaction.
 */
export async function applyWordResultsToBucket(
  ctx: MutationCtx,
  userId: Id<"users">,
  results: Array<{
    word: string;
    phonicsGroup: string;
    wasStruggle: boolean;
    inputMode: "see" | "listen";
  }>,
) {
  const now = Date.now();

  for (const { word, phonicsGroup, wasStruggle, inputMode } of results) {
    // Check if word already in bucket
    const existing = await ctx.db
      .query("userStruggleWords")
      .withIndex("by_userId_word", (q) =>
        q.eq("userId", userId).eq("word", word)
      )
      .first();

    if (wasStruggle) {
      if (existing) {
        await ctx.db.patch(existing._id, {
          consecutiveCorrect: 0,
          totalAttempts: existing.totalAttempts + 1,
          ...missCounter(existing, inputMode),
          lastSeenAt: now,
        });
      } else {
        await ctx.db.insert("userStruggleWords", {
          userId,
          word,
          phonicsGroup,
          consecutiveCorrect: 0,
          totalAttempts: 1,
          ...missCounter(null, inputMode),
          lastSeenAt: now,
          createdAt: now,
        });
      }
    } else {
      if (existing) {
        const newConsecutive = existing.consecutiveCorrect + 1;

        if (newConsecutive >= 3) {
          await ctx.db.delete(existing._id);
        } else {
          await ctx.db.patch(existing._id, {
            consecutiveCorrect: newConsecutive,
            totalAttempts: existing.totalAttempts + 1,
            lastSeenAt: now,
          });
        }
      }
    }
  }
}

