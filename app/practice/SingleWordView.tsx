"use client";

import { useState, useEffect, useRef } from "react";
import { Word } from "@/lib/types";
import { LetterState } from "./types";
import { RevealButton } from "./RevealButton";
import { RevealState } from "@/hooks/useReveal";

type SingleWordViewProps = {
  currentWord: Word;
  userInput: string;
  letterStates: LetterState[];
  showFeedback: "correct" | "incorrect" | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  // Accessibility props
  blindMode?: boolean;
  showHints?: boolean;
  // Dictation mode props
  dictationMode?: boolean;
  reveal: RevealState & { toggle: () => void };
  onRepeat?: () => void;
};

export function SingleWordView({
  currentWord,
  userInput,
  letterStates,
  showFeedback,
  inputRef,
  onInputChange,
  onKeyDown,
  blindMode = false,
  showHints = false,
  dictationMode = false,
  reveal,
  onRepeat,
}: SingleWordViewProps) {
  const [isFocused, setIsFocused] = useState(true);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  const handleContainerClick = () => inputRef.current?.focus();

  // Focus input when word becomes hidden (after reveal toggle)
  useEffect(() => {
    if (dictationMode && !reveal.isRevealed) {
      inputRef.current?.focus();
    }
  }, [dictationMode, reveal.isRevealed]);

  // The word is deliberately hidden in dictation mode, so colour alone tells
  // a screen-reader user nothing — announce only word-level outcomes
  // (correct/incorrect, moving on), never per-letter, or every keystroke
  // would talk over itself. Written straight to the live-region node rather
  // than through React state: it's synchronizing with the screen reader
  // (an external system), not deriving anything the render needs.
  const announcementRef = useRef<HTMLSpanElement>(null);
  const prevFeedbackRef = useRef(showFeedback);
  useEffect(() => {
    const prevFeedback = prevFeedbackRef.current;
    if (showFeedback !== prevFeedback) {
      if (announcementRef.current) {
        if (showFeedback === "correct") {
          announcementRef.current.textContent = "Correct. Next word.";
        } else if (showFeedback === "incorrect") {
          announcementRef.current.textContent =
            "Not quite. Press space to move on.";
        }
      }
      prevFeedbackRef.current = showFeedback;
    }
  }, [showFeedback]);

  return (
    <div
      className={`
        relative bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md dark:shadow-none border transition-all
        ${isFocused
          ? "border-gray-200 dark:border-gray-800"
          : "border-gray-300 dark:border-gray-700"
        }
      `}
      onClick={handleContainerClick}
      data-tour="typing-area"
    >
      <span
        ref={announcementRef}
        role="status"
        aria-live="polite"
        className="sr-only"
      />

      {/* Unfocused overlay — suppressed while the word is revealed in
          dictation mode (the input is disabled then, and the user is reading) */}
      {!isFocused && !(dictationMode && reveal.isRevealed) && (
        <div className="absolute inset-0 bg-gray-500/10 dark:bg-gray-900/50 rounded-lg flex items-center justify-center z-10 cursor-pointer">
          <div className="bg-white dark:bg-gray-800 px-6 py-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              Click to continue typing
            </p>
          </div>
        </div>
      )}

      {dictationMode && (
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          Listen, then type what you hear
        </p>
      )}

      {/* Word Display with live letter coloring */}
      <div
        className={`
          mb-8 p-8 rounded-lg border-2 relative transition-all duration-150
          ${showFeedback === "correct" ? "bg-green-50 dark:bg-green-900/20 border-green-500" : ""}
          ${showFeedback === "incorrect" ? "bg-red-50 dark:bg-red-900/20 border-red-500" : ""}
          ${!showFeedback ? "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700" : ""}
        `}
      >
        {/* Struggle word indicator */}
        {currentWord.isStruggle && (
          <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            <span>Review</span>
          </div>
        )}
        <div className="text-6xl font-bold text-center tracking-wider font-mono">
          {currentWord.text.split("").map((char, charIdx) => {
            const typedChar = userInput[charIdx];
            const state = letterStates[charIdx];

            // Determine what character to display
            let displayChar = char;
            if (dictationMode && !reveal.isRevealed) {
              // In dictation mode: show typed char or "?" for untyped
              displayChar = typedChar !== undefined ? typedChar : "?";
            } else if (blindMode && typedChar !== undefined) {
              displayChar = "•";
            }

            // Determine color
            let colorClass = "text-gray-600 dark:text-gray-400"; // Default for "?" untyped

            // Correct/incorrect is otherwise colour-only (WCAG 1.4.1) — pair it
            // with an underline style so it reads without colour perception.
            // Not shown in blind/dictation mode: those colour every typed
            // letter neutral blue on purpose (nothing to reveal), so there's
            // no correct/incorrect signal there to back up.
            let underlineClass = "";

            if (typedChar !== undefined) {
              if (blindMode || (dictationMode && !reveal.isRevealed)) {
                // In blind mode or dictation mode (not revealed), show neutral color
                colorClass = "text-blue-500 dark:text-blue-400";
              } else if (dictationMode && reveal.isRevealed) {
                // Revealed in dictation mode - still neutral while typing
                colorClass = "text-blue-500 dark:text-blue-400";
              } else if (typedChar.toLowerCase() === char.toLowerCase()) {
                colorClass = "text-green-600 dark:text-green-400";
                underlineClass = "underline decoration-2 underline-offset-4";
              } else {
                colorClass = "text-red-500 dark:text-red-400";
                underlineClass =
                  "underline decoration-2 underline-offset-4 decoration-dotted";
              }
            } else if (!dictationMode || reveal.isRevealed) {
              // Untyped characters in normal mode or revealed dictation
              colorClass = "text-gray-800 dark:text-gray-200";
            }

            const showCorrectionDot =
              !blindMode &&
              !dictationMode &&
              state?.wasEverWrong &&
              typedChar?.toLowerCase() === char.toLowerCase();

            const showCaret =
              charIdx === userInput.length && isFocused && !showFeedback;

            return (
              <span
                key={charIdx}
                className={`relative ${colorClass} ${underlineClass}`}
              >
                {displayChar}
                {showCorrectionDot && (
                  <span className="absolute -top-2 -right-1 w-2 h-2 bg-yellow-500 rounded-full" />
                )}
                {showCaret && (
                  <span
                    className="absolute left-0 right-0 -bottom-1 h-1 bg-blue-500 rounded-full animate-pulse motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                )}
              </span>
            );
          })}
          {/* Overflow characters - show extra typed characters beyond word length */}
          {userInput.length > currentWord.text.length && !blindMode && (
            <span className="relative">
              {userInput.slice(currentWord.text.length).split("").map((char, idx) => (
                <span
                  key={`overflow-${idx}`}
                  className="text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded px-0.5 underline decoration-2 underline-offset-4 decoration-dotted animate-pulse motion-reduce:animate-none"
                >
                  {char}
                </span>
              ))}
            </span>
          )}
        </div>

        {/* Hint - hidden in dictation mode */}
        {showHints && !dictationMode && currentWord.sentenceContext && (
          <p className="text-center text-gray-600 dark:text-gray-400 mt-4 text-lg">
            &ldquo;{currentWord.sentenceContext}&rdquo;
          </p>
        )}
      </div>

      {/* Dictation mode controls */}
      {dictationMode && (
        <div className="flex justify-center gap-3 mb-6 relative z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRepeat?.();
              inputRef.current?.focus();
            }}
            className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium"
          >
            Repeat
          </button>
          <RevealButton
            isRevealed={reveal.isRevealed}
            isPermanent={reveal.isPermanent}
            progress={reveal.progress}
            nextDuration={reveal.nextDuration}
            onToggle={() => {
              reveal.toggle();
              inputRef.current?.focus();
            }}
          />
        </div>
      )}

      {/* Hidden input captures the typing — the word display above IS the
          typing surface */}
      <input
        ref={inputRef}
        type="text"
        value={userInput}
        onChange={onInputChange}
        onKeyDown={onKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoFocus
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        disabled={dictationMode && reveal.isRevealed}
        aria-label={
          dictationMode ? "Type the word you hear" : "Type the word shown above"
        }
        className="absolute inset-0 w-full h-full opacity-0 cursor-text"
      />

      <p className="text-center text-sm text-gray-500 dark:text-gray-500">
        {dictationMode && reveal.isRevealed
          ? "Hide the word to continue typing"
          : userInput.length >= currentWord.text.length &&
              userInput.toLowerCase() !== currentWord.text.toLowerCase()
            ? "Press Space to move on"
            : "Words move on automatically when you get them right"}
      </p>
    </div>
  );
}
