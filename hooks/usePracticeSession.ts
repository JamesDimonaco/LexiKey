"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Word, UserProgress, PhonicsGroup, StruggleWord, WordResult } from "@/lib/types";
import { AdaptiveSessionGenerator, calculateNewUserLevel, SessionOptions } from "@/lib/AdaptiveEngine";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useTTS } from "./useTTS";
import { LetterState } from "@/app/practice/types";
import wordsData from "@/app/practice/words.json";

// Struggle word threshold constants
const HESITATION_THRESHOLD = 1.5; // seconds
const BACKSPACE_THRESHOLD = 3;

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
  currentUser: { _id: string; stats: { hasCompletedPlacementTest: boolean; struggleGroups?: string[] } } | null | undefined;
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
  const [startTime, setStartTime] = useState(Date.now());
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [correctionsMade, setCorrectionsMade] = useState(0);
  const [letterStates, setLetterStates] = useState<LetterState[]>([]);
  const [wasLastKeyBackspace, setWasLastKeyBackspace] = useState(false);

  // Feedback state
  const [showFeedback, setShowFeedback] = useState<"correct" | "incorrect" | null>(null);

  // Timed reveal state
  const [revealCount, setRevealCount] = useState(0); // 0, 1, 2, 3+ for permanent
  const [revealTimeRemaining, setRevealTimeRemaining] = useState<number | null>(null); // ms remaining, null = hidden
  const revealTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Derived: word is revealed if there's time remaining or it's permanent (revealCount >= 3)
  const wordRevealed = revealTimeRemaining !== null;

  const inputRef = useRef<HTMLInputElement>(null);
  const lastSpokenWordIdRef = useRef<string>("");

  const currentWord = sessionWords[currentWordIndex];

  // Speak word when it changes (only in dictation/Listen mode)
  useEffect(() => {
    if (!currentWord || !settings.dictationMode || !settings.ttsEnabled) return;
    if (lastSpokenWordIdRef.current === currentWord.id) return;

    // Reset reveal state for new word
    setRevealCount(0);
    setRevealTimeRemaining(null);
    if (revealTimerRef.current) {
      clearInterval(revealTimerRef.current);
      revealTimerRef.current = null;
    }

    const timer = setTimeout(() => {
      lastSpokenWordIdRef.current = currentWord.id;
      speakWord(currentWord.text);
    }, 300);

    return () => clearTimeout(timer);
  }, [currentWord?.id, settings.dictationMode, settings.ttsEnabled, speakWord]);

  // Timer countdown for timed reveal
  useEffect(() => {
    if (revealTimeRemaining === null || revealTimeRemaining === -1) {
      // Not revealed or permanent - no timer needed
      if (revealTimerRef.current) {
        clearInterval(revealTimerRef.current);
        revealTimerRef.current = null;
      }
      return;
    }

    // Start countdown timer
    revealTimerRef.current = setInterval(() => {
      setRevealTimeRemaining((prev) => {
        if (prev === null || prev === -1) return prev;
        const newTime = prev - 50; // Update every 50ms for smooth animation
        if (newTime <= 0) {
          return null; // Time's up, hide the word
        }
        return newTime;
      });
    }, 50);

    return () => {
      if (revealTimerRef.current) {
        clearInterval(revealTimerRef.current);
        revealTimerRef.current = null;
      }
    };
  }, [revealTimeRemaining === null, revealTimeRemaining === -1]);

  // Generate adaptive session when user data loads
  useEffect(() => {
    if (sessionWords.length > 0) return;
    if (isUserLoading) return;

    const userProgress: UserProgress = {
      userId: isAnonymous ? (anonymousUser?.deviceId ?? "anon") : currentUser!._id,
      currentLevel: effectiveLevel,
      hasCompletedPlacementTest: isAnonymous ? false : (currentUser?.stats.hasCompletedPlacementTest ?? false),
      struggleGroups: isAnonymous ? [] : ((currentUser?.stats.struggleGroups || []) as PhonicsGroup[]),
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

    const generator = new AdaptiveSessionGenerator(WORD_POOL, effectiveStruggleWords);
    const generatedWords = generator.generateSession(userProgress, sessionOptions);
    setSessionWords(generatedWords);
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
      setStartTime(Date.now());
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
        timeSpent: 0,
        backspaceCount: 0,
        hesitationDetected: false,
      };
    }

    const timeSpent = (Date.now() - startTime) / 1000;
    const isCorrect = userInput.toLowerCase() === currentWord.text.toLowerCase();

    return {
      wordId: currentWord.id,
      word: currentWord.text,
      phonicsGroup: currentWord.phonicsGroup,
      correct: isCorrect,
      timeSpent,
      backspaceCount,
      hesitationDetected: timeSpent > HESITATION_THRESHOLD,
    };
  }, [currentWord, userInput, startTime, backspaceCount]);

  // Finish session handler
  const finishSession = useCallback(async (allResults: WordResult[]) => {
    setIsComplete(true);

    const accuracy = allResults.filter((r) => r.correct).length / allResults.length;
    const avgTimePerWord = allResults.reduce((sum, r) => sum + r.timeSpent, 0) / allResults.length;
    const newLevel = calculateNewUserLevel(effectiveLevel, accuracy, avgTimePerWord);

    await onFinishSession(allResults, newLevel);
  }, [effectiveLevel, onFinishSession]);

  // Input change handler with letter tracking
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const oldLength = userInput.length;
    const newLength = newValue.length;

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
                wasCorrectFirstTry: state.typed === null ? isCorrect : state.wasCorrectFirstTry,
                wasEverWrong: state.wasEverWrong || !isCorrect,
              };
            }
            return state;
          }),
        );
      }
    }

    setUserInput(newValue);
  }, [userInput.length, wasLastKeyBackspace, letterStates.length]);

  // Advance to next word
  const advanceToNextWord = useCallback((wasCorrect: boolean) => {
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
  }, [calculateWordResult, results, currentWordIndex, sessionWords.length, finishSession]);

  // Submit word (single word mode)
  const handleSubmitWord = useCallback(() => {
    if (!currentWord) return;

    const result = calculateWordResult();
    const isCorrect = userInput.toLowerCase() === currentWord.text.toLowerCase();

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
  }, [currentWord, calculateWordResult, userInput, results, currentWordIndex, sessionWords.length, finishSession]);

  // Key down handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      setBackspaceCount((prev) => prev + 1);
    }

    if (!sentenceMode && (e.key === "Enter" || e.key === " ") && userInput.length > 0) {
      e.preventDefault();
      handleSubmitWord();
    }

    if (sentenceMode && e.key === " " && userInput.length > 0) {
      e.preventDefault();
      advanceToNextWord(userInput.toLowerCase() === currentWord?.text.toLowerCase());
    }
  }, [sentenceMode, userInput, handleSubmitWord, advanceToNextWord, currentWord?.text]);

  // Reset session state (keeps same words)
  const resetSessionState = useCallback(() => {
    setCurrentWordIndex(0);
    setUserInput("");
    setResults([]);
    setIsComplete(false);
    setStartTime(Date.now());
    setBackspaceCount(0);
    setCorrectionsMade(0);
    setShowFeedback(null);
    // Reset reveal state
    setRevealCount(0);
    setRevealTimeRemaining(null);
    if (revealTimerRef.current) {
      clearInterval(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  }, []);

  // Restart session (generates new words)
  const restartSession = useCallback(() => {
    setSessionWords([]); // This triggers regeneration
    resetSessionState();
  }, [resetSessionState]);

  // Refresh session with new words
  const refreshSession = useCallback(() => {
    setSessionWords([]); // Clear to trigger regeneration
    resetSessionState();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [resetSessionState]);

  // Dictation mode toggle - regenerates new words to prevent cheating
  const handleDictationToggle = useCallback((enabled: boolean) => {
    updateSettings({
      dictationMode: enabled,
      ttsEnabled: enabled ? true : settings.ttsEnabled,
    });

    // Generate new words to prevent cheating
    setSessionWords([]);
    resetSessionState();

    setTimeout(() => inputRef.current?.focus(), 100);
  }, [settings.ttsEnabled, updateSettings, resetSessionState]);

  // Dictation handlers
  const handleReveal = useCallback(() => {
    if (wordRevealed) {
      // Currently revealed - hide it
      setRevealTimeRemaining(null);
      if (revealTimerRef.current) {
        clearInterval(revealTimerRef.current);
        revealTimerRef.current = null;
      }
    } else {
      // Currently hidden - reveal with timed duration
      const newCount = revealCount + 1;
      setRevealCount(newCount);

      if (newCount >= 3) {
        // 3rd+ time: permanent reveal
        setRevealTimeRemaining(-1);
      } else {
        // 1st time: 1s, 2nd time: 2s
        setRevealTimeRemaining(newCount * 1000);
      }
    }
  }, [wordRevealed, revealCount]);

  // Get reveal duration info for UI
  const getRevealDuration = useCallback(() => {
    if (revealCount >= 2) return null; // Will be permanent next time
    return (revealCount + 1) * 1000; // Next duration in ms
  }, [revealCount]);

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
    wordRevealed,
    revealTimeRemaining,
    revealCount,
    inputRef,
    // Handlers
    handleInputChange,
    handleKeyDown,
    handleSubmitWord,
    restartSession,
    refreshSession,
    handleDictationToggle,
    handleReveal,
    handleRepeat,
    setSentenceMode,
    getRevealDuration,
  };
}

export { BACKSPACE_THRESHOLD };
