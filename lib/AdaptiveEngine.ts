/**
 * Adaptive Session Generator
 *
 * Client-side algorithm for generating personalized typing sessions
 * Uses weighted probability buckets to balance new concepts, review, and confidence
 */

import { Word, UserProgress, PhonicsGroup, StruggleWord } from "./types";
import { posthog } from "@/components/PostHogProvider";

/**
 * Session configuration defaults - can be overridden via SessionOptions
 */
export const SESSION_CONFIG = {
  DEFAULT_SIZE: 20,
  DEFAULT_STRUGGLE_PERCENT: 0.30,
  DEFAULT_NEW_PERCENT: 0.50,
  DEFAULT_CONFIDENCE_PERCENT: 0.20,
  DEFAULT_STARTING_BOOSTERS: 2,
};

/**
 * Session options passed to generateSession
 */
export interface SessionOptions {
  wordCount?: number;
  capitalFrequency?: "never" | "sometimes" | "often";
  punctuationFrequency?: "never" | "sometimes" | "often";
  // Session mix - percentages (0-100)
  strugglePercent?: number;
  newPercent?: number;
  confidencePercent?: number;
  startingBoosters?: number;
}

export class AdaptiveSessionGenerator {
  private allWords: Word[];
  private userStruggleWords: StruggleWord[];

  constructor(allWords: Word[], userStruggleWords: StruggleWord[] = []) {
    this.allWords = allWords;
    this.userStruggleWords = userStruggleWords;
  }

  /**
   * Generates a personalized session tailored to the user.
   *
   * Breakdown (configurable via SESSION_CONFIG):
   * - 30% Struggle words (from bucket or struggle groups)
   * - 50% New concepts (at current level +/- 1)
   * - 20% Confidence boosters (easy words)
   */
  public generateSession(user: UserProgress, options: SessionOptions = {}): Word[] {
    const {
      DEFAULT_SIZE,
      DEFAULT_STRUGGLE_PERCENT,
      DEFAULT_NEW_PERCENT,
      DEFAULT_STARTING_BOOSTERS,
    } = SESSION_CONFIG;

    const SIZE = options.wordCount ?? DEFAULT_SIZE;
    const STRUGGLE_PERCENT = (options.strugglePercent ?? DEFAULT_STRUGGLE_PERCENT * 100) / 100;
    const NEW_PERCENT = (options.newPercent ?? DEFAULT_NEW_PERCENT * 100) / 100;
    const STARTING_BOOSTERS = options.startingBoosters ?? DEFAULT_STARTING_BOOSTERS;

    const maxAvailableDifficulty = Math.max(
      ...this.allWords.map((w) => w.difficulty),
    );

    // Track error if user level exceeds available words
    if (user.currentLevel > maxAvailableDifficulty) {
      console.error(
        `[AdaptiveEngine] Insufficient words for user level. User level: ${user.currentLevel}, Max available: ${maxAvailableDifficulty}`,
      );
      posthog.capture("insufficient_words_for_level", {
        userLevel: user.currentLevel,
        maxAvailableDifficulty,
        levelGap: user.currentLevel - maxAvailableDifficulty,
        userId: user.userId,
        totalWordsInPool: this.allWords.length,
      });
    }

    // Bucket sizes
    const struggleCount = Math.floor(SIZE * STRUGGLE_PERCENT);
    const newConceptCount = Math.floor(SIZE * NEW_PERCENT);
    const confidenceCount = SIZE - struggleCount - newConceptCount;

    const sessionWords: Word[] = [];
    const usedWords = new Set<string>(); // Track words to prevent duplicates

    // 1. FILL STRUGGLE BUCKET (30%)
    const struggleWords = this.getStruggleWords(user, struggleCount, usedWords);
    sessionWords.push(...struggleWords);
    struggleWords.forEach(w => usedWords.add(w.text));

    // 2. FILL NEW CONCEPT BUCKET (50%)
    const newWords = this.getNewWords(user, newConceptCount, usedWords);
    sessionWords.push(...newWords);
    newWords.forEach(w => usedWords.add(w.text));

    // 3. FILL CONFIDENCE BUCKET (20%)
    const easyWords = this.getConfidenceBoosters(user, confidenceCount, usedWords);

    // Start with confidence boosters (don't shuffle these)
    const startingBoost = easyWords.slice(0, STARTING_BOOSTERS);
    const remainingEasy = easyWords.slice(STARTING_BOOSTERS);

    // Shuffle everything except the starting confidence boosters
    const shuffled = this.shuffle([
      ...remainingEasy,
      ...newWords,
      ...struggleWords,
    ]);

    const finalWords = [...startingBoost, ...shuffled];

    // Apply word transformations (capitals, punctuation)
    return this.applyWordTransformations(finalWords, options);
  }

