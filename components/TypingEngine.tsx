"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useTTS } from "@/hooks/useTTS";
import { TypingWord, WordResult, KeystrokeData } from "@/lib/types";

interface SavedProgress {
  currentWordIndex: number;
  sessionResults: WordResult[];
  words: TypingWord[];
}

interface TypingEngineProps {
  words: TypingWord[];
  onWordComplete: (result: WordResult) => void;
  onSessionComplete: (results: WordResult[]) => void;
  onQuit?: (progress: SavedProgress) => void;
  initialWordIndex?: number;
  initialResults?: WordResult[];
}

export function TypingEngine({
  words,
  onWordComplete,
  onSessionComplete,
  onQuit,
  initialWordIndex = 0,
  initialResults = [],
}: TypingEngineProps) {
  const { settings } = useAccessibility();
  const { speakWord, speakLetter } = useTTS(
    settings.voiceSpeed,
    settings.ttsEnabled,
  );

  const [currentWordIndex, setCurrentWordIndex] = useState(initialWordIndex);
  const [userInput, setUserInput] = useState("");
  const [keystrokeHistory, setKeystrokeHistory] = useState<KeystrokeData[]>([]);
  const [sessionResults, setSessionResults] =
    useState<WordResult[]>(initialResults);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [lastKeystrokeTime, setLastKeystrokeTime] = useState<number>(
    Date.now(),
  );
  const [backspaceCount, setBackspaceCount] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  const currentWord = words[currentWordIndex];
  const isSessionComplete = currentWordIndex >= words.length;

  // Auto-focus input on mount and word change
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentWordIndex]);

  // Start timer on first keystroke
  useEffect(() => {
    if (userInput.length > 0 && startTime === null) {
      setStartTime(Date.now());
    }
  }, [userInput, startTime]);

  // Speak the current word when it changes
  useEffect(() => {
    if (currentWord && !isSessionComplete) {
      speakWord(currentWord.word);
    }
  }, [currentWord, isSessionComplete, speakWord]);

  const getCharacterClass = (index: number): string => {
    if (index >= userInput.length) {
      return "text-gray-400"; // Not yet typed
    }
    const isCorrect = userInput[index] === currentWord.word[index];
    return isCorrect ? "text-green-600" : "text-red-600";
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const now = Date.now();
      const hesitationTime = now - lastKeystrokeTime;

      if (e.key === "Backspace") {
        setBackspaceCount((prev) => prev + 1);
      }

      // Track keystroke
      if (e.key.length === 1) {
        const char = e.key;
        const expectedChar = currentWord.word[userInput.length];
        const isCorrect = char === expectedChar;

        const keystroke: KeystrokeData = {
          char,
          isCorrect,
          timestamp: now,
          hesitationTime,
          backspaceUsed: false,
        };

        setKeystrokeHistory((prev) => [...prev, keystroke]);

        // Speak the letter if TTS is enabled
        if (settings.ttsEnabled) {
          speakLetter(char);
        }
      }

      setLastKeystrokeTime(now);
    },
    [
      currentWord,
      userInput,
      lastKeystrokeTime,
      settings.ttsEnabled,
      speakLetter,
    ],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserInput(value);

    // Check if word is complete
    if (value === currentWord.word) {
      completeWord(true);
    }
  };

  const completeWord = (isCorrect: boolean) => {
    const endTime = Date.now();
    // If user skipped without typing, timeSpent is 0
    const timeSpent = startTime ? (endTime - startTime) / 1000 : 0;

    // Check for hesitation (> 1.5s pause between keystrokes)
    const hesitated = keystrokeHistory.some((k) => k.hesitationTime > 1500);

    const result: WordResult = {
      wordId: currentWord.id,
      word: currentWord.word,
      isCorrect,
      timeSpent,
      keystrokeCount: keystrokeHistory.length,
      backspaceCount,
      hesitated,
      timestamp: endTime,
    };

    // Add to results
    setSessionResults((prev) => [...prev, result]);

    // Notify parent
    onWordComplete(result);

    // Move to next word
    setCurrentWordIndex((prev) => prev + 1);
    setUserInput("");
    setKeystrokeHistory([]);
    setStartTime(null);
    setBackspaceCount(0);
    setLastKeystrokeTime(Date.now());
  };

  // Trigger session complete callback when all words are done
  useEffect(() => {
    if (currentWordIndex >= words.length && sessionResults.length > 0) {
      onSessionComplete(sessionResults);
    }
  }, [currentWordIndex, words.length, sessionResults, onSessionComplete]);

  const skipWord = () => {
    completeWord(false);
  };

  const handleQuit = () => {
    if (onQuit) {
      onQuit({
        currentWordIndex,
        sessionResults,
        words,
      });
    }
  };

  if (isSessionComplete) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <h2 className="text-3xl font-bold">Session Complete!</h2>
        <p className="text-xl">You completed {sessionResults.length} words</p>
        <p className="text-lg">
          Accuracy:{" "}
          {Math.round(
            (sessionResults.filter((r) => r.isCorrect).length /
              sessionResults.length) *
              100,
          )}
          %
        </p>
      </div>
    );
  }

  if (!currentWord) {
    return <div>Loading...</div>;
  }

  // Calculate dynamic styles based on accessibility settings
  const fontFamily =
    settings.font === "opendyslexic"
      ? "OpenDyslexic, sans-serif"
      : settings.font === "arial"
        ? "Arial, sans-serif"
        : "Helvetica, Arial, sans-serif";

  const containerStyles: React.CSSProperties = {
    backgroundColor: settings.highContrast ? "#000000" : "#0A0A0A",
    color: settings.highContrast ? "#FFFFFF" : "#E5E5E5",
  };

  const textStyles: React.CSSProperties = {
    fontFamily,
    fontSize: `${settings.fontSize}px`,
    letterSpacing: `${settings.letterSpacing}px`,
  };

  const cursorStyles: React.CSSProperties = {
    caretColor: settings.largeCursor ? "transparent" : "auto",
  };

  if (settings.largeCursor) {
    cursorStyles.borderLeft = "4px solid #FFF";
  }

  if (settings.nonBlinkingCursor) {
    cursorStyles.animation = "none";
  }

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen p-8"
      style={containerStyles}
    >
      {/* Top left button */}
      <button
        onClick={handleQuit}
        className="absolute top-4 left-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
      >
        Quit Practice
      </button>

      <div className="max-w-4xl w-full flex flex-col gap-8">
        {/* Progress indicator */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">
            Word {currentWordIndex + 1} of {words.length}
          </span>
          {!settings.noTimerPressure && startTime && (
            <span className="text-sm font-medium">
              Time: {Math.floor((Date.now() - startTime) / 1000)}s
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${(currentWordIndex / words.length) * 100}%` }}
          />
        </div>

        {/* Context sentence (if available and hints enabled) */}
        {settings.showHints && currentWord.sentenceContext && (
          <div className="text-center text-gray-400 italic">
            &ldquo;{currentWord.sentenceContext}&rdquo;
          </div>
        )}

        {/* Target word display */}
        <div className="flex justify-center items-center gap-2 mb-4">
          {!settings.blindMode &&
            currentWord.word.split("").map((char, index) => (
              <span
                key={index}
                className={`font-mono font-bold transition-colors ${getCharacterClass(index)}`}
                style={{
                  ...textStyles,
                  fontSize: `${settings.fontSize * 1.5}px`,
                }}
              >
                {char}
              </span>
            ))}
          {settings.blindMode && (
            <span className="text-gray-500 text-2xl">
              Type the word you hear...
            </span>
          )}
        </div>

        {/* Input field */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="w-full text-center bg-gray-900 border-2 border-gray-700 text-white rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600"
            style={{
              ...textStyles,
              ...cursorStyles,
            }}
            placeholder="Type here..."
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => speakWord(currentWord.word)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔊 Repeat Word
          </button>
          <button
            onClick={skipWord}
            className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Phonics group indicator (if hints enabled) */}
        {settings.showHints && currentWord.phonicsGroup && (
          <div className="text-center text-sm text-gray-400">
            Phonics Pattern:{" "}
            <span className="font-semibold text-gray-300">
              {currentWord.phonicsGroup}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
