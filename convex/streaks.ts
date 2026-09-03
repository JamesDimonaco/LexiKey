import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./authHelpers";

/**
 * Forgiving Daily Streak System
 *
 * Rules:
 * - One completed practice session per day keeps the streak alive.
 * - "Day" is computed in the USER's timezone (client passes its UTC offset),
 *   so a 11pm session in California counts for the Californian's day.
 * - Missing a single day does NOT break the streak if a freeze is available:
 *   the freeze is spent silently and the streak continues.
 * - Freezes: max 1, refilled at the start of each week (Monday, user's tz).
 * - Missing two or more days in a row resets the streak (freezes only cover
 *   a single missed day).
 */

const MS_PER_DAY = 86_400_000;
const MAX_FREEZES = 1;
const STREAK_MILESTONES = [3, 7, 14, 30];

/**
 * YYYY-MM-DD of "now" in the user's local timezone.
 * tzOffsetMinutes follows Date.prototype.getTimezoneOffset(): UTC minus local,
 * so local wall-clock time = UTC - offset.
 */
function localDateString(nowMs: number, tzOffsetMinutes: number): string {
  return new Date(nowMs - tzOffsetMinutes * 60_000).toISOString().slice(0, 10);
}

/** Days since 1970-01-01 for a YYYY-MM-DD string (calendar math, DST-proof). */
function dayNumber(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / MS_PER_DAY;
}

/** YYYY-MM-DD of the Monday of the week containing the given date. */
function mondayOf(date: string): string {
  const dn = dayNumber(date);
  // Day 0 (1970-01-01) was a Thursday, index 3 in a Monday-based week.
  const monday = dn - ((dn + 3) % 7);
  return new Date(monday * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Real-world UTC offsets span UTC+14..UTC-12; reject anything outside. */
function clampTzOffset(minutes: number): number {
  if (!Number.isFinite(minutes)) return 0;
  return Math.max(-840, Math.min(840, Math.round(minutes)));
}

const streakResultValidator = v.object({
  // What happened to the streak, so the client can celebrate / track it:
  // - already_counted: user already practiced today, nothing changed
  // - started: first ever active day (streak = 1)
  // - incremented: consecutive day, streak grew
  // - freeze_used: one day was skipped, a freeze covered it, streak grew
  // - reset: too many days missed, streak restarted at 1
  status: v.union(
    v.literal("already_counted"),
    v.literal("started"),
    v.literal("incremented"),
    v.literal("freeze_used"),
    v.literal("reset"),
  ),
  currentStreak: v.number(),
  longestStreak: v.number(),
  freezesAvailable: v.number(),
  // Set when currentStreak lands exactly on 3/7/14/30 — celebrate it
  milestone: v.union(v.number(), v.null()),
});

/**
 * Record that the user completed a practice session today.
 * Call once after every completed session; same-day calls are no-ops.
 */
export const recordSessionCompleted = mutation({
  args: {
    userId: v.id("users"),
    // From the client: new Date().getTimezoneOffset()
    timezoneOffsetMinutes: v.number(),
  },
  returns: streakResultValidator,
  handler: async (ctx, { userId, timezoneOffsetMinutes }) => {
    const user = await requireUser(ctx, userId);

    const stats = user.stats;
    const today = localDateString(
      Date.now(),
      clampTzOffset(timezoneOffsetMinutes),
    );
    const lastActive = stats.lastActiveDate;

    // Same day (or clock moved backwards after travel): already counted.
    if (lastActive && dayNumber(today) <= dayNumber(lastActive)) {
      return {
        status: "already_counted" as const,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        freezesAvailable: stats.freezesAvailable ?? MAX_FREEZES,
        milestone: null,
      };
    }

    // Weekly freeze refill — before evaluating the gap, so a fresh week's
    // freeze can forgive the first missed day of that week.
    let freezesAvailable = stats.freezesAvailable ?? MAX_FREEZES;
    let freezeWeekStart = stats.freezeWeekStart;
    const thisWeek = mondayOf(today);
    if (!freezeWeekStart || dayNumber(thisWeek) > dayNumber(freezeWeekStart)) {
      freezesAvailable = MAX_FREEZES;
      freezeWeekStart = thisWeek;
    }

    let currentStreak: number;
    let status: "started" | "incremented" | "freeze_used" | "reset";

    if (!lastActive) {
      currentStreak = 1;
      status = "started";
    } else {
      const gap = dayNumber(today) - dayNumber(lastActive);
      if (gap === 1) {
        currentStreak = stats.currentStreak + 1;
        status = "incremented";
      } else if (gap === 2 && freezesAvailable > 0) {
        // Exactly one day skipped and a freeze is available: spend it,
        // the streak survives and today still counts.
        freezesAvailable -= 1;
        currentStreak = stats.currentStreak + 1;
        status = "freeze_used";
      } else {
        currentStreak = 1;
        status = "reset";
      }
    }

    const longestStreak = Math.max(stats.longestStreak, currentStreak);
    const milestone = STREAK_MILESTONES.includes(currentStreak)
      ? currentStreak
      : null;

    await ctx.db.patch(userId, {
      stats: {
        ...stats,
        currentStreak,
        longestStreak,
        lastActiveDate: today,
        lastPracticeDate: today, // keep legacy field in sync
        freezesAvailable,
        freezeWeekStart,
      },
      updatedAt: Date.now(),
    });

    return {
      status,
      currentStreak,
      longestStreak,
      freezesAvailable,
      milestone,
    };
  },
});

/**
 * Normalized streak state for the UI (fills defaults for users created
 * before the streak fields existed).
 */
export const getStreak = query({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      currentStreak: v.number(),
      longestStreak: v.number(),
      lastActiveDate: v.union(v.string(), v.null()),
      freezesAvailable: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, { userId }) => {
    // Returns null rather than throwing for an unknown or unowned user: the
    // returns validator allows null, ProgressView branches on it, and a stale
    // id in an open tab should quietly hide the streak, not error the render.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db.get(userId);
    if (!user || user.clerkId !== identity.subject) return null;

    return {
      currentStreak: user.stats.currentStreak,
      longestStreak: user.stats.longestStreak,
      lastActiveDate: user.stats.lastActiveDate ?? null,
      freezesAvailable: user.stats.freezesAvailable ?? MAX_FREEZES,
    };
  },
});
