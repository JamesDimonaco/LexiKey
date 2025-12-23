"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { Header } from "@/components/Header";
import { Word, PhonicsGroup, PlacementTestResult } from "@/lib/types";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSyncPlacementData } from "@/hooks/useSyncPlacementData";

// Adaptive Placement Test Word Pool
// Multiple words per difficulty level and phonics group
const PLACEMENT_WORD_POOL: Word[] = [
  // Difficulty 1 - CVC Words (Short Vowels)
  // Target: Basic phonetic decoding
  { id: "p1a", text: "cat", difficulty: 1, phonicsGroup: "cvc" },
  { id: "p1b", text: "dog", difficulty: 1, phonicsGroup: "cvc" },
  { id: "p1c", text: "bat", difficulty: 1, phonicsGroup: "cvc" },
  { id: "p1d", text: "pen", difficulty: 1, phonicsGroup: "cvc" },
  { id: "p1e", text: "sit", difficulty: 1, phonicsGroup: "cvc" },
  { id: "p1f", text: "run", difficulty: 1, phonicsGroup: "cvc" },
  { id: "p1g", text: "hot", difficulty: 1, phonicsGroup: "cvc" },
  { id: "p1h", text: "map", difficulty: 1, phonicsGroup: "cvc" },
  { id: "p1i", text: "red", difficulty: 1, phonicsGroup: "cvc" },
  { id: "p1j", text: "sun", difficulty: 1, phonicsGroup: "cvc" },

  // Difficulty 2 - Advanced CVC & Basic Blends
  // Target: slightly faster decoding, initial consonant blends
  { id: "p2a", text: "rat", difficulty: 2, phonicsGroup: "cvc" },
  { id: "p2b", text: "zip", difficulty: 2, phonicsGroup: "cvc" },
  { id: "p2c", text: "frog", difficulty: 2, phonicsGroup: "blends" },
  { id: "p2d", text: "drum", difficulty: 2, phonicsGroup: "blends" },
  { id: "p2e", text: "swim", difficulty: 2, phonicsGroup: "blends" },
  { id: "p2f", text: "spin", difficulty: 2, phonicsGroup: "blends" },
  { id: "p2g", text: "flag", difficulty: 2, phonicsGroup: "blends" },
  { id: "p2h", text: "stop", difficulty: 2, phonicsGroup: "blends" },

  // Difficulty 3 - Silent E (CVCe)
  // Target: Vowel-Consonant-E rule awareness
  { id: "p3a", text: "cake", difficulty: 3, phonicsGroup: "silent-e" },
  { id: "p3b", text: "bike", difficulty: 3, phonicsGroup: "silent-e" },
  { id: "p3c", text: "bone", difficulty: 3, phonicsGroup: "silent-e" },
  { id: "p3d", text: "make", difficulty: 3, phonicsGroup: "silent-e" },
  { id: "p3e", text: "time", difficulty: 3, phonicsGroup: "silent-e" },
  { id: "p3f", text: "home", difficulty: 3, phonicsGroup: "silent-e" },
  { id: "p3g", text: "cute", difficulty: 3, phonicsGroup: "silent-e" },
  { id: "p3h", text: "rode", difficulty: 3, phonicsGroup: "silent-e" },
  { id: "p3i", text: "hope", difficulty: 3, phonicsGroup: "silent-e" },

  // Difficulty 4 - Consonant Digraphs
  // Target: "sh", "th", "ch", "wh", "ck"
  { id: "p4a", text: "ship", difficulty: 4, phonicsGroup: "digraphs" },
  { id: "p4b", text: "that", difficulty: 4, phonicsGroup: "digraphs" },
  { id: "p4c", text: "when", difficulty: 4, phonicsGroup: "digraphs" },
  { id: "p4d", text: "chop", difficulty: 4, phonicsGroup: "digraphs" },
  { id: "p4e", text: "thin", difficulty: 4, phonicsGroup: "digraphs" },
  { id: "p4f", text: "duck", difficulty: 4, phonicsGroup: "digraphs" },
  { id: "p4g", text: "fish", difficulty: 4, phonicsGroup: "digraphs" },
  { id: "p4h", text: "bath", difficulty: 4, phonicsGroup: "digraphs" },
  { id: "p4i", text: "rich", difficulty: 4, phonicsGroup: "digraphs" },

  // Difficulty 5 - Basic Vowel Teams
  // Target: "ai", "ay", "ea", "ee", "oa"
  { id: "p5a", text: "train", difficulty: 5, phonicsGroup: "vowel-teams" },
  { id: "p5b", text: "rain", difficulty: 5, phonicsGroup: "vowel-teams" },
  { id: "p5c", text: "boat", difficulty: 5, phonicsGroup: "vowel-teams" },
  { id: "p5d", text: "play", difficulty: 5, phonicsGroup: "vowel-teams" },
  { id: "p5e", text: "green", difficulty: 5, phonicsGroup: "vowel-teams" },
  { id: "p5f", text: "team", difficulty: 5, phonicsGroup: "vowel-teams" },
  { id: "p5g", text: "soap", difficulty: 5, phonicsGroup: "vowel-teams" },
  { id: "p5h", text: "stay", difficulty: 5, phonicsGroup: "vowel-teams" },
  { id: "p5i", text: "feet", difficulty: 5, phonicsGroup: "vowel-teams" },

  // Difficulty 6 - R-Controlled Vowels
  // Target: "ar", "or", "er", "ir", "ur"
  { id: "p6a", text: "bird", difficulty: 6, phonicsGroup: "r-controlled" },
  { id: "p6b", text: "star", difficulty: 6, phonicsGroup: "r-controlled" },
  { id: "p6c", text: "turn", difficulty: 6, phonicsGroup: "r-controlled" },
  { id: "p6d", text: "corn", difficulty: 6, phonicsGroup: "r-controlled" },
  { id: "p6e", text: "fern", difficulty: 6, phonicsGroup: "r-controlled" },
  { id: "p6f", text: "park", difficulty: 6, phonicsGroup: "r-controlled" },
  { id: "p6g", text: "hurt", difficulty: 6, phonicsGroup: "r-controlled" },
  { id: "p6h", text: "port", difficulty: 6, phonicsGroup: "r-controlled" },
  { id: "p6i", text: "girl", difficulty: 6, phonicsGroup: "r-controlled" },

  // Difficulty 7 - Diphthongs & Complex Vowels
  // Target: "ou", "ow", "oi", "oy", "oo"
  { id: "p7a", text: "cloud", difficulty: 7, phonicsGroup: "diphthongs" },
  { id: "p7b", text: "point", difficulty: 7, phonicsGroup: "diphthongs" },
  { id: "p7c", text: "house", difficulty: 7, phonicsGroup: "diphthongs" },
  { id: "p7d", text: "brown", difficulty: 7, phonicsGroup: "diphthongs" },
  { id: "p7e", text: "clown", difficulty: 7, phonicsGroup: "diphthongs" },
  { id: "p7f", text: "boil", difficulty: 7, phonicsGroup: "diphthongs" },
  { id: "p7g", text: "moon", difficulty: 7, phonicsGroup: "diphthongs" },
  { id: "p7h", text: "look", difficulty: 7, phonicsGroup: "diphthongs" },
  { id: "p7i", text: "shout", difficulty: 7, phonicsGroup: "diphthongs" },

  // Difficulty 8 - Complex Blends (3-letter blends, silent letters)
  // Target: "str", "spl", "scr", "spr", "kn", "wr"
  { id: "p8a", text: "bright", difficulty: 8, phonicsGroup: "blends" },
  { id: "p8b", text: "string", difficulty: 8, phonicsGroup: "blends" },
  { id: "p8c", text: "splash", difficulty: 8, phonicsGroup: "blends" },
  { id: "p8d", text: "street", difficulty: 8, phonicsGroup: "blends" },
  { id: "p8e", text: "scream", difficulty: 8, phonicsGroup: "blends" },
  { id: "p8f", text: "spring", difficulty: 8, phonicsGroup: "blends" },
  { id: "p8g", text: "knock", difficulty: 8, phonicsGroup: "blends" },
  { id: "p8h", text: "wreck", difficulty: 8, phonicsGroup: "blends" },
  { id: "p8i", text: "throw", difficulty: 8, phonicsGroup: "blends" },

  // Difficulty 9 - Complex Digraphs & Silent GH
  // Target: "ough", "aught", "ph", "tch"
  { id: "p9a", text: "thought", difficulty: 9, phonicsGroup: "digraphs" },
  { id: "p9b", text: "taught", difficulty: 9, phonicsGroup: "digraphs" },
  { id: "p9c", text: "through", difficulty: 9, phonicsGroup: "digraphs" },
  { id: "p9d", text: "laugh", difficulty: 9, phonicsGroup: "digraphs" },
  { id: "p9e", text: "phone", difficulty: 9, phonicsGroup: "digraphs" },
  { id: "p9f", text: "catch", difficulty: 9, phonicsGroup: "digraphs" },
  { id: "p9g", text: "match", difficulty: 9, phonicsGroup: "digraphs" },
  { id: "p9h", text: "rough", difficulty: 9, phonicsGroup: "digraphs" },
  { id: "p9i", text: "pitch", difficulty: 9, phonicsGroup: "digraphs" },

  // Difficulty 10 - Multi-syllabic & Abstract
  // Target: Suffixes, Prefixes, Compound words
  { id: "p10a", text: "brought", difficulty: 10, phonicsGroup: "blends" },
  { id: "p10b", text: "strength", difficulty: 10, phonicsGroup: "blends" },
  { id: "p10c", text: "straight", difficulty: 10, phonicsGroup: "blends" },
  {
    id: "p10d",
    text: "suddenly",
    difficulty: 10,
    phonicsGroup: "multi-syllable",
  },
  {
    id: "p10e",
    text: "beautiful",
    difficulty: 10,
    phonicsGroup: "multi-syllable",
  },
  {
    id: "p10f",
    text: "playground",
    difficulty: 10,
    phonicsGroup: "multi-syllable",
  },
  {
    id: "p10g",
    text: "happiness",
    difficulty: 10,
    phonicsGroup: "multi-syllable",
  },
  {
    id: "p10h",
    text: "understand",
    difficulty: 10,
    phonicsGroup: "multi-syllable",
  },
];

