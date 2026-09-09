"use client";

import { useEffect, useRef, useCallback } from 'react';
import { TTSVoice } from '@/lib/types';

/**
 * Words with no generated file. Module scope because a missing file is a fact
 * about the build, not about one component, and re-checking it would cost a
 * failed request on every play. Only ever written from a playback callback,
 * never during render.
 */
const missingAudio = new Set<string>();

/**
 * Speech for practice words.
 *
 * The word pool is a closed set, so every word is pre-rendered by
 * scripts/generate-tts.mts and served from public/audio. The browser's own
 * speech synthesis stays as the fallback for anything without a file —
 * sentences, and any word added to the pool since the last generation run.
 * It mangles words badly enough that inaudibleWordReports exists to track it,
 * so it is a safety net, not a co-equal path.
 */
export function useTTS(
  voiceSpeed: number = 1.0,
  enabled: boolean = true,
  voice: TTSVoice = "alice",
) {
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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

    const audio = audioRef.current;
    return () => {
      if (synthRef.current) {
        synthRef.current.onvoiceschanged = null;
        // Stop speech outliving the component — otherwise a word spoken in a
        // dictation session keeps playing over whatever screen comes next.
        synthRef.current.cancel();
      }
      audio?.pause();
      speakingRef.current = false;
    };
  }, []);

  const stop = useCallback(() => {
    synthRef.current?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    speakingRef.current = false;
  }, []);

  const speakViaSynth = useCallback((text: string) => {
    if (!synthRef.current) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceSpeed;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

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
  }, [voiceSpeed]);

  const speak = useCallback((text: string) => {
    if (!enabled || !text) return;

    // Prevent speaking the same word multiple times in rapid succession
    if (speakingRef.current && lastSpokenRef.current === text) {
      return;
    }

    stop();

    // Only single words are pre-rendered; sentences and anything carrying
    // punctuation have no file to look for.
    const word = text.toLowerCase();
    if (!/^[a-z]+$/.test(word) || missingAudio.has(word)) {
      speakViaSynth(text);
      return;
    }

    const audio = new Audio(`/audio/${voice}/${word}.mp3`);
    // Browsers preserve pitch across playbackRate, so a slowed word still
    // sounds like the word rather than a chipmunk.
    audio.playbackRate = voiceSpeed;
    audioRef.current = audio;
    speakingRef.current = true;
    lastSpokenRef.current = text;

    audio.onended = () => {
      speakingRef.current = false;
    };

    audio.play().catch((err: DOMException) => {
      speakingRef.current = false;
      // An autoplay block says nothing about whether the file exists. Caching
      // it as missing would lose the word for the rest of the session.
      if (err.name !== "NotAllowedError") {
        missingAudio.add(word);
      }
      speakViaSynth(text);
    });
  }, [enabled, voice, voiceSpeed, speakViaSynth, stop]);

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
