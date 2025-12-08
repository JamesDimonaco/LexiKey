"use client";

import { Word } from "@/lib/types";
import { LetterState } from "./types";

type SingleWordViewProps = {
  currentWord: Word;
  userInput: string;
  letterStates: LetterState[];
  showFeedback: "correct" | "incorrect" | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
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
}: SingleWordViewProps) {
  return (
    <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
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
        <div className="text-6xl font-bold text-center tracking-wider font-mono">
          {currentWord.text.split("").map((char, charIdx) => {
            const typedChar = userInput[charIdx];

            let colorClass = "text-gray-800 dark:text-gray-200";

            if (typedChar !== undefined) {
              if (typedChar.toLowerCase() === char.toLowerCase()) {
                colorClass = "text-green-600 dark:text-green-400";
              } else {
                colorClass = "text-red-500 dark:text-red-400";
              }
            }

            const state = letterStates[charIdx];
            const showCorrectionDot =
              state?.wasEverWrong &&
              typedChar?.toLowerCase() === char.toLowerCase();

            return (
              <span key={charIdx} className={`relative ${colorClass}`}>
                {char}
                {showCorrectionDot && (
                  <span className="absolute -top-2 -right-1 w-2 h-2 bg-yellow-500 rounded-full" />
                )}
              </span>
            );
          })}
        </div>

        {currentWord.sentenceContext && (
          <p className="text-center text-gray-600 dark:text-gray-400 mt-4 text-lg">
            &ldquo;{currentWord.sentenceContext}&rdquo;
          </p>
        )}
      </div>

      {/* Input */}
      <div className="mb-6">
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          placeholder="Type the word here..."
          autoFocus
          className="w-full px-6 py-4 text-2xl text-center border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        />
        <p className="text-center text-sm text-gray-500 dark:text-gray-500 mt-2">
          Press Space or Enter to continue
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
