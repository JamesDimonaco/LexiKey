"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SignUpButton } from "@clerk/nextjs";
import { Flame, Snowflake, Trophy, VolumeX } from "lucide-react";
import { WordResult, StreakResult, StruggleWord } from "@/lib/types";
import {
  trackEvent,
  trackSessionCompleted,
  trackWordMastered,
  updateUserProperties,
  incrementUserProperty,
  triggerSurveyEligibility,
} from "@/hooks/usePostHog";
import { BACKSPACE_THRESHOLD } from "@/hooks/usePracticeSession";

type SessionCompleteProps = {
  results: WordResult[];
  /** Struggle bucket as it stood when the session's words were generated */
  struggleWordsAtStart?: StruggleWord[];
  currentLevel: number;
  onRestart: () => void;
  /** Return to the session setup screen */
  onChangeFocus?: () => void;
  showTimerPressure?: boolean;
  isAnonymous?: boolean;
  showTypingSpeed?: boolean;
  // Mode tracking
  inputMode: "visible" | "voice";
  displayMode: "sentence" | "word";
  /** Report that the voice mangled a word (dictation sessions only) */
  onReportInaudible?: (word: string) => void;
  streakResult?: StreakResult | null;
};

export function SessionComplete({
  results,
  struggleWordsAtStart,
  currentLevel,
  onRestart,
  onChangeFocus,
  showTimerPressure = false,
  isAnonymous = false,
  showTypingSpeed = true,
  inputMode,
  displayMode,
  onReportInaudible,
  streakResult,
}: SessionCompleteProps) {
  // Only show WPM in sentence mode with visible words (not voice/dictation)
  const shouldShowWPM =
    showTypingSpeed && displayMode === "sentence" && inputMode === "visible";
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
  const wpm =
    totalTimeMinutes > 0
      ? Math.round(totalCharacters / 5 / totalTimeMinutes)
      : 0;

  // Struggle words: incorrect OR hesitation OR too many backspaces
  const struggleWords = results.filter(
    (r) =>
      !r.correct ||
      r.hesitationDetected ||
      r.backspaceCount > BACKSPACE_THRESHOLD,
  );
  const totalBackspaces = results.reduce((sum, r) => sum + r.backspaceCount, 0);

  // Words that graduated out of the review bucket this session. Mirrors the
  // server's rule exactly: 3 consecutive clean attempts deletes the word, a
  // struggle resets the counter (and re-adds it if it had just graduated).
  const masteredWordDetails = useMemo(() => {
    if (!struggleWordsAtStart?.length) return [];

    const counters = new Map(
      struggleWordsAtStart.map((w) => [
        w.word.toLowerCase(),
        w.consecutiveCorrect,
      ]),
    );
    const attempts = new Map<string, number>();
    const mastered = new Map<
      string,
      { phonicsGroup: string; attemptsThisSession: number }
    >();

    for (const r of results) {
      const key = r.word.toLowerCase();
      if (!counters.has(key)) continue;

      attempts.set(key, (attempts.get(key) ?? 0) + 1);

      const wasStruggle =
        !r.correct ||
        r.hesitationDetected ||
        r.backspaceCount > BACKSPACE_THRESHOLD;

      if (wasStruggle) {
        counters.set(key, 0);
        mastered.delete(key); // back in the bucket
      } else {
        const next = (counters.get(key) ?? 0) + 1;
        counters.set(key, next);
        if (next >= 3) {
          mastered.set(key, {
            phonicsGroup: r.phonicsGroup,
            attemptsThisSession: attempts.get(key) ?? next,
          });
        }
      }
    }

    // Return in original-casing, session order
    return results
      .filter(
        (r, i, arr) =>
          arr.findIndex(
            (x) => x.word.toLowerCase() === r.word.toLowerCase(),
          ) === i,
      )
      .filter((r) => mastered.has(r.word.toLowerCase()))
      .map((r) => ({ word: r.word, ...mastered.get(r.word.toLowerCase())! }));
  }, [results, struggleWordsAtStart]);

  const masteredWords = useMemo(
    () => masteredWordDetails.map((m) => m.word),
    [masteredWordDetails],
  );

  // Handle Enter key to restart — but only when focus isn't already inside
  // an interactive control (a button, a Clerk sign-up modal's form field,
  // etc). Otherwise this fires on top of whatever Enter was supposed to do
  // there, e.g. restarting the session instead of activating "Create Free
  // Account".
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const target = e.target as HTMLElement | null;
      if (
        target?.closest(
          'button, a, input, textarea, select, [role="button"], [contenteditable="true"]',
        )
      ) {
        return;
      }
      e.preventDefault();
      onRestart();
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

    // One event per word that graduated out of the review bucket this session
    for (const m of masteredWordDetails) {
      trackWordMastered({
        word: m.word,
        phonicsGroup: m.phonicsGroup,
        attemptsThisSession: m.attemptsThisSession,
      });
    }
    // Analytics must fire exactly once when the completion screen mounts,
    // not again on re-renders — the values are frozen for this session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      role="region"
      aria-labelledby="session-complete-heading"
      className="max-w-2xl w-full bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md dark:shadow-none border border-gray-200 dark:border-gray-800 outline-none animate-in fade-in duration-300 motion-reduce:animate-none"
    >
      <h1
        id="session-complete-heading"
        className="text-3xl font-bold mb-6 text-center text-black dark:text-white"
      >
        Session Complete!
      </h1>

      <div className="space-y-6">
        {/* Streak milestone / freeze celebration */}
        {streakResult && <StreakCelebration streakResult={streakResult} />}

        {/* Sign up prompt for anonymous users */}
        {isAnonymous && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-5 rounded-lg border border-green-200 dark:border-green-800">
            <h2 className="text-lg font-bold text-green-800 dark:text-green-300 mb-2">
              Save Your Progress
            </h2>
            <p className="text-sm text-green-700 dark:text-green-400 mb-4">
              Create a free account to save your level, track struggle words
              across sessions, and unlock personalized practice.
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

        {/* Words mastered this session */}
        {masteredWords.length > 0 && (
          <MasteredWordsDisplay masteredWords={masteredWords} />
        )}

        {/* Struggle words */}
        {struggleWords.length > 0 && (
          <StruggleWordsDisplay
            struggleWords={struggleWords}
            onReportInaudible={
              inputMode === "voice" ? onReportInaudible : undefined
            }
          />
        )}

        {/* Actions */}
        <button
          onClick={onRestart}
          className="w-full py-4 bg-blue-600 text-white text-xl font-bold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Practice Again
          <span className="block text-sm font-normal opacity-75">
            Press Enter
          </span>
        </button>
        {onChangeFocus && (
          <button
            onClick={onChangeFocus}
            className="w-full py-3 text-gray-600 dark:text-gray-400 font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Change what you practice
          </button>
        )}
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
      <div
        className={`grid ${showTypingSpeed ? "grid-cols-3" : "grid-cols-2"} gap-3`}
      >
        <StatCard value={wordsCount} label="Words" colorClass="blue" />
        <StatCard value={`${accuracy}%`} label="Accuracy" colorClass="green" />
        {showTypingSpeed && (
          <StatCard value={`${wpm}`} label="WPM" colorClass="purple" />
        )}
      </div>
    );
  }

  // Calculate grid columns based on what's shown
  const cols = showTypingSpeed ? 5 : 4;

  return (
    <div className={`grid grid-cols-2 md:grid-cols-${cols} gap-3`}>
      <StatCard value={wordsCount} label="Words" colorClass="blue" />
      <StatCard value={`${accuracy}%`} label="Accuracy" colorClass="green" />
      {showTypingSpeed && (
        <StatCard value={`${wpm}`} label="WPM" colorClass="purple" />
      )}
      <StatCard value={`${totalTime}s`} label="Time" colorClass="yellow" />
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

function MasteredWordsDisplay({ masteredWords }: { masteredWords: string[] }) {
  return (
    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-lg border border-emerald-200 dark:border-emerald-800">
      <h2 className="text-xl font-bold mb-3 text-black dark:text-white flex items-center gap-2">
        <Trophy
          className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0"
          aria-hidden="true"
        />
        Words Mastered
      </h2>
      <div className="flex flex-wrap gap-2">
        {masteredWords.map((word) => (
          <span
            key={word}
            className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-600/30 border border-emerald-300 dark:border-emerald-700 rounded-lg font-mono font-semibold text-emerald-900 dark:text-emerald-200"
          >
            {word}
          </span>
        ))}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
        Typed correctly 3 times in a row — these are out of your review list.
        Nice work.
      </p>
    </div>
  );
}

function StruggleWordsDisplay({
  struggleWords,
  onReportInaudible,
}: {
  struggleWords: WordResult[];
  /** Only passed for dictation sessions — a shown word can't be inaudible */
  onReportInaudible?: (word: string) => void;
}) {
  const [reported, setReported] = useState<string[]>([]);

  const report = useCallback(
    (word: string) => {
      setReported((prev) => (prev.includes(word) ? prev : [...prev, word]));
      onReportInaudible?.(word);
    },
    [onReportInaudible],
  );

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
          if (r.backspaceCount > BACKSPACE_THRESHOLD)
            reasons.push(`${r.backspaceCount} backspaces`);

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
                  <span className="text-gray-500 dark:text-gray-400">
                    typed:{" "}
                  </span>
                  <span className="font-mono line-through">
                    {r.userInput || "(empty)"}
                  </span>
                </span>
              )}
              <span className="ml-auto text-xs text-yellow-600 dark:text-yellow-400">
                {reasons.join(" · ")}
              </span>
              {onReportInaudible &&
                (reported.includes(r.word) ? (
                  <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    Won&apos;t be spoken again
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => report(r.word)}
                    className="flex items-center gap-1 text-xs font-medium text-yellow-900 dark:text-yellow-200 underline underline-offset-2 hover:no-underline whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                  >
                    <VolumeX className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Couldn&apos;t hear it
                  </button>
                ))}
            </div>
          );
        })}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
        {onReportInaudible
          ? "These words have been added to your review bucket. If the voice mangled one, say so and it won't be spoken to you again."
          : "These words have been added to your review bucket for extra practice"}
      </p>
    </div>
  );
}

