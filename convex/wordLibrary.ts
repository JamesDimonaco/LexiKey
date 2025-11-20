import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Word Library Functions
 *
 * Manages the phonics-based word curriculum
 * Words are categorized using Orton-Gillingham principles
 */

// ====================
// QUERIES
// ====================

/**
 * Get words by phonics group
 */
export const getWordsByPhonicsGroup = query({
  args: {
    phonicsGroup: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { phonicsGroup, limit = 20 }) => {
    const words = await ctx.db
      .query("wordLibrary")
      .withIndex("by_phonicsGroup", (q) => q.eq("phonicsGroup", phonicsGroup))
      .take(limit);

    return words;
  },
});

/**
 * Get words by difficulty level
 */
export const getWordsByDifficulty = query({
  args: {
    difficultyLevel: v.number(),
    phonicsGroup: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { difficultyLevel, phonicsGroup, limit = 20 }) => {
    let query = ctx.db
      .query("wordLibrary")
      .withIndex("by_difficulty", (q) => q.eq("difficultyLevel", difficultyLevel));

    const words = await query.take(limit);

    // Filter by phonics group if provided (no compound index, so filter in memory)
    if (phonicsGroup) {
      return words.filter((w) => w.phonicsGroup === phonicsGroup);
    }

    return words;
  },
});

/**
 * Get a random selection of words for practice
 */
export const getRandomWords = query({
  args: {
    phonicsGroup: v.optional(v.string()),
    difficultyLevel: v.optional(v.number()),
    count: v.number(),
    excludeWordIds: v.optional(v.array(v.id("wordLibrary"))),
  },
  handler: async (ctx, { phonicsGroup, difficultyLevel, count, excludeWordIds = [] }) => {
    let words = await ctx.db.query("wordLibrary").collect();

    // Filter by phonics group
    if (phonicsGroup) {
      words = words.filter((w) => w.phonicsGroup === phonicsGroup);
    }

    // Filter by difficulty
    if (difficultyLevel !== undefined) {
      words = words.filter((w) => w.difficultyLevel === difficultyLevel);
    }

    // Exclude specific words
    if (excludeWordIds.length > 0) {
      const excludeSet = new Set(excludeWordIds);
      words = words.filter((w) => !excludeSet.has(w._id));
    }

    // Shuffle and take count
    const shuffled = words.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  },
});

/**
 * Search words by text
 */
export const searchWords = query({
  args: {
    searchTerm: v.string(),
    phonicsGroup: v.optional(v.string()),
    difficultyLevel: v.optional(v.number()),
    isCustom: v.optional(v.boolean()),
  },
  handler: async (ctx, { searchTerm, phonicsGroup, difficultyLevel, isCustom }) => {
    // Use search index
    let results = await ctx.db
      .query("wordLibrary")
      .withSearchIndex("search_word", (q) => {
        let search = q.search("word", searchTerm);

        if (phonicsGroup !== undefined) {
          search = search.eq("phonicsGroup", phonicsGroup);
        }
        if (difficultyLevel !== undefined) {
          search = search.eq("difficultyLevel", difficultyLevel);
        }
        if (isCustom !== undefined) {
          search = search.eq("isCustom", isCustom);
        }

        return search;
      })
      .take(50);

    return results;
  },
});

/**
 * Get custom words created by a specific teacher
 */
export const getCustomWordsByTeacher = query({
  args: { teacherId: v.id("users") },
  handler: async (ctx, { teacherId }) => {
    const words = await ctx.db
      .query("wordLibrary")
      .withIndex("by_createdBy", (q) => q.eq("createdBy", teacherId))
      .collect();

    return words;
  },
});

/**
 * Get word by ID
 */
export const getWordById = query({
  args: { wordId: v.id("wordLibrary") },
  handler: async (ctx, { wordId }) => {
    return await ctx.db.get(wordId);
  },
});

/**
 * Get multiple words by IDs
 */
export const getWordsByIds = query({
  args: { wordIds: v.array(v.id("wordLibrary")) },
  handler: async (ctx, { wordIds }) => {
    const words = await Promise.all(wordIds.map((id) => ctx.db.get(id)));
    return words.filter((w) => w !== null);
  },
});

/**
 * Get all unique phonics groups
 */
export const getAllPhonicsGroups = query({
  args: {},
  handler: async (ctx) => {
    const words = await ctx.db.query("wordLibrary").collect();
    const groups = new Set(words.map((w) => w.phonicsGroup));
    return Array.from(groups).sort();
  },
});

