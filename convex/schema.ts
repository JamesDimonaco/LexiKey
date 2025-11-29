import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * LexiKey Database Schema
 *
 * Core Principles:
 * 1. LOCAL-FIRST: Never store individual keystrokes (latency!)
 * 2. SUMMARY-BASED: Only persist session results
 * 3. PHONICS-FOCUSED: Words categorized by Orton-Gillingham principles
 * 4. B2B-READY: Built for classroom/teacher management
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

    // Subscription info (B2B/Premium)
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
  // CURRICULUM
  // ====================

  wordLibrary: defineTable({
    word: v.string(),

    // Phonics categorization (Orton-Gillingham)
    phonicsGroup: v.string(), // "cvc", "silent-e", "digraph-th", "blend-st", "reversal-bd", etc.
    phonicsSubgroup: v.optional(v.string()), // More specific categorization

    difficultyLevel: v.number(), // 1-10 scale

    // Context for TTS
    sentenceContext: v.optional(v.string()), // "The cat sat on the mat."

    // Metadata
    frequencyRank: v.optional(v.number()), // Common word ranking
    letterCount: v.number(),
    syllableCount: v.optional(v.number()),

    // Tags for filtering
    tags: v.array(v.string()), // ["animal", "verb", "noun", etc.]

    // For custom word lists (B2B feature)
    isCustom: v.boolean(),
    createdBy: v.optional(v.id("users")), // If teacher-uploaded

    createdAt: v.number(),
  })
    .index("by_phonicsGroup", ["phonicsGroup"])
    .index("by_difficulty", ["difficultyLevel"])
    .index("by_createdBy", ["createdBy"])
    .searchIndex("search_word", {
      searchField: "word",
      filterFields: ["phonicsGroup", "difficultyLevel", "isCustom"],
    }),

  // ====================
  // PRACTICE SESSIONS
  // ====================

  practiceSessions: defineTable({
    userId: v.id("users"),

    mode: v.union(
      v.literal("lesson"), // Guided phonics lesson
      v.literal("practice"), // Free practice
      v.literal("assignment"), // Teacher-assigned
      v.literal("review") // Bucket review
    ),

    // What was practiced
    phonicsGroupFocus: v.optional(v.string()), // If focusing on specific phonics
    assignmentId: v.optional(v.id("assignments")), // If from teacher assignment

    // Session results (SUMMARY only, not individual keystrokes!)
    wordsAttempted: v.number(),
    wordsCompleted: v.number(),
    accuracy: v.number(), // 0-100 percentage
    averageWPM: v.optional(v.number()),
    durationSeconds: v.number(),

    // Words that need review
    struggleWords: v.array(v.id("wordLibrary")), // Words with >1.5s hesitation or >3 backspaces

    // Detailed word results
    wordResults: v.array(v.object({
      wordId: v.id("wordLibrary"),
      word: v.string(), // Denormalized for easy reporting
      timeSpent: v.number(), // Seconds
      backspaceCount: v.number(),
      wasCorrect: v.boolean(),
      hesitationDetected: v.boolean(), // >1.5s pause
    })),

    timestamp: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_timestamp", ["userId", "timestamp"])
    .index("by_assignmentId", ["assignmentId"])
    .index("by_mode", ["mode"]),

  // ====================
  // BUCKET SYSTEM (Spaced Repetition)
  // ====================

  userStruggleWords: defineTable({
    userId: v.id("users"),
    wordId: v.id("wordLibrary"),

    // Tracking struggle
    errorCount: v.number(), // How many times struggled
    totalAttempts: v.number(),

    // Spaced repetition scheduling
    lastReviewedAt: v.number(), // Timestamp
    nextReviewAt: v.number(), // Timestamp
    interval: v.number(), // Days until next review (increases with success)
    easeFactor: v.number(), // SM-2 algorithm factor (2.5 default)

    // Status
    status: v.union(
      v.literal("struggling"), // Currently in review bucket
      v.literal("improving"), // Getting better
      v.literal("mastered") // Consistently correct
    ),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_nextReview", ["userId", "nextReviewAt"])
    .index("by_wordId", ["wordId"])
    .index("by_status", ["status"]),

  // ====================
  // B2B FEATURES
  // ====================

  classrooms: defineTable({
    teacherId: v.id("users"),
    name: v.string(), // "Ms. Smith's 3rd Grade"
    gradeLevel: v.optional(v.string()),
    schoolName: v.optional(v.string()),

    // Student relationships
    studentIds: v.array(v.id("users")),

    // Classroom settings
    settings: v.optional(v.object({
      defaultPhonicsFocus: v.optional(v.string()),
      defaultDifficulty: v.optional(v.number()),
    })),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_teacherId", ["teacherId"])
    .index("by_teacherId_name", ["teacherId", "name"]),

  assignments: defineTable({
    classroomId: v.id("classrooms"),
    teacherId: v.id("users"),

    title: v.string(), // "Week 4 Spelling Words"
    description: v.optional(v.string()),

    // Assignment content
    wordIds: v.array(v.id("wordLibrary")),
    phonicsGroupFocus: v.optional(v.string()),

    // Scheduling
    assignedAt: v.number(),
    dueDate: v.optional(v.number()),

    // Requirements
    targetAccuracy: v.optional(v.number()), // e.g., 80%
    minimumAttempts: v.optional(v.number()), // e.g., "Practice each word 3 times"

    // Status
    isActive: v.boolean(),

    createdAt: v.number(),
  })
    .index("by_classroomId", ["classroomId"])
    .index("by_teacherId", ["teacherId"])
    .index("by_isActive", ["isActive"]),

  // Student-Assignment relationship (for tracking completion)
  studentAssignments: defineTable({
    studentId: v.id("users"),
    assignmentId: v.id("assignments"),
    classroomId: v.id("classrooms"),

    // Completion tracking
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("completed")
    ),

    // Results
    bestAccuracy: v.optional(v.number()),
    totalAttempts: v.number(),
    timeSpent: v.number(), // Total seconds

    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_studentId", ["studentId"])
    .index("by_assignmentId", ["assignmentId"])
    .index("by_student_assignment", ["studentId", "assignmentId"])
    .index("by_classroom", ["classroomId"]),

  // ====================
  // IEP REPORTS (B2B Killer Feature)
  // ====================

  progressReports: defineTable({
    studentId: v.id("users"),
    teacherId: v.optional(v.id("users")),

    reportType: v.union(
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("custom"),
      v.literal("iep") // For IEP documentation
    ),

    // Date range
    startDate: v.number(),
    endDate: v.number(),

    // Aggregated data
    summary: v.object({
      totalSessions: v.number(),
      totalWords: v.number(),
      averageAccuracy: v.number(),
      improvementRate: v.number(), // Percentage change
      phonicsGroupsProgress: v.array(v.object({
        group: v.string(),
        accuracy: v.number(),
        wordsAttempted: v.number(),
      })),
      strugglingAreas: v.array(v.string()), // Phonics groups needing work
      strengths: v.array(v.string()),
    }),

    // Generated PDF URL (if stored)
    pdfUrl: v.optional(v.string()),

    createdAt: v.number(),
  })
    .index("by_studentId", ["studentId"])
    .index("by_teacherId", ["teacherId"])
    .index("by_reportType", ["reportType"]),
});
