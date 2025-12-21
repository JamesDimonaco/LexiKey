// Track per-letter state during typing (UI-specific)
export type LetterState = {
  expected: string;
  typed: string | null;
  wasCorrectFirstTry: boolean;
  wasEverWrong: boolean;
};
