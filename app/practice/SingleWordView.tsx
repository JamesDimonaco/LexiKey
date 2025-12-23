"use client";

import { useState, useEffect } from "react";
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
  onSubmit: () => void;
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
  onSubmit,
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

  return (
    <div
      className={`
        relative bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md border transition-all
        ${isFocused
          ? "border-gray-200 dark:border-gray-800"
          : "border-gray-300 dark:border-gray-700"
        }
      `}
      onClick={handleContainerClick}
    >
      {/* Unfocused overlay */}
      {!isFocused && (
        <div className="absolute inset-0 bg-gray-500/10 dark:bg-gray-900/50 rounded-lg flex items-center justify-center z-10 cursor-pointer">
          <div className="bg-white dark:bg-gray-800 px-6 py-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              Click to continue typing
            </p>
          </div>
        </div>
      )}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2 text-black dark:text-white">
          Practice Session
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Type the word you see below
        </p>
      </div>

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
            let colorClass = "text-gray-400 dark:text-gray-600"; // Default for "?" untyped

            if (typedChar !== undefined) {
              if (blindMode || (dictationMode && !reveal.isRevealed)) {
                // In blind mode or dictation mode (not revealed), show neutral color
                colorClass = "text-blue-500 dark:text-blue-400";
              } else if (dictationMode && reveal.isRevealed) {
                // Revealed in dictation mode - still neutral while typing
                colorClass = "text-blue-500 dark:text-blue-400";
              } else if (typedChar.toLowerCase() === char.toLowerCase()) {
                colorClass = "text-green-600 dark:text-green-400";
              } else {
                colorClass = "text-red-500 dark:text-red-400";
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

            return (
              <span key={charIdx} className={`relative ${colorClass}`}>
                {displayChar}
                {showCorrectionDot && (
                  <span className="absolute -top-2 -right-1 w-2 h-2 bg-yellow-500 rounded-full" />
                )}
              </span>
            );
          })}
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

      {/* Input */}
      <div className="mb-6">
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={dictationMode ? "Type what you hear..." : "Type the word here..."}
          autoFocus
          disabled={dictationMode && reveal.isRevealed}
          className={`w-full px-6 py-4 text-2xl text-center border-2 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${
            dictationMode && reveal.isRevealed
              ? "border-gray-200 dark:border-gray-800 opacity-50 cursor-not-allowed"
              : "border-gray-300 dark:border-gray-700"
          }`}
        />
        <p className="text-center text-sm text-gray-500 dark:text-gray-500 mt-2">
          {dictationMode
            ? reveal.isRevealed
              ? "Hide the word to continue typing"
              : "Listen and type • Press Space or Enter to continue"
            : "Press Space or Enter to continue"
          }
        </p>
      </div>

      <button
        onClick={onSubmit}
        disabled={userInput.length === 0}
        className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        Next Word
      </button>
    </div>
  );
}
