import { WORD_POOL } from "./wordPool";

/**
 * User-facing phonics pattern catalogue for the session setup screen.
 *
 * words.json uses fine-grained groups ("cvc-short-a", "vowel-team-ea", ...).
 * Each pattern here maps a friendly label to the set of group prefixes it
 * covers, so the picker stays readable while the data stays precise.
 */
export interface PhonicsPattern {
  id: string;
  label: string;
  /** Example words, shown under the label (also what TTS reads) */
  example: string;
  /** phonicsGroup prefixes in words.json that belong to this pattern */
  prefixes: string[];
}

export const PHONICS_PATTERNS: PhonicsPattern[] = [
  {
    id: "cvc",
    label: "Short vowels",
    example: "cat, bed, sip",
    prefixes: ["cvc-"],
  },
  {
    id: "magic-e",
    label: "Magic E",
    example: "rate, bite, hope",
    prefixes: ["silent-e"],
  },
  {
    id: "digraphs",
    label: "Digraphs",
    example: "ship, chat, patch",
    prefixes: ["digraph-", "trigraph-"],
  },
  {
    id: "blends",
    label: "Blends",
    example: "stop, trip, sand",
    prefixes: ["blend-", "blends-", "end-blends-", "glued-", "welded-"],
  },
  {
    id: "vowel-teams",
    label: "Vowel teams",
    example: "rain, beach, seed",
    prefixes: ["vowel-team-"],
  },
  {
    id: "r-controlled",
    label: "R-controlled",
    example: "car, bird, fort",
    prefixes: ["r-controlled"],
  },
  {
    id: "diphthongs",
    label: "Diphthongs",
    example: "coin, cloud, town",
    prefixes: ["diphthong-"],
  },
  {
    id: "silent-letters",
    label: "Silent letters",
    example: "knee, wrist, ghost",
    prefixes: [
      "silent-gh",
      "silent-k",
      "silent-kn",
      "silent-l",
      "silent-letters",
      "silent-s",
      "silent-t",
      "silent-u",
      "silent-w",
      "silent-wr",
    ],
  },
  {
    id: "double-letters",
    label: "Double letters",
    example: "letter, ballot, sudden",
    prefixes: ["double-letters"],
  },
  {
    id: "tricky-rules",
    label: "Tricky rules",
    example: "receive, giant, once",
    prefixes: [
      "ie-ei-rule",
      "soft-c",
      "soft-g",
      "sight-words",
      "reversal-",
      "ending-y",
      "long-vowel-y",
    ],
  },
  {
    id: "compound",
    label: "Compound words",
    example: "sunset, backpack",
    prefixes: ["compound"],
  },
  {
    id: "multi-syllable",
    label: "Longer words",
    example: "wonderful, remember",
    prefixes: ["multi-syllable", "suffix-"],
  },
];

export function getPattern(patternId: string): PhonicsPattern | undefined {
  return PHONICS_PATTERNS.find((p) => p.id === patternId);
}

export function wordMatchesPrefixes(
  phonicsGroup: string,
  prefixes: string[],
): boolean {
  return prefixes.some((prefix) => phonicsGroup.startsWith(prefix));
}

/** Words available in the pool for a pattern (shown on the picker) */
const PATTERN_WORD_COUNTS = new Map(
  PHONICS_PATTERNS.map((p) => [
    p.id,
    WORD_POOL.filter((w) => wordMatchesPrefixes(w.phonicsGroup, p.prefixes))
      .length,
  ]),
);

export function patternWordCount(pattern: PhonicsPattern): number {
  return PATTERN_WORD_COUNTS.get(pattern.id) ?? 0;
}
