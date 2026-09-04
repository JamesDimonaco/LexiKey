import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireClerkId, requireUser } from "./authHelpers";

/**
 * User Management Functions
 *
 * Handles user CRUD operations, settings, and statistics
 */

// ====================
// QUERIES
// ====================

/**
 * Get current user by Clerk ID
 */
export const getCurrentUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    await requireClerkId(ctx, clerkId);

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    // Return null instead of undefined when no user found
    // This allows distinguishing between loading (undefined) and no user (null)
    return user ?? null;
  },
});

// ====================
// MUTATIONS
// ====================

/**
 * Create a new user
 * Optionally accepts anonymous user data for migration
 */
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    role: v.union(
      v.literal("student"),
      v.literal("teacher"),
      v.literal("parent"),
      v.literal("admin"),
    ),
    // Optional anonymous data to migrate
    anonymousData: v.optional(v.object({
      currentLevel: v.number(),
      totalWords: v.number(),
      totalSessions: v.number(),
      struggleWords: v.array(v.object({
        word: v.string(),
        phonicsGroup: v.string(),
        consecutiveCorrect: v.number(),
        listenMisses: v.optional(v.number()),
        seeMisses: v.optional(v.number()),
      })),
      lastPracticeDate: v.union(v.string(), v.null()),
      listenLevel: v.optional(v.number()),
      inaudibleWords: v.optional(v.array(v.string())),
      thresholdParams: v.optional(
        v.object({
          baseTime: v.number(),
          secondsPerChar: v.number(),
          secondsPerCharSquared: v.optional(v.number()),
          safetyMultiplier: v.number(),
          wordCount: v.number(),
          lastUpdated: v.string(),
        })
      ),
      listenThresholdParams: v.optional(
        v.object({
          baseTime: v.number(),
          secondsPerChar: v.number(),
          secondsPerCharSquared: v.optional(v.number()),
          safetyMultiplier: v.number(),
          wordCount: v.number(),
          lastUpdated: v.string(),
        })
      ),
      // Carried over so a user who placement-tested (and maybe practised
      // further) anonymously isn't shown the placement prompt again on signup.
      hasCompletedPlacementTest: v.optional(v.boolean()),
      struggleGroups: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, { clerkId, name, email, role, anonymousData }) => {
    await requireClerkId(ctx, clerkId);

    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (existing) {
      throw new Error("User already exists");
    }

    const now = Date.now();

    // Start with default stats, then merge anonymous data if provided
    const initialStats = {
      totalWords: anonymousData?.totalWords ?? 0,
      totalSessions: anonymousData?.totalSessions ?? 0,
      currentStreak: 0,
      longestStreak: 0,
      lastPracticeDate: anonymousData?.lastPracticeDate ?? undefined,
      totalMinutesPracticed: 0,
      averageAccuracy: 0,
      currentLevel: anonymousData?.currentLevel ?? 1,
      listenLevel: anonymousData?.listenLevel,
      hasCompletedPlacementTest: anonymousData?.hasCompletedPlacementTest ?? false,
      struggleGroups: anonymousData?.struggleGroups ?? [],
      thresholdParams: anonymousData?.thresholdParams,
      listenThresholdParams: anonymousData?.listenThresholdParams,
    };

    // Create user with default settings and potentially migrated stats
    const userId = await ctx.db.insert("users", {
      clerkId,
      name,
      email,
      role,
      settings: {
        font: "helvetica",
        fontSize: 24,
        letterSpacing: 2,
        contrast: "normal",
        voiceSpeed: 1.0,
        ttsEnabled: true,
        showHints: true,
        timerPressure: false,
        blindMode: false,
        cursorStyle: "standard",
      },
      stats: initialStats,
      subscription: {
        tier: "free",
        expiresAt: undefined,
        stripeCustomerId: undefined,
      },
      createdAt: now,
      updatedAt: now,
    });

    // Migrate struggle words if anonymous data was provided
    if (anonymousData?.struggleWords && anonymousData.struggleWords.length > 0) {
      for (const sw of anonymousData.struggleWords) {
        await ctx.db.insert("userStruggleWords", {
          userId,
          word: sw.word,
          phonicsGroup: sw.phonicsGroup,
          consecutiveCorrect: sw.consecutiveCorrect,
          totalAttempts: 1,
          listenMisses: sw.listenMisses,
          seeMisses: sw.seeMisses,
          lastSeenAt: now,
          createdAt: now,
        });
      }
    }

    // Carry over words the voice mangled, so they aren't spoken again the
    // moment someone signs up
    for (const word of anonymousData?.inaudibleWords ?? []) {
      await ctx.db.insert("inaudibleWordReports", {
        userId,
        word,
        createdAt: now,
      });
    }

    return userId;
  },
});

