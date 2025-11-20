import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Struggle Words (Bucket System)
 *
 * Implements spaced repetition using SM-2 algorithm
 * Words that users hesitate on (>1.5s) or backspace frequently (>3x)
 * are added to their review bucket
 */

// ====================
// QUERIES
// ====================

/**
 * Get all struggle words for a user
 */
export const getUserStruggleWords = query({
  args: {
    userId: v.id("users"),
    status: v.optional(
      v.union(
        v.literal("struggling"),
        v.literal("improving"),
        v.literal("mastered")
      )
    ),
  },
  handler: async (ctx, { userId, status }) => {
    let query = ctx.db
      .query("userStruggleWords")
      .withIndex("by_userId", (q) => q.eq("userId", userId));

    const words = await query.collect();

    // Filter by status if provided
    if (status) {
      return words.filter((w) => w.status === status);
    }

    return words;
  },
});

/**
 * Get struggle words with full word details
 */
export const getUserStruggleWordsWithDetails = query({
  args: {
    userId: v.id("users"),
    status: v.optional(
      v.union(
        v.literal("struggling"),
        v.literal("improving"),
        v.literal("mastered")
      )
    ),
  },
  handler: async (ctx, { userId, status }) => {
    let query = ctx.db
      .query("userStruggleWords")
      .withIndex("by_userId", (q) => q.eq("userId", userId));

    let words = await query.collect();

    // Filter by status
    if (status) {
      words = words.filter((w) => w.status === status);
    }

    // Join with word details
    const wordsWithDetails = await Promise.all(
      words.map(async (sw) => {
        const word = await ctx.db.get(sw.wordId);
        return {
          ...sw,
          wordDetails: word,
        };
      })
    );

    return wordsWithDetails;
  },
});

/**
 * Get words due for review
 */
export const getWordsForReview = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 20 }) => {
    const now = Date.now();

    const words = await ctx.db
      .query("userStruggleWords")
      .withIndex("by_userId_nextReview", (q) => q.eq("userId", userId))
      .filter((q) => q.lte(q.field("nextReviewAt"), now))
      .take(limit);

    // Join with word details
    const wordsWithDetails = await Promise.all(
      words.map(async (sw) => {
        const word = await ctx.db.get(sw.wordId);
        return {
          ...sw,
          wordDetails: word,
        };
      })
    );

    return wordsWithDetails;
  },
});

/**
 * Get count of words due for review
 */
export const getReviewCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const now = Date.now();

    const words = await ctx.db
      .query("userStruggleWords")
      .withIndex("by_userId_nextReview", (q) => q.eq("userId", userId))
      .filter((q) => q.lte(q.field("nextReviewAt"), now))
      .collect();

    return words.length;
  },
});

/**
 * Get specific struggle word entry
 */
export const getStruggleWord = query({
  args: {
    userId: v.id("users"),
    wordId: v.id("wordLibrary"),
  },
  handler: async (ctx, { userId, wordId }) => {
    const words = await ctx.db
      .query("userStruggleWords")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("wordId"), wordId))
      .first();

    return words;
  },
});

// ====================
// MUTATIONS
// ====================

/**
 * Add word to struggle bucket
 * Called when user hesitates >1.5s or backspaces >3x
 */
export const addToStruggleBucket = mutation({
  args: {
    userId: v.id("users"),
    wordId: v.id("wordLibrary"),
  },
  handler: async (ctx, { userId, wordId }) => {
    const now = Date.now();

    // Check if word already in bucket
    const existing = await ctx.db
      .query("userStruggleWords")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("wordId"), wordId))
      .first();

    if (existing) {
      // Increment error count
      await ctx.db.patch(existing._id, {
        errorCount: existing.errorCount + 1,
        totalAttempts: existing.totalAttempts + 1,
        lastReviewedAt: now,
        updatedAt: now,
      });

      return existing._id;
    } else {
      // Create new entry
      const id = await ctx.db.insert("userStruggleWords", {
        userId,
        wordId,
        errorCount: 1,
        totalAttempts: 1,
        lastReviewedAt: now,
        nextReviewAt: now, // Review immediately
        interval: 1, // 1 day
        easeFactor: 2.5, // SM-2 default
        status: "struggling",
        createdAt: now,
        updatedAt: now,
      });

      return id;
    }
  },
});

