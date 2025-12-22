"use client";

import { useEffect, useRef, useCallback } from 'react';

export function useTTS(voiceSpeed: number = 1.0, enabled: boolean = true) {
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const lastSpokenRef = useRef<string>("");
  const speakingRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    synthRef.current = window.speechSynthesis;

    // Select a good English voice
    const selectVoice = () => {
      const voices = synthRef.current?.getVoices() || [];
      // Prefer natural/enhanced voices, then any English voice
      const preferredVoice = voices.find(v =>
        v.lang.startsWith('en') && (v.name.includes('Enhanced') || v.name.includes('Natural') || v.name.includes('Samantha'))
      ) || voices.find(v =>
        v.lang.startsWith('en-US') || v.lang.startsWith('en-GB')
      ) || voices.find(v =>
        v.lang.startsWith('en')
      );

      if (preferredVoice) {
        voiceRef.current = preferredVoice;
      }
    };

    // Voices may load asynchronously
    selectVoice();
    if (synthRef.current) {
      synthRef.current.onvoiceschanged = selectVoice;
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.onvoiceschanged = null;
      }
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!enabled || !synthRef.current || !text) return;

    // Prevent speaking the same word multiple times in rapid succession
    if (speakingRef.current && lastSpokenRef.current === text) {
      return;
    }

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceSpeed;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Use the selected voice if available
    if (voiceRef.current) {
      utterance.voice = voiceRef.current;
    }

    utterance.onstart = () => {
      speakingRef.current = true;
      lastSpokenRef.current = text;
    };

    utterance.onend = () => {
      speakingRef.current = false;
    };

    utterance.onerror = () => {
      speakingRef.current = false;
    };

    synthRef.current.speak(utterance);
  }, [voiceSpeed, enabled]);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      speakingRef.current = false;
    }
  }, []);

  const speakWord = useCallback((word: string) => {
    speak(word);
  }, [speak]);

  const speakLetter = useCallback((letter: string) => {
    speak(letter);
  }, [speak]);

  const speakSentence = useCallback((sentence: string) => {
    speak(sentence);
  }, [speak]);

  return {
    speak,
    stop,
    speakWord,
    speakLetter,
    speakSentence,
  };
}
