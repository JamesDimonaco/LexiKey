/**
 * Adaptive Session Generator
 *
 * Client-side algorithm for generating personalized typing sessions
 * Uses weighted probability buckets to balance new concepts, review, and confidence
 */

import { Word, UserProgress, PhonicsGroup, WordStats } from './types';

export class AdaptiveSessionGenerator {
  private allWords: Word[];

  constructor(allWords: Word[]) {
    this.allWords = allWords;
  }

  /**
   * Generates a 20-word session tailored to the user.
   *
   * Breakdown:
   * - 30% Struggle words (recently missed or from struggle groups)
   * - 50% New concepts (at current level +/- 1)
   * - 20% Confidence boosters (easy mastered words)
   */
  public generateSession(user: UserProgress): Word[] {
    const SESSION_SIZE = 20;

    // Bucket sizes
    const struggleCount = Math.floor(SESSION_SIZE * 0.3); // 6 words
    const newConceptCount = Math.floor(SESSION_SIZE * 0.5); // 10 words
    const confidenceCount = SESSION_SIZE - struggleCount - newConceptCount; // 4 words

    const sessionWords: Word[] = [];

    // 1. FILL STRUGGLE BUCKET (30%)
    const struggleWords = this.getStruggleWords(user, struggleCount);
    sessionWords.push(...struggleWords);

    // 2. FILL NEW CONCEPT BUCKET (50%)
    const newWords = this.getNewWords(user, newConceptCount, sessionWords);
    sessionWords.push(...newWords);

    // 3. FILL CONFIDENCE BUCKET (20%)
    const easyWords = this.getConfidenceBoosters(user, confidenceCount, sessionWords);

    // Start with 2 confidence boosters (don't shuffle these)
    const startingBoost = easyWords.slice(0, 2);
    const remainingEasy = easyWords.slice(2);

    // Shuffle everything except the first 2 confidence boosters
    const shuffled = this.shuffle([...remainingEasy, ...newWords, ...struggleWords]);

    return [...startingBoost, ...shuffled];
  }

  /**
   * Check if a word's phonicsGroup matches a struggle group
   * Handles the mismatch between generic categories (e.g., "cvc") and
   * specific subcategories in words.json (e.g., "cvc-short-a")
   */
  private matchesStruggleGroup(wordPhonicsGroup: string, struggleGroup: PhonicsGroup): boolean {
    // Map generic categories to their prefixes/patterns in words.json
    const groupPatterns: Record<PhonicsGroup, string[]> = {
      "cvc": ["cvc-"],
      "silent-e": ["silent-"], // Matches "silent-e", "silent-gh", "silent-kn", "silent-wr", etc.
      "digraphs": ["digraph-"],
      "blends": ["blends-", "end-blends-"],
      "vowel-teams": ["vowel-team-"],
      "r-controlled": ["r-controlled-"],
      "diphthongs": ["diphthong-"],
      "reversals": ["reversal-"],
      "multi-syllable": ["multi-syllable"],
    };

    const patterns = groupPatterns[struggleGroup];
    if (!patterns) return false;

    // Check if word's phonicsGroup matches any pattern
    return patterns.some(pattern => wordPhonicsGroup.startsWith(pattern));
  }

  /**
   * Find words user failed recently or from struggle phonics groups
   */
  private getStruggleWords(user: UserProgress, count: number): Word[] {
    // Get words with low accuracy (<70%)
    const missedWordIds = Object.entries(user.wordHistory)
      .filter(([, stats]) => {
        if (stats.timesSeen === 0) return false;
        const accuracy = stats.timesCorrect / stats.timesSeen;
        return accuracy < 0.7;
      })
      .sort((a, b) => b[1].lastSeenAt - a[1].lastSeenAt) // Most recent first
      .map(([id]) => id);

    // Also include words from struggle phonics groups
    const groupWords = this.allWords.filter(w =>
      user.struggleGroups.some(group => this.matchesStruggleGroup(w.phonicsGroup, group)) &&
      !missedWordIds.includes(w.id)
    );

    const pool = [
      ...this.allWords.filter(w => missedWordIds.includes(w.id)),
      ...groupWords
    ];

    return pool.slice(0, count);
  }

