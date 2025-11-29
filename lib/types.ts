// Accessibility Settings Types
export interface AccessibilitySettings {
  // Font settings
  font: "helvetica" | "arial" | "opendyslexic";
  fontSize: number; // in px
  letterSpacing: number; // in px

  // Cursor settings
  largeCursor: boolean;
  nonBlinkingCursor: boolean;

  // Contrast settings
  highContrast: boolean;

  // TTS settings
  ttsEnabled: boolean;
  voiceSpeed: number; // 0.5 to 2.0

  // UI settings
  showHints: boolean;
  noTimerPressure: boolean;
  blindMode: boolean; // Hide text to force muscle memory
}

// Typing Session Types
export interface TypingWord {
  id: string;
  word: string;
  phonicsGroup: string;
  difficultyLevel: number;
  sentenceContext?: string;
}

export interface KeystrokeData {
  char: string;
  isCorrect: boolean;
  timestamp: number;
  hesitationTime: number; // Time since last keystroke
  backspaceUsed: boolean;
}

export interface WordResult {
  wordId: string;
  word: string;
  isCorrect: boolean;
  timeSpent: number; // in seconds
  keystrokeCount: number;
  backspaceCount: number;
  hesitated: boolean; // > 1.5s pause
  timestamp: number;
}

export interface PracticeSession {
  userId: string;
  mode: "lesson" | "practice" | "assignment";
  phonicsGroupFocus?: string;
  wordsAttempted: number;
  accuracy: number; // percentage
  durationSeconds: number;
  struggleWords: string[]; // word IDs
  completedAt: number;
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
}

export interface WordStats {
  timesSeen: number;
  timesCorrect: number;
  lastSeenAt: number; // Timestamp
  consecutiveCorrect: number; // For "mastery" tracking
  avgTimeSpent: number; // Average milliseconds per attempt
  totalBackspaces: number;
}

export interface UserProgress {
  userId: string;
  currentLevel: number; // 1-10, can be decimal like 3.5
  hasCompletedPlacementTest: boolean;
  struggleGroups: PhonicsGroup[];
  wordHistory: Record<string, WordStats>; // Map of WordID -> Stats
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
    timeSpent: number;
    backspaceCount: number;
  }>;
}
