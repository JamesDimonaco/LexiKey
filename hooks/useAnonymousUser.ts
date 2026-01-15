"use client";

import { useState, useEffect, useCallback } from 'react';
import { AnonymousUserData, StruggleWord } from '@/lib/types';
import { ThresholdParams } from '@/lib/thresholdCalculator';

const STORAGE_KEY = 'lexikey-anonymous-user';
const DEFAULT_LEVEL = 5;

// Word result for processing struggle words
interface WordResultForBucket {
  word: string;
  phonicsGroup: string;
  wasStruggle: boolean;
}

// Generate a unique device ID
function generateDeviceId(): string {
  return 'anon_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// Create default anonymous user data
function createDefaultAnonymousUser(): AnonymousUserData {
  return {
    deviceId: generateDeviceId(),
    currentLevel: DEFAULT_LEVEL,
    totalWords: 0,
    totalSessions: 0,
    struggleWords: [],
    lastPracticeDate: null,
    createdAt: new Date().toISOString(),
  };
}

export function useAnonymousUser() {
  const [anonymousUser, setAnonymousUser] = useState<AnonymousUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load anonymous user data from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setAnonymousUser(parsed);
        } else {
          // Create new anonymous user
          const newUser = createDefaultAnonymousUser();
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
          setAnonymousUser(newUser);
        }
      } catch (e) {
        console.error('Failed to load anonymous user data:', e);
        // Create new anonymous user on error
        const newUser = createDefaultAnonymousUser();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        setAnonymousUser(newUser);
      }
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Save to localStorage whenever data changes
  const saveData = useCallback((data: AnonymousUserData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setAnonymousUser(data);
    } catch (e) {
      console.error('Failed to save anonymous user data:', e);
    }
  }, []);

  // Update anonymous user stats after a session
  // Now accepts ALL word results (not just struggled ones) to properly track graduation
  const updateStats = useCallback((
    wordsCompleted: number,
    newLevel: number,
    wordResults: WordResultForBucket[]
  ) => {
    if (!anonymousUser) return;

    const today = new Date().toISOString().split('T')[0];

    // Process all word results (same logic as Convex batchProcessWordResults)
    const updatedStruggleWords = [...anonymousUser.struggleWords];

    for (const result of wordResults) {
      const existingIndex = updatedStruggleWords.findIndex(w => w.word === result.word);

      if (result.wasStruggle) {
        // User struggled with this word
        if (existingIndex >= 0) {
          // Reset consecutive counter
          updatedStruggleWords[existingIndex] = {
            ...updatedStruggleWords[existingIndex],
            consecutiveCorrect: 0,
          };
        } else {
          // Add new struggle word
          updatedStruggleWords.push({
            word: result.word,
            phonicsGroup: result.phonicsGroup,
            consecutiveCorrect: 0,
          });
        }
      } else {
        // User got it correct (no struggle)
        if (existingIndex >= 0) {
          // Increment consecutive correct
          const newConsecutive = updatedStruggleWords[existingIndex].consecutiveCorrect + 1;
          updatedStruggleWords[existingIndex] = {
            ...updatedStruggleWords[existingIndex],
            consecutiveCorrect: newConsecutive,
          };
        }
        // If word not in bucket and user got it correct, do nothing
      }
    }

    // Remove graduated words (consecutiveCorrect >= 3)
    const filteredStruggleWords = updatedStruggleWords.filter(
      sw => sw.consecutiveCorrect < 3
    );

    const updated: AnonymousUserData = {
      ...anonymousUser,
      currentLevel: Math.round(newLevel * 100) / 100, // Round to 2 decimal places
      totalWords: anonymousUser.totalWords + wordsCompleted,
      totalSessions: anonymousUser.totalSessions + 1,
      struggleWords: filteredStruggleWords,
      lastPracticeDate: today,
    };

    saveData(updated);
  }, [anonymousUser, saveData]);

  // Get data for migration to authenticated account
  const getDataForMigration = useCallback(() => {
    return anonymousUser;
  }, [anonymousUser]);

  // Clear anonymous data (after successful migration)
  const clearData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAnonymousUser(null);
  }, []);

  // Set threshold params (initial calibration from placement test)
  const setThresholdParams = useCallback((params: ThresholdParams) => {
    if (!anonymousUser) return;

    const updated: AnonymousUserData = {
      ...anonymousUser,
      thresholdParams: params,
    };

    saveData(updated);
  }, [anonymousUser, saveData]);

  // Update threshold params (gradual adjustment from practice session)
  const updateThreshold = useCallback((params: ThresholdParams) => {
    if (!anonymousUser) return;

    const updated: AnonymousUserData = {
      ...anonymousUser,
      thresholdParams: params,
    };

    saveData(updated);
  }, [anonymousUser, saveData]);

  return {
    anonymousUser,
    isLoading,
    updateStats,
    getDataForMigration,
    clearData,
    setThresholdParams,
    updateThreshold,
  };
}
