import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * LexiKey Database Schema
 *
 * Core Principles:
 * 1. LOCAL-FIRST: Never store individual keystrokes (latency!)
 * 2. SUMMARY-BASED: Only persist session results
 * 3. PHONICS-FOCUSED: Words categorized by Orton-Gillingham principles
 */

export default defineSchema({

  // ====================
  // USERS & SETTINGS
  // ====================

  users: defineTable({
    clerkId: v.string(), // Clerk authentication ID
    name: v.string(),
    email: v.optional(v.string()),
    role: v.union(
      v.literal("student"),
      v.literal("teacher"),
      v.literal("parent"),
      v.literal("admin")
    ),

    // User preferences
    settings: v.object({
      font: v.string(), // "helvetica", "arial", "opendyslexic"
      fontSize: v.number(), // 16-48px
      letterSpacing: v.number(), // 0-8px
      contrast: v.union(v.literal("normal"), v.literal("high")), // high = pure black/white
      voiceSpeed: v.number(), // 0.5-2.0 for TTS
      ttsEnabled: v.boolean(),
      showHints: v.boolean(),
      timerPressure: v.boolean(), // Show countdown timer
      blindMode: v.boolean(), // Hide text to force muscle memory
      cursorStyle: v.union(
        v.literal("standard"),
        v.literal("large"),
        v.literal("non-blinking")
      ),
    }),

    // User statistics
    stats: v.object({
      totalWords: v.number(),
      totalSessions: v.number(),
      currentStreak: v.number(), // Days in a row
      longestStreak: v.number(),
      lastPracticeDate: v.optional(v.string()), // ISO date
      totalMinutesPracticed: v.number(),
      averageAccuracy: v.number(), // 0-100

      // Adaptive learning
      currentLevel: v.number(), // 1-10 difficulty rating
      hasCompletedPlacementTest: v.boolean(),
      struggleGroups: v.array(v.string()), // Phonics groups user struggles with
    }),

    // Subscription info (Premium)
    subscription: v.optional(v.object({
      tier: v.union(
        v.literal("free"),
        v.literal("premium"),
        v.literal("school")
      ),
      expiresAt: v.optional(v.string()), // ISO date
      stripeCustomerId: v.optional(v.string()),
    })),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // ====================
  // PRACTICE SESSIONS
  // ====================

  practiceSessions: defineTable({
    userId: v.id("users"),

    mode: v.union(
      v.literal("lesson"), // Guided phonics lesson
      v.literal("practice"), // Free practice
      v.literal("review") // Bucket review
    ),

    // Practice mode settings
    inputMode: v.optional(v.union(
      v.literal("visible"), // Words shown on screen
      v.literal("voice") // Dictation mode - words spoken
    )),
    displayMode: v.optional(v.union(
      v.literal("sentence"), // Multiple words shown
      v.literal("word") // Single word at a time
    )),

    // What was practiced
    phonicsGroupFocus: v.optional(v.string()), // If focusing on specific phonics

    // Session results (SUMMARY only, not individual keystrokes!)
    wordsAttempted: v.number(),
    wordsCompleted: v.number(),
    accuracy: v.number(), // 0-100 percentage
    averageWPM: v.optional(v.number()), // Only recorded for sentence+visible mode
    durationSeconds: v.number(),

    // Words that need review (stored as strings, not IDs)
    struggleWords: v.array(v.string()), // Word texts with >1.5s hesitation or >3 backspaces

    // Detailed word results
    wordResults: v.array(v.object({
      word: v.string(),
      phonicsGroup: v.string(),
      timeSpent: v.number(), // Seconds
      backspaceCount: v.number(),
      wasCorrect: v.boolean(),
      hesitationDetected: v.boolean(), // >1.5s pause
    })),

    timestamp: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_timestamp", ["userId", "timestamp"])
    .index("by_mode", ["mode"]),

  // ====================
  // STRUGGLE WORDS (Simple Bucket System)
  // ====================

  userStruggleWords: defineTable({
    userId: v.id("users"),
    word: v.string(), // The word text
    phonicsGroup: v.string(), // For adaptive engine grouping

    // Simple graduation tracking
    consecutiveCorrect: v.number(), // 0-3, graduates (deleted) at 3
    totalAttempts: v.number(),

    lastSeenAt: v.number(), // Timestamp
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_word", ["userId", "word"]),
});