// ====================
// MUTATIONS
// ====================

/**
 * Add a single word to the library
 */
export const addWord = mutation({
  args: {
    word: v.string(),
    phonicsGroup: v.string(),
    phonicsSubgroup: v.optional(v.string()),
    difficultyLevel: v.number(),
    sentenceContext: v.optional(v.string()),
    frequencyRank: v.optional(v.number()),
    syllableCount: v.optional(v.number()),
    tags: v.array(v.string()),
    isCustom: v.boolean(),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // TODO: Add permission checks (only teachers can add custom words)

    // Calculate letter count
    const letterCount = args.word.length;

    const wordId = await ctx.db.insert("wordLibrary", {
      word: args.word.toLowerCase(),
      phonicsGroup: args.phonicsGroup,
      phonicsSubgroup: args.phonicsSubgroup,
      difficultyLevel: args.difficultyLevel,
      sentenceContext: args.sentenceContext,
      frequencyRank: args.frequencyRank,
      letterCount,
      syllableCount: args.syllableCount,
      tags: args.tags,
      isCustom: args.isCustom,
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });

    return wordId;
  },
});

/**
 * Bulk add words (for seeding or CSV upload)
 */
export const bulkAddWords = mutation({
  args: {
    words: v.array(
      v.object({
        word: v.string(),
        phonicsGroup: v.string(),
        phonicsSubgroup: v.optional(v.string()),
        difficultyLevel: v.number(),
        sentenceContext: v.optional(v.string()),
        frequencyRank: v.optional(v.number()),
        syllableCount: v.optional(v.number()),
        tags: v.array(v.string()),
      })
    ),
    isCustom: v.boolean(),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, { words, isCustom, createdBy }) => {
    // TODO: Add permission checks

    const wordIds = await Promise.all(
      words.map((wordData) =>
        ctx.db.insert("wordLibrary", {
          word: wordData.word.toLowerCase(),
          phonicsGroup: wordData.phonicsGroup,
          phonicsSubgroup: wordData.phonicsSubgroup,
          difficultyLevel: wordData.difficultyLevel,
          sentenceContext: wordData.sentenceContext,
          frequencyRank: wordData.frequencyRank,
          letterCount: wordData.word.length,
          syllableCount: wordData.syllableCount,
          tags: wordData.tags,
          isCustom,
          createdBy,
          createdAt: Date.now(),
        })
      )
    );

    return { count: wordIds.length, wordIds };
  },
});

/**
 * Update a word
 */
export const updateWord = mutation({
  args: {
    wordId: v.id("wordLibrary"),
    word: v.optional(v.string()),
    phonicsGroup: v.optional(v.string()),
    phonicsSubgroup: v.optional(v.string()),
    difficultyLevel: v.optional(v.number()),
    sentenceContext: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { wordId, ...updates }) => {
    const word = await ctx.db.get(wordId);
    if (!word) {
      throw new Error("Word not found");
    }

    // TODO: Add permission checks (only creator can edit custom words)

    // Recalculate letterCount if word text changed
    if (updates.word) {
      await ctx.db.patch(wordId, {
        ...updates,
        word: updates.word.toLowerCase(),
        letterCount: updates.word.length,
      });
    } else {
      await ctx.db.patch(wordId, updates);
    }

    return wordId;
  },
});

/**
 * Delete a word
 */
export const deleteWord = mutation({
  args: { wordId: v.id("wordLibrary") },
  handler: async (ctx, { wordId }) => {
    const word = await ctx.db.get(wordId);
    if (!word) {
      throw new Error("Word not found");
    }

    // TODO: Add permission checks (only creator can delete custom words)
    // TODO: Prevent deletion of words in active assignments

    if (!word.isCustom) {
      throw new Error("Cannot delete built-in words");
    }

    await ctx.db.delete(wordId);
    return { success: true };
  },
});

/**
 * Bulk delete words
 */
export const bulkDeleteWords = mutation({
  args: { wordIds: v.array(v.id("wordLibrary")) },
  handler: async (ctx, { wordIds }) => {
    // TODO: Add permission checks
    // TODO: Verify all words are custom and owned by caller

    await Promise.all(
      wordIds.map(async (wordId) => {
        const word = await ctx.db.get(wordId);
        if (word && word.isCustom) {
          await ctx.db.delete(wordId);
        }
      })
    );

    return { success: true, count: wordIds.length };
  },
});
