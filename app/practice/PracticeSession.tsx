"use client";

import { useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useUserProgress } from "@/hooks/useUserProgress";
import { usePracticeSession, BACKSPACE_THRESHOLD } from "@/hooks/usePracticeSession";
import { StruggleWord, WordResult } from "@/lib/types";
import { trackEvent } from "@/hooks/usePostHog";
import { adjustThresholdFromSession, DEFAULT_THRESHOLD_PARAMS } from "@/lib/thresholdCalculator";

import { SentenceModeView } from "./SentenceModeView";
import { SingleWordView } from "./SingleWordView";
import { SessionComplete } from "./SessionComplete";

export function PracticeSession() {
  const { settings } = useAccessibility();

  // User progress (handles auth/anonymous, data migration)
  const {
    isAnonymous,
    isLoading: isUserLoading,
    effectiveLevel,
    effectiveStruggleWords,
    effectiveThresholdParams,
    currentUser,
    anonymousUser,
    updateAnonymousStats,
    updateUserStats,
    batchProcessWordResults,
    updateAnonymousThreshold,
    updateThresholdParams,
  } = useUserProgress();

  // Handle finishing session - save results to appropriate storage
  const handleFinishSession = useCallback(async (allResults: WordResult[], newLevel: number) => {
    // Build word results with wasStruggle flag for bucket processing
    // A word is a struggle if: incorrect, took too long, or required many corrections
    const wordResultsForBucket = allResults.map((r) => ({
      word: r.word,
      phonicsGroup: r.phonicsGroup,
      wasStruggle: !r.correct || r.hesitationDetected || r.backspaceCount > BACKSPACE_THRESHOLD,
    }));

    // Extract timing data for threshold adjustment (only correct words)
    const sessionTimings = allResults
      .filter((r) => r.correct)
      .map((r) => ({ wordLen: r.word.length, time: r.timeSpent }));

    // Gradually adjust threshold based on this session's timing
    const currentThreshold = effectiveThresholdParams ?? DEFAULT_THRESHOLD_PARAMS;
    const adjustedThreshold = adjustThresholdFromSession(currentThreshold, sessionTimings);

    if (isAnonymous) {
      // Pass ALL word results so graduation logic can increment consecutiveCorrect
      updateAnonymousStats(allResults.length, newLevel, wordResultsForBucket);
      // Update threshold (gradual adjustment)
      updateAnonymousThreshold(adjustedThreshold);
    } else if (currentUser) {
      await Promise.all([
        batchProcessWordResults({
          userId: currentUser._id,
          results: wordResultsForBucket,
        }),
        updateUserStats({
          userId: currentUser._id,
          stats: { currentLevel: newLevel },
        }),
        updateThresholdParams({
          userId: currentUser._id,
          thresholdParams: adjustedThreshold,
        }),
      ]);
    }
  }, [isAnonymous, currentUser, updateAnonymousStats, updateUserStats, batchProcessWordResults, effectiveThresholdParams, updateAnonymousThreshold, updateThresholdParams]);

  // Session state and handlers
  const {
    sessionWords,
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
    handleSubmitWord,
    restartSession,
    refreshSession,
    handleDictationToggle,
    handleRepeat,
    setSentenceMode,
    wordTimeRemaining,
  } = usePracticeSession({
    isAnonymous,
    isUserLoading,
    effectiveLevel,
    effectiveStruggleWords,
    thresholdParams: effectiveThresholdParams,
    currentUser,
    anonymousUser,
    onFinishSession: handleFinishSession,
  });

  // Loading state
  if (isUserLoading || isSessionLoading) {
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

  // Session complete
  if (isComplete) {
    return (
      <SessionComplete
        results={results}
        currentLevel={effectiveLevel}
        onRestart={restartSession}
        showTimerPressure={settings.showTimerPressure}
        isAnonymous={isAnonymous}
        showTypingSpeed={settings.showTypingSpeed}
        inputMode={settings.dictationMode ? "voice" : "visible"}
        displayMode={sentenceMode ? "sentence" : "word"}
      />
    );
  }

  // Active session
  return (
    <div className="max-w-4xl w-full mx-auto">
      {/* Header with level and mode toggles */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3" data-tour="level-display">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold">
              Level {effectiveLevel.toFixed(1)}
            </span>
          </div>
          {settings.hardcoreMode && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider">
              Hardcore
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {/* Dictation Mode Toggle */}
          <div className="flex items-center gap-2" data-tour="dictation-toggle">
            <Label
              htmlFor="dictation-toggle"
              className={`text-sm ${!settings.dictationMode ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}
            >
              Visible
            </Label>
            <Switch
              checked={settings.dictationMode}
              onCheckedChange={handleDictationToggle}
              id="dictation-toggle"
            />
            <Label
              htmlFor="dictation-toggle"
              className={`text-sm ${settings.dictationMode ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}
            >
              Listen
            </Label>
          </div>

          {/* Word/Sentence Mode Toggle */}
          <div className="flex items-center gap-2" data-tour="mode-toggle">
            <Label
              htmlFor="mode-toggle"
              className={`text-sm ${!sentenceMode ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}
            >
              Word
            </Label>
            <Switch
              checked={sentenceMode}
              onCheckedChange={(enabled) => {
                trackEvent("practice_mode_toggled", {
                  mode: enabled ? "sentence" : "word",
                  wordIndex: currentWordIndex,
                });
                setSentenceMode(enabled);
              }}
              id="mode-toggle"
            />
            <Label
              htmlFor="mode-toggle"
              className={`text-sm ${sentenceMode ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}
            >
              Sentence
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {currentWordIndex + 1} / {sessionWords.length}
            </div>
            <button
              onClick={refreshSession}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
              title="Get new words"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                <path d="M16 21h5v-5"/>
              </svg>
            </button>
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

      {/* Hardcore mode countdown timer */}
      {settings.hardcoreMode && wordTimeRemaining !== null && (
        <div className="flex justify-center mb-4">
          <div
            className={`
              px-4 py-2 rounded-lg font-mono text-lg
              ${wordTimeRemaining < 2
                ? 'bg-red-500/20 text-red-400 animate-pulse'
                : wordTimeRemaining < 4
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-gray-700/50 text-gray-300'
              }
            `}
          >
            {wordTimeRemaining.toFixed(1)}s
          </div>
        </div>
      )}

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
          onSubmit={handleSubmitWord}
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
