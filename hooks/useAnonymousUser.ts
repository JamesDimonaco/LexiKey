"use client";

import { useState, useEffect, useCallback } from 'react';
import { AnonymousUserData, StruggleWord } from '@/lib/types';

const STORAGE_KEY = 'lexikey-anonymous-user';
const DEFAULT_LEVEL = 5;

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
  const updateStats = useCallback((
    wordsCompleted: number,
    newLevel: number,
    struggleWordsToAdd: StruggleWord[]
  ) => {
    if (!anonymousUser) return;

    const today = new Date().toISOString().split('T')[0];

    // Merge struggle words (update existing or add new)
    const updatedStruggleWords = [...anonymousUser.struggleWords];
    for (const sw of struggleWordsToAdd) {
      const existingIndex = updatedStruggleWords.findIndex(w => w.word === sw.word);
      if (existingIndex >= 0) {
        updatedStruggleWords[existingIndex] = sw;
      } else {
        updatedStruggleWords.push(sw);
      }
    }

    // Remove graduated words (consecutiveCorrect >= 3)
    const filteredStruggleWords = updatedStruggleWords.filter(
      sw => sw.consecutiveCorrect < 3
    );

    const updated: AnonymousUserData = {
      ...anonymousUser,
      currentLevel: newLevel,
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

  return {
    anonymousUser,
    isLoading,
    updateStats,
    getDataForMigration,
    clearData,
  };
}
