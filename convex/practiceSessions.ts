import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Practice Session Functions
 *
 * CRITICAL: Only stores session SUMMARIES, never individual keystrokes
 * Local-first architecture: typing validation happens in browser
 */

// ====================
// QUERIES
// ====================

/**
 * Get recent sessions for a user
 */
export const getUserSessions = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 50 }) => {
    const sessions = await ctx.db
      .query("practiceSessions")
      .withIndex("by_userId_timestamp", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    return sessions;
  },
});

/**
 * Get sessions by date range
 */
export const getSessionsByDateRange = query({
  args: {
    userId: v.id("users"),
    startDate: v.number(), // Unix timestamp
    endDate: v.number(), // Unix timestamp
  },
  handler: async (ctx, { userId, startDate, endDate }) => {
    const sessions = await ctx.db
      .query("practiceSessions")
      .withIndex("by_userId_timestamp", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), startDate),
          q.lte(q.field("timestamp"), endDate)
        )
      )
      .collect();

    return sessions;
  },
});

/**
 * Get sessions by mode
 */
export const getSessionsByMode = query({
  args: {
    userId: v.id("users"),
    mode: v.union(
      v.literal("lesson"),
      v.literal("practice"),
      v.literal("assignment"),
      v.literal("review")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, mode, limit = 50 }) => {
    const allSessions = await ctx.db
      .query("practiceSessions")
      .withIndex("by_userId_timestamp", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit * 2); // Take more to ensure enough after filtering

    const filtered = allSessions.filter((s) => s.mode === mode);
    return filtered.slice(0, limit);
  },
});

/**
 * Get aggregate statistics for a user
 */
export const getSessionStats = query({
  args: {
    userId: v.id("users"),
    phonicsGroup: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, { userId, phonicsGroup, startDate, endDate }) => {
    let sessions = await ctx.db
      .query("practiceSessions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Filter by date range
    if (startDate !== undefined) {
      sessions = sessions.filter((s) => s.timestamp >= startDate);
    }
    if (endDate !== undefined) {
      sessions = sessions.filter((s) => s.timestamp <= endDate);
    }

    // Filter by phonics group
    if (phonicsGroup) {
      sessions = sessions.filter((s) => s.phonicsGroupFocus === phonicsGroup);
    }

    // Calculate aggregates
    const totalSessions = sessions.length;
    const totalWords = sessions.reduce((sum, s) => sum + s.wordsAttempted, 0);
    const totalCompleted = sessions.reduce((sum, s) => sum + s.wordsCompleted, 0);
    const totalSeconds = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);

    const accuracies = sessions.map((s) => s.accuracy);
    const averageAccuracy =
      accuracies.length > 0
        ? accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length
        : 0;

    const wpms = sessions.map((s) => s.averageWPM).filter((wpm) => wpm !== undefined);
    const averageWPM =
      wpms.length > 0 ? wpms.reduce((sum, wpm) => sum + wpm!, 0) / wpms.length : 0;

    return {
      totalSessions,
      totalWords,
      totalCompleted,
      totalMinutes: Math.round(totalSeconds / 60),
      averageAccuracy: Math.round(averageAccuracy * 100) / 100,
      averageWPM: Math.round(averageWPM * 100) / 100,
    };
  },
});

/**
 * Get phonics group performance breakdown
 */
