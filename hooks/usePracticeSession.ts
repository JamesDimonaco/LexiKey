"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Word,
  UserProgress,
  PhonicsGroup,
  StruggleWord,
  WordResult,
} from "@/lib/types";
import {
  AdaptiveSessionGenerator,
  calculateNewUserLevel,
  SessionOptions,
} from "@/lib/AdaptiveEngine";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useTTS } from "./useTTS";
import { useReveal } from "./useReveal";
import { LetterState } from "@/app/practice/types";
import wordsData from "@/app/practice/words.json";
import { trackEvent } from "./usePostHog";

// Struggle word threshold constants
const HESITATION_BASE_TIME = 0.6; // base seconds to read/process the word
const HESITATION_PER_CHAR = 0.3; // seconds per character (reasonable typing speed)
const BACKSPACE_THRESHOLD = 4;

// Calculate hesitation threshold based on word length
function getHesitationThreshold(wordLength: number): number {
  return HESITATION_BASE_TIME + wordLength * HESITATION_PER_CHAR;
}

// Load words from JSON and transform to Word[] format
const WORD_POOL: Word[] = wordsData.map(
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

interface UsePracticeSessionProps {
  isAnonymous: boolean;
  isUserLoading: boolean;
  effectiveLevel: number;
  effectiveStruggleWords: StruggleWord[];
  currentUser:
    | {
        _id: string;
        stats: {
          hasCompletedPlacementTest: boolean;
          struggleGroups?: string[];
        };
      }
    | null
    | undefined;
  anonymousUser: { deviceId: string } | null;
  onFinishSession: (results: WordResult[], newLevel: number) => Promise<void>;
}

export function usePracticeSession({
  isAnonymous,
  isUserLoading,
  effectiveLevel,
  effectiveStruggleWords,
  currentUser,
  anonymousUser,
  onFinishSession,
}: UsePracticeSessionProps) {
  const { settings, updateSettings } = useAccessibility();
  const { speakWord } = useTTS(settings.voiceSpeed, settings.ttsEnabled);

  // Core state
  const [sessionWords, setSessionWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [results, setResults] = useState<WordResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Mode state
  const [sentenceMode, setSentenceMode] = useState(true);

  // Tracking state
  const [startTime, setStartTime] = useState<number | null>(null);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [correctionsMade, setCorrectionsMade] = useState(0);
  const [letterStates, setLetterStates] = useState<LetterState[]>([]);
  const [wasLastKeyBackspace, setWasLastKeyBackspace] = useState(false);

  // Feedback state
  const [showFeedback, setShowFeedback] = useState<
    "correct" | "incorrect" | null
  >(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const lastSpokenWordIdRef = useRef<string>("");

  const currentWord = sessionWords[currentWordIndex];

  // Reveal state (extracted to dedicated hook)
  const reveal = useReveal(currentWord?.id);

  // Speak word when it changes (only in dictation/Listen mode)
  useEffect(() => {
    if (!currentWord || !settings.dictationMode || !settings.ttsEnabled) return;
    if (lastSpokenWordIdRef.current === currentWord.id) return;

    const timer = setTimeout(() => {
      lastSpokenWordIdRef.current = currentWord.id;
      speakWord(currentWord.text);
    }, 300);

    return () => clearTimeout(timer);
  }, [currentWord?.id, settings.dictationMode, settings.ttsEnabled, speakWord]);

  // Generate adaptive session when user data loads
  useEffect(() => {
    if (sessionWords.length > 0) return;
    if (isUserLoading) return;

    const userProgress: UserProgress = {
      userId: isAnonymous
        ? (anonymousUser?.deviceId ?? "anon")
        : currentUser!._id,
      currentLevel: effectiveLevel,
      hasCompletedPlacementTest: isAnonymous
        ? false
        : (currentUser?.stats.hasCompletedPlacementTest ?? false),
      struggleGroups: isAnonymous
        ? []
        : ((currentUser?.stats.struggleGroups || []) as PhonicsGroup[]),
      struggleWords: effectiveStruggleWords,
    };

    const sessionOptions: SessionOptions = {
      wordCount: settings.sessionWordCount,
      capitalFrequency: settings.capitalFrequency,
      punctuationFrequency: settings.punctuationFrequency,
      strugglePercent: settings.strugglePercent,
      newPercent: settings.newPercent,
      confidencePercent: settings.confidencePercent,
      startingBoosters: settings.startingBoosters,
    };

    const generator = new AdaptiveSessionGenerator(
      WORD_POOL,
      effectiveStruggleWords,
    );
    const generatedWords = generator.generateSession(
      userProgress,
      sessionOptions,
    );
    setSessionWords(generatedWords);

    // Track session started
    trackEvent("practice_session_started", {
      wordCount: generatedWords.length,
      userLevel: effectiveLevel,
      isAnonymous,
      hasCompletedPlacementTest: userProgress.hasCompletedPlacementTest,
      struggleWordsCount: effectiveStruggleWords.length,
      sessionOptions: {
        strugglePercent: sessionOptions.strugglePercent,
        newPercent: sessionOptions.newPercent,
        confidencePercent: sessionOptions.confidencePercent,
      },
    });
  }, [
    isAnonymous,
    isUserLoading,
    anonymousUser,
    currentUser,
    sessionWords.length,
    effectiveLevel,
    effectiveStruggleWords,
    settings.sessionWordCount,
    settings.capitalFrequency,
    settings.punctuationFrequency,
    settings.strugglePercent,
    settings.newPercent,
    settings.confidencePercent,
    settings.startingBoosters,
  ]);

  // Initialize letter states when word changes
  useEffect(() => {
    if (currentWord) {
      setLetterStates(
        currentWord.text.split("").map((char) => ({
          expected: char.toLowerCase(),
          typed: null,
          wasCorrectFirstTry: true,
          wasEverWrong: false,
        })),
      );
      setStartTime(null); // Timer starts on first keystroke, not when word appears
      setBackspaceCount(0);
      setCorrectionsMade(0);
      setShowFeedback(null);
      setWasLastKeyBackspace(false);
    }
  }, [currentWord, currentWordIndex]);

  // Calculate result for current word
  const calculateWordResult = useCallback((): WordResult => {
    if (!currentWord) {
      return {
        wordId: "",
        word: "",
        phonicsGroup: "",
        correct: false,
        userInput: "",
        timeSpent: 0,
        backspaceCount: 0,
        hesitationDetected: false,
      };
    }

    // If startTime is null, user hasn't started typing yet - use 0
    const timeSpent = startTime ? (Date.now() - startTime) / 1000 : 0;
    const isCorrect =
      userInput.toLowerCase() === currentWord.text.toLowerCase();

    return {
      wordId: currentWord.id,
      word: currentWord.text,
      phonicsGroup: currentWord.phonicsGroup,
      correct: isCorrect,
      userInput,
      timeSpent,
      backspaceCount,
      hesitationDetected:
        timeSpent > getHesitationThreshold(currentWord.text.length),
    };
  }, [currentWord, userInput, startTime, backspaceCount]);

  // Finish session handler
  const finishSession = useCallback(
    async (allResults: WordResult[]) => {
      setIsComplete(true);

      const accuracy =
        allResults.filter((r) => r.correct).length / allResults.length;
      const avgTimePerWord =
        allResults.reduce((sum, r) => sum + r.timeSpent, 0) / allResults.length;
      const newLevel = calculateNewUserLevel(
        effectiveLevel,
        accuracy,
        avgTimePerWord,
      );

      // Track session completion
      const totalTime = allResults.reduce((sum, r) => sum + r.timeSpent, 0);
      const struggleWords = allResults.filter(
        (r) => !r.correct || r.hesitationDetected || r.backspaceCount > BACKSPACE_THRESHOLD
      );

      trackEvent("practice_session_completed", {
        wordCount: allResults.length,
        accuracy: Math.round(accuracy * 100),
        avgTimePerWord: Math.round(avgTimePerWord * 100) / 100,
        totalTime: Math.round(totalTime),
        oldLevel: effectiveLevel,
        newLevel,
        struggleWordsCount: struggleWords.length,
        isAnonymous,
        sentenceMode,
        dictationMode: settings.dictationMode,
      });

      await onFinishSession(allResults, newLevel);
    },
    [effectiveLevel, onFinishSession, isAnonymous, sentenceMode, settings.dictationMode],
  );

  // Input change handler with letter tracking
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      const oldLength = userInput.length;
      const newLength = newValue.length;

      // Start timer on first keystroke (when going from 0 to 1 character)
      if (oldLength === 0 && newLength > 0 && startTime === null) {
        setStartTime(Date.now());
      }

      if (newLength < oldLength) {
        if (!wasLastKeyBackspace && oldLength > 0) {
          setCorrectionsMade((prev) => prev + 1);
        }
        setWasLastKeyBackspace(true);

        setLetterStates((prev) =>
          prev.map((state, i) => {
            if (i >= newLength) {
              return { ...state, typed: null };
            }
            return state;
          }),
        );
      } else {
        setWasLastKeyBackspace(false);

        const newCharIndex = newLength - 1;
        const newChar = newValue[newCharIndex];

        if (newCharIndex < letterStates.length) {
          setLetterStates((prev) =>
            prev.map((state, i) => {
              if (i === newCharIndex) {
                const isCorrect = newChar.toLowerCase() === state.expected;
                return {
                  ...state,
                  typed: newChar,
                  wasCorrectFirstTry:
                    state.typed === null ? isCorrect : state.wasCorrectFirstTry,
                  wasEverWrong: state.wasEverWrong || !isCorrect,
                };
              }
              return state;
            }),
          );
        }
      }

      setUserInput(newValue);
    },
    [userInput.length, wasLastKeyBackspace, letterStates.length, startTime],
  );

  // Advance to next word
  const advanceToNextWord = useCallback(
    (wasCorrect: boolean) => {
      const result = calculateWordResult();
      result.correct = wasCorrect;
      const newResults = [...results, result];
      setResults(newResults);

      if (currentWordIndex < sessionWords.length - 1) {
        setCurrentWordIndex((prev) => prev + 1);
        setUserInput("");
      } else {
        finishSession(newResults);
      }
    },
    [
      calculateWordResult,
      results,
      currentWordIndex,
      sessionWords.length,
      finishSession,
    ],
  );

  // Submit word (single word mode)
  const handleSubmitWord = useCallback(() => {
    if (!currentWord) return;

    const result = calculateWordResult();
    const isCorrect =
      userInput.toLowerCase() === currentWord.text.toLowerCase();

    // Track word completion
    trackEvent("practice_word_completed", {
      word: currentWord.text,
      correct: isCorrect,
      timeSpent: Math.round(result.timeSpent * 100) / 100,
      backspaceCount: result.backspaceCount,
      hesitationDetected: result.hesitationDetected,
      wordIndex: currentWordIndex + 1,
      totalWords: sessionWords.length,
      difficulty: currentWord.difficulty,
      phonicsGroup: currentWord.phonicsGroup,
      sentenceMode,
      dictationMode: settings.dictationMode,
    });

    setShowFeedback(isCorrect ? "correct" : "incorrect");

    const newResults = [...results, result];
    setResults(newResults);

    setTimeout(() => {
      if (currentWordIndex < sessionWords.length - 1) {
        setCurrentWordIndex((prev) => prev + 1);
        setUserInput("");
      } else {
        finishSession(newResults);
      }
    }, 300);
  }, [
    currentWord,
    calculateWordResult,
    userInput,
    results,
    currentWordIndex,
    sessionWords.length,
    finishSession,
  ]);

  // Key down handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        setBackspaceCount((prev) => prev + 1);
      }

      if (
        !sentenceMode &&
        (e.key === "Enter" || e.key === " ") &&
        userInput.length > 0
      ) {
        e.preventDefault();
        handleSubmitWord();
      }

      if (sentenceMode && e.key === " " && userInput.length > 0) {
        e.preventDefault();
        const isCorrect = userInput.toLowerCase() === currentWord?.text.toLowerCase();

        // Track word completion in sentence mode
        if (currentWord) {
          const result = calculateWordResult();
          trackEvent("practice_word_completed", {
            word: currentWord.text,
            correct: isCorrect,
            timeSpent: Math.round(result.timeSpent * 100) / 100,
            backspaceCount: result.backspaceCount,
            hesitationDetected: result.hesitationDetected,
            wordIndex: currentWordIndex + 1,
            totalWords: sessionWords.length,
            difficulty: currentWord.difficulty,
            phonicsGroup: currentWord.phonicsGroup,
            sentenceMode: true,
            dictationMode: settings.dictationMode,
          });
        }

        advanceToNextWord(isCorrect);
      }
    },
    [
      sentenceMode,
      userInput,
      handleSubmitWord,
      advanceToNextWord,
      currentWord?.text,
    ],
  );

  // Reset session state (keeps same words)
  const resetSessionState = useCallback(() => {
    setCurrentWordIndex(0);
    setUserInput("");
    setResults([]);
    setIsComplete(false);
    setStartTime(null); // Timer starts on first keystroke
    setBackspaceCount(0);
    setCorrectionsMade(0);
    setShowFeedback(null);
    reveal.reset();
  }, [reveal]);

  // Restart session (generates new words)
  const restartSession = useCallback(() => {
    trackEvent("practice_session_restarted", {
      previousWordCount: sessionWords.length,
      previousResultsCount: results.length,
    });
    setSessionWords([]); // This triggers regeneration
    resetSessionState();
  }, [resetSessionState, sessionWords.length, results.length]);

  // Refresh session with new words
  const refreshSession = useCallback(() => {
    trackEvent("practice_session_refreshed", {
      previousWordCount: sessionWords.length,
      currentWordIndex,
    });
    setSessionWords([]); // Clear to trigger regeneration
    resetSessionState();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [resetSessionState, sessionWords.length, currentWordIndex]);

  // Dictation mode toggle - regenerates new words to prevent cheating
  const handleDictationToggle = useCallback(
    (enabled: boolean) => {
      trackEvent("dictation_mode_toggled", {
        enabled,
        previousMode: settings.dictationMode,
        wordIndex: currentWordIndex,
      });

      updateSettings({
        dictationMode: enabled,
        ttsEnabled: enabled ? true : settings.ttsEnabled,
      });

      // Generate new words to prevent cheating
      setSessionWords([]);
      resetSessionState();

      setTimeout(() => inputRef.current?.focus(), 100);
    },
    [settings.ttsEnabled, settings.dictationMode, updateSettings, resetSessionState, currentWordIndex],
  );

  // Dictation handlers
  const handleRepeat = useCallback(() => {
    if (currentWord) speakWord(currentWord.text);
  }, [currentWord, speakWord]);

  // Focus input when mode changes
  useEffect(() => {
    inputRef.current?.focus();
  }, [sentenceMode]);

  const isLoading = isUserLoading || sessionWords.length === 0;

  return {
    // State
    sessionWords,
    currentWordIndex,
    currentWord,
    userInput,
    results,
    isComplete,
    isLoading,
    sentenceMode,
    letterStates,
    showFeedback,
    reveal, // Reveal state object from useReveal hook
    inputRef,
    // Handlers
    handleInputChange,
    handleKeyDown,
    handleSubmitWord,
    restartSession,
    refreshSession,
    handleDictationToggle,
    handleRepeat,
    setSentenceMode,
  };
}

export { BACKSPACE_THRESHOLD };
