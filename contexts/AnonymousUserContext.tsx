"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AnonymousUserData } from '@/lib/types';
import { ThresholdParams } from '@/lib/thresholdCalculator';

const STORAGE_KEY = 'lexikey-anonymous-user';
const DEFAULT_LEVEL = 5;

// Word result for processing struggle words
interface WordResultForBucket {
  word: string;
  phonicsGroup: string;
  wasStruggle: boolean;
}

interface AnonymousUserContextType {
  anonymousUser: AnonymousUserData | null;
  isLoading: boolean;
  updateStats: (wordsCompleted: number, newLevel: number, wordResults: WordResultForBucket[]) => void;
  getDataForMigration: () => AnonymousUserData | null;
  clearData: () => void;
  setThresholdParams: (params: ThresholdParams) => void;
  updateThreshold: (params: ThresholdParams) => void;
}

const AnonymousUserContext = createContext<AnonymousUserContextType | null>(null);

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

export function AnonymousUserProvider({ children }: { children: ReactNode }) {
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

  // Save to localStorage and update state
  const saveData = useCallback((data: AnonymousUserData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setAnonymousUser(data);
    } catch (e) {
      console.error('[saveData] Failed to save anonymous user data:', e);
    }
  }, []);

  // Update anonymous user stats after a session
  const updateStats = useCallback((
    wordsCompleted: number,
    newLevel: number,
    wordResults: WordResultForBucket[]
  ) => {
    // ALWAYS read fresh from localStorage to avoid race conditions
    let currentUser: AnonymousUserData | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        currentUser = JSON.parse(saved);
      }
    } catch (e) {
      console.error("[updateStats] Failed to read from localStorage:", e);
    }
    if (!currentUser) return;

    const today = new Date().toISOString().split('T')[0];

    // Process all word results (same logic as Convex batchProcessWordResults)
    const updatedStruggleWords = [...currentUser.struggleWords];

    for (const result of wordResults) {
      const existingIndex = updatedStruggleWords.findIndex(w => w.word === result.word);

      if (result.wasStruggle) {
        if (existingIndex >= 0) {
          updatedStruggleWords[existingIndex] = {
            ...updatedStruggleWords[existingIndex],
            consecutiveCorrect: 0,
          };
        } else {
          updatedStruggleWords.push({
            word: result.word,
            phonicsGroup: result.phonicsGroup,
            consecutiveCorrect: 0,
          });
        }
      } else {
        if (existingIndex >= 0) {
          const newConsecutive = updatedStruggleWords[existingIndex].consecutiveCorrect + 1;
          updatedStruggleWords[existingIndex] = {
            ...updatedStruggleWords[existingIndex],
            consecutiveCorrect: newConsecutive,
          };
        }
      }
    }

    // Remove graduated words (consecutiveCorrect >= 3)
    const filteredStruggleWords = updatedStruggleWords.filter(
      sw => sw.consecutiveCorrect < 3
    );

    const updated: AnonymousUserData = {
      ...currentUser,
      currentLevel: Math.round(newLevel * 100) / 100,
      totalWords: currentUser.totalWords + wordsCompleted,
      totalSessions: currentUser.totalSessions + 1,
      struggleWords: filteredStruggleWords,
      lastPracticeDate: today,
    };

    saveData(updated);
  }, [saveData]);

  // Get data for migration to authenticated account
  const getDataForMigration = useCallback(() => {
    // Read fresh from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("[getDataForMigration] Failed to read localStorage:", e);
    }
    return anonymousUser;
  }, [anonymousUser]);

  // Clear anonymous data (after successful migration)
  const clearData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAnonymousUser(null);
  }, []);

  // Set threshold params (initial calibration from placement test)
  const setThresholdParams = useCallback((params: ThresholdParams) => {
    let currentUser: AnonymousUserData | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) currentUser = JSON.parse(saved);
    } catch (e) {
      console.error("[setThresholdParams] Failed to read localStorage:", e);
    }
    if (!currentUser) return;

    const updated: AnonymousUserData = {
      ...currentUser,
      thresholdParams: params,
    };

    saveData(updated);
  }, [saveData]);

  // Update threshold params (gradual adjustment from practice session)
  const updateThreshold = useCallback((params: ThresholdParams) => {
    let currentUser: AnonymousUserData | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) currentUser = JSON.parse(saved);
    } catch (e) {
      console.error("[updateThreshold] Failed to read localStorage:", e);
    }
    if (!currentUser) return;

    const updated: AnonymousUserData = {
      ...currentUser,
      thresholdParams: params,
    };

    saveData(updated);
  }, [saveData]);

  return (
    <AnonymousUserContext.Provider value={{
      anonymousUser,
      isLoading,
      updateStats,
      getDataForMigration,
      clearData,
      setThresholdParams,
      updateThreshold,
    }}>
      {children}
    </AnonymousUserContext.Provider>
  );
}

export function useAnonymousUser() {
  const context = useContext(AnonymousUserContext);
  if (!context) {
    throw new Error('useAnonymousUser must be used within an AnonymousUserProvider');
  }
  return context;
}
