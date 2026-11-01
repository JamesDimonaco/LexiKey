import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireUser } from "./authHelpers";

// Well above the 50-word settings maximum; rejects obviously bogus calls.
const MAX_WORDS_PER_SESSION = 200;

/**
 * Save a finished session's summary and add it to the user's running totals.
 * One row per session, never per keystroke.
 */
export const recordSession = mutation({
  args: {
    userId: v.id("users"),
    mode: v.union(v.literal("practice"), v.literal("review")),
    inputMode: v.union(v.literal("visible"), v.literal("voice")),
    displayMode: v.union(v.literal("sentence"), v.literal("word")),
    phonicsGroupFocus: v.optional(v.string()),
    durationSeconds: v.number(),
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
  returns: v.id("practiceSessions"),
  handler: async (ctx, { userId, wordResults, ...session }) => {
    const user = await requireUser(ctx, userId);

    if (wordResults.length === 0 || wordResults.length > MAX_WORDS_PER_SESSION) {
      throw new Error(`A session must have 1-${MAX_WORDS_PER_SESSION} words`);
    }

    const wordsCompleted = wordResults.filter((r) => r.wasCorrect).length;
    const now = Date.now();

    const sessionId = await ctx.db.insert("practiceSessions", {
      userId,
      ...session,
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

    await ctx.db.patch(userId, {
      stats: {
        ...user.stats,
        totalWords: user.stats.totalWords + wordResults.length,
        totalSessions: user.stats.totalSessions + 1,
      },
      updatedAt: now,
    });

    return sessionId;
  },
});
