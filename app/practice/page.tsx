"use client";

import { useState, useEffect } from "react";
import { SignInButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { Header } from "@/components/Header";
import { Word, UserProgress, PhonicsGroup } from "@/lib/types";
import {
  AdaptiveSessionGenerator,
  calculateNewUserLevel,
} from "@/lib/AdaptiveEngine";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSyncPlacementData } from "@/hooks/useSyncPlacementData";
import Link from "next/link";
import wordsData from "./words.json";

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

type WordResult = {
  wordId: string;
  word: string;
  difficulty: number;
  phonicsGroup: string;
  correct: boolean;
  timeSpent: number;
  backspaceCount: number;
  hesitationDetected: boolean;
};

export default function PracticePage() {
  // Sync any placement test data from localStorage when user signs in
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

function AuthWall() {
  return (
    <>
      <Header />
      <main className="bg-gray-50 dark:bg-black min-h-screen p-8 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 text-center">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-bold mb-4 text-black dark:text-white">
            Sign In Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to be signed in to practice and save your progress.
          </p>
          <div className="space-y-4">
            <SignInButton mode="modal">
              <button className="w-full py-4 bg-blue-600 text-white text-xl font-bold rounded-lg hover:bg-blue-700 transition-colors">
                Sign In to Practice
              </button>
            </SignInButton>
            <Link
              href="/placement-test"
              className="block w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-center text-lg font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Take Placement Test (No Sign In Required)
            </Link>
            <Link
              href="/"
              className="block text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
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
        console.log("👤 Creating user in Convex (from practice page)...");
        await createUser({
          clerkId: user.id,
          name: user.fullName || user.firstName || "User",
          email: user.primaryEmailAddress?.emailAddress,
          role: "student",
        });
        console.log("✅ User created successfully");
      } catch (error) {
        // Ignore if user already exists
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (!errorMessage?.includes("already exists")) {
          console.error("Failed to create user:", error);
        }
      }
    };

    createUserIfNeeded();
  }, [user, currentUser, createUser]);

  const [sessionWords, setSessionWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [results, setResults] = useState<WordResult[]>([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  // 0-100 representing progress to next level
  const [showFeedback, setShowFeedback] = useState<{
    type: "correct" | "incorrect";
    speed: "fast" | "slow" | "normal";
  } | null>(null);

  const currentWord = sessionWords[currentWordIndex];

  // Generate adaptive session when user data loads
  useEffect(() => {
    if (!currentUser || sessionWords.length > 0) return;

    // Build UserProgress from Convex data
    const userProgress: UserProgress = {
      userId: currentUser._id,
      currentLevel: currentUser.stats.currentLevel,
      hasCompletedPlacementTest: currentUser.stats.hasCompletedPlacementTest,
      struggleGroups: (currentUser.stats.struggleGroups ||
        []) as PhonicsGroup[],
      wordHistory: {}, // TODO: fetch from Convex practiceSessions
    };

    const generator = new AdaptiveSessionGenerator(WORD_POOL);
    const generatedWords = generator.generateSession(userProgress);
    setSessionWords(generatedWords);
  }, [currentUser, sessionWords.length]);

  useEffect(() => {
    setStartTime(Date.now());
    setBackspaceCount(0);
    setShowFeedback(null);
  }, [currentWordIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      setBackspaceCount((prev) => prev + 1);
    }

    // Advance on Enter or Space (if user has typed something)
    if ((e.key === "Enter" || e.key === " ") && userInput.length > 0) {
      e.preventDefault(); // Prevent space from being added to input
      handleSubmitWord();
    }
  };

  const handleSubmitWord = () => {
    if (!currentWord) return;

    const timeSpentMs = Date.now() - startTime;
    const timeSpent = timeSpentMs / 1000; // Convert to seconds
    const correct =
      userInput.trim().toLowerCase() === currentWord.text.toLowerCase();

    // Determine speed feedback
    let speed: "fast" | "slow" | "normal" = "normal";
    if (timeSpent < 2) {
      speed = "fast";
    } else if (timeSpent > 4) {
      speed = "slow";
    }

    // Show feedback briefly
    setShowFeedback({
      type: correct ? "correct" : "incorrect",
      speed,
    });

    // Record result
    const wordResult: WordResult = {
      wordId: currentWord.id,
      word: currentWord.text,
      difficulty: currentWord.difficulty,
      phonicsGroup: currentWord.phonicsGroup,
      correct,
      timeSpent,
      backspaceCount,
      hesitationDetected: timeSpent > 1.5,
    };

    setResults((prev) => [...prev, wordResult]);

    // Move to next word after brief delay (to show feedback)
    setTimeout(() => {
      if (currentWordIndex < sessionWords.length - 1) {
        setCurrentWordIndex((prev) => prev + 1);
        setUserInput("");
      } else {
        // Session complete
        finishSession([...results, wordResult]);
      }
    }, 800);
  };

  const finishSession = async (allResults: WordResult[]) => {
    setIsComplete(true);

    if (!currentUser) return;

    // Calculate session stats
    const accuracy =
      allResults.filter((r) => r.correct).length / allResults.length;
    const avgTimePerWord =
      allResults.reduce((sum, r) => sum + r.timeSpent, 0) / allResults.length; // Already in seconds from timeSpent

    console.log("📊 Session Stats:", {
      currentLevel: currentUser.stats.currentLevel,
      accuracy,
      avgTimePerWord,
      totalWords: allResults.length,
      correctWords: allResults.filter((r) => r.correct).length,
    });

    // Calculate new user level
    const newLevel = calculateNewUserLevel(
      currentUser.stats.currentLevel,
      accuracy,
      avgTimePerWord,
    );

    console.log("📈 Level Change:", {
      oldLevel: currentUser.stats.currentLevel,
      newLevel,
      difference: newLevel - currentUser.stats.currentLevel,
    });

    // Update user stats in Convex
    await updateUserStats({
      userId: currentUser._id,
      stats: {
        currentLevel: newLevel,
      },
    });

    console.log("✅ Session completed. New level:", newLevel);
  };

  const restartSession = () => {
    setSessionWords([]);
    setCurrentWordIndex(0);
    setUserInput("");
    setResults([]);
    setIsComplete(false);
    setStartTime(Date.now());
    setBackspaceCount(0);
    setShowFeedback(null);
  };

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

  if (isComplete) {
    const accuracy = Math.round(
      (results.filter((r) => r.correct).length / results.length) * 100,
    );
    const totalTime = Math.round(
      results.reduce((sum, r) => sum + r.timeSpent, 0),
    );
    const struggleWords = results.filter(
      (r) => r.hesitationDetected || r.backspaceCount > 3 || !r.correct,
    );
    const fastWords = results.filter(
      (r) => r.correct && r.timeSpent < 2,
    ).length;
    const newLevel = currentUser?.stats.currentLevel ?? 1;

    return (
      <>
        <Header />
        <main className="bg-gray-50 dark:bg-black min-h-screen p-8 flex flex-col items-center justify-center">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
            <h1 className="text-3xl font-bold mb-6 text-center text-black dark:text-white">
              Session Complete! 🎉
            </h1>

            <div className="space-y-6">
              {/* Level Display */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-lg border-2 border-purple-300 dark:border-purple-700">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Current Level
                  </p>
                  <p className="text-5xl font-bold text-purple-600 dark:text-purple-400">
                    {newLevel.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {accuracy >= 85
                      ? "Great job! 🚀"
                      : accuracy >= 70
                        ? "Keep practicing! 💪"
                        : "Take your time! 🌱"}
                  </p>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(newLevel % 1) * 100}%` }}
                  />
                </div>
                <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Progress to Level {Math.ceil(newLevel)}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {results.length}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Words
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {accuracy}%
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Accuracy
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800 text-center">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {totalTime}s
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Time
                  </p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 text-center">
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    ⚡{fastWords}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Fast
                  </p>
                </div>
              </div>

              {struggleWords.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h2 className="text-xl font-bold mb-3 text-black dark:text-white">
                    Words to Review
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {struggleWords.map((r) => (
                      <span
                        key={r.wordId}
                        className="px-3 py-1 bg-yellow-200 dark:bg-yellow-600/30 border border-yellow-300 dark:border-yellow-700 rounded-full text-sm font-mono text-yellow-900 dark:text-yellow-200"
                      >
                        {r.word}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                    These words will be added to your review bucket for extra
                    practice
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={restartSession}
                  className="flex-1 py-4 bg-blue-600 text-white text-xl font-bold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Practice Again
                </button>
                <Link
                  href="/"
                  className="flex-1 py-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-center text-xl font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Home
                </Link>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="bg-gray-50 dark:bg-black min-h-screen p-8 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full">
          {/* Level and Progress */}
          <div className="mb-8 space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold">
                  Level {currentUser.stats.currentLevel.toFixed(1)}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Word {currentWordIndex + 1} of {sessionWords.length}
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(currentWordIndex / sessionWords.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2 text-black dark:text-white">
                Practice Session
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Type the word you see below
              </p>
            </div>

            {/* Word Display */}
            <div className="mb-8 p-8 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-700 relative">
              <div className="text-6xl font-bold text-center text-black dark:text-white tracking-wider">
                {currentWord.text}
              </div>
              {currentWord.sentenceContext && (
                <p className="text-center text-gray-600 dark:text-gray-400 mt-4 text-lg">
                  &ldquo;{currentWord.sentenceContext}&rdquo;
                </p>
              )}

              {/* Visual Feedback */}
              {showFeedback && (
                <div className="absolute top-4 right-4 flex gap-2">
                  {/* Correct/Incorrect Icon */}
                  {showFeedback.type === "correct" ? (
                    <div className="bg-green-500 text-white rounded-full p-3 shadow-lg animate-bounce">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div className="bg-red-500 text-white rounded-full p-3 shadow-lg animate-bounce">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Speed Icon */}
                  {showFeedback.speed === "fast" && (
                    <div className="bg-yellow-500 text-white rounded-full p-3 shadow-lg">
                      <span className="text-2xl">⚡</span>
                    </div>
                  )}
                  {showFeedback.speed === "slow" && (
                    <div className="bg-blue-500 text-white rounded-full p-3 shadow-lg">
                      <span className="text-2xl">🐌</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="mb-6">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type the word here..."
                autoFocus
                className="w-full px-6 py-4 text-2xl text-center border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-center text-sm text-gray-500 dark:text-gray-500 mt-2">
                Press Space or Enter to continue
              </p>
            </div>

            <button
              onClick={handleSubmitWord}
              disabled={userInput.length === 0}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Next Word
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