/**
 * Adaptive Placement Test Logic
 * - Starts at difficulty 3 (middle ground)
 * - If user gets it right and fast (<2s), difficulty increases by 2
 * - If user gets it right but slow (>2s), difficulty increases by 1
 * - If user gets it wrong, difficulty decreases by 1
 * - Clamps between 1-10
 */
function selectNextWord(
  results: PlacementTestResult["wordResults"],
  usedWordIds: Set<string>,
): Word | null {
  // Start at difficulty 3
  if (results.length === 0) {
    const startWords = PLACEMENT_WORD_POOL.filter((w) => w.difficulty === 3);
    return startWords[Math.floor(Math.random() * startWords.length)];
  }

  const lastResult = results[results.length - 1];
  let nextDifficulty = lastResult.difficulty;

  if (lastResult.correct) {
    // Right answer - go harder
    if (lastResult.timeSpent < 2000) {
      nextDifficulty += 2; // Fast and correct = jump up
    } else {
      nextDifficulty += 1; // Correct but slow = gentle increase
    }
  } else {
    // Wrong answer - go easier
    nextDifficulty -= 1;
  }

  // Clamp between 1 and 10
  nextDifficulty = Math.max(1, Math.min(10, nextDifficulty));

  // Find available words at this difficulty (not already used)
  const availableWords = PLACEMENT_WORD_POOL.filter(
    (w) => w.difficulty === nextDifficulty && !usedWordIds.has(w.id),
  );

  if (availableWords.length === 0) {
    // If no words available at exact difficulty, find closest
    for (let offset = 1; offset <= 5; offset++) {
      const nearby = PLACEMENT_WORD_POOL.filter(
        (w) =>
          (w.difficulty === nextDifficulty + offset ||
            w.difficulty === nextDifficulty - offset) &&
          !usedWordIds.has(w.id),
      );
      if (nearby.length > 0) {
        return nearby[Math.floor(Math.random() * nearby.length)];
      }
    }
  }

  // Random selection from available words
  return availableWords.length > 0
    ? availableWords[Math.floor(Math.random() * availableWords.length)]
    : null;
}

