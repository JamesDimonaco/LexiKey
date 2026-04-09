"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AccessibilitySettings } from '@/lib/types';

const DEFAULT_SETTINGS: AccessibilitySettings = {
  // Practice
  sessionWordCount: 20,
  capitalFrequency: 'never',
  punctuationFrequency: 'never',
  // Session mix
  strugglePercent: 30,
  newPercent: 50,
  confidencePercent: 20,
  startingBoosters: 2,
  // Font
  font: 'helvetica',
  fontSize: 24,
  letterSpacing: 2,
  // Cursor
  largeCursor: false,
  // Contrast
  highContrast: false,
  // TTS
  ttsEnabled: true,
  voiceSpeed: 1.0,
  dictationMode: false,
  // UI
  showHints: false,
  showTimerPressure: false, // Changed from noTimerPressure
  blindMode: false,
  showTypingSpeed: true,
  // Challenge mode
  hardcoreMode: false,
};

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (updates: Partial<AccessibilitySettings>) => void;
  resetSettings: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount (merge with defaults for new settings)
  useEffect(() => {
    const saved = localStorage.getItem('lexikey-accessibility');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with defaults so new settings get default values
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        console.error('Failed to load accessibility settings:', e);
      }
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('lexikey-accessibility', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <AccessibilityContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}
