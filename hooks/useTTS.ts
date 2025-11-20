"use client";

import { useEffect, useRef, useCallback } from 'react';

export function useTTS(voiceSpeed: number = 1.0, enabled: boolean = true) {
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!enabled || !synthRef.current) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceSpeed;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, [voiceSpeed, enabled]);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
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
