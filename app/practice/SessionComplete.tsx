"use client";

import { useEffect, useRef } from "react";
import { SignUpButton } from "@clerk/nextjs";
import { WordResult } from "@/lib/types";
import {
  trackEvent,
  trackSessionCompleted,
  updateUserProperties,
  incrementUserProperty,
  triggerSurveyEligibility,
} from "@/hooks/usePostHog";

// Thresholds for determining struggle words (match practice page)
const BACKSPACE_THRESHOLD = 4;

type SessionCompleteProps = {
  results: WordResult[];
  currentLevel: number;
  onRestart: () => void;
  showTimerPressure?: boolean;
  isAnonymous?: boolean;
  showTypingSpeed?: boolean;
  // Mode tracking
  inputMode: "visible" | "voice";
  displayMode: "sentence" | "word";
};

export function SessionComplete({
  results,
  currentLevel,
  onRestart,
  showTimerPressure = false,
  isAnonymous = false,
  showTypingSpeed = true,
  inputMode,
  displayMode,
}: SessionCompleteProps) {
  // Only show WPM in sentence mode with visible words (not voice/dictation)
  const shouldShowWPM = showTypingSpeed && displayMode === "sentence" && inputMode === "visible";
  const containerRef = useRef<HTMLDivElement>(null);

  const accuracy = Math.round(
    (results.filter((r) => r.correct).length / results.length) * 100,
  );
  const totalTime = Math.round(
    results.reduce((sum, r) => sum + r.timeSpent, 0),
  );
  const totalTimeMinutes = totalTime / 60;

  // Calculate WPM (words per minute)
  // Using standard: WPM = (total characters / 5) / time in minutes
  const totalCharacters = results.reduce((sum, r) => sum + r.word.length, 0);
  const wpm = totalTimeMinutes > 0 ? Math.round((totalCharacters / 5) / totalTimeMinutes) : 0;

  // Struggle words: incorrect OR hesitation OR too many backspaces
  const struggleWords = results.filter(
    (r) => !r.correct || r.hesitationDetected || r.backspaceCount > BACKSPACE_THRESHOLD,
  );
  const totalBackspaces = results.reduce(
    (sum, r) => sum + r.backspaceCount,
    0,
  );

  // Handle Enter key to restart
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onRestart();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onRestart]);

  // Focus container for keyboard events and track analytics
  useEffect(() => {
    containerRef.current?.focus();

    // Track comprehensive session completion
    trackSessionCompleted({
      wordsAttempted: results.length,
      wordsCompleted: results.filter((r) => r.correct).length,
      accuracy,
      durationSeconds: totalTime,
      struggleWordsAdded: struggleWords.length,
      mode: "practice",
    });

    // Update user properties for segmentation
    updateUserProperties({
      currentLevel,
      struggleWordsCount: struggleWords.length,
    });

    // Increment lifetime stats
    incrementUserProperty("totalWords", results.length);
    incrementUserProperty("totalSessions", 1);

    // Track session complete view (existing)
    trackEvent("session_complete_viewed", {
      accuracy,
      wordCount: results.length,
      struggleWordsCount: struggleWords.length,
      totalTime,
      wpm: shouldShowWPM ? wpm : null,
      isAnonymous,
      inputMode,
      displayMode,
    });

    // Trigger survey eligibility after 5 sessions (check in PostHog)
    triggerSurveyEligibility("after_5_sessions", {
      accuracy,
      currentLevel,
    });
  }, []);

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="max-w-2xl w-full bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 outline-none"
    >
      <h1 className="text-3xl font-bold mb-6 text-center text-black dark:text-white">
        Session Complete!
      </h1>

      <div className="space-y-6">
        {/* Sign up prompt for anonymous users */}
        {isAnonymous && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-5 rounded-lg border border-green-200 dark:border-green-800">
            <h2 className="text-lg font-bold text-green-800 dark:text-green-300 mb-2">
              Save Your Progress
            </h2>
            <p className="text-sm text-green-700 dark:text-green-400 mb-4">
              Create a free account to save your level, track struggle words across sessions, and unlock personalized practice.
            </p>
            <SignUpButton mode="modal">
              <button className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors">
                Create Free Account
              </button>
            </SignUpButton>
          </div>
        )}

        {/* Level Display */}
        <LevelDisplay currentLevel={currentLevel} accuracy={accuracy} />

        {/* Stats Grid */}
        <StatsGrid
          wordsCount={results.length}
          accuracy={accuracy}
          totalTime={totalTime}
          totalBackspaces={totalBackspaces}
          showTimerPressure={showTimerPressure}
          showTypingSpeed={shouldShowWPM}
          wpm={wpm}
        />

        {/* Struggle words */}
        {struggleWords.length > 0 && (
          <StruggleWordsDisplay struggleWords={struggleWords} />
        )}

        {/* Actions */}
        <button
          onClick={onRestart}
          className="w-full py-4 bg-blue-600 text-white text-xl font-bold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Practice Again
          <span className="block text-sm font-normal opacity-75">Press Enter</span>
        </button>
      </div>
    </div>
  );
}

