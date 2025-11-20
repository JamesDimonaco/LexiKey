"use client";

import { useState, useCallback, useEffect } from "react";
import { TypingEngine } from "@/components/TypingEngine";
import { AccessibilitySettings } from "@/components/AccessibilitySettings";
import { TypingWord, WordResult } from "@/lib/types";
import Link from "next/link";
import wordsData from "./words.json";

// Load words from JSON file
const SAMPLE_WORDS: TypingWord[] = wordsData;

interface SavedProgress {
  currentWordIndex: number;
  sessionResults: WordResult[];
  words: TypingWord[];
}

const STORAGE_KEY = "lexikey-practice-progress";

export default function PracticePage() {
  const [showSettings, setShowSettings] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionResults, setSessionResults] = useState<WordResult[]>([]);
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(
    null,
  );
  const [wordsToPractice, setWordsToPractice] =
    useState<TypingWord[]>(SAMPLE_WORDS);

  const handleWordComplete = useCallback((result: WordResult) => {
    console.log("Word completed:", result);
    // In production, this would send result summary to Convex
    // NOT individual keystrokes - only the aggregate result
  }, []);

  const handleSessionComplete = useCallback((results: WordResult[]) => {
    setSessionResults(results);
    setSessionActive(false);
    setSavedProgress(null);
    localStorage.removeItem(STORAGE_KEY);

    // In production, this would create a PracticeSession in Convex
    const accuracy =
      (results.filter((r) => r.isCorrect).length / results.length) * 100;
    const totalDuration = results.reduce((sum, r) => sum + r.timeSpent, 0);
    const struggleWords = results
      .filter((r) => r.hesitated || r.backspaceCount > 3 || !r.isCorrect)
      .map((r) => r.wordId);

    console.log("Session Summary:", {
      wordsAttempted: results.length,
      accuracy,
      durationSeconds: totalDuration,
      struggleWords,
    });
  }, []);

  // Load saved progress on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const progress: SavedProgress = JSON.parse(saved);
        // Verify the saved words match current words structure
        if (progress.words && progress.words.length > 0) {
          setSavedProgress(progress);
          setWordsToPractice(progress.words);
        }
      } catch (e) {
        console.error("Failed to load saved progress:", e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const startNewSession = () => {
    setSessionResults([]);
    setSavedProgress(null);
    setWordsToPractice(SAMPLE_WORDS);
    localStorage.removeItem(STORAGE_KEY);
    setSessionActive(true);
  };

  const continueSession = () => {
    if (savedProgress) {
      setSessionResults(savedProgress.sessionResults);
      setWordsToPractice(savedProgress.words);
      setSessionActive(true);
    }
  };

  const handleQuit = useCallback((progress: SavedProgress) => {
    // Save progress to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    setSavedProgress(progress);
    setSessionActive(false);
  }, []);

  const clearSavedProgress = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedProgress(null);
  };

  if (showSettings) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Settings
            </h1>
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Practice
            </button>
          </div>
          <AccessibilitySettings />
        </div>
      </div>
    );
  }

  if (sessionActive) {
    return (
      <TypingEngine
        words={wordsToPractice}
        onWordComplete={handleWordComplete}
        onSessionComplete={handleSessionComplete}
        onQuit={handleQuit}
        initialWordIndex={savedProgress?.currentWordIndex ?? 0}
        initialResults={savedProgress?.sessionResults ?? []}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-black dark:text-white">
            LexiKey Practice
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              ⚙️ Settings
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-300 dark:bg-gray-800 text-black dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700"
            >
              Home
            </Link>
          </div>
        </div>

        {sessionResults.length > 0 ? (
          <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">
              Last Session Results
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {sessionResults.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Words Practiced
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                  {Math.round(
                    (sessionResults.filter((r) => r.isCorrect).length /
                      sessionResults.length) *
                      100,
                  )}
                  %
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Accuracy
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round(
                    sessionResults.reduce((sum, r) => sum + r.timeSpent, 0),
                  )}
                  s
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Time
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold mb-2 text-black dark:text-white">
                Word Details:
              </h3>
              {sessionResults.map((result) => (
                <div
                  key={result.wordId}
                  className={`p-3 rounded-lg ${
                    result.isCorrect
                      ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-black dark:text-white">
                      {result.word}
                    </span>
                    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>{result.timeSpent.toFixed(1)}s</span>
                      <span>{result.keystrokeCount} keys</span>
                      {result.backspaceCount > 0 && (
                        <span>{result.backspaceCount} backspaces</span>
                      )}
                      {result.hesitated && (
                        <span className="text-orange-600 dark:text-orange-400">
                          ⚠️ Hesitated
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {sessionResults.filter(
              (r) => r.hesitated || r.backspaceCount > 3 || !r.isCorrect,
            ).length > 0 && (
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <h3 className="font-semibold mb-2 text-black dark:text-white">
                  Words to Review:
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  These words will be added to your review bucket for extra
                  practice.
                </p>
                <div className="flex flex-wrap gap-2">
                  {sessionResults
                    .filter(
                      (r) =>
                        r.hesitated || r.backspaceCount > 3 || !r.isCorrect,
                    )
                    .map((r) => (
                      <span
                        key={r.wordId}
                        className="px-3 py-1 bg-yellow-200 dark:bg-yellow-600/30 border border-yellow-300 dark:border-yellow-700 rounded-full text-sm font-mono text-yellow-900 dark:text-yellow-200"
                      >
                        {r.word}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">
            Ready to Practice?
          </h2>
          <p className="text-gray-700 dark:text-gray-400 mb-6">
            This practice session includes {SAMPLE_WORDS.length} words focusing
            on:
          </p>
          <ul className="list-disc list-inside mb-6 text-gray-700 dark:text-gray-400 space-y-1">
            <li>CVC words (short vowels: a, e, i, o, u)</li>
            <li>Silent E patterns</li>
            <li>Digraphs (sh, ch, th, ck, wh, ph)</li>
            <li>Common reversals (b/d, p/q, was/saw)</li>
            <li>Blends (st, fl, fr, cr, dr, sp, sw, tr, gl, pl, cl)</li>
            <li>End blends (mp, nd, nt, st, lk)</li>
            <li>Glued sounds (ng, nk)</li>
            <li>Vowel teams (ai, ay, oa, ee, ea, oo, ou, ow, oy)</li>
            <li>R-controlled vowels (ar, or, er, ir, ur)</li>
          </ul>

          {savedProgress && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <h3 className="font-semibold mb-2 text-black dark:text-white">
                📌 Saved Progress
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-400 mb-3">
                You have {savedProgress.currentWordIndex} of{" "}
                {savedProgress.words.length} words completed. Continue where you
                left off?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={continueSession}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold"
                >
                  Continue Practice
                </button>
                <button
                  onClick={clearSavedProgress}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-black dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          <button
            onClick={startNewSession}
            className="w-full py-4 bg-blue-600 text-white text-xl font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            {sessionResults.length > 0
              ? "Practice Again"
              : "Start New Practice"}
          </button>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="font-semibold mb-2 text-black dark:text-white">
              💡 Tips:
            </h3>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>• Listen to the word being spoken</li>
              <li>• Type carefully - accuracy is more important than speed</li>
              <li>
                • Use the &ldquo;Repeat Word&rdquo; button if you need to hear
                it again
              </li>
              <li>
                • Take your time - there&apos;s no rush unless you enable timer
                mode
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