  /**
   * Apply capitals and punctuation to words based on settings
   */
  private applyWordTransformations(words: Word[], options: SessionOptions): Word[] {
    const { capitalFrequency = "never", punctuationFrequency = "never" } = options;

    // Calculate how many words to transform
    const capitalChance = capitalFrequency === "never" ? 0 : capitalFrequency === "sometimes" ? 0.15 : 0.35;
    const punctuationChance = punctuationFrequency === "never" ? 0 : punctuationFrequency === "sometimes" ? 0.15 : 0.35;

    const punctuationMarks = [".", ",", "!", "?"];

    return words.map((word) => {
      let text = word.text;

      // Apply capitalization
      if (capitalChance > 0 && Math.random() < capitalChance) {
        text = text.charAt(0).toUpperCase() + text.slice(1);
      }

      // Apply punctuation
      if (punctuationChance > 0 && Math.random() < punctuationChance) {
        const mark = punctuationMarks[Math.floor(Math.random() * punctuationMarks.length)];
        text = text + mark;
      }

      // Return new word object if modified
      if (text !== word.text) {
        return { ...word, text };
      }
      return word;
    });
  }

  /**
   * Check if a word's phonicsGroup matches a struggle group
   * Handles the mismatch between generic categories (e.g., "cvc") and
   * specific subcategories in words.json (e.g., "cvc-short-a")
   */
  private matchesStruggleGroup(
    wordPhonicsGroup: string,
    struggleGroup: PhonicsGroup,
  ): boolean {
    // Map generic categories to their prefixes/patterns in words.json
    const groupPatterns: Record<PhonicsGroup, string[]> = {
      cvc: ["cvc-"],
      "silent-e": ["silent-"],
      digraphs: ["digraph-"],
      blends: ["blends-", "end-blends-"],
      "vowel-teams": ["vowel-team-"],
      "r-controlled": ["r-controlled-"],
      diphthongs: ["diphthong-"],
      reversals: ["reversal-"],
      "multi-syllable": ["multi-syllable"],
    };

    const patterns = groupPatterns[struggleGroup];
    if (!patterns) return false;

    return patterns.some((pattern) => wordPhonicsGroup.startsWith(pattern));
  }

  /**
   * Find struggle words from the user's bucket first, then from struggle groups
   */
  private getStruggleWords(
    user: UserProgress,
    count: number,
    usedWords: Set<string>,
  ): Word[] {
    const result: Word[] = [];

    // Priority 1: Words from the struggle bucket (these are real struggles)
    const bucketWordTexts = new Set(this.userStruggleWords.map((sw) => sw.word));
    const bucketWords = this.allWords.filter(
      (w) => bucketWordTexts.has(w.text) && !usedWords.has(w.text)
    );

    // Sort by consecutiveCorrect (prioritize words with 0 over 1-2)
    bucketWords.sort((a, b) => {
      const aProgress = this.userStruggleWords.find((sw) => sw.word === a.text)?.consecutiveCorrect ?? 0;
      const bProgress = this.userStruggleWords.find((sw) => sw.word === b.text)?.consecutiveCorrect ?? 0;
      return aProgress - bProgress; // Lower progress = higher priority
    });

    result.push(...bucketWords.slice(0, count));

    // Priority 2: If we need more, get words from struggle phonics groups
    if (result.length < count && user.struggleGroups.length > 0) {
      const groupWords = this.allWords.filter(
        (w) =>
          !usedWords.has(w.text) &&
          !result.some((r) => r.id === w.id) &&
          user.struggleGroups.some((group) =>
            this.matchesStruggleGroup(w.phonicsGroup, group)
          )
      );
      result.push(...groupWords.slice(0, count - result.length));
    }

    return result;
  }

