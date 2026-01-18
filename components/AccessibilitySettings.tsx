"use client";

import React, { useState } from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AccessibilitySettings as SettingsType } from "@/lib/types";

interface AccessibilitySettingsProps {
  onClose?: () => void;
}

export function AccessibilitySettings({ onClose }: AccessibilitySettingsProps) {
  const { settings, updateSettings, resetSettings } = useAccessibility();
  const [tempSettings, setTempSettings] = useState<SettingsType>(settings);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Update temporary settings for preview
  const updateTempSettings = (updates: Partial<SettingsType>) => {
    setTempSettings((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    setShowConfirmDialog(true);
  };

  const confirmSave = () => {
    updateSettings(tempSettings);
    setShowConfirmDialog(false);
    onClose?.(); // Close the modal after saving
  };

  const handleCancel = () => {
    setTempSettings(settings); // Reset to saved settings
  };

  const handleReset = () => {
    resetSettings();
    setTempSettings({
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
    });
  };

  // Check if settings have changed
  const hasChanges = JSON.stringify(tempSettings) !== JSON.stringify(settings);

  return (
    <>
      <div
        className="bg-gray-900 dark:bg-gray-900 p-6 rounded-lg shadow-md max-w-2xl mx-auto border border-gray-800"
        style={{
          fontFamily: tempSettings.font === "opendyslexic" ? "OpenDyslexic, sans-serif" : tempSettings.font,
          fontSize: `${tempSettings.fontSize}px`,
          letterSpacing: `${tempSettings.letterSpacing}px`,
        }}
      >
        <h2 className="text-2xl font-bold mb-6 text-white">Accessibility Settings</h2>

        <div className="space-y-6">
          {/* Font Settings */}
          <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Font Settings</h3>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Font Family
            </label>
            <select
              value={tempSettings.font}
              onChange={(e) =>
                updateTempSettings({
                  font: e.target.value as
                    | "helvetica"
                    | "arial"
                    | "opendyslexic",
                })
              }
              className="w-full p-2 bg-gray-800 border border-gray-700 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="helvetica">Helvetica (Recommended)</option>
              <option value="arial">Arial</option>
              <option value="opendyslexic">OpenDyslexic</option>
            </select>
            {tempSettings.font === "opendyslexic" && (
              <p className="text-xs text-gray-400 mt-1">
                Note: Research shows OpenDyslexic provides no statistical
                benefit over Arial/Helvetica, but some users find it helpful.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Font Size: {tempSettings.fontSize}px
            </label>
            <input
              type="range"
              min="16"
              max="48"
              value={tempSettings.fontSize}
              onChange={(e) =>
                updateTempSettings({ fontSize: parseInt(e.target.value) })
              }
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Letter Spacing: {tempSettings.letterSpacing}px
            </label>
            <input
              type="range"
              min="0"
              max="8"
              value={tempSettings.letterSpacing}
              onChange={(e) =>
                updateTempSettings({ letterSpacing: parseInt(e.target.value) })
              }
              className="w-full accent-blue-500"
            />
          </div>
        </div>

        {/* Cursor Settings */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Cursor Settings</h3>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={tempSettings.largeCursor}
              onChange={(e) =>
                updateTempSettings({ largeCursor: e.target.checked })
              }
              className="w-4 h-4 accent-blue-500"
            />
            <span className="text-sm text-gray-300">Large Cursor</span>
          </label>
        </div>

        {/* Visual Settings */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Visual Settings</h3>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={tempSettings.highContrast}
              onChange={(e) =>
                updateTempSettings({ highContrast: e.target.checked })
              }
              className="w-4 h-4 accent-blue-500"
            />
            <span className="text-sm text-gray-300">High Contrast Mode</span>
          </label>
        </div>

        {/* TTS Settings */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Text-to-Speech</h3>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={tempSettings.ttsEnabled}
              onChange={(e) => updateTempSettings({ ttsEnabled: e.target.checked })}
              className="w-4 h-4 accent-blue-500"
            />
            <span className="text-sm text-gray-300">Enable Text-to-Speech</span>
          </label>

          {tempSettings.ttsEnabled && (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Voice Speed: {tempSettings.voiceSpeed.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={tempSettings.voiceSpeed}
                onChange={(e) =>
                  updateTempSettings({ voiceSpeed: parseFloat(e.target.value) })
                }
                className="w-full accent-blue-500"
              />
            </div>
          )}
        </div>

        {/* Practice Settings */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Practice Settings</h3>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={tempSettings.showHints}
              onChange={(e) => updateTempSettings({ showHints: e.target.checked })}
              className="w-4 h-4 accent-blue-500"
            />
            <span className="text-sm text-gray-300">
              Show Hints (context sentences, phonics patterns)
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={tempSettings.showTimerPressure}
              onChange={(e) =>
                updateTempSettings({ showTimerPressure: e.target.checked })
              }
              className="w-4 h-4 accent-blue-500"
            />
            <span className="text-sm text-gray-300">Show Session Stats (time &amp; backspaces)</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={tempSettings.blindMode}
              onChange={(e) => updateTempSettings({ blindMode: e.target.checked })}
              className="w-4 h-4 accent-blue-500"
            />
            <span className="text-sm text-gray-300">
              Blind Mode (hide text to force muscle memory)
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={tempSettings.hardcoreMode}
              onChange={(e) => updateTempSettings({ hardcoreMode: e.target.checked })}
              className="w-4 h-4 accent-red-500"
            />
            <span className="text-sm text-gray-300">
              Hardcore Mode (no backspace, auto-advance on timeout)
            </span>
          </label>
          {tempSettings.hardcoreMode && (
            <p className="text-xs text-red-400 mt-1 ml-6">
              Warning: In hardcore mode, you cannot delete mistakes. Words will auto-advance if not completed in time.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex gap-3">
          <Button
            onClick={handleReset}
            variant="outline"
            className="flex-1"
          >
            Reset to Defaults
          </Button>
          <Button
            onClick={handleCancel}
            variant="outline"
            className="flex-1"
            disabled={!hasChanges}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
            disabled={!hasChanges}
          >
            Save Changes
          </Button>
        </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Settings?</DialogTitle>
            <DialogDescription>
              Your accessibility settings will be saved to your browser and applied across all pages.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmSave}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
