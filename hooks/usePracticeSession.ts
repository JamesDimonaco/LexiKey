"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  PhonicsGroup,
  SessionConfig,
  StruggleWord,
  UserProgress,
  Word,
  WordResult,
} from "@/lib/types";
import {
  AdaptiveSessionGenerator,
  calculateNewUserLevel,
  SessionOptions,
} from "@/lib/AdaptiveEngine";
import {
  ThresholdParams,
  DEFAULT_THRESHOLD_PARAMS,
  getHesitationThreshold,
} from "@/lib/thresholdCalculator";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useTTS } from "./useTTS";
import { useReveal } from "./useReveal";
import { LetterState } from "@/app/practice/types";
import { WORD_POOL } from "@/lib/wordPool";
import { getPattern } from "@/lib/phonicsPatterns";
import { trackEvent, trackPracticeStarted, trackWordStruggle } from "./usePostHog";

// Struggle word threshold constant (backspaces only - hesitation now uses adaptive threshold)
const BACKSPACE_THRESHOLD = 4;

interface UsePracticeSessionProps {
  isAnonymous: boolean;
  isUserLoading: boolean;
  effectiveLevel: number;
  effectiveStruggleWords: StruggleWord[];
  /** Words this user reported as inaudible — skipped in listening sessions */
  inaudibleWords: string[];
  thresholdParams?: ThresholdParams; // Personalized hesitation threshold
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
  /** Session configuration chosen on the setup screen */
  config: SessionConfig;
  onFinishSession: (results: WordResult[], newLevel: number) => Promise<void>;
}

