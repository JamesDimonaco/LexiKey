import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    return user;
  },
});

/**
 * Get user by ID
 */
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

/**
 * Get all users by role
 */
export const getUsersByRole = query({
  args: {
    role: v.union(
      v.literal("student"),
      v.literal("teacher"),
      v.literal("parent"),
      v.literal("admin")
    ),
  },
  handler: async (ctx, { role }) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", role))
      .collect();

    return users;
  },
});

/**
 * Search users by name or email
 */
export const searchUsers = query({
  args: {
    searchTerm: v.string(),
    role: v.optional(
      v.union(
        v.literal("student"),
        v.literal("teacher"),
        v.literal("parent"),
        v.literal("admin")
      )
    ),
  },
  handler: async (ctx, { searchTerm, role }) => {
    let users = await ctx.db.query("users").collect();

    // Filter by role if provided
    if (role) {
      users = users.filter((u) => u.role === role);
    }

    // Filter by search term (name or email)
    const searchLower = searchTerm.toLowerCase();
    users = users.filter(
      (u) =>
        u.name.toLowerCase().includes(searchLower) ||
        (u.email && u.email.toLowerCase().includes(searchLower))
    );

    return users;
  },
});

// ====================
// MUTATIONS
// ====================

/**
 * Create a new user
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
      v.literal("admin")
    ),
  },
  handler: async (ctx, { clerkId, name, email, role }) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (existing) {
      throw new Error("User already exists");
    }

    const now = Date.now();

    // Create user with default settings
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
      stats: {
        totalWords: 0,
        totalSessions: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastPracticeDate: undefined,
        totalMinutesPracticed: 0,
        averageAccuracy: 0,
      },
      subscription: {
        tier: "free",
        expiresAt: undefined,
        stripeCustomerId: undefined,
      },
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});

/**
 * Update user settings
 */
export const updateUserSettings = mutation({
  args: {
    userId: v.id("users"),
    settings: v.object({
      font: v.optional(v.string()),
      fontSize: v.optional(v.number()),
      letterSpacing: v.optional(v.number()),
      contrast: v.optional(v.union(v.literal("normal"), v.literal("high"))),
      voiceSpeed: v.optional(v.number()),
      ttsEnabled: v.optional(v.boolean()),
      showHints: v.optional(v.boolean()),
      timerPressure: v.optional(v.boolean()),
      blindMode: v.optional(v.boolean()),
      cursorStyle: v.optional(
        v.union(
          v.literal("standard"),
          v.literal("large"),
          v.literal("non-blinking")
        )
      ),
    }),
  },
  handler: async (ctx, { userId, settings }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Merge new settings with existing
    const updatedSettings = {
      ...user.settings,
      ...settings,
    };

    await ctx.db.patch(userId, {
      settings: updatedSettings,
      updatedAt: Date.now(),
    });

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
    }),
  },
  handler: async (ctx, { userId, stats }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Calculate streak if lastPracticeDate is being updated
    let updatedStats = { ...user.stats, ...stats };

    if (stats.lastPracticeDate) {
      const today = new Date().toISOString().split("T")[0];
      const lastPractice = user.stats.lastPracticeDate;

      if (lastPractice) {
        const lastDate = new Date(lastPractice);
        const todayDate = new Date(today);
        const diffDays = Math.floor(
          (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          // Consecutive day - increment streak
          updatedStats.currentStreak = user.stats.currentStreak + 1;
          updatedStats.longestStreak = Math.max(
            updatedStats.currentStreak,
            user.stats.longestStreak
          );
        } else if (diffDays > 1) {
          // Streak broken - reset to 1
          updatedStats.currentStreak = 1;
        }
        // diffDays === 0 means same day, keep streak as is
      } else {
        // First practice ever
        updatedStats.currentStreak = 1;
        updatedStats.longestStreak = 1;
      }
    }

    await ctx.db.patch(userId, {
      stats: updatedStats,
      updatedAt: Date.now(),
    });

    return userId;
  },
});

/**
 * Update user subscription
 */
export const updateUserSubscription = mutation({
  args: {
    userId: v.id("users"),
    subscription: v.object({
      tier: v.union(
        v.literal("free"),
        v.literal("premium"),
        v.literal("school")
      ),
      expiresAt: v.optional(v.string()),
      stripeCustomerId: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { userId, subscription }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(userId, {
      subscription,
      updatedAt: Date.now(),
    });

    return userId;
  },
});

/**
 * Delete user (soft delete - could also add isDeleted flag)
 */
export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // TODO: Add permission checks
    // TODO: Consider soft delete vs hard delete
    // TODO: Clean up related data (sessions, struggle words, etc.)

    await ctx.db.delete(userId);
    return { success: true };
  },
});
