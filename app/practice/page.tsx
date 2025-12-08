"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { Switch } from "@/components/ui/switch";
import { Header } from "@/components/Header";
import { Word, UserProgress, PhonicsGroup } from "@/lib/types";
import {
  AdaptiveSessionGenerator,
  calculateNewUserLevel,
} from "@/lib/AdaptiveEngine";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSyncPlacementData } from "@/hooks/useSyncPlacementData";
import { Label } from "@/components/ui/label";
import wordsData from "./words.json";

import { WordResult, LetterState } from "./types";
import { AuthWall } from "./AuthWall";
import { SentenceModeView } from "./SentenceModeView";
import { SingleWordView } from "./SingleWordView";
import { SessionComplete } from "./SessionComplete";

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

export default function PracticePage() {
  useSyncPlacementData();

  return (
    <>
      <SignedOut>
        <AuthWall />
      </SignedOut>
      <SignedIn>
        <PracticeSession />
      </SignedIn>
    </>
  );
}

function PracticeSession() {
  const { user } = useUser();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : "skip",
  );
  const createUser = useMutation(api.users.createUser);
  const updateUserStats = useMutation(api.users.updateUserStats);

  // Auto-create user if they don't exist in Convex
  useEffect(() => {
    if (!user || currentUser !== null) return;

    const createUserIfNeeded = async () => {
      try {
        await createUser({
          clerkId: user.id,
          name: user.fullName || user.firstName || "User",
          email: user.primaryEmailAddress?.emailAddress,
          role: "student",
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (!errorMessage?.includes("already exists")) {
          console.error("Failed to create user:", error);
        }
      }
    };

    createUserIfNeeded();
  }, [user, currentUser, createUser]);

  // Core state
  const [sessionWords, setSessionWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [results, setResults] = useState<WordResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Mode state
  const [sentenceMode, setSentenceMode] = useState(false);

  // Tracking state
  const [startTime, setStartTime] = useState(Date.now());
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [correctionsMade, setCorrectionsMade] = useState(0);
  const [letterStates, setLetterStates] = useState<LetterState[]>([]);
  const [wasLastKeyBackspace, setWasLastKeyBackspace] = useState(false);

  // Single word mode feedback
  const [showFeedback, setShowFeedback] = useState<
    "correct" | "incorrect" | null
  >(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const currentWord = sessionWords[currentWordIndex];

  // Generate adaptive session when user data loads
  useEffect(() => {
    if (!currentUser || sessionWords.length > 0) return;

    const userProgress: UserProgress = {
      userId: currentUser._id,
      currentLevel: currentUser.stats.currentLevel,
      hasCompletedPlacementTest: currentUser.stats.hasCompletedPlacementTest,
      struggleGroups: (currentUser.stats.struggleGroups || []) as PhonicsGroup[],
      wordHistory: {},
    };

    const generator = new AdaptiveSessionGenerator(WORD_POOL);
    const generatedWords = generator.generateSession(userProgress);
    setSessionWords(generatedWords);
  }, [currentUser, sessionWords.length]);

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
        difficulty: 0,
        phonicsGroup: "",
        correct: false,
        timeSpent: 0,
        backspaceCount: 0,
        hesitationDetected: false,
        correctionsMade: 0,
        letterAccuracy: 0,
        finalAccuracy: 0,
      };
    }

    const timeSpent = (Date.now() - startTime) / 1000;
    const isCorrect =
      userInput.toLowerCase() === currentWord.text.toLowerCase();

    // Calculate letter accuracy (first try accuracy)
    const correctFirstTry = letterStates.filter(
      (l) => l.wasCorrectFirstTry && l.typed !== null,
    ).length;
    const totalTyped = letterStates.filter((l) => l.typed !== null).length;
    const letterAccuracy =
      totalTyped > 0 ? (correctFirstTry / totalTyped) * 100 : 0;

    // Calculate final accuracy
    const correctLetters = letterStates.filter(
      (l, i) => l.typed?.toLowerCase() === currentWord.text[i]?.toLowerCase(),
    ).length;
    const finalAccuracy = (correctLetters / currentWord.text.length) * 100;

    return {
      wordId: currentWord.id,
      word: currentWord.text,
      difficulty: currentWord.difficulty,
      phonicsGroup: currentWord.phonicsGroup,
      correct: isCorrect,
      timeSpent,
      backspaceCount,
      hesitationDetected: timeSpent > 1.5,
      correctionsMade,
      letterAccuracy,
      finalAccuracy,
    };
  }, [
    currentWord,
    userInput,
    startTime,
    backspaceCount,
    correctionsMade,
    letterStates,
  ]);

  // Handle input change with letter tracking
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const oldLength = userInput.length;
    const newLength = newValue.length;

    // Detect backspace (correction)
    if (newLength < oldLength) {
      if (!wasLastKeyBackspace && oldLength > 0) {
        // User just started backspacing after typing - this is a correction
        setCorrectionsMade((prev) => prev + 1);
      }
      setWasLastKeyBackspace(true);

      // Update letter states for deleted characters
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

      // Update letter states for new character
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
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      setBackspaceCount((prev) => prev + 1);
    }

    // In single word mode, advance on Enter or Space
    if (
      !sentenceMode &&
      (e.key === "Enter" || e.key === " ") &&
      userInput.length > 0
    ) {
      e.preventDefault();
      handleSubmitWord();
    }

    // In sentence mode, space advances to next word (even if not fully correct)
    if (sentenceMode && e.key === " " && userInput.length > 0) {
      e.preventDefault();
      advanceToNextWord(
        userInput.toLowerCase() === currentWord?.text.toLowerCase(),
      );
    }
  };

  const advanceToNextWord = (wasCorrect: boolean) => {
    const result = calculateWordResult();
    result.correct = wasCorrect;
    setResults((prev) => [...prev, result]);

    if (currentWordIndex < sessionWords.length - 1) {
      setCurrentWordIndex((prev) => prev + 1);
      setUserInput("");
    } else {
      finishSession([...results, result]);
    }
  };

  const handleSubmitWord = () => {
    if (!currentWord) return;

    const result = calculateWordResult();
    const isCorrect =
      userInput.toLowerCase() === currentWord.text.toLowerCase();

    // Show brief feedback in single word mode
    setShowFeedback(isCorrect ? "correct" : "incorrect");

    setResults((prev) => [...prev, result]);

    // Brief delay for feedback, then advance
    setTimeout(() => {
      if (currentWordIndex < sessionWords.length - 1) {
        setCurrentWordIndex((prev) => prev + 1);
        setUserInput("");
      } else {
        finishSession([...results, result]);
      }
    }, 300);
  };

  const finishSession = async (allResults: WordResult[]) => {
    setIsComplete(true);

    if (!currentUser) return;

    const accuracy =
      allResults.filter((r) => r.correct).length / allResults.length;
    const avgTimePerWord =
      allResults.reduce((sum, r) => sum + r.timeSpent, 0) / allResults.length;

    const newLevel = calculateNewUserLevel(
      currentUser.stats.currentLevel,
      accuracy,
      avgTimePerWord,
    );

    await updateUserStats({
      userId: currentUser._id,
      stats: {
        currentLevel: newLevel,
      },
    });
  };

  const restartSession = () => {
    setSessionWords([]);
    setCurrentWordIndex(0);
    setUserInput("");
    setResults([]);
    setIsComplete(false);
    setStartTime(Date.now());
    setBackspaceCount(0);
    setCorrectionsMade(0);
    setShowFeedback(null);
  };

  // Focus input when mode changes
  useEffect(() => {
    inputRef.current?.focus();
  }, [sentenceMode]);

  // Loading state
  if (!currentUser || sessionWords.length === 0) {
    return (
      <>
        <Header />
        <main className="bg-gray-50 dark:bg-black min-h-screen p-8 flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Loading your personalized session...
            </p>
          </div>
        </main>
      </>
    );
  }

  // Session complete state
  if (isComplete) {
    return (
      <SessionComplete
        results={results}
        currentLevel={currentUser.stats.currentLevel}
        onRestart={restartSession}
      />
    );
  }

  // Active session
  return (
    <>
      <Header />
      <main className="bg-gray-50 dark:bg-black min-h-screen p-8 flex flex-col items-center justify-center">
        <div className="max-w-4xl w-full">
          {/* Header with level and mode toggle */}
          <div className="mb-6 flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold">
                Level {currentUser.stats.currentLevel.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={sentenceMode}
                  onCheckedChange={setSentenceMode}
                  id="sentence-mode"
                />
                <Label
                  htmlFor="sentence-mode"
                  className="text-sm text-gray-600 dark:text-gray-400"
                >
                  Sentence Mode
                </Label>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {currentWordIndex + 1} / {sessionWords.length}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentWordIndex + (userInput.length > 0 ? 0.5 : 0)) / sessionWords.length) * 100}%`,
              }}
            />
          </div>

          {/* Mode-specific view */}
          {sentenceMode ? (
            <SentenceModeView
              words={sessionWords}
              currentWordIndex={currentWordIndex}
              userInput={userInput}
              letterStates={letterStates}
              results={results}
              inputRef={inputRef}
              onInputChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <SingleWordView
              currentWord={currentWord}
              userInput={userInput}
              letterStates={letterStates}
              showFeedback={showFeedback}
              inputRef={inputRef}
              onInputChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onSubmit={handleSubmitWord}
            />
          )}
        </div>
      </main>
    </>
  );
}