export function usePracticeSession({
  isAnonymous,
  isUserLoading,
  effectiveLevel,
  effectiveStruggleWords,
  inaudibleWords,
  thresholdParams,
  currentUser,
  anonymousUser,
  config,
  onFinishSession,
}: UsePracticeSessionProps) {
  // Use personalized threshold or default
  const effectiveThreshold = thresholdParams ?? DEFAULT_THRESHOLD_PARAMS;
  const { settings } = useAccessibility();
  const { speakWord } = useTTS(settings.voiceSpeed, settings.ttsEnabled);

  // Display flow is fixed per session (chosen at setup)
  const sentenceMode = config.flow === "sentence";

  // Build a session from the current props/settings. Synchronous local work
  // (~1k words) — running it during the initial render means the session is
  // ready on first paint, with no loading flash between setup and typing.
  const buildSession = useCallback((): Word[] => {
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

    // Map the setup-screen focus onto engine options
    const focusOption: SessionOptions["focus"] =
      config.focus.type === "review"
        ? { type: "review" }
        : config.focus.type === "pattern"
          ? {
              type: "pattern",
              prefixes: getPattern(config.focus.patternId)?.prefixes ?? [],
            }
          : undefined;

    const sessionOptions: SessionOptions = {
      wordCount: settings.sessionWordCount,
      capitalFrequency: settings.capitalFrequency,
      punctuationFrequency: settings.punctuationFrequency,
      strugglePercent: settings.strugglePercent,
      newPercent: settings.newPercent,
      confidencePercent: settings.confidencePercent,
      startingBoosters: settings.startingBoosters,
      focus: focusOption,
      // Only listening sessions skip these — the word is perfectly readable
      excludeWords: settings.dictationMode ? inaudibleWords : undefined,
    };

    const generator = new AdaptiveSessionGenerator(
      WORD_POOL,
      effectiveStruggleWords,
    );
    return generator.generateSession(userProgress, sessionOptions);
  }, [
    isAnonymous,
    anonymousUser,
    currentUser,
    effectiveLevel,
    effectiveStruggleWords,
    inaudibleWords,
    config,
    settings.dictationMode,
    settings.sessionWordCount,
    settings.capitalFrequency,
    settings.punctuationFrequency,
    settings.strugglePercent,
    settings.newPercent,
    settings.confidencePercent,
    settings.startingBoosters,
  ]);

  // Core state (lazy init: words exist from the very first render)
  const [sessionWords, setSessionWords] = useState<Word[]>(buildSession);
  // Snapshot of the struggle bucket when this session's words were generated.
  // Convex updates the bucket reactively after a session saves, so the live
  // list can't tell the results screen which words graduated — this can.
  const [sessionStruggleWords, setSessionStruggleWords] = useState<
    StruggleWord[]
  >(() => effectiveStruggleWords);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [results, setResults] = useState<WordResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Tracking state
  const [startTime, setStartTime] = useState<number | null>(null);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [letterStates, setLetterStates] = useState<LetterState[]>([]);

  // Feedback state
  const [showFeedback, setShowFeedback] = useState<
    "correct" | "incorrect" | null
  >(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const lastSpokenWordIdRef = useRef<string>("");
  // One submit per word index. Submitting waits 300ms before the index moves,
  // and in that window a habitual space/enter would run the whole submit again
  // — duplicate result, duplicate analytics event, index jumping by two, and
  // on the last word a second finishSession (double streak, double bucket
  // write). Keyed by index, not word id: the same word can appear twice in a
  // session and the second occurrence still needs its own submit.
  const submittedIndexRef = useRef<number | null>(null);

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

  // Track session start — once per mount. Only startSession bumps the
  // session key; restart/refresh rebuild in place and fire their own events.
  useEffect(() => {
    trackPracticeStarted({
      mode: "practice",
      currentLevel: effectiveLevel,
    });

    trackEvent("practice_session_started", {
      wordCount: sessionWords.length,
      userLevel: effectiveLevel,
      isAnonymous,
      hasCompletedPlacementTest: isAnonymous
        ? false
        : (currentUser?.stats.hasCompletedPlacementTest ?? false),
      struggleWordsCount: effectiveStruggleWords.length,
      focus: config.focus.type,
      focusPattern:
        config.focus.type === "pattern" ? config.focus.patternId : null,
      flow: config.flow,
      dictationMode: settings.dictationMode,
      sessionOptions: {
        strugglePercent: settings.strugglePercent,
        newPercent: settings.newPercent,
        confidencePercent: settings.confidencePercent,
      },
    });
    // Analytics must fire exactly once per started session, with the values
    // frozen at mount — not again on re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setShowFeedback(null);
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
      // The base word, not the transformed one: capitals and punctuation are
      // typing practice, but "Cat." must not become its own review-bucket
      // entry separate from "cat".
      word: currentWord.baseText ?? currentWord.text,
      phonicsGroup: currentWord.phonicsGroup,
      correct: isCorrect,
      userInput,
      timeSpent,
      backspaceCount,
      hesitationDetected:
        timeSpent > getHesitationThreshold(currentWord.text.length, effectiveThreshold),
    };
  }, [currentWord, userInput, startTime, backspaceCount, effectiveThreshold]);

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
        setLetterStates((prev) =>
          prev.map((state, i) => {
            if (i >= newLength) {
              return { ...state, typed: null };
            }
            return state;
          }),
        );
      } else {
        // A paste can add several characters at once, and can also replace a
        // selection without changing the length — so start from the first
        // index that actually differs, not from the old length, or replaced
        // letters keep their stale colour hint.
        let startIndex = 0;
        while (
          startIndex < oldLength &&
          startIndex < newLength &&
          userInput[startIndex] === newValue[startIndex]
        ) {
          startIndex++;
        }
        const endIndex = Math.min(newLength, letterStates.length) - 1;

        if (endIndex >= startIndex) {
          setLetterStates((prev) =>
            prev.map((state, i) => {
              if (i < startIndex || i > endIndex) return state;
              const newChar = newValue[i];
              const isCorrect = newChar.toLowerCase() === state.expected;
              return {
                ...state,
                typed: newChar,
                wasCorrectFirstTry:
                  state.typed === null ? isCorrect : state.wasCorrectFirstTry,
                wasEverWrong: state.wasEverWrong || !isCorrect,
              };
            }),
          );
        }
      }

      setUserInput(newValue);
    },
    [userInput, letterStates.length, startTime],
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
    if (submittedIndexRef.current === currentWordIndex) return;
    submittedIndexRef.current = currentWordIndex;

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

    // Track struggle words for analytics
    if (!isCorrect) {
      trackWordStruggle({
        word: currentWord.text,
        phonicsGroup: currentWord.phonicsGroup,
        reason: "error",
        dictationMode: settings.dictationMode,
      });
    } else if (result.hesitationDetected) {
      trackWordStruggle({
        word: currentWord.text,
        phonicsGroup: currentWord.phonicsGroup,
        reason: "hesitation",
        dictationMode: settings.dictationMode,
      });
    } else if (result.backspaceCount > BACKSPACE_THRESHOLD) {
      trackWordStruggle({
        word: currentWord.text,
        phonicsGroup: currentWord.phonicsGroup,
        reason: "backspaces",
        dictationMode: settings.dictationMode,
      });
    }

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
    sentenceMode,
    settings.dictationMode,
    finishSession,
  ]);

  // Submit word (sentence mode) — shared by the spacebar handler and the
  // final-word auto-complete
  const submitSentenceWord = useCallback(() => {
    if (!currentWord) return;
    if (submittedIndexRef.current === currentWordIndex) return;
    submittedIndexRef.current = currentWordIndex;

    const isCorrect = userInput.toLowerCase() === currentWord.text.toLowerCase();
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

    // Track struggle words for analytics (sentence mode)
    if (!isCorrect) {
      trackWordStruggle({
        word: currentWord.text,
        phonicsGroup: currentWord.phonicsGroup,
        reason: "error",
        dictationMode: settings.dictationMode,
      });
    } else if (result.hesitationDetected) {
      trackWordStruggle({
        word: currentWord.text,
        phonicsGroup: currentWord.phonicsGroup,
        reason: "hesitation",
        dictationMode: settings.dictationMode,
      });
    } else if (result.backspaceCount > BACKSPACE_THRESHOLD) {
      trackWordStruggle({
        word: currentWord.text,
        phonicsGroup: currentWord.phonicsGroup,
        reason: "backspaces",
        dictationMode: settings.dictationMode,
      });
    }

    advanceToNextWord(isCorrect);
  }, [
    currentWord,
    userInput,
    calculateWordResult,
    currentWordIndex,
    sessionWords.length,
    settings.dictationMode,
    advanceToNextWord,
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
        submitSentenceWord();
      }
    },
    [sentenceMode, userInput, handleSubmitWord, submitSentenceWord],
  );

  // Auto-advance correctly typed words. In single-word mode every correct
  // word moves on by itself — analytics showed users typing a word, waiting,
  // and leaving because nothing told them to press space. In sentence mode
  // the spacebar IS the typing rhythm, so only the final word (which has no
  // next word to space into) auto-completes.
  // Double submits are prevented by submittedIndexRef inside the handlers, so
  // this effect can fire freely.
  useEffect(() => {
    if (!currentWord || isComplete) return;
    if (userInput.toLowerCase() !== currentWord.text.toLowerCase()) return;

    const isLastWord = currentWordIndex === sessionWords.length - 1;
    if (sentenceMode && !isLastWord) return;

    if (sentenceMode) {
      submitSentenceWord();
    } else {
      handleSubmitWord();
    }
  }, [
    userInput,
    currentWord,
    currentWordIndex,
    sessionWords.length,
    isComplete,
    sentenceMode,
    submitSentenceWord,
    handleSubmitWord,
  ]);

  // Reset session state (keeps same words)
  const resetSessionState = useCallback(() => {
    setCurrentWordIndex(0);
    setUserInput("");
    setResults([]);
    setIsComplete(false);
    setStartTime(null); // Timer starts on first keystroke
    setBackspaceCount(0);
    setShowFeedback(null);
    submittedIndexRef.current = null;
    reveal.reset();
  }, [reveal]);

  // Restart session (generates new words)
  const restartSession = useCallback(() => {
    // Scroll to top instantly before restarting
    window.scrollTo({ top: 0, behavior: "instant" });

    trackEvent("practice_session_restarted", {
      previousWordCount: sessionWords.length,
      previousResultsCount: results.length,
    });
    setSessionWords(buildSession()); // New words, synchronously — no loading flash
    setSessionStruggleWords(effectiveStruggleWords); // Fresh snapshot for the new session
    resetSessionState();
  }, [
    resetSessionState,
    buildSession,
    sessionWords.length,
    results.length,
    effectiveStruggleWords,
  ]);

  // Refresh session with new words
  const refreshSession = useCallback(() => {
    trackEvent("practice_session_refreshed", {
      previousWordCount: sessionWords.length,
      currentWordIndex,
    });
    setSessionWords(buildSession()); // New words, synchronously — no loading flash
    setSessionStruggleWords(effectiveStruggleWords); // Fresh snapshot for the new session
    resetSessionState();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [
    resetSessionState,
    buildSession,
    sessionWords.length,
    currentWordIndex,
    effectiveStruggleWords,
  ]);

  // Dictation handlers
  const handleRepeat = useCallback(() => {
    if (currentWord) speakWord(currentWord.text);
  }, [currentWord, speakWord]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // sessionWords is built synchronously in the useState lazy initializer, so
  // an empty result here is never "still loading" — it's the generator
  // genuinely having nothing to offer (e.g. every candidate word already
  // excluded). Keeping it folded into isLoading is what left the UI on a
  // spinner that could never resolve; isEmpty lets a caller show something
  // actionable (e.g. send the user back to setup) instead.
  const isLoading = isUserLoading;
  const isEmpty = !isUserLoading && sessionWords.length === 0;

  return {
    // State
    sessionWords,
    sessionStruggleWords,
    currentWordIndex,
    currentWord,
    userInput,
    results,
    isComplete,
    isLoading,
    isEmpty,
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
    handleRepeat,
  };
}

export { BACKSPACE_THRESHOLD };
