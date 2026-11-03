import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireUser } from "./authHelpers";
import { thresholdParamsValidator } from "./schema";
import { applySessionToStreak, streakResultValidator } from "./streaks";
import { applyWordResultsToBucket } from "./struggleWords";

// Well above the 50-word settings maximum; rejects obviously bogus calls.
const MAX_WORDS_PER_SESSION = 200;
// A tab left open mid-session would otherwise count hours of idle time.
const MAX_SESSION_SECONDS = 60 * 60;

/**
 * Everything a finished session changes, in one transaction: the history row,
 * the review bucket, the level and hesitation threshold for the mode it ran
 * in, the running totals and the streak. One row per session, never per
 * keystroke. Either all of it saves or none of it does.
 */
export const finishSession = mutation({
  args: {
    userId: v.id("users"),
    mode: v.union(v.literal("practice"), v.literal("review")),
    inputMode: v.union(v.literal("see"), v.literal("listen")),
    displayMode: v.union(v.literal("sentence"), v.literal("word")),
    phonicsGroupFocus: v.optional(v.string()),
    durationSeconds: v.number(),
    newLevel: v.number(),
    thresholdParams: thresholdParamsValidator,
    // From the client: new Date().getTimezoneOffset()
    timezoneOffsetMinutes: v.number(),
    wordResults: v.array(
      v.object({
        word: v.string(),
        phonicsGroup: v.string(),
        timeSpent: v.number(),
        backspaceCount: v.number(),
        wasCorrect: v.boolean(),
        hesitationDetected: v.boolean(),
        wasStruggle: v.boolean(),
      }),
    ),
  },
  returns: streakResultValidator,
  handler: async (ctx, args) => {
    const { userId, wordResults, inputMode, newLevel, thresholdParams } = args;
    const user = await requireUser(ctx, userId);

    if (wordResults.length === 0 || wordResults.length > MAX_WORDS_PER_SESSION) {
      throw new Error(`A session must have 1-${MAX_WORDS_PER_SESSION} words`);
    }

    const now = Date.now();
    const wordsCompleted = wordResults.filter((r) => r.wasCorrect).length;

    await ctx.db.insert("practiceSessions", {
      userId,
      mode: args.mode,
      inputMode: inputMode === "listen" ? "voice" : "visible",
      displayMode: args.displayMode,
      phonicsGroupFocus: args.phonicsGroupFocus,
      durationSeconds: Math.min(
        Math.max(0, Math.round(args.durationSeconds)),
        MAX_SESSION_SECONDS,
      ),
      wordsAttempted: wordResults.length,
      wordsCompleted,
      accuracy: Math.round((wordsCompleted / wordResults.length) * 100),
      struggleWords: wordResults.filter((r) => r.wasStruggle).map((r) => r.word),
      wordResults: wordResults.map((r) => ({
        word: r.word,
        phonicsGroup: r.phonicsGroup,
        timeSpent: r.timeSpent,
        backspaceCount: r.backspaceCount,
        wasCorrect: r.wasCorrect,
        hesitationDetected: r.hesitationDetected,
      })),
      timestamp: now,
    });

    await applyWordResultsToBucket(
      ctx,
      userId,
      wordResults.map((r) => ({
        word: r.word,
        phonicsGroup: r.phonicsGroup,
        wasStruggle: r.wasStruggle,
        inputMode,
      })),
    );

    const streak = applySessionToStreak(
      user.stats,
      args.timezoneOffsetMinutes,
      now,
    );

    // Listening and reading keep their own level and threshold.
    await ctx.db.patch(userId, {
      stats: {
        ...user.stats,
        ...(inputMode === "listen"
          ? { listenLevel: newLevel, listenThresholdParams: thresholdParams }
          : { currentLevel: newLevel, thresholdParams }),
        totalWords: user.stats.totalWords + wordResults.length,
        totalSessions: user.stats.totalSessions + 1,
        ...streak.stats,
      },
      updatedAt: now,
    });

    return streak.result;
  },
});