  /**
   * Find words at user's current level that haven't been seen much
   */
  private getNewWords(user: UserProgress, count: number, exclude: Word[]): Word[] {
    const excludeIds = new Set(exclude.map(w => w.id));

    const pool = this.allWords.filter(w => {
      if (excludeIds.has(w.id)) return false;

      const diffGap = Math.abs(w.difficulty - user.currentLevel);
      const history = user.wordHistory[w.id];

      // Prioritize unseen or rarely seen words
      const isNew = !history || history.timesSeen < 3;

      // Allow words within +/- 1 level
      return diffGap <= 1 && isNew;
    });

    // Sort by least seen
    pool.sort((a, b) => {
      const aCount = user.wordHistory[a.id]?.timesSeen || 0;
      const bCount = user.wordHistory[b.id]?.timesSeen || 0;
      return aCount - bCount;
    });

    return pool.slice(0, count);
  }

  /**
   * Find easy words with high accuracy (>90%) for confidence
   */
  private getConfidenceBoosters(user: UserProgress, count: number, exclude: Word[]): Word[] {
    const excludeIds = new Set(exclude.map(w => w.id));

    const pool = this.allWords.filter(w => {
      if (excludeIds.has(w.id)) return false;

      const history = user.wordHistory[w.id];
      if (!history || history.timesSeen < 2) return false;

      const accuracy = history.timesCorrect / history.timesSeen;
      const isMastered = accuracy > 0.9 && history.consecutiveCorrect >= 2;
      const isEasy = w.difficulty < user.currentLevel;

      return isMastered && isEasy;
    });

    return pool.slice(0, count);
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
      [result[currentIndex], result[randomIndex]] = [result[randomIndex], result[currentIndex]];
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
  avgTimePerWord: number // seconds (e.g., 2.5)
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
  } else if (sessionAccuracy >= 0.70) {
    // Acceptable - stay at current level (build fluency)
    levelAdjustment = 0;
  } else if (sessionAccuracy >= 0.50) {
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

/**
 * Map specific phonicsGroup values from words.json to generic PhonicsGroup categories
 */
function mapToGenericPhonicsGroup(specificGroup: string): PhonicsGroup | null {
  if (specificGroup.startsWith("cvc-")) return "cvc";
  if (specificGroup.startsWith("silent-")) return "silent-e"; // All silent patterns map to silent-e
  if (specificGroup.startsWith("digraph-")) return "digraphs";
  if (specificGroup.startsWith("blends-") || specificGroup.startsWith("end-blends-")) return "blends";
  if (specificGroup.startsWith("vowel-team-")) return "vowel-teams";
  if (specificGroup.startsWith("r-controlled-")) return "r-controlled";
  if (specificGroup.startsWith("diphthong-")) return "diphthongs";
  if (specificGroup.startsWith("reversal-")) return "reversals";
  if (specificGroup.startsWith("multi-syllable")) return "multi-syllable";
  // Patterns like "glued-*", "soft-*", "trigraph-*", "welded-*", "ending-*", "suffix-*" 
  // don't map to PhonicsGroup types and will return null (excluded from struggle group detection)
  return null;
}

/**
 * Detect struggle groups based on word history
 * Aggregates specific phonicsGroup values (e.g., "cvc-short-a") into generic categories (e.g., "cvc")
 */
export function detectStruggleGroups(
  allWords: Word[],
  wordHistory: Record<string, WordStats>
): PhonicsGroup[] {
  const groupAccuracy: Record<PhonicsGroup, { correct: number; total: number }> = {} as Record<PhonicsGroup, { correct: number; total: number }>;

  Object.entries(wordHistory).forEach(([wordId, stats]) => {
    const word = allWords.find(w => w.id === wordId);
    if (!word) return;

    const genericGroup = mapToGenericPhonicsGroup(word.phonicsGroup);
    if (!genericGroup) return;

    if (!groupAccuracy[genericGroup]) {
      groupAccuracy[genericGroup] = { correct: 0, total: 0 };
    }

    groupAccuracy[genericGroup].correct += stats.timesCorrect;
    groupAccuracy[genericGroup].total += stats.timesSeen;
  });

  // Return groups with <70% accuracy AND at least 5 attempts
  return Object.entries(groupAccuracy)
    .filter(([, stats]) => {
      const accuracy = stats.correct / stats.total;
      return stats.total >= 5 && accuracy < 0.7;
    })
    .map(([group]) => group as PhonicsGroup);
}
