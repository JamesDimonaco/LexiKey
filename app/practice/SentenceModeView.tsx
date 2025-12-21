"use client";

import { useState } from "react";
import { Word, WordResult } from "@/lib/types";
import { LetterState } from "./types";

type SentenceModeViewProps = {
  words: Word[];
  currentWordIndex: number;
  userInput: string;
  letterStates: LetterState[];
  results: WordResult[];
  inputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

export function SentenceModeView({
  words,
  currentWordIndex,
  userInput,
  letterStates,
  results,
  inputRef,
  onInputChange,
  onKeyDown,
}: SentenceModeViewProps) {
  const [isFocused, setIsFocused] = useState(true);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  const handleContainerClick = () => inputRef.current?.focus();

  return (
    <div
      className={`
        relative bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md border transition-all cursor-text
        ${isFocused
          ? "border-gray-200 dark:border-gray-800"
          : "border-gray-300 dark:border-gray-700"
        }
      `}
      onClick={handleContainerClick}
    >
      {/* Unfocused overlay */}
      {!isFocused && (
        <div className="absolute inset-0 bg-gray-500/10 dark:bg-gray-900/50 rounded-lg flex items-center justify-center z-10">
          <div className="bg-white dark:bg-gray-800 px-6 py-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              Click to continue typing
            </p>
          </div>
        </div>
      )}

      {/* All words display */}
      <div className="flex flex-wrap gap-x-4 gap-y-3 mb-8 justify-center">
        {words.map((word, wordIdx) => {
          const isCurrentWord = wordIdx === currentWordIndex;
          const isCompleted = wordIdx < currentWordIndex;
          const result = results[wordIdx];

          return (
            <div
              key={word.id}
              className={`
                text-2xl font-mono tracking-wider px-2 py-1 rounded transition-colors
                ${isCurrentWord ? "bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 underline decoration-blue-500 decoration-2 underline-offset-4" : ""}
                ${isCompleted && result?.correct ? "text-green-600 dark:text-green-400" : ""}
                ${isCompleted && !result?.correct ? "text-red-500 dark:text-red-400 line-through" : ""}
                ${!isCurrentWord && !isCompleted ? "text-gray-400 dark:text-gray-600" : ""}
              `}
            >
              {isCurrentWord ? (
                <CurrentWordDisplay
                  word={word}
                  userInput={userInput}
                  letterStates={letterStates}
                />
              ) : (
                word.text
              )}
            </div>
          );
        })}
      </div>

      {/* Hidden input for capturing keystrokes */}
      <input
        ref={inputRef}
        type="text"
        value={userInput}
        onChange={onInputChange}
        onKeyDown={onKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoFocus
        className="sr-only"
        aria-label="Type the highlighted word"
      />

      {/* Instructions */}
      <p className="text-center text-sm text-gray-500 dark:text-gray-500">
        Type the highlighted word • Press Space to advance
      </p>
    </div>
  );
}

// Current word with live letter coloring
function CurrentWordDisplay({
  word,
  userInput,
  letterStates,
}: {
  word: Word;
  userInput: string;
  letterStates: LetterState[];
}) {
  return (
    <span>
      {word.text.split("").map((char, charIdx) => {
        const state = letterStates[charIdx];
        const typedChar = userInput[charIdx];

        let colorClass = "text-gray-800 dark:text-gray-200"; // Not yet typed

        if (typedChar !== undefined) {
          if (typedChar.toLowerCase() === char.toLowerCase()) {
            colorClass = "text-green-600 dark:text-green-400";
          } else {
            colorClass = "text-red-500 dark:text-red-400";
          }
        }

        // Show correction indicator (was wrong but now fixed)
        const showCorrectionDot =
          state?.wasEverWrong &&
          typedChar?.toLowerCase() === char.toLowerCase();

        return (
          <span key={charIdx} className={`relative ${colorClass}`}>
            {char}
            {showCorrectionDot && (
              <span className="absolute -top-1 -right-0.5 w-1.5 h-1.5 bg-yellow-500 rounded-full" />
            )}
          </span>
        );
      })}
    </span>
  );
}
