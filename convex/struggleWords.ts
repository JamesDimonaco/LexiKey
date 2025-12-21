import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Struggle Words (Simple Bucket System)
 *
 * Words are added when user struggles (hesitation >1.5s OR backspaces >3)
 * Words graduate (get removed) after 3 consecutive correct attempts
 * Any mistake resets the consecutive counter to 0
 */

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
    const words = await ctx.db
      .query("userStruggleWords")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return words;
  },
});

/**
 * Derive status from consecutiveCorrect count
 * 0 = struggling, 1-2 = improving, 3+ = mastered (will be deleted)
 */
function deriveStatus(consecutiveCorrect: number): "struggling" | "improving" | "mastered" {
  if (consecutiveCorrect === 0) return "struggling";
  if (consecutiveCorrect >= 3) return "mastered";
  return "improving";
}

/**
 * Get struggle words with derived status for display
 */
export const getUserStruggleWordsWithStatus = query({
  args: {
    userId: v.id("users"),
    status: v.optional(
      v.union(
        v.literal("struggling"),
        v.literal("improving")
      )
    ),
  },
  handler: async (ctx, { userId, status }) => {
    const words = await ctx.db
      .query("userStruggleWords")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Add derived status to each word
    const wordsWithStatus = words.map((w) => ({
      ...w,
      status: deriveStatus(w.consecutiveCorrect),
      progressToGraduation: `${w.consecutiveCorrect}/3`, // e.g., "2/3"
    }));

    // Filter by status if provided
    if (status) {
      return wordsWithStatus.filter((w) => w.status === status);
    }

    return wordsWithStatus;
  },
});

/**
 * Get count of struggle words for a user
 */
export const getStruggleWordCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const words = await ctx.db
      .query("userStruggleWords")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return words.length;
  },
});

// ====================
// MUTATIONS
// ====================

/**
 * Process a word result after practice session
 * - If struggled: add to bucket or reset consecutiveCorrect to 0
 * - If correct: increment consecutiveCorrect, delete if reaches 3
 */
export const processWordResult = mutation({
  args: {
    userId: v.id("users"),
    word: v.string(),
    phonicsGroup: v.string(),
    wasStruggle: v.boolean(), // hesitation >1.5s OR backspaces >3
  },
  handler: async (ctx, { userId, word, phonicsGroup, wasStruggle }) => {
    const now = Date.now();

    // Check if word already in bucket
    const existing = await ctx.db
      .query("userStruggleWords")
      .withIndex("by_userId_word", (q) =>
        q.eq("userId", userId).eq("word", word)
      )
      .first();

    if (wasStruggle) {
      // User struggled with this word
      if (existing) {
        // Reset consecutive counter, increment attempts
        await ctx.db.patch(existing._id, {
          consecutiveCorrect: 0,
          totalAttempts: existing.totalAttempts + 1,
          lastSeenAt: now,
        });
      } else {
        // Add new struggle word
        await ctx.db.insert("userStruggleWords", {
          userId,
          word,
          phonicsGroup,
          consecutiveCorrect: 0,
          totalAttempts: 1,
          lastSeenAt: now,
          createdAt: now,
        });
      }
    } else {
      // User got it correct
      if (existing) {
        const newConsecutive = existing.consecutiveCorrect + 1;

        if (newConsecutive >= 3) {
          // Graduated! Delete from bucket
          await ctx.db.delete(existing._id);
        } else {
          // Increment consecutive correct
          await ctx.db.patch(existing._id, {
            consecutiveCorrect: newConsecutive,
            totalAttempts: existing.totalAttempts + 1,
            lastSeenAt: now,
          });
        }
      }
      // If word not in bucket and user got it correct, do nothing
    }
  },
});

/**
 * Batch process multiple word results at end of session
 */
export const batchProcessWordResults = mutation({
  args: {
    userId: v.id("users"),
    results: v.array(v.object({
      word: v.string(),
      phonicsGroup: v.string(),
      wasStruggle: v.boolean(),
    })),
  },
  handler: async (ctx, { userId, results }) => {
    const now = Date.now();

    for (const result of results) {
      const { word, phonicsGroup, wasStruggle } = result;

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
            lastSeenAt: now,
          });
        } else {
          await ctx.db.insert("userStruggleWords", {
            userId,
            word,
            phonicsGroup,
            consecutiveCorrect: 0,
            totalAttempts: 1,
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
  },
});

/**
 * Reset all struggle words for a user (for testing)
 */
export const resetStruggleBucket = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const words = await ctx.db
      .query("userStruggleWords")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    await Promise.all(words.map((word) => ctx.db.delete(word._id)));

    return { success: true, count: words.length };
  },
});