export const getPhonicsGroupStats = query({
  args: {
    userId: v.id("users"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, { userId, startDate, endDate }) => {
    let sessions = await ctx.db
      .query("practiceSessions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Filter by date range
    if (startDate !== undefined) {
      sessions = sessions.filter((s) => s.timestamp >= startDate);
    }
    if (endDate !== undefined) {
      sessions = sessions.filter((s) => s.timestamp <= endDate);
    }

    // Group by phonics
    const groupStats: Record<
      string,
      { wordsAttempted: number; accuracy: number; count: number }
    > = {};

    sessions.forEach((session) => {
      if (session.phonicsGroupFocus) {
        if (!groupStats[session.phonicsGroupFocus]) {
          groupStats[session.phonicsGroupFocus] = {
            wordsAttempted: 0,
            accuracy: 0,
            count: 0,
          };
        }

        groupStats[session.phonicsGroupFocus].wordsAttempted += session.wordsAttempted;
        groupStats[session.phonicsGroupFocus].accuracy += session.accuracy;
        groupStats[session.phonicsGroupFocus].count += 1;
      }
    });

    // Calculate averages
    const result = Object.entries(groupStats).map(([group, stats]) => ({
      group,
      wordsAttempted: stats.wordsAttempted,
      averageAccuracy: Math.round((stats.accuracy / stats.count) * 100) / 100,
    }));

    return result;
  },
});

/**
 * Get session by ID
 */
export const getSessionById = query({
  args: { sessionId: v.id("practiceSessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db.get(sessionId);
  },
});

// ====================
// MUTATIONS
// ====================

/**
 * Create a practice session
 * CRITICAL: This is called AFTER typing is complete, with summary data only
 */
export const createPracticeSession = mutation({
  args: {
    userId: v.id("users"),
    mode: v.union(
      v.literal("lesson"),
      v.literal("practice"),
      v.literal("assignment"),
      v.literal("review")
    ),
    phonicsGroupFocus: v.optional(v.string()),
    assignmentId: v.optional(v.id("assignments")),
    wordsAttempted: v.number(),
    wordsCompleted: v.number(),
    accuracy: v.number(),
    averageWPM: v.optional(v.number()),
    durationSeconds: v.number(),
    struggleWords: v.array(v.id("wordLibrary")),
    wordResults: v.array(
      v.object({
        wordId: v.id("wordLibrary"),
        word: v.string(),
        timeSpent: v.number(),
        backspaceCount: v.number(),
        wasCorrect: v.boolean(),
        hesitationDetected: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Create session
    const sessionId = await ctx.db.insert("practiceSessions", {
      ...args,
      timestamp: now,
    });

    // Update user stats
    const user = await ctx.db.get(args.userId);
    if (user) {
      const newTotalWords = user.stats.totalWords + args.wordsCompleted;
      const newTotalSessions = user.stats.totalSessions + 1;
      const newTotalMinutes =
        user.stats.totalMinutesPracticed + Math.round(args.durationSeconds / 60);

      // Calculate new average accuracy (weighted average)
      const oldWeight = user.stats.totalWords;
      const newWeight = args.wordsCompleted;
      const newAverageAccuracy =
        oldWeight + newWeight > 0
          ? (user.stats.averageAccuracy * oldWeight + args.accuracy * newWeight) /
            (oldWeight + newWeight)
          : args.accuracy;

      // Update streak
      const today = new Date().toISOString().split("T")[0];
      let currentStreak = user.stats.currentStreak;
      let longestStreak = user.stats.longestStreak;

      if (user.stats.lastPracticeDate) {
        const lastDate = new Date(user.stats.lastPracticeDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor(
          (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          currentStreak += 1;
          longestStreak = Math.max(currentStreak, longestStreak);
        } else if (diffDays > 1) {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
        longestStreak = 1;
      }

      await ctx.db.patch(args.userId, {
        stats: {
          totalWords: newTotalWords,
          totalSessions: newTotalSessions,
          currentStreak,
          longestStreak,
          lastPracticeDate: today,
          totalMinutesPracticed: newTotalMinutes,
          averageAccuracy: newAverageAccuracy,
        },
        updatedAt: now,
      });
    }

    // Add struggle words to bucket (will be handled by struggleWords functions)
    // This is just recording which words were struggled with in this session

    return sessionId;
  },
});

/**
 * Delete a session (admin only, for data cleanup)
 */
export const deleteSession = mutation({
  args: { sessionId: v.id("practiceSessions") },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // TODO: Add permission checks (admin only)
    // TODO: Optionally recalculate user stats after deletion

    await ctx.db.delete(sessionId);
    return { success: true };
  },
});