const TOTAL_PLACEMENT_WORDS = 20;

export default function PlacementTest() {
  // Sync placement data from localStorage when user signs in
  useSyncPlacementData();

  const router = useRouter();
  const { user } = useUser();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [results, setResults] = useState<PlacementTestResult["wordResults"]>(
    [],
  );
  const [startTime, setStartTime] = useState(Date.now());
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [calculatedResult, setCalculatedResult] =
    useState<PlacementTestResult | null>(null);
  const [usedWordIds, setUsedWordIds] = useState<Set<string>>(new Set());
  const [currentWord, setCurrentWord] = useState<Word | null>(null);

  // Convex hooks
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : "skip",
  );
  const updateUserStats = useMutation(api.users.updateUserStats);

  // Initialize first word on mount
  useEffect(() => {
    const firstWord = selectNextWord([], new Set());
    if (firstWord) {
      setCurrentWord(firstWord);
      setUsedWordIds(new Set([firstWord.id]));
    }
  }, []);

  useEffect(() => {
    setStartTime(Date.now());
    setBackspaceCount(0);
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

    const timeSpent = Date.now() - startTime;
    const correct =
      userInput.trim().toLowerCase() === currentWord.text.toLowerCase();

    // Record result
    const wordResult = {
      wordId: currentWord.id,
      word: currentWord.text,
      phonicsGroup: currentWord.phonicsGroup,
      difficulty: currentWord.difficulty,
      correct,
      timeSpent,
      backspaceCount,
    };

    const updatedResults = [...results, wordResult];
    setResults(updatedResults);

    // Move to next word or finish
    if (currentWordIndex < TOTAL_PLACEMENT_WORDS - 1) {
      // Select next word adaptively
      const nextWord = selectNextWord(updatedResults, usedWordIds);

      if (nextWord) {
        setCurrentWord(nextWord);
        setUsedWordIds((prev) => new Set([...prev, nextWord.id]));
        setCurrentWordIndex((prev) => prev + 1);
        setUserInput("");
      } else {
        // No more words available, finish early
        finishTest(updatedResults);
      }
    } else {
      // Test complete - calculate level
      finishTest(updatedResults);
    }
  };

  const finishTest = (allResults: PlacementTestResult["wordResults"]) => {
    // Calculate determined level
    // Use the average of all attempted difficulties, weighted by correctness
    const correctWords = allResults.filter((r) => r.correct);

    // If they got most right, use the average difficulty of correct words
    // If they struggled, use a lower level
    let determinedLevel = 1;

    if (correctWords.length > 0) {
      const avgCorrectDifficulty =
        correctWords.reduce((sum, r) => sum + r.difficulty, 0) /
        correctWords.length;
      const accuracy = correctWords.length / allResults.length;

      if (accuracy >= 0.9) {
        // 90%+ accuracy - use average of correct words
        determinedLevel = Math.round(avgCorrectDifficulty);
      } else if (accuracy >= 0.7) {
        // 70-89% accuracy - slightly below average of correct words
        determinedLevel = Math.max(1, Math.round(avgCorrectDifficulty - 1));
      } else {
        // Below 70% - use lower bound
        determinedLevel = Math.max(1, Math.round(avgCorrectDifficulty - 2));
      }
    }

    // Clamp between 1 and 10
    determinedLevel = Math.max(1, Math.min(10, determinedLevel));

    // Identify struggle groups (< 100% accuracy on that group)
    const groupPerformance: Record<string, { correct: number; total: number }> =
      {};

    allResults.forEach((r) => {
      if (!groupPerformance[r.phonicsGroup]) {
        groupPerformance[r.phonicsGroup] = { correct: 0, total: 0 };
      }
      groupPerformance[r.phonicsGroup].total += 1;
      if (r.correct) {
        groupPerformance[r.phonicsGroup].correct += 1;
      }
    });

    const struggleGroups = Object.entries(groupPerformance)
      .filter(([, stats]) => {
        const accuracy = stats.correct / stats.total;
        return accuracy < 1.0; // Any mistakes = potential struggle area
      })
      .map(([group]) => group as PhonicsGroup);

    const result: PlacementTestResult = {
      determinedLevel,
      identifiedStruggleGroups: struggleGroups,
      wordResults: allResults,
    };

    setCalculatedResult(result);
    setIsComplete(true);

    // Save to Convex
    console.log("Placement Test Result:", result);
    saveResultsToConvex(result);
  };

  const saveResultsToConvex = async (result: PlacementTestResult) => {
    if (!currentUser) {
      // User not signed in - save to localStorage for later sync
      console.log("📦 Saving placement results to localStorage (user not signed in)");
      try {
        // Save placement result for later sync when they sign in
        localStorage.setItem("lexikey_placement_result", JSON.stringify({
          ...result,
          completedAt: Date.now(),
        }));

        // Also update the anonymous user's level so practice uses the new level
        const anonUserData = localStorage.getItem("lexikey-anonymous-user");
        if (anonUserData) {
          const anonUser = JSON.parse(anonUserData);
          anonUser.currentLevel = result.determinedLevel;
          localStorage.setItem("lexikey-anonymous-user", JSON.stringify(anonUser));
          console.log("✅ Anonymous user level updated to:", result.determinedLevel);
        }

        console.log("✅ Placement results saved locally");
      } catch (error) {
        console.error("Failed to save to localStorage:", error);
      }
      return;
    }

    try {
      // Update user stats with placement test results
      await updateUserStats({
        userId: currentUser._id,
        stats: {
          currentLevel: result.determinedLevel,
          hasCompletedPlacementTest: true,
          struggleGroups: result.identifiedStruggleGroups,
        },
      });

      console.log("✅ Placement test results saved to Convex");

      // Clear localStorage if we successfully saved to Convex
      localStorage.removeItem("lexikey_placement_result");
    } catch (error) {
      console.error("Failed to save placement results:", error);
    }
  };

  const handleStartPractice = () => {
    router.push("/practice");
  };

  if (isComplete && calculatedResult) {
    return (
      <>
        <Header />
        <main className="bg-gray-50 dark:bg-black min-h-screen p-8 flex flex-col items-center justify-center">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
            <h1 className="text-3xl font-bold mb-6 text-center text-black dark:text-white">
              Placement Test Complete! 🎉
            </h1>

            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                <h2 className="text-xl font-bold mb-2 text-black dark:text-white">
                  Your Starting Level
                </h2>
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  Level {calculatedResult.determinedLevel}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  We&apos;ll start you here and adapt as you progress
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
                <h2 className="text-xl font-bold mb-3 text-black dark:text-white">
                  Focus Areas
                </h2>
                {calculatedResult.identifiedStruggleGroups.length > 0 ? (
                  <div className="space-y-2">
                    {calculatedResult.identifiedStruggleGroups.map((group) => (
                      <div
                        key={group}
                        className="bg-white dark:bg-gray-800 px-4 py-2 rounded-md border border-purple-300 dark:border-purple-700"
                      >
                        <span className="font-medium text-black dark:text-white capitalize">
                          {group.replace(/-/g, " ")}
                        </span>
                      </div>
                    ))}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                      We&apos;ll give you extra practice in these phonics patterns
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">
                    Great job! No specific struggle areas identified.
                  </p>
                )}
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
                <h2 className="text-xl font-bold mb-2 text-black dark:text-white">
                  Test Results
                </h2>
                <div className="space-y-1">
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Accuracy:</span>{" "}
                    {Math.round(
                      (calculatedResult.wordResults.filter((r) => r.correct)
                        .length /
                        calculatedResult.wordResults.length) *
                        100,
                    )}
                    %
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Words Completed:</span>{" "}
                    {calculatedResult.wordResults.length}
                  </p>
                </div>
              </div>

              <SignedIn>
                <button
                  onClick={handleStartPractice}
                  className="w-full py-4 bg-blue-600 text-white text-xl font-bold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Practice →
                </button>
              </SignedIn>

              <SignedOut>
                <div className="space-y-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
                      💾 Your results are saved locally. Sign in to sync across devices!
                    </p>
                  </div>
                  <Link
                    href="/"
                    className="block w-full py-4 bg-blue-600 text-white text-center text-xl font-bold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Practice →
                  </Link>
                  <SignInButton mode="modal">
                    <button className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-center text-lg font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                      Sign In to Save Progress
                    </button>
                  </SignInButton>
                </div>
              </SignedOut>
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
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>
                Word {currentWordIndex + 1} of {TOTAL_PLACEMENT_WORDS}
              </span>
              <span>
                {Math.round((currentWordIndex / TOTAL_PLACEMENT_WORDS) * 100)}%
                Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(currentWordIndex / TOTAL_PLACEMENT_WORDS) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2 text-black dark:text-white">
                Placement Test
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Type the word you see below
              </p>
            </div>

            {/* Word Display */}
            <div className="mb-8 p-8 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-700">
              <div className="text-6xl font-bold text-center text-black dark:text-white tracking-wider">
                {currentWord?.text || "Loading..."}
              </div>
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
