"use client";

import { useState, useEffect } from "react";
import { Word, WordResult } from "@/lib/types";
import { LetterState } from "./types";
import { RevealButton } from "./RevealButton";
import { RevealState } from "@/hooks/useReveal";

type SentenceModeViewProps = {
  words: Word[];
  currentWordIndex: number;
  userInput: string;
  letterStates: LetterState[];
  results: WordResult[];
  inputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  // Dictation mode props
  dictationMode?: boolean;
  reveal: RevealState & { toggle: () => void };
  onRepeat?: () => void;
  // Accessibility props
  blindMode?: boolean;
  showHints?: boolean;
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
  dictationMode = false,
  reveal,
  onRepeat,
  blindMode = false,
  showHints = false,
}: SentenceModeViewProps) {
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

      {/* Hint display - above the grid, hidden in dictation mode */}
      {showHints && !dictationMode && words[currentWordIndex]?.sentenceContext && (
        <div className="mb-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg italic">
            &ldquo;{words[currentWordIndex].sentenceContext}&rdquo;
          </p>
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
                relative text-2xl font-mono tracking-wider px-2 py-1 rounded transition-colors
                ${isCurrentWord ? "bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 underline decoration-blue-500 decoration-2 underline-offset-4" : ""}
                ${isCompleted && result?.correct ? "text-green-600 dark:text-green-400" : ""}
                ${isCompleted && !result?.correct ? "text-red-500 dark:text-red-400 line-through" : ""}
                ${!isCurrentWord && !isCompleted ? "text-gray-400 dark:text-gray-600" : ""}
                ${word.isStruggle && !isCompleted ? "border-b-2 border-orange-400 dark:border-orange-500" : ""}
              `}
            >
              {isCurrentWord ? (
                <CurrentWordDisplay
                  word={word}
                  userInput={userInput}
                  letterStates={letterStates}
                  blindMode={blindMode}
                  dictationMode={dictationMode}
                  wordRevealed={reveal.isRevealed}
                />
              ) : (
                // In dictation mode, hide upcoming words too
                dictationMode && !isCompleted ? (
                  <span className="text-gray-300 dark:text-gray-700">{"?".repeat(word.text.length)}</span>
                ) : (
                  word.text
                )
              )}
            </div>
          );
        })}
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
        disabled={dictationMode && reveal.isRevealed}
        className="sr-only"
        aria-label="Type the highlighted word"
      />

      {/* Instructions */}
      <p className="text-center text-sm text-gray-500 dark:text-gray-500">
        {dictationMode
          ? reveal.isRevealed
            ? "Hide the word to continue typing"
            : "Listen and type the word you hear • Press Space to advance"
          : "Type the highlighted word • Press Space to advance"
        }
      </p>
    </div>
  );
}

// Current word with live letter coloring
function CurrentWordDisplay({
  word,
  userInput,
  letterStates,
  blindMode = false,
  dictationMode = false,
  wordRevealed = false,
}: {
  word: Word;
  userInput: string;
  letterStates: LetterState[];
  blindMode?: boolean;
  dictationMode?: boolean;
  wordRevealed?: boolean;
}) {
  return (
    <span>
      {word.text.split("").map((char, charIdx) => {
        const state = letterStates[charIdx];
        const typedChar = userInput[charIdx];

        // Determine what character to display
        let displayChar = char;
        if (dictationMode && !wordRevealed) {
          // In dictation mode: show typed char or "?" for untyped
          displayChar = typedChar !== undefined ? typedChar : "?";
        } else if (blindMode && typedChar !== undefined) {
          displayChar = "•";
        }

        // Determine color
        let colorClass = "text-gray-400 dark:text-gray-600"; // Default for "?" untyped

        if (typedChar !== undefined) {
          if (blindMode || (dictationMode && !wordRevealed)) {
            // In blind mode or dictation mode (not revealed), show neutral color
            colorClass = "text-blue-500 dark:text-blue-400";
          } else if (dictationMode && wordRevealed) {
            // Revealed in dictation mode - still neutral while typing
            colorClass = "text-blue-500 dark:text-blue-400";
          } else if (typedChar.toLowerCase() === char.toLowerCase()) {
            colorClass = "text-green-600 dark:text-green-400";
          } else {
            colorClass = "text-red-500 dark:text-red-400";
          }
        } else if (!dictationMode || wordRevealed) {
          // Untyped characters in normal mode or revealed dictation
          colorClass = "text-gray-800 dark:text-gray-200";
        }

        // Show correction indicator (was wrong but now fixed) - hide in blind/dictation mode
        const showCorrectionDot =
          !blindMode &&
          !dictationMode &&
          state?.wasEverWrong &&
          typedChar?.toLowerCase() === char.toLowerCase();

        return (
          <span key={charIdx} className={`relative ${colorClass}`}>
            {displayChar}
            {showCorrectionDot && (
              <span className="absolute -top-1 -right-0.5 w-1.5 h-1.5 bg-yellow-500 rounded-full" />
            )}
          </span>
        );
      })}
      {/* Overflow characters - show extra typed characters beyond word length */}
      {userInput.length > word.text.length && !blindMode && (
        <>
          {userInput.slice(word.text.length).split("").map((char, idx) => (
            <span
              key={`overflow-${idx}`}
              className="text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded px-0.5 animate-pulse"
            >
              {char}
            </span>
          ))}
        </>
      )}
    </span>
  );
}
