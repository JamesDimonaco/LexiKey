import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./authHelpers";

/**
 * Inaudible Word Reports
 *
 * In dictation mode a word can be missed because the speech synthesis voice
 * mangled it, not because the learner can't spell it. Counting that as a
 * struggle punishes them for the app's failure and keeps serving the same
 * unhearable word back.
 *
 * A report does two things: keeps the word out of that user's listening
 * sessions, and — counted across users — flags which words the voice gets
 * wrong for everyone.
 */

// ====================
// QUERIES
// ====================

/**
 * Words this user has reported as inaudible, for filtering listening sessions
 */
export const getUserInaudibleWords = query({
  args: { userId: v.id("users") },
  returns: v.array(v.string()),
  handler: async (ctx, { userId }) => {
    await requireUser(ctx, userId);

    const reports = await ctx.db
      .query("inaudibleWordReports")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return reports.map((r) => r.word);
  },
});

// ====================
// MUTATIONS
// ====================

/**
 * Report that a word could not be made out when spoken.
 *
 * Idempotent — reporting the same word twice is a no-op, so the cross-user
 * count stays a count of PEOPLE, not of clicks.
 */
export const reportInaudible = mutation({
  args: {
    userId: v.id("users"),
    word: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { userId, word }) => {
    await requireUser(ctx, userId);

    const existing = await ctx.db
      .query("inaudibleWordReports")
      .withIndex("by_userId_word", (q) =>
        q.eq("userId", userId).eq("word", word)
      )
      .first();

    if (!existing) {
      await ctx.db.insert("inaudibleWordReports", {
        userId,
        word,
        createdAt: Date.now(),
      });
    }

    // Undo the struggle this caused. If every miss on this word happened while
    // listening, it was never a spelling problem — drop it from the review
    // bucket. If they've also missed it reading, the row stays and only the
    // listening misses are cleared.
    const struggle = await ctx.db
      .query("userStruggleWords")
      .withIndex("by_userId_word", (q) =>
        q.eq("userId", userId).eq("word", word)
      )
      .first();

    // Only drop the row when we can SEE that every miss was a listening miss.
    // Rows written before the counters existed have both fields absent — that
    // is unknown history, not proof of a listening-only struggle, so they stay.
    if (struggle) {
      const listenMisses = struggle.listenMisses ?? 0;
      const seeMisses = struggle.seeMisses ?? 0;

      if (listenMisses > 0 && seeMisses === 0) {
        await ctx.db.delete(struggle._id);
      } else if (listenMisses > 0) {
        await ctx.db.patch(struggle._id, { listenMisses: 0 });
      }
    }

    return null;
  },
});
