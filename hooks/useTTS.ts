"use client";

import { useEffect, useRef, useCallback } from 'react';
import { TTSVoice } from '@/lib/types';

/**
 * "<voice>/<word>" for files that are genuinely absent. Module scope because a
 * missing file is a fact about the build, not about one component, and
 * re-checking it would cost a failed request on every play. Keyed by voice
 * because generation continues past per-word failures, so the two voices can
 * hold different words. Only ever written from a playback callback, never
 * during render.
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

    return () => {
      if (synthRef.current) {
        synthRef.current.onvoiceschanged = null;
        // Stop speech outliving the component — otherwise a word spoken in a
        // dictation session keeps playing over whatever screen comes next.
        synthRef.current.cancel();
      }
      // Read through the ref, not a value captured at mount — this effect runs
      // once, when audioRef.current is still null.
      audioRef.current?.pause();
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

    // AdaptiveEngine appends "." "," "!" "?" to a share of words and
    // capitalises others, so the text on screen is "Cat." where the file is
    // "cat.mp3". Punctuation is inaudible in a single word either way.
    const word = text.toLowerCase().replace(/[.,!?]+$/, "");
    const key = `${voice}/${word}`;
    if (!/^[a-z]+$/.test(word) || missingAudio.has(key)) {
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

    // play() can resolve and the media fail afterwards. Without this the
    // dedupe guard above sees a word still "speaking" and makes Repeat — the
    // only recovery a learner has in dictation — a silent no-op.
    audio.onerror = () => {
      speakingRef.current = false;
    };

    audio.play().catch((err: DOMException) => {
      speakingRef.current = false;
      // Only cache a file the browser actually looked for and did not find.
      // An autoplay block, or a dropped connection on school wifi, says
      // nothing about whether the file exists — caching either would serve the
      // mangled synth voice for the rest of the session.
      const absent =
        audio.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED &&
        navigator.onLine !== false;
      if (err.name !== "NotAllowedError" && absent) {
        missingAudio.add(key);
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
