// Enhanced result type with correction tracking
export type WordResult = {
  wordId: string;
  word: string;
  difficulty: number;
  phonicsGroup: string;
  correct: boolean;
  timeSpent: number;
  backspaceCount: number;
  hesitationDetected: boolean;
  // Correction tracking fields
  correctionsMade: number; // Times user backspaced to fix a mistake
  letterAccuracy: number; // Percentage of letters typed correctly on first try
  finalAccuracy: number; // Final word accuracy (correct letters / total letters)
};

// Track per-letter state during typing
export type LetterState = {
  expected: string;
  typed: string | null;
  wasCorrectFirstTry: boolean;
  wasEverWrong: boolean;
};
