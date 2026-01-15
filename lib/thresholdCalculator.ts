/**
 * Adaptive Threshold Calculator
 *
 * Calculates personalized hesitation thresholds based on user typing speed.
 * Slower users get more lenient thresholds, faster users get tighter ones.
 */

export interface ThresholdParams {
  baseTime: number; // Processing/reading overhead in seconds
  secondsPerChar: number; // Typing speed per character
  safetyMultiplier: number; // Buffer above normal speed (1.3 = 30% buffer)
  wordCount: number; // Number of words used to calculate this
  lastUpdated: string; // ISO timestamp
}

/**
 * Default threshold for users without calibration data.
 * Middle ground between strict (current hardcoded) and generous.
 *
 * Example: "cat" (3 chars) = (0.7 + 3*0.4) * 1.3 = 2.47 seconds
 * vs current hardcoded: 0.6 + 3*0.3 = 1.5 seconds
 */
export const DEFAULT_THRESHOLD_PARAMS: ThresholdParams = {
  baseTime: 0.7,
  secondsPerChar: 0.4,
  safetyMultiplier: 1.3,
  wordCount: 0,
  lastUpdated: new Date().toISOString(),
};

/**
 * Calculate the hesitation threshold for a specific word.
 *
 * @param wordLength - Number of characters in the word
 * @param params - User's personalized threshold parameters (uses defaults if not provided)
 * @returns Threshold in seconds - time above this is considered "hesitation"
 */
export function getHesitationThreshold(
  wordLength: number,
  params: ThresholdParams = DEFAULT_THRESHOLD_PARAMS
): number {
  return (params.baseTime + wordLength * params.secondsPerChar) * params.safetyMultiplier;
}

/**
 * Calculate the Nth percentile of an array of numbers.
 * Used to get robust timing estimates that ignore outliers.
 */
function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Calculate threshold parameters from placement test results.
 * This is the initial calibration when a user completes the placement test.
 *
 * @param wordResults - Array of word results from placement test
 * @returns Personalized threshold parameters
 */
export function calculateThresholdFromPlacementTest(
  wordResults: Array<{ word: string; timeSpent: number; correct: boolean }>
): ThresholdParams {
  // Only use correct words with valid data for baseline
  const correctResults = wordResults.filter(
    (r) => r.correct && r.word.length > 0 && r.timeSpent > 0 && isFinite(r.timeSpent)
  );

  if (correctResults.length < 3) {
    // Not enough data, return defaults
    return { ...DEFAULT_THRESHOLD_PARAMS, lastUpdated: new Date().toISOString() };
  }

  // Calculate seconds per character for each word
  // Note: timeSpent from placement test is in milliseconds
  const timingsPerChar = correctResults.map(
    (r) => r.timeSpent / 1000 / r.word.length
  );

  // Filter out any invalid values (NaN, Infinity, negative)
  const validTimings = timingsPerChar.filter((t) => isFinite(t) && t > 0);

  if (validTimings.length < 3) {
    return { ...DEFAULT_THRESHOLD_PARAMS, lastUpdated: new Date().toISOString() };
  }

  // Use 75th percentile - this gives a "normal-ish" speed that ignores
  // both their fastest typing (lucky) and outliers (distractions)
  const p75SecsPerChar = percentile(validTimings, 75);

  // Clamp secondsPerChar to reasonable bounds (0.1s to 2.0s per char)
  // 0.1s = ~100 WPM for 5-char words, 2.0s = ~6 WPM
  const clampedSecsPerChar = Math.max(0.1, Math.min(2.0, p75SecsPerChar));

  // Calculate base time as a proportion of their typing speed
  // Faster typists need less "reading" time
  const baseTime = Math.max(0.4, Math.min(1.0, clampedSecsPerChar * 0.5));

  return {
    baseTime,
    secondsPerChar: clampedSecsPerChar,
    safetyMultiplier: 1.3, // 30% buffer above their normal speed
    wordCount: correctResults.length,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Gradually adjust threshold parameters based on a practice session.
 * Uses exponential moving average to blend new data with existing.
 *
 * @param current - Current threshold parameters
 * @param sessionTimings - Timing data from the practice session
 * @param adjustmentRate - How much to weight new data (default 0.05 = 5%)
 * @returns Updated threshold parameters
 */
export function adjustThresholdFromSession(
  current: ThresholdParams,
  sessionTimings: Array<{ wordLen: number; time: number }>,
  adjustmentRate: number = 0.05
): ThresholdParams {
  // Filter to only valid timings (positive word length and time)
  const validTimings = sessionTimings.filter(
    (t) => t.wordLen > 0 && t.time > 0 && isFinite(t.time)
  );

  if (validTimings.length < 3) {
    // Not enough valid data to adjust
    return current;
  }

  // Calculate seconds per character for this session
  const timingsPerChar = validTimings.map((t) => t.time / t.wordLen);

  // Filter out any invalid calculated values
  const validCalcTimings = timingsPerChar.filter((t) => isFinite(t) && t > 0);

  if (validCalcTimings.length < 3) {
    return current;
  }

  const sessionSecsPerChar = percentile(validCalcTimings, 75);

  // Clamp session value to reasonable bounds before blending
  const clampedSessionSecs = Math.max(0.1, Math.min(2.0, sessionSecsPerChar));

  // Blend with existing (exponential moving average)
  // e.g., 95% old + 5% new for gradual adjustment
  const newSecondsPerChar =
    current.secondsPerChar * (1 - adjustmentRate) +
    clampedSessionSecs * adjustmentRate;

  // Also adjust base time proportionally
  const newBaseTime =
    current.baseTime * (1 - adjustmentRate) +
    Math.max(0.4, Math.min(1.0, clampedSessionSecs * 0.5)) * adjustmentRate;

  // Final clamp to ensure we stay in bounds
  const finalSecsPerChar = Math.max(0.1, Math.min(2.0, newSecondsPerChar));

  return {
    baseTime: Math.round(newBaseTime * 1000) / 1000, // Round to 3 decimals
    secondsPerChar: Math.round(finalSecsPerChar * 1000) / 1000,
    safetyMultiplier: current.safetyMultiplier, // Keep multiplier constant
    wordCount: current.wordCount + validTimings.length,
    lastUpdated: new Date().toISOString(),
  };
}
