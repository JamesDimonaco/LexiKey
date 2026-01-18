"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AccessibilitySettings as SettingsType } from "@/lib/types";
import { usePostHogPageView, trackEvent } from "@/hooks/usePostHog";
import { useResetTour } from "@/components/OnboardingTour";

export default function SettingsPage() {
  usePostHogPageView();
  const { settings, updateSettings, resetSettings } = useAccessibility();
  const [tempSettings, setTempSettings] = useState<SettingsType>(settings);
  const [savedMessage, setSavedMessage] = useState(false);
  const [tourResetMessage, setTourResetMessage] = useState(false);
  const resetTour = useResetTour();

  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    practice: true,
    display: true,
    audio: true,
    accessibility: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateTempSettings = (updates: Partial<SettingsType>) => {
    setTempSettings((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    // Track settings changes
    const changedSettings: Record<string, any> = {};
    Object.keys(tempSettings).forEach((key) => {
      if (tempSettings[key as keyof SettingsType] !== settings[key as keyof SettingsType]) {
        changedSettings[key] = {
          old: settings[key as keyof SettingsType],
          new: tempSettings[key as keyof SettingsType],
        };
      }
    });

    if (Object.keys(changedSettings).length > 0) {
      trackEvent("settings_changed", {
        changedSettings,
        totalChanges: Object.keys(changedSettings).length,
      });
    }

    updateSettings(tempSettings);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const handleReset = () => {
    trackEvent("settings_reset");
    const defaults: SettingsType = {
      sessionWordCount: 20,
      capitalFrequency: "never",
      punctuationFrequency: "never",
      strugglePercent: 30,
      newPercent: 50,
      confidencePercent: 20,
      startingBoosters: 2,
      font: "helvetica",
      fontSize: 24,
      letterSpacing: 2,
      largeCursor: false,
      highContrast: false,
      ttsEnabled: true,
      voiceSpeed: 1.0,
      dictationMode: false,
      showHints: false,
      showTimerPressure: false,
      blindMode: false,
      showTypingSpeed: true,
      hardcoreMode: false,
    };
    resetSettings();
    setTempSettings(defaults);
  };

  const hasChanges = JSON.stringify(tempSettings) !== JSON.stringify(settings);

  return (
    <>
      <Header />
      <main className="bg-gray-50 dark:bg-black min-h-screen p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-black dark:text-white">Settings</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Customize your learning experience
              </p>
            </div>
            <Link
              href="/"
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              Back to Practice
            </Link>
          </div>

          <div className="space-y-4">
            {/* Practice Section */}
            <SettingsSection
              title="Practice"
              description="Session and word options"
              icon="📝"
              isExpanded={expandedSections.practice}
              onToggle={() => toggleSection("practice")}
            >
              <div className="space-y-6">
                {/* Session Word Count */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Words per session: {tempSettings.sessionWordCount}
                  </Label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={tempSettings.sessionWordCount}
                    onChange={(e) =>
                      updateTempSettings({ sessionWordCount: parseInt(e.target.value) })
                    }
                    className="w-full mt-2 accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-1">
                    <span>10 (Quick)</span>
                    <span>30 (Standard)</span>
                    <span>50 (Extended)</span>
                  </div>
                </div>

                {/* Capital Letters */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Capital Letters
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                    Randomly capitalize some words in practice
                  </p>
                  <div className="flex gap-2">
                    {(["never", "sometimes", "often"] as const).map((freq) => (
                      <button
                        key={freq}
                        onClick={() => updateTempSettings({ capitalFrequency: freq })}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          tempSettings.capitalFrequency === freq
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Punctuation */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Punctuation
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                    Add periods, commas, or other punctuation
                  </p>
                  <div className="flex gap-2">
                    {(["never", "sometimes", "often"] as const).map((freq) => (
                      <button
                        key={freq}
                        onClick={() => updateTempSettings({ punctuationFrequency: freq })}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          tempSettings.punctuationFrequency === freq
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Show Hints */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Show Hints
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Context sentences and phonics patterns
                    </p>
                  </div>
                  <Switch
                    checked={tempSettings.showHints}
                    onCheckedChange={(checked) => updateTempSettings({ showHints: checked })}
                  />
                </div>

                {/* Show Timer Pressure */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Show Session Stats
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Display time and backspace count after sessions
                    </p>
                  </div>
                  <Switch
                    checked={tempSettings.showTimerPressure}
                    onCheckedChange={(checked) => updateTempSettings({ showTimerPressure: checked })}
                  />
                </div>

                {/* Show Typing Speed */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Show Typing Speed
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Display words per minute after each session
                    </p>
                  </div>
                  <Switch
                    checked={tempSettings.showTypingSpeed}
                    onCheckedChange={(checked) => updateTempSettings({ showTypingSpeed: checked })}
                  />
                </div>

                {/* Session Mix Section */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Session Mix
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                    Customize how words are selected for each practice session
                  </p>

                  {/* Struggle Words */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                        Targeted Practice
                        <InfoTooltip text="Words you've struggled with before. These need extra attention and will appear more frequently until mastered." />
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">{tempSettings.strugglePercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={tempSettings.strugglePercent}
                      onChange={(e) => {
                        const newStruggle = parseInt(e.target.value);
                        const remaining = 100 - newStruggle;
                        const ratio = tempSettings.newPercent / (tempSettings.newPercent + tempSettings.confidencePercent) || 0.7;
                        updateTempSettings({
                          strugglePercent: newStruggle,
                          newPercent: Math.round(remaining * ratio),
                          confidencePercent: Math.round(remaining * (1 - ratio)),
                        });
                      }}
                      className="w-full accent-red-500"
                    />
                  </div>

                  {/* New Concepts */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                        New Words
                        <InfoTooltip text="Fresh words at your current skill level. Learning new words helps expand your vocabulary and typing fluency." />
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">{tempSettings.newPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={tempSettings.newPercent}
                      onChange={(e) => {
                        const newNew = parseInt(e.target.value);
                        const remaining = 100 - newNew;
                        const ratio = tempSettings.strugglePercent / (tempSettings.strugglePercent + tempSettings.confidencePercent) || 0.6;
                        updateTempSettings({
                          newPercent: newNew,
                          strugglePercent: Math.round(remaining * ratio),
                          confidencePercent: Math.round(remaining * (1 - ratio)),
                        });
                      }}
                      className="w-full accent-blue-500"
                    />
                  </div>

                  {/* Easy Practice */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                        Easy Practice
                        <InfoTooltip text="Simpler words you already know well. These help build rhythm, maintain confidence, and reinforce muscle memory." />
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">{tempSettings.confidencePercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={tempSettings.confidencePercent}
                      onChange={(e) => {
                        const newConf = parseInt(e.target.value);
                        const remaining = 100 - newConf;
                        const ratio = tempSettings.strugglePercent / (tempSettings.strugglePercent + tempSettings.newPercent) || 0.4;
                        updateTempSettings({
                          confidencePercent: newConf,
                          strugglePercent: Math.round(remaining * ratio),
                          newPercent: Math.round(remaining * (1 - ratio)),
                        });
                      }}
                      className="w-full accent-green-500"
                    />
                  </div>

                  {/* Visual summary */}
                  <div className="flex h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mb-4">
                    <div
                      className="bg-red-500"
                      style={{ width: `${tempSettings.strugglePercent}%` }}
                    />
                    <div
                      className="bg-blue-500"
                      style={{ width: `${tempSettings.newPercent}%` }}
                    />
                    <div
                      className="bg-green-500"
                      style={{ width: `${tempSettings.confidencePercent}%` }}
                    />
                  </div>

                  {/* Warm-up Words */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                        Warm-up Words
                        <InfoTooltip text="Number of easy words at the very start of each session. Helps you get into a good typing flow before tackling harder words." />
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">{tempSettings.startingBoosters}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="1"
                      value={tempSettings.startingBoosters}
                      onChange={(e) =>
                        updateTempSettings({ startingBoosters: parseInt(e.target.value) })
                      }
                      className="w-full accent-green-500"
                    />
                  </div>
                </div>
              </div>
            </SettingsSection>

            {/* Display Section */}
            <SettingsSection
              title="Display"
              description="Font and visual preferences"
              icon="🎨"
              isExpanded={expandedSections.display}
              onToggle={() => toggleSection("display")}
            >
              <div className="space-y-6">
                {/* Font Family */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Font Family
                  </Label>
                  <select
                    value={tempSettings.font}
                    onChange={(e) =>
                      updateTempSettings({
                        font: e.target.value as "helvetica" | "arial" | "opendyslexic",
                      })
                    }
                    className="w-full mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-black dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="helvetica">Helvetica (Recommended)</option>
                    <option value="arial">Arial</option>
                    <option value="opendyslexic">OpenDyslexic</option>
                  </select>
                  {tempSettings.font === "opendyslexic" && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Research shows OpenDyslexic provides no statistical benefit, but some users prefer it.
                    </p>
                  )}
                </div>

                {/* Font Size */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Font Size: {tempSettings.fontSize}px
                  </Label>
                  <input
                    type="range"
                    min="16"
                    max="48"
                    value={tempSettings.fontSize}
                    onChange={(e) =>
                      updateTempSettings({ fontSize: parseInt(e.target.value) })
                    }
                    className="w-full mt-2 accent-blue-500"
                  />
                </div>

                {/* Letter Spacing */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Letter Spacing: {tempSettings.letterSpacing}px
                  </Label>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    value={tempSettings.letterSpacing}
                    onChange={(e) =>
                      updateTempSettings({ letterSpacing: parseInt(e.target.value) })
                    }
                    className="w-full mt-2 accent-blue-500"
                  />
                </div>

                {/* High Contrast */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      High Contrast
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Pure black and white for maximum readability
                    </p>
                  </div>
                  <Switch
                    checked={tempSettings.highContrast}
                    onCheckedChange={(checked) => updateTempSettings({ highContrast: checked })}
                  />
                </div>
              </div>
            </SettingsSection>

            {/* Audio Section */}
            <SettingsSection
              title="Audio"
              description="Text-to-speech and dictation"
              icon="🔊"
              isExpanded={expandedSections.audio}
              onToggle={() => toggleSection("audio")}
            >
              <div className="space-y-6">
                {/* TTS Enabled */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Text-to-Speech
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Hear words spoken aloud
                    </p>
                  </div>
                  <Switch
                    checked={tempSettings.ttsEnabled}
                    onCheckedChange={(checked) => updateTempSettings({ ttsEnabled: checked })}
                  />
                </div>

                {/* Voice Speed */}
                {tempSettings.ttsEnabled && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Voice Speed: {tempSettings.voiceSpeed.toFixed(1)}x
                    </Label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={tempSettings.voiceSpeed}
                      onChange={(e) =>
                        updateTempSettings({ voiceSpeed: parseFloat(e.target.value) })
                      }
                      className="w-full mt-2 accent-blue-500"
                    />
                  </div>
                )}

                {/* Dictation Mode */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Dictation Mode
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Word is spoken but hidden - type what you hear
                    </p>
                  </div>
                  <Switch
                    checked={tempSettings.dictationMode}
                    onCheckedChange={(checked) => {
                      updateTempSettings({
                        dictationMode: checked,
                        ttsEnabled: checked ? true : tempSettings.ttsEnabled,
                      });
                    }}
                  />
                </div>
                {tempSettings.dictationMode && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      In dictation mode, you&apos;ll hear the word spoken aloud but won&apos;t see it.
                      Use the reveal button if you need help, or repeat to hear it again.
                    </p>
                  </div>
                )}
              </div>
            </SettingsSection>

            {/* Accessibility Section */}
            <SettingsSection
              title="Accessibility"
              description="Additional support options"
              icon="♿"
              isExpanded={expandedSections.accessibility}
              onToggle={() => toggleSection("accessibility")}
            >
              <div className="space-y-6">
                {/* Large Cursor */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Large Cursor
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Thicker text cursor for better visibility
                    </p>
                  </div>
                  <Switch
                    checked={tempSettings.largeCursor}
                    onCheckedChange={(checked) => updateTempSettings({ largeCursor: checked })}
                  />
                </div>

                {/* Blind Mode */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Blind Mode
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Hide your typed text to build muscle memory
                    </p>
                  </div>
                  <Switch
                    checked={tempSettings.blindMode}
                    onCheckedChange={(checked) => updateTempSettings({ blindMode: checked })}
                  />
                </div>

                {/* Hardcore Mode */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-red-500 dark:text-red-400">
                      Hardcore Mode
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      No backspace allowed. Auto-advance on timeout.
                    </p>
                  </div>
                  <Switch
                    checked={tempSettings.hardcoreMode}
                    onCheckedChange={(checked) => updateTempSettings({ hardcoreMode: checked })}
                  />
                </div>

                {/* Replay Tour */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Onboarding Tour
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      See the quick tour again next time you practice
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      resetTour();
                      setTourResetMessage(true);
                      setTimeout(() => setTourResetMessage(false), 2000);
                    }}
                  >
                    {tourResetMessage ? "Tour Reset!" : "Replay Tour"}
                  </Button>
                </div>
              </div>
            </SettingsSection>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-3 sticky bottom-4">
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1 bg-white dark:bg-gray-800"
            >
              Reset to Defaults
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex-1"
            >
              {savedMessage ? "Saved!" : "Save Changes"}
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}

// Collapsible section component
function SettingsSection({
  title,
  description,
  icon,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  icon: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div className="text-left">
            <h3 className="font-semibold text-black dark:text-white">{title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-500">{description}</p>
          </div>
        </div>
        <span
          className={`text-gray-400 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

// Info tooltip component with hover behavior
function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="relative inline-block group">
      <span className="w-4 h-4 inline-flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs cursor-help">
        ?
      </span>
      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-56 text-center z-50 shadow-lg">
        {text}
        <span className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-gray-900 dark:border-t-gray-100" />
      </span>
    </span>
  );
}