/**
 * Update struggle word progress after review
 * Implements SM-2 spaced repetition algorithm
 */
export const updateStruggleWordProgress = mutation({
  args: {
    userId: v.id("users"),
    wordId: v.id("wordLibrary"),
    wasSuccessful: v.boolean(),
    quality: v.optional(v.number()), // 0-5 rating (SM-2), 3+ is pass
  },
  handler: async (ctx, { userId, wordId, wasSuccessful, quality }) => {
    const struggleWord = await ctx.db
      .query("userStruggleWords")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("wordId"), wordId))
      .first();

    if (!struggleWord) {
      throw new Error("Struggle word not found");
    }

    const now = Date.now();
    let { interval, easeFactor, errorCount, totalAttempts, status } = struggleWord;

    totalAttempts += 1;

    // SM-2 Algorithm
    if (wasSuccessful) {
      const q = quality !== undefined ? quality : 4; // Default to good

      // Calculate new ease factor
      easeFactor = Math.max(
        1.3,
        easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
      );

      // Calculate new interval (in days)
      if (interval === 1) {
        interval = 6; // First success: 6 days
      } else {
        interval = Math.round(interval * easeFactor);
      }

      // Update status based on success rate
      const successRate = (totalAttempts - errorCount) / totalAttempts;
      if (successRate > 0.8 && totalAttempts >= 3) {
        status = "improving";
      }
      if (successRate > 0.9 && totalAttempts >= 5) {
        status = "mastered";
      }
    } else {
      // Failed - reset interval
      interval = 1;
      errorCount += 1;
      status = "struggling";
      easeFactor = Math.max(1.3, easeFactor - 0.2);
    }

    // Calculate next review date
    const nextReviewAt = now + interval * 24 * 60 * 60 * 1000; // Convert days to ms

    await ctx.db.patch(struggleWord._id, {
      errorCount,
      totalAttempts,
      lastReviewedAt: now,
      nextReviewAt,
      interval,
      easeFactor,
      status,
      updatedAt: now,
    });

    return {
      newInterval: interval,
      newStatus: status,
      nextReviewDate: new Date(nextReviewAt).toISOString(),
    };
  },
});

/**
 * Remove word from struggle bucket (mark as mastered)
 */
export const removeFromStruggleBucket = mutation({
  args: {
    userId: v.id("users"),
    wordId: v.id("wordLibrary"),
  },
  handler: async (ctx, { userId, wordId }) => {
    const struggleWord = await ctx.db
      .query("userStruggleWords")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("wordId"), wordId))
      .first();

    if (!struggleWord) {
      return { success: false, message: "Word not in bucket" };
    }

    await ctx.db.delete(struggleWord._id);
    return { success: true };
  },
});

/**
 * Bulk add words to struggle bucket
 * Called after a practice session
 */
export const bulkAddToStruggleBucket = mutation({
  args: {
    userId: v.id("users"),
    wordIds: v.array(v.id("wordLibrary")),
  },
  handler: async (ctx, { userId, wordIds }) => {
    const results = await Promise.all(
      wordIds.map((wordId) =>
        ctx.runMutation(
          ctx.db.system.getFunctionId("struggleWords:addToStruggleBucket"),
          { userId, wordId }
        )
      )
    );

    return { count: results.length };
  },
});

/**
 * Reset all struggle words (for testing or user request)
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

/**
 * Get struggle word statistics
 */
export const getStruggleStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const words = await ctx.db
      .query("userStruggleWords")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const struggling = words.filter((w) => w.status === "struggling").length;
    const improving = words.filter((w) => w.status === "improving").length;
    const mastered = words.filter((w) => w.status === "mastered").length;

    const now = Date.now();
    const dueForReview = words.filter((w) => w.nextReviewAt <= now).length;

    return {
      total: words.length,
      struggling,
      improving,
      mastered,
      dueForReview,
    };
  },
});
