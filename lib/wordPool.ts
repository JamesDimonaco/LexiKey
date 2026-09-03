import { PhonicsGroup, Word } from "./types";
import wordsData from "@/app/practice/words.json";

/**
 * The full client-side word pool, loaded once from words.json.
 * Shared by the session generator and the setup screen (pattern word counts).
 */
export const WORD_POOL: Word[] = wordsData.map(
  (w: {
    id: string;
    word: string;
    difficultyLevel: number;
    phonicsGroup: string;
    sentenceContext?: string;
  }) => ({
    id: w.id,
    text: w.word,
    difficulty: w.difficultyLevel,
    phonicsGroup: w.phonicsGroup as PhonicsGroup,
    sentenceContext: w.sentenceContext,
  }),
);
