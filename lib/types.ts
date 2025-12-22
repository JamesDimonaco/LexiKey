// Accessibility Settings Types
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
  dictationMode: boolean; // Hide word, speak it aloud for user to type

  // UI settings
  showHints: boolean;
  showTimerPressure: boolean; // Show time/backspace stats on session complete
  blindMode: boolean; // Hide text to force muscle memory
  showTypingSpeed: boolean; // Show WPM on session complete
}

// Anonymous user data stored in localStorage
export interface AnonymousUserData {
  deviceId: string;
  currentLevel: number;
  totalWords: number;
  totalSessions: number;
  struggleWords: StruggleWord[];
  lastPracticeDate: string | null;
  createdAt: string;
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
