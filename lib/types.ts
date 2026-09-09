// Accessibility Settings Types
/** Pre-rendered voices in public/audio. Accents differ, and so does how each
 * one says bath, path and past — the pool contains all three. */
export type TTSVoice = "alice" | "roger";

export interface AccessibilitySettings {
  // Practice settings
  sessionWordCount: number; // 10-50
  capitalFrequency: "never" | "sometimes" | "often";
  punctuationFrequency: "never" | "sometimes" | "often";

  // Session mix settings (percentages that should sum to 100)
  strugglePercent: number; // 0-100, default 30
  newPercent: number; // 0-100, default 50
  confidencePercent: number; // 0-100, default 20
  startingBoosters: number; // 0-5, default 2

  // Font settings
  font: "helvetica" | "arial" | "opendyslexic";
  fontSize: number; // in px
  letterSpacing: number; // in px

  // Cursor settings
  largeCursor: boolean;

  // Contrast settings
  highContrast: boolean;

  // TTS settings
  ttsEnabled: boolean;
  voiceSpeed: number; // 0.5 to 2.0
  voice: TTSVoice;
  dictationMode: boolean; // Hide word, speak it aloud for user to type

  // UI settings
  showHints: boolean;
  showTimerPressure: boolean; // Show time/backspace stats on session complete
  blindMode: boolean; // Hide text to force muscle memory
  showTypingSpeed: boolean; // Show WPM on session complete
}

// Import and re-export ThresholdParams for convenience
import type { ThresholdParams } from "./thresholdCalculator";
export type { ThresholdParams };

// What a practice session focuses on (chosen on the setup screen)
export type PracticeFocus =
  | { type: "recommended" } // adaptive mix at the user's level
  | { type: "review" } // only words from the user's struggle bucket
  | { type: "pattern"; patternId: string }; // a single phonics pattern

// Session configuration chosen on the setup screen.
// Local state only — never persisted to Convex (summaries are).
export interface SessionConfig {
  focus: PracticeFocus;
  flow: "word" | "sentence";
}

// Anonymous user data stored in localStorage
export interface AnonymousUserData {
  deviceId: string;
  currentLevel: number; // Reading level (words shown on screen)
  listenLevel?: number; // Dictation level; falls back to currentLevel
  totalWords: number;
  totalSessions: number;
  struggleWords: StruggleWord[];
  lastPracticeDate: string | null;
  createdAt: string;
  // Adaptive hesitation threshold (set after placement test, adjusted
  // gradually). One per input mode — listening is far slower on long words.
  thresholdParams?: ThresholdParams;
  listenThresholdParams?: ThresholdParams;
  // Words the voice mangled — kept out of this device's listening sessions
  inaudibleWords?: string[];
  // Placement outcome, so signing up doesn't send the user back through the
  // test they already took. Absent for anyone who skipped it.
  hasCompletedPlacementTest?: boolean;
  struggleGroups?: string[];
}

// Adaptive Learning Types
export type PhonicsGroup =
  | "cvc"
  | "silent-e"
  | "digraphs"
  | "blends"
  | "vowel-teams"
  | "r-controlled"
  | "diphthongs"
  | "reversals"
  | "multi-syllable";

export interface Word {
  id: string;
  text: string;
  difficulty: number; // 1 (Easy) to 10 (Hard)
  phonicsGroup: PhonicsGroup;
  sentenceContext?: string;
  isStruggle?: boolean; // True if this word is from the struggle bucket
  /** Text before capitals/punctuation were applied; what gets persisted */
  baseText?: string;
}

// Struggle word from DB bucket
export interface StruggleWord {
  word: string;
  phonicsGroup: string;
  consecutiveCorrect: number; // 0-3, graduates at 3
  // Where the misses happened. Listening and reading are different skills —
  // a word only ever missed on dictation isn't a spelling problem.
  listenMisses?: number;
  seeMisses?: number;
}

// Result for a single word in a practice session
export interface WordResult {
  wordId: string;
  word: string;
  phonicsGroup: string;
  correct: boolean;
  userInput: string; // what the user actually typed
  timeSpent: number; // in seconds
  backspaceCount: number;
  hesitationDetected: boolean; // time exceeded per-character threshold
}

// Result of calling api.streaks.recordSessionCompleted (see convex/streaks.ts)
export interface StreakResult {
  status: "already_counted" | "started" | "incremented" | "freeze_used" | "reset";
  currentStreak: number;
  longestStreak: number;
  freezesAvailable: number;
  milestone: number | null;
}

// User's adaptive learning progress
export interface UserProgress {
  userId: string;
  currentLevel: number; // 1-10, can be decimal like 3.5
  hasCompletedPlacementTest: boolean;
  struggleGroups: PhonicsGroup[];
  struggleWords: StruggleWord[]; // Words in the struggle bucket
}

export interface PlacementTestResult {
  determinedLevel: number;
  identifiedStruggleGroups: PhonicsGroup[];
  wordResults: Array<{
    wordId: string;
    word: string;
    phonicsGroup: PhonicsGroup;
    difficulty: number;
    correct: boolean;
    timeSpent: number; // in milliseconds (differs from WordResult which uses seconds)
    backspaceCount: number;
  }>;
}
