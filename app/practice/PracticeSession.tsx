"use client";

import { useCallback, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useUserProgress } from "@/hooks/useUserProgress";
import {
  usePracticeSession,
  BACKSPACE_THRESHOLD,
} from "@/hooks/usePracticeSession";
import { SessionConfig, StreakResult, WordResult } from "@/lib/types";
import { getPattern } from "@/lib/phonicsPatterns";
import { trackEvent } from "@/hooks/usePostHog";
import {
  adjustThresholdFromSession,
  DEFAULT_THRESHOLD_PARAMS,
  DEFAULT_LISTEN_THRESHOLD_PARAMS,
} from "@/lib/thresholdCalculator";

import { SentenceModeView } from "./SentenceModeView";
import { SingleWordView } from "./SingleWordView";
import { SessionComplete } from "./SessionComplete";
import { SessionSetup } from "./SessionSetup";

type UserProgressData = ReturnType<typeof useUserProgress>;

/** Human label for the session's focus, shown in the session header */
function focusLabel(config: SessionConfig): string {
  switch (config.focus.type) {
    case "review":
      return "Tricky words";
    case "pattern":
      return getPattern(config.focus.patternId)?.label ?? "Pattern";
    default:
      return "Smart mix";
  }
}

/**
 * Orchestrates the practice flow: setup screen → active session → complete.
 * Session config is local state only; nothing here touches Convex until a
 * finished session's summary is saved.
 */