function LevelDisplay({
  currentLevel,
  accuracy,
}: {
  currentLevel: number;
  accuracy: number;
}) {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-lg border-2 border-purple-300 dark:border-purple-700">
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Current Level
        </p>
        <p className="text-5xl font-bold text-purple-600 dark:text-purple-400">
          {currentLevel.toFixed(1)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          {accuracy >= 85
            ? "Great job!"
            : accuracy >= 70
              ? "Keep practicing!"
              : "Take your time!"}
        </p>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
        <div
          className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${(currentLevel % 1) * 100}%` }}
        />
      </div>
      <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-2">
        Progress to Level {Math.ceil(currentLevel)}
      </p>
    </div>
  );
}

function StatsGrid({
  wordsCount,
  accuracy,
  totalTime,
  totalBackspaces,
  showTimerPressure = false,
  showTypingSpeed = true,
  wpm = 0,
}: {
  wordsCount: number;
  accuracy: number;
  totalTime: number;
  totalBackspaces: number;
  showTimerPressure?: boolean;
  showTypingSpeed?: boolean;
  wpm?: number;
}) {
  // When showTimerPressure is false, only show words, accuracy, and optionally WPM
  if (!showTimerPressure) {
    return (
      <div className={`grid ${showTypingSpeed ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
        <StatCard
          value={wordsCount}
          label="Words"
          colorClass="blue"
        />
        <StatCard
          value={`${accuracy}%`}
          label="Accuracy"
          colorClass="green"
        />
        {showTypingSpeed && (
          <StatCard
            value={`${wpm}`}
            label="WPM"
            colorClass="purple"
          />
        )}
      </div>
    );
  }

  // Calculate grid columns based on what's shown
  const cols = showTypingSpeed ? 5 : 4;

  return (
    <div className={`grid grid-cols-2 md:grid-cols-${cols} gap-3`}>
      <StatCard
        value={wordsCount}
        label="Words"
        colorClass="blue"
      />
      <StatCard
        value={`${accuracy}%`}
        label="Accuracy"
        colorClass="green"
      />
      {showTypingSpeed && (
        <StatCard
          value={`${wpm}`}
          label="WPM"
          colorClass="purple"
        />
      )}
      <StatCard
        value={`${totalTime}s`}
        label="Time"
        colorClass="yellow"
      />
      <StatCard
        value={totalBackspaces}
        label="Backspaces"
        colorClass="yellow"
      />
    </div>
  );
}

function StatCard({
  value,
  label,
  colorClass,
}: {
  value: string | number;
  label: string;
  colorClass: "blue" | "green" | "purple" | "yellow";
}) {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400",
    green:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400",
    purple:
      "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400",
    yellow:
      "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400",
  };

  const [bgBorder, textColor] = colors[colorClass].split(" text-");

  return (
    <div className={`${bgBorder} p-4 rounded-lg border text-center`}>
      <p className={`text-2xl font-bold text-${textColor}`}>{value}</p>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{label}</p>
    </div>
  );
}

function StruggleWordsDisplay({
  struggleWords,
}: {
  struggleWords: WordResult[];
}) {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
      <h2 className="text-xl font-bold mb-3 text-black dark:text-white">
        Words to Review
      </h2>
      <div className="space-y-2">
        {struggleWords.map((r) => {
          const reasons: string[] = [];
          if (!r.correct) reasons.push("incorrect");
          if (r.hesitationDetected) reasons.push("slow");
          if (r.backspaceCount > BACKSPACE_THRESHOLD) reasons.push(`${r.backspaceCount} backspaces`);

          return (
            <div
              key={r.wordId}
              className="flex items-center gap-3 px-3 py-2 bg-yellow-200 dark:bg-yellow-600/30 border border-yellow-300 dark:border-yellow-700 rounded-lg"
            >
              <span className="font-mono font-semibold text-yellow-900 dark:text-yellow-200">
                {r.word}
              </span>
              {!r.correct && r.userInput && (
                <span className="text-sm text-red-600 dark:text-red-400">
                  <span className="text-gray-500 dark:text-gray-400">typed: </span>
                  <span className="font-mono line-through">{r.userInput || "(empty)"}</span>
                </span>
              )}
              <span className="ml-auto text-xs text-yellow-600 dark:text-yellow-400">
                {reasons.join(" · ")}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
        These words have been added to your review bucket for extra practice
      </p>
    </div>
  );
}
