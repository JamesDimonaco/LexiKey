"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// Reveal timing configuration
const REVEAL_DURATIONS = [1000, 2000] as const; // 1st: 1s, 2nd: 2s, 3rd+: permanent
const TIMER_INTERVAL = 50; // Update every 50ms for smooth animation

export type RevealState = {
  isRevealed: boolean;
  isPermanent: boolean;
  progress: number; // 0-100, percentage of time remaining
  nextDuration: number | null; // null = permanent next time
  revealCount: number;
};

export function useReveal(onWordChange?: string) {
  const [revealCount, setRevealCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null); // null = hidden, -1 = permanent
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalDurationRef = useRef<number>(0);

  // Derived state
  const isRevealed = timeRemaining !== null;
  const isPermanent = timeRemaining === -1;

  // Calculate progress percentage
  const progress = (() => {
    if (timeRemaining === null) return 0;
    if (timeRemaining === -1) return 100;
    if (totalDurationRef.current === 0) return 0;
    return (timeRemaining / totalDurationRef.current) * 100;
  })();

  // Next duration hint (null = permanent)
  const nextDuration = revealCount >= REVEAL_DURATIONS.length ? null : REVEAL_DURATIONS[revealCount];

  // Clear timer helper
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Toggle reveal
  const toggle = useCallback(() => {
    if (isRevealed) {
      // Hide
      setTimeRemaining(null);
      clearTimer();
    } else {
      // Reveal
      const newCount = revealCount + 1;
      setRevealCount(newCount);

      if (newCount > REVEAL_DURATIONS.length) {
        // Permanent
        setTimeRemaining(-1);
      } else {
        // Timed
        const duration = REVEAL_DURATIONS[newCount - 1];
        totalDurationRef.current = duration;
        setTimeRemaining(duration);
      }
    }
  }, [isRevealed, revealCount, clearTimer]);

  // Reset for new word
  const reset = useCallback(() => {
    setRevealCount(0);
    setTimeRemaining(null);
    totalDurationRef.current = 0;
    clearTimer();
  }, [clearTimer]);

  // Timer countdown effect
  useEffect(() => {
    if (timeRemaining === null || timeRemaining === -1) {
      clearTimer();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev === -1) return prev;
        const newTime = prev - TIMER_INTERVAL;
        return newTime <= 0 ? null : newTime;
      });
    }, TIMER_INTERVAL);

    return clearTimer;
  }, [timeRemaining === null, timeRemaining === -1, clearTimer]);

  // Reset when word changes
  useEffect(() => {
    if (onWordChange !== undefined) {
      reset();
    }
  }, [onWordChange, reset]);

  return {
    // State
    isRevealed,
    isPermanent,
    progress,
    nextDuration,
    revealCount,
    // Actions
    toggle,
    reset,
  };
}