/**
 * Update user statistics
 */
export const updateUserStats = mutation({
  args: {
    userId: v.id("users"),
    stats: v.object({
      totalWords: v.optional(v.number()),
      totalSessions: v.optional(v.number()),
      currentStreak: v.optional(v.number()),
      longestStreak: v.optional(v.number()),
      lastPracticeDate: v.optional(v.string()),
      totalMinutesPracticed: v.optional(v.number()),
      averageAccuracy: v.optional(v.number()),
      currentLevel: v.optional(v.number()),
      listenLevel: v.optional(v.number()),
      hasCompletedPlacementTest: v.optional(v.boolean()),
      hasCompletedTour: v.optional(v.boolean()),
      struggleGroups: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, { userId, stats }) => {
    const user = await requireUser(ctx, userId);

    // NOTE: streaks are owned by streaks.recordSessionCompleted (timezone-aware,
    // freeze-forgiving) — this mutation only merges the fields it's given.
    await ctx.db.patch(userId, {
      stats: { ...user.stats, ...stats },
      updatedAt: Date.now(),
    });

    return userId;
  },
});

/**
 * Update user's adaptive hesitation threshold parameters.
 * Called after placement test (initial calibration) and after practice sessions (gradual adjustment).
 */
export const updateThresholdParams = mutation({
  args: {
    userId: v.id("users"),
    thresholdParams: v.object({
      baseTime: v.number(),
      secondsPerChar: v.number(),
      secondsPerCharSquared: v.optional(v.number()),
      safetyMultiplier: v.number(),
      wordCount: v.number(),
      lastUpdated: v.string(),
    }),
    /** Which mode the session ran in — each has its own calibration.
     *  Optional for the same cross-deploy reason as struggleWords. */
    inputMode: v.optional(v.union(v.literal("see"), v.literal("listen"))),
  },
  returns: v.id("users"),
  handler: async (ctx, { userId, thresholdParams, inputMode = "see" }) => {
    const user = await requireUser(ctx, userId);

    await ctx.db.patch(userId, {
      stats: {
        ...user.stats,
        ...(inputMode === "listen"
          ? { listenThresholdParams: thresholdParams }
          : { thresholdParams }),
      },
      updatedAt: Date.now(),
    });

    return userId;
  },
});

/**
 * Migrate anonymous user data to an existing authenticated user
 * Called when user signs up but webhook created their account before client could migrate
 */
export const migrateAnonymousData = mutation({
  args: {
    clerkId: v.string(),
    anonymousData: v.object({
      currentLevel: v.number(),
      totalWords: v.number(),
      totalSessions: v.number(),
      struggleWords: v.array(v.object({
        word: v.string(),
        phonicsGroup: v.string(),
        consecutiveCorrect: v.number(),
        listenMisses: v.optional(v.number()),
        seeMisses: v.optional(v.number()),
      })),
      lastPracticeDate: v.union(v.string(), v.null()),
      // Optional threshold params for adaptive hesitation detection
      listenLevel: v.optional(v.number()),
      inaudibleWords: v.optional(v.array(v.string())),
      listenThresholdParams: v.optional(
        v.object({
          baseTime: v.number(),
          secondsPerChar: v.number(),
          secondsPerCharSquared: v.optional(v.number()),
          safetyMultiplier: v.number(),
          wordCount: v.number(),
          lastUpdated: v.string(),
        })
      ),
      thresholdParams: v.optional(
        v.object({
          baseTime: v.number(),
          secondsPerChar: v.number(),
          secondsPerCharSquared: v.optional(v.number()),
          safetyMultiplier: v.number(),
          wordCount: v.number(),
          lastUpdated: v.string(),
        })
      ),
      // Carried over so a user who placement-tested (and maybe practised
      // further) anonymously isn't shown the placement prompt again on signup.
      hasCompletedPlacementTest: v.optional(v.boolean()),
      struggleGroups: v.optional(v.array(v.string())),
    }),
  },
  returns: v.object({
    success: v.boolean(),
    userId: v.id("users"),
  }),
  handler: async (ctx, { clerkId, anonymousData }) => {
    await requireClerkId(ctx, clerkId);

    // Find user by clerkId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();

    // Merge stats: add totals, use the level passed by the client (user's choice)
    const mergedStats = {
      ...user.stats,
      totalWords: user.stats.totalWords + anonymousData.totalWords,
      totalSessions: user.stats.totalSessions + anonymousData.totalSessions,
      currentLevel: Math.round(anonymousData.currentLevel * 100) / 100, // Round to avoid floating-point issues
      lastPracticeDate: anonymousData.lastPracticeDate ?? user.stats.lastPracticeDate,
      // Include threshold params if provided (from placement test calibration)
      ...(anonymousData.thresholdParams && { thresholdParams: anonymousData.thresholdParams }),
      ...(anonymousData.listenThresholdParams && {
        listenThresholdParams: anonymousData.listenThresholdParams,
      }),
      ...(anonymousData.listenLevel !== undefined && { listenLevel: anonymousData.listenLevel }),
      // Only present when the anonymous data came from a completed placement
      // test — absent (not false) callers must not reset an existing user's flag.
      ...(anonymousData.hasCompletedPlacementTest !== undefined && {
        hasCompletedPlacementTest: anonymousData.hasCompletedPlacementTest,
      }),
      ...(anonymousData.struggleGroups && { struggleGroups: anonymousData.struggleGroups }),
    };

    // Update user with merged stats
    await ctx.db.patch(user._id, {
      stats: mergedStats,
      updatedAt: now,
    });

    // Migrate struggle words — merge into existing rows rather than skipping
    // them, keeping the more pessimistic state from either device. The point
    // of the bucket is to keep practising words the learner has missed.
    if (anonymousData.struggleWords.length > 0) {
      // Get existing struggle words for this user
      const existingStruggleWords = await ctx.db
        .query("userStruggleWords")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();

      const existingByWord = new Map(existingStruggleWords.map((sw) => [sw.word, sw]));

      for (const sw of anonymousData.struggleWords) {
        const existing = existingByWord.get(sw.word);
        if (existing) {
          await ctx.db.patch(existing._id, {
            // Lower consecutiveCorrect = further from graduating = more pessimistic.
            consecutiveCorrect: Math.min(existing.consecutiveCorrect, sw.consecutiveCorrect),
            listenMisses: Math.max(existing.listenMisses ?? 0, sw.listenMisses ?? 0),
            seeMisses: Math.max(existing.seeMisses ?? 0, sw.seeMisses ?? 0),
            lastSeenAt: now,
          });
        } else {
          await ctx.db.insert("userStruggleWords", {
            userId: user._id,
            word: sw.word,
            phonicsGroup: sw.phonicsGroup,
            consecutiveCorrect: sw.consecutiveCorrect,
            totalAttempts: 1,
            listenMisses: sw.listenMisses,
            seeMisses: sw.seeMisses,
            lastSeenAt: now,
            createdAt: now,
          });
        }
      }
    }

    // Same for words the voice mangled — skip any the account already knows
    if (anonymousData.inaudibleWords?.length) {
      const existingReports = await ctx.db
        .query("inaudibleWordReports")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();
      const known = new Set(existingReports.map((r) => r.word));

      for (const word of anonymousData.inaudibleWords) {
        if (!known.has(word)) {
          await ctx.db.insert("inaudibleWordReports", {
            userId: user._id,
            word,
            createdAt: now,
          });
        }
      }
    }

    return {
      success: true,
      userId: user._id,
    };
  },
});