export function PracticeSession() {
  const userProgress = useUserProgress();
  const [config, setConfig] = useState<SessionConfig | null>(null);
  // Bumped per started session so ActiveSession remounts with fresh state
  const [sessionKey, setSessionKey] = useState(0);

  const startSession = useCallback((newConfig: SessionConfig) => {
    setConfig(newConfig);
    setSessionKey((key) => key + 1);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const backToSetup = useCallback(() => {
    setConfig(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  if (userProgress.isLoading) {
    return <LoadingState />;
  }

  if (!config) {
    return (
      <SessionSetup
        struggleWordCount={userProgress.effectiveStruggleWords.length}
        onStart={startSession}
      />
    );
  }

  return (
    <ActiveSession
      key={sessionKey}
      config={config}
      userProgress={userProgress}
      onChangeFocus={backToSetup}
    />
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="text-center">
        <div className="text-6xl mb-4">⏳</div>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Loading your personalized session...
        </p>
      </div>
    </div>
  );
}

function ActiveSession({
  config,
  userProgress,
  onChangeFocus,
}: {
  config: SessionConfig;
  userProgress: UserProgressData;
  onChangeFocus: () => void;
}) {
  const { settings } = useAccessibility();

  const {
    isAnonymous,
    isLoading: isUserLoading,
    effectiveLevel,
    effectiveListenLevel,
    effectiveStruggleWords,
    effectiveInaudibleWords,
    effectiveThresholdParams,
    effectiveListenThresholdParams,
    currentUser,
    anonymousUser,
    updateAnonymousStats,
    updateUserStats,
    batchProcessWordResults,
    updateAnonymousThreshold,
    updateThresholdParams,
    reportAnonymousInaudible,
    reportInaudibleWord,
  } = userProgress;

  const recordSessionCompleted = useMutation(
    api.streaks.recordSessionCompleted,
  );
  const [streakResult, setStreakResult] = useState<StreakResult | null>(null);

  // The input mode is fixed for a whole session, so the level and the
  // hesitation threshold are chosen once here. Listening and reading each keep
  // their own — mixing them measures neither.
  const inputMode: "see" | "listen" = settings.dictationMode ? "listen" : "see";
  const sessionLevel =
    inputMode === "listen" ? effectiveListenLevel : effectiveLevel;
  const sessionThresholdParams =
    inputMode === "listen"
      ? (effectiveListenThresholdParams ?? DEFAULT_LISTEN_THRESHOLD_PARAMS)
      : (effectiveThresholdParams ?? DEFAULT_THRESHOLD_PARAMS);

  // Handle finishing session - save results to appropriate storage
  const handleFinishSession = useCallback(
    async (allResults: WordResult[], newLevel: number) => {
      // Build word results with wasStruggle flag for bucket processing
      // A word is a struggle if: incorrect, took too long, or required many corrections
      const wordResultsForBucket = allResults.map((r) => ({
        word: r.word,
        phonicsGroup: r.phonicsGroup,
        wasStruggle:
          !r.correct ||
          r.hesitationDetected ||
          r.backspaceCount > BACKSPACE_THRESHOLD,
        inputMode,
      }));

      // Extract timing data for threshold adjustment (only correct words)
      const sessionTimings = allResults
        .filter((r) => r.correct)
        .map((r) => ({ wordLen: r.word.length, time: r.timeSpent }));

      // Gradually adjust the threshold for THIS mode only
      const adjustedThreshold = adjustThresholdFromSession(
        sessionThresholdParams,
        sessionTimings,
      );

      if (isAnonymous) {
        // Pass ALL word results so graduation logic can increment consecutiveCorrect
        updateAnonymousStats(
          allResults.length,
          newLevel,
          wordResultsForBucket,
          inputMode,
        );
        // Update threshold (gradual adjustment)
        updateAnonymousThreshold(adjustedThreshold, inputMode);
      } else if (currentUser) {
        await Promise.all([
          batchProcessWordResults({
            userId: currentUser._id,
            results: wordResultsForBucket,
          }),
          updateUserStats({
            userId: currentUser._id,
            stats:
              inputMode === "listen"
                ? { listenLevel: newLevel }
                : { currentLevel: newLevel },
          }),
          updateThresholdParams({
            userId: currentUser._id,
            thresholdParams: adjustedThreshold,
            inputMode,
          }),
        ]);

        // Streak tracking is best-effort - never let it block session saving.
        try {
          const result = await recordSessionCompleted({
            userId: currentUser._id,
            timezoneOffsetMinutes: new Date().getTimezoneOffset(),
          });
          setStreakResult(result);

          if (result.status === "started" || result.status === "incremented") {
            trackEvent("streak_incremented", {
              currentStreak: result.currentStreak,
              longestStreak: result.longestStreak,
              freezesAvailable: result.freezesAvailable,
              milestone: result.milestone,
            });
          } else if (result.status === "freeze_used") {
            trackEvent("streak_freeze_used", {
              currentStreak: result.currentStreak,
              longestStreak: result.longestStreak,
              freezesAvailable: result.freezesAvailable,
              milestone: result.milestone,
            });
          } else if (result.status === "reset") {
            trackEvent("streak_reset", {
              previousLongest: result.longestStreak,
            });
          }
        } catch (error) {
          console.error("[Streak] Failed to record session:", error);
        }
      }
    },
    [
      isAnonymous,
      inputMode,
      sessionThresholdParams,
      currentUser,
      updateAnonymousStats,
      updateUserStats,
      batchProcessWordResults,
      updateAnonymousThreshold,
      updateThresholdParams,
      recordSessionCompleted,
    ],
  );

  // "I couldn't hear that" on the results screen. Keeps the word out of future
  // listening sessions and, counted across users, shows which words the voice
  // mangles for everyone.
  const handleReportInaudible = useCallback(
    (word: string) => {
      trackEvent("word_reported_inaudible", { word, isAnonymous });

      if (isAnonymous) {
        reportAnonymousInaudible(word);
      } else if (currentUser) {
        reportInaudibleWord({ userId: currentUser._id, word }).catch((error) =>
          console.error("[Inaudible] Failed to report word:", error),
        );
      }
    },
    [isAnonymous, currentUser, reportAnonymousInaudible, reportInaudibleWord],
  );

  // Session state and handlers
  const {
    sessionWords,
    sessionStruggleWords,
    currentWordIndex,
    currentWord,
    userInput,
    results,
    isComplete,
    isLoading: isSessionLoading,
    sentenceMode,
    letterStates,
    showFeedback,
    reveal,
    inputRef,
    handleInputChange,
    handleKeyDown,
    restartSession,
    refreshSession,
    handleRepeat,
  } = usePracticeSession({
    isAnonymous,
    isUserLoading,
    effectiveLevel: sessionLevel,
    effectiveStruggleWords,
    inaudibleWords: effectiveInaudibleWords,
    thresholdParams: sessionThresholdParams,
    currentUser,
    anonymousUser,
    config,
    onFinishSession: handleFinishSession,
  });

  // Loading state
  if (isUserLoading || isSessionLoading) {
    return <LoadingState />;
  }

  // Session complete
  if (isComplete) {
    return (
      <SessionComplete
        results={results}
        struggleWordsAtStart={sessionStruggleWords}
        currentLevel={sessionLevel}
        onRestart={restartSession}
        onChangeFocus={onChangeFocus}
        showTimerPressure={settings.showTimerPressure}
        isAnonymous={isAnonymous}
        showTypingSpeed={settings.showTypingSpeed}
        inputMode={settings.dictationMode ? "voice" : "visible"}
        displayMode={sentenceMode ? "sentence" : "word"}
        onReportInaudible={handleReportInaudible}
        streakResult={streakResult}
      />
    );
  }

  // Active session
  return (
    <div className="max-w-4xl w-full mx-auto animate-in fade-in duration-200 motion-reduce:animate-none">
      {/* Header: level + focus on the left, progress + actions on the right */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div
          className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
          data-tour="level-display"
        >
          <span className="font-semibold">
            {inputMode === "listen" ? "Listening level" : "Level"}{" "}
            {sessionLevel.toFixed(1)}
          </span>
          <span aria-hidden="true">·</span>
          <span>{focusLabel(config)}</span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="text-sm text-gray-600 dark:text-gray-400"
            aria-label={`Word ${currentWordIndex + 1} of ${sessionWords.length}`}
          >
            {currentWordIndex + 1} / {sessionWords.length}
          </div>
          <button
            onClick={refreshSession}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            title="Get new words"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
            <span className="sr-only">Get new words</span>
          </button>
          <button
            onClick={onChangeFocus}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline underline-offset-2 transition-colors"
          >
            Change practice
          </button>
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
          dictationMode={settings.dictationMode}
          reveal={reveal}
          onRepeat={handleRepeat}
          blindMode={settings.blindMode}
          showHints={settings.showHints}
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
          blindMode={settings.blindMode}
          showHints={settings.showHints}
          dictationMode={settings.dictationMode}
          reveal={reveal}
          onRepeat={handleRepeat}
        />
      )}
    </div>
  );
}
