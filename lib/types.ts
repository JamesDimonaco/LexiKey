// Accessibility Settings Types
export interface AccessibilitySettings {
  // Font settings
  font: 'helvetica' | 'arial' | 'opendyslexic';
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
  mode: 'lesson' | 'practice' | 'assignment';
  phonicsGroupFocus?: string;
  wordsAttempted: number;
  accuracy: number; // percentage
  durationSeconds: number;
  struggleWords: string[]; // word IDs
  completedAt: number;
}