  /**
   * Find words at user's current level (variety each session)
   */
  private getNewWords(
    user: UserProgress,
    count: number,
    usedWords: Set<string>,
  ): Word[] {
    // Find the max difficulty available in the word pool
    const maxAvailableDifficulty = Math.max(
      ...this.allWords.map((w) => w.difficulty),
    );

    // Cap user level at max available difficulty for filtering
    const effectiveLevel = Math.min(user.currentLevel, maxAvailableDifficulty);

    // Get words at current level that aren't already used
    const pool = this.allWords.filter((w) => {
      if (usedWords.has(w.text)) return false;
      const diffGap = Math.abs(w.difficulty - effectiveLevel);
      return diffGap <= 1; // Allow words within +/- 1 level
    });

    // Shuffle to get variety each session
    const shuffled = this.shuffle(pool);

    // If not enough words at level, widen the range
    if (shuffled.length < count) {
      const fallbackPool = this.allWords.filter((w) => {
        if (usedWords.has(w.text)) return false;
        if (shuffled.some((s) => s.id === w.id)) return false;
        const diffGap = Math.abs(w.difficulty - effectiveLevel);
        return diffGap <= 2; // Widen the range
      });
      return [...shuffled, ...this.shuffle(fallbackPool)].slice(0, count);
    }

    return shuffled.slice(0, count);
  }

  /**
   * Find easy words for confidence boosting at session start
   */
  private getConfidenceBoosters(
    user: UserProgress,
    count: number,
    usedWords: Set<string>,
  ): Word[] {
    // Find the max difficulty available in the word pool
    const maxAvailableDifficulty = Math.max(
      ...this.allWords.map((w) => w.difficulty),
    );

    // Cap user level at max available difficulty
    const effectiveLevel = Math.min(user.currentLevel, maxAvailableDifficulty);

    // Get easy words (below user level) that aren't struggle words
    const struggleWordTexts = new Set(this.userStruggleWords.map((sw) => sw.word));

    const pool = this.allWords.filter((w) => {
      if (usedWords.has(w.text)) return false;
      if (struggleWordTexts.has(w.text)) return false; // Don't use struggle words as boosters
      return w.difficulty < effectiveLevel || w.difficulty <= 2;
    });

    // Shuffle and return
    const shuffled = this.shuffle(pool);
    return shuffled.slice(0, count);
  }

  /**
   * Fisher-Yates Shuffle
   */
  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    let currentIndex = result.length;

    while (currentIndex !== 0) {
      const randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [result[currentIndex], result[randomIndex]] = [
        result[randomIndex],
        result[currentIndex],
      ];
    }

    return result;
  }
}

/**
 * Calculate new user level based on session performance
 *
 * Progressive leveling system:
 * - Requires multiple successful sessions to level up
 * - Much slower progression at higher levels
 * - Gentler adjustments for dyslexic learners
 */
export function calculateNewUserLevel(
  currentLevel: number,
  sessionAccuracy: number, // 0 to 1 (e.g. 0.85)
  avgTimePerWord: number, // seconds (e.g., 2.5)
): number {
  let levelAdjustment = 0;

  // Determine base adjustment based on performance
  if (sessionAccuracy >= 0.95 && avgTimePerWord < 2.5) {
    // Exceptional performance (95%+ accuracy, fast typing)
    levelAdjustment = 0.05;
  } else if (sessionAccuracy >= 0.85 && avgTimePerWord < 3.0) {
    // Good performance (85%+ accuracy, reasonable speed)
    levelAdjustment = 0.03;
  } else if (sessionAccuracy >= 0.75 && avgTimePerWord < 4.0) {
    // Decent performance - small increase
    levelAdjustment = 0.01;
  } else if (sessionAccuracy >= 0.7) {
    // Acceptable - stay at current level (build fluency)
    levelAdjustment = 0;
  } else if (sessionAccuracy >= 0.5) {
    // Struggling - small decrease
    levelAdjustment = -0.02;
  } else {
    // Significant struggle - larger decrease
    levelAdjustment = -0.05;
  }

  // Apply speed penalty for slow typing (even if accurate)
  if (avgTimePerWord > 5.0 && levelAdjustment > 0) {
    levelAdjustment *= 0.5; // Half the progression if too slow
  }

  const newLevel = currentLevel + levelAdjustment;

  // Clamp between 1 and 10
  return Math.min(Math.max(newLevel, 1), 10);
}

