"use client";

import { useState } from "react";
import Link from "next/link";
import { Volume2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { PracticeFocus, SessionConfig } from "@/lib/types";
import {
  PHONICS_PATTERNS,
  getPattern,
  patternWordCount,
} from "@/lib/phonicsPatterns";
import { trackEvent } from "@/hooks/usePostHog";

const SESSION_CONFIG_KEY = "lexikey-session-config";

const LENGTH_OPTIONS = [
  { words: 10, label: "Quick" },
  { words: 20, label: "Standard" },
  { words: 30, label: "Long" },
] as const;

/** Load the last-used session config (falls back to a sensible default) */
function loadLastConfig(): SessionConfig {
  const fallback: SessionConfig = {
    focus: { type: "recommended" },
    flow: "sentence",
  };
  if (typeof window === "undefined") return fallback;
  try {
    const saved = localStorage.getItem(SESSION_CONFIG_KEY);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved) as SessionConfig;
    // Validate: pattern must still exist, flow must be known
    if (parsed.focus?.type === "pattern" && !getPattern(parsed.focus.patternId))
      return fallback;
    if (!["recommended", "review", "pattern"].includes(parsed.focus?.type))
      return fallback;
    if (!["word", "sentence"].includes(parsed.flow)) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

function saveLastConfig(config: SessionConfig) {
  try {
    localStorage.setItem(SESSION_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // Storage full/blocked — losing the preference is fine
  }
}

type SessionSetupProps = {
  /** Words currently waiting in the user's review bucket */
  struggleWordCount: number;
  onStart: (config: SessionConfig) => void;
};

export function SessionSetup({ struggleWordCount, onStart }: SessionSetupProps) {
  const { settings, updateSettings } = useAccessibility();
  const [config, setConfig] = useState<SessionConfig>(() => {
    const last = loadLastConfig();
    // "Review" with an empty bucket would generate a generic session — start
    // people on the recommended mix instead.
    if (last.focus.type === "review" && struggleWordCount === 0) {
      return { ...last, focus: { type: "recommended" } };
    }
    return last;
  });

  const setFocus = (focus: PracticeFocus) =>
    setConfig((prev) => ({ ...prev, focus }));

  const handleStart = () => {
    saveLastConfig(config);
    trackEvent("practice_setup_started", {
      focus: config.focus.type,
      focusPattern:
        config.focus.type === "pattern" ? config.focus.patternId : null,
      flow: config.flow,
      wordCount: settings.sessionWordCount,
      dictationMode: settings.dictationMode,
      blindMode: settings.blindMode,
    });
    onStart(config);
  };

  const selectedPatternId =
    config.focus.type === "pattern" ? config.focus.patternId : null;

  return (
    <div className="w-full max-w-2xl mx-auto animate-in fade-in duration-300 motion-reduce:animate-none">
      {/* Framing: dyslexia-first, but for everyone */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
          Set up your practice
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
          Built for dyslexic learners — and for anyone who keeps mistyping the
          same words. Type them until your fingers remember.
        </p>
      </div>

      <div className="space-y-4">
        {/* ── Focus ───────────────────────────────────────────── */}
        <fieldset
          className="bg-white dark:bg-gray-900 p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none"
          data-tour="focus-picker"
        >
          <legend className="sr-only">What to practice</legend>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            What to practice
          </h2>
          <div className="space-y-2">
            <FocusCard
              name="focus"
              checked={config.focus.type === "recommended"}
              onSelect={() => setFocus({ type: "recommended" })}
              title="Smart mix"
              badge="Recommended"
              description="A balanced session at your level — review, new patterns, and a few easy wins."
            />
            <FocusCard
              name="focus"
              checked={config.focus.type === "review"}
              onSelect={() => setFocus({ type: "review" })}
              disabled={struggleWordCount === 0}
              title={
                struggleWordCount > 0
                  ? `My tricky words (${struggleWordCount})`
                  : "My tricky words"
              }
              description={
                struggleWordCount > 0
                  ? "Just the words you've stumbled on, until they stick."
                  : "Nothing waiting yet — words you miss will collect here."
              }
            />
            <FocusCard
              name="focus"
              checked={config.focus.type === "pattern"}
              onSelect={() =>
                setFocus({
                  type: "pattern",
                  patternId: selectedPatternId ?? PHONICS_PATTERNS[0].id,
                })
              }
              title="One spelling pattern"
              description="Drill a single pattern — from Magic E to silent letters."
            />
          </div>

          {/* Pattern grid, only when "One spelling pattern" is chosen */}
          {config.focus.type === "pattern" && (
            <div
              role="group"
              aria-label="Spelling pattern"
              className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 animate-in fade-in duration-200 motion-reduce:animate-none"
            >
              {PHONICS_PATTERNS.map((pattern) => {
                const selected = selectedPatternId === pattern.id;
                return (
                  <button
                    key={pattern.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      setFocus({ type: "pattern", patternId: pattern.id })
                    }
                    className={`text-left p-3 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      selected
                        ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-black dark:text-white">
                      {pattern.label}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {pattern.example}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {patternWordCount(pattern)} words
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </fieldset>

        {/* ── How you'll type ─────────────────────────────────── */}
        <div
          className="bg-white dark:bg-gray-900 p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none"
          data-tour="typing-mode"
        >
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            How you&apos;ll type
          </h2>
          <div className="space-y-4">
            <SegmentedChoice
              label="Words are"
              options={[
                { value: "see", label: "Shown on screen" },
                { value: "listen", label: "Spoken aloud", icon: true },
              ]}
              value={settings.dictationMode ? "listen" : "see"}
              onChange={(v) =>
                updateSettings({
                  dictationMode: v === "listen",
                  // Listening mode needs TTS on
                  ttsEnabled: v === "listen" ? true : settings.ttsEnabled,
                })
              }
            />
            <SegmentedChoice
              label="Practice as"
              options={[
                { value: "sentence", label: "Flowing sentence" },
                { value: "word", label: "One word at a time" },
              ]}
              value={config.flow}
              onChange={(v) =>
                setConfig((prev) => ({ ...prev, flow: v as "word" | "sentence" }))
              }
            />
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Blind typing
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Hide what you type — pure muscle memory
                </p>
              </div>
              <Switch
                checked={settings.blindMode}
                onCheckedChange={(checked) =>
                  updateSettings({ blindMode: checked })
                }
                aria-label="Blind typing"
              />
            </div>
          </div>
        </div>

        {/* ── Session length ──────────────────────────────────── */}
        <div
          className="bg-white dark:bg-gray-900 p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none"
          data-tour="session-length"
        >
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Session length
          </h2>
          <div
            role="group"
            aria-label="Session length"
            className="flex gap-2"
          >
            {LENGTH_OPTIONS.map(({ words, label }) => {
              const selected = settings.sessionWordCount === words;
              return (
                <button
                  key={words}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => updateSettings({ sessionWordCount: words })}
                  className={`flex-1 py-3 rounded-lg border text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    selected
                      ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <span className="block text-lg font-bold text-black dark:text-white">
                    {words}
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {label}
                  </span>
                </button>
              );
            })}
            {/* A custom count set on the Settings page still shows up here */}
            {!LENGTH_OPTIONS.some(
              (o) => o.words === settings.sessionWordCount,
            ) && (
              <div className="flex-1 py-3 rounded-lg border border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-center">
                <span className="block text-lg font-bold text-black dark:text-white">
                  {settings.sessionWordCount}
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  Custom
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Start ───────────────────────────────────────────── */}
        <button
          type="button"
          onClick={handleStart}
          data-tour="start-button"
          className="w-full py-4 bg-blue-600 text-white text-xl font-bold rounded-lg hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
        >
          Start practice
          <span className="block text-sm font-normal opacity-75">
            {settings.sessionWordCount} words · no pressure, no timer
          </span>
        </button>

        <p className="text-center text-sm text-gray-500 dark:text-gray-500">
          Fonts, text size and voice speed live in{" "}
          <Link
            href="/settings"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Settings
          </Link>
        </p>
      </div>
    </div>
  );
}

/** Radio styled as a card — native input keeps keyboard/AT behaviour */
function FocusCard({
  name,
  checked,
  onSelect,
  disabled = false,
  title,
  badge,
  description,
}: {
  name: string;
  checked: boolean;
  onSelect: () => void;
  disabled?: boolean;
  title: string;
  badge?: string;
  description: string;
}) {
  return (
    <label
      className={`flex items-start gap-3 p-4 rounded-lg border transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 ${
        disabled
          ? "opacity-60 cursor-not-allowed border-gray-200 dark:border-gray-800"
          : checked
            ? "cursor-pointer border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
            : "cursor-pointer border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      }`}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="mt-1 w-4 h-4 accent-blue-600 shrink-0"
      />
      <span className="min-w-0">
        <span className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-black dark:text-white">
            {title}
          </span>
          {badge && (
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 rounded-full px-2 py-0.5">
              {badge}
            </span>
          )}
        </span>
        <span className="block text-sm text-gray-600 dark:text-gray-400 mt-0.5">
          {description}
        </span>
      </span>
    </label>
  );
}

/** Two-option segmented control (aria-pressed toggles) */
function SegmentedChoice({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string; icon?: boolean }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
      <div
        role="group"
        aria-label={label}
        className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-800"
      >
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                selected
                  ? "bg-white dark:bg-gray-900 text-black dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {option.icon && <Volume2 className="h-4 w-4" aria-hidden="true" />}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