function StreakCelebration({ streakResult }: { streakResult: StreakResult }) {
  const { status, milestone, currentStreak } = streakResult;

  // Only the moments worth a gentle callout: hitting a milestone, or a
  // freeze quietly saving the day. Everyday increments stay invisible here -
  // the dashboard streak counter is where day-to-day progress lives.
  if (status !== "freeze_used" && milestone === null) {
    return null;
  }

  const isMilestone = milestone !== null;

  return (
    <div
      role="status"
      className={`relative overflow-hidden rounded-lg border p-4 text-center animate-in fade-in slide-in-from-top-2 duration-500 motion-reduce:animate-none ${
        isMilestone
          ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
          : "bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800"
      }`}
    >
      {isMilestone && <ConfettiBurst />}

      {isMilestone ? (
        <div className="relative">
          <p className="text-lg font-semibold text-orange-700 dark:text-orange-300 flex items-center justify-center gap-2">
            <Flame className="h-5 w-5 shrink-0" aria-hidden="true" />
            {milestone}-day streak!
          </p>
          <p className="text-sm text-orange-900 dark:text-orange-200 mt-1">
            You&apos;ve practiced {milestone} days in a row — wonderful
            consistency.
          </p>
        </div>
      ) : (
        <p className="relative text-sm font-medium text-sky-800 dark:text-sky-300 flex items-center justify-center gap-2">
          <Snowflake className="h-4 w-4 shrink-0" aria-hidden="true" />A freeze
          covered your missed day — your {currentStreak}-day streak is safe
        </p>
      )}
    </div>
  );
}

// A handful of lightweight CSS-only confetti particles. Purely decorative,
// hidden from screen readers, and skipped entirely under reduced motion.
function ConfettiBurst() {
  const particles = [
    { left: "12%", delay: "0ms", color: "bg-orange-400" },
    { left: "28%", delay: "80ms", color: "bg-amber-400" },
    { left: "50%", delay: "40ms", color: "bg-purple-400" },
    { left: "72%", delay: "120ms", color: "bg-blue-400" },
    { left: "88%", delay: "60ms", color: "bg-orange-300" },
  ];

  return (
    <div
      className="pointer-events-none absolute inset-0 motion-reduce:hidden"
      aria-hidden="true"
    >
      {particles.map((p, i) => (
        <span
          key={i}
          className={`confetti-particle absolute top-0 h-2 w-2 rounded-full ${p.color}`}
          style={{ left: p.left, animationDelay: p.delay }}
        />
      ))}
    </div>
  );
}
