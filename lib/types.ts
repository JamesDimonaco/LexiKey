// Accessibility Settings Types
export interface AccessibilitySettings {
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

  // UI settings
  showHints: boolean;
  noTimerPressure: boolean;
  blindMode: boolean; // Hide text to force muscle memory
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

// Struggle word from DB bucket
export interface StruggleWord {
  word: string;
  phonicsGroup: string;
  consecutiveCorrect: number; // 0-3, graduates at 3
}

// Result for a single word in a practice session
export interface WordResult {
  wordId: string;
  word: string;
  phonicsGroup: string;
  correct: boolean;
  timeSpent: number; // in seconds
  backspaceCount: number;
  hesitationDetected: boolean; // >1.5s to type the word
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
    timeSpent: number;
    backspaceCount: number;
  }>;
}
