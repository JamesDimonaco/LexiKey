"use client";

import React from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";

export function AccessibilitySettings() {
  const { settings, updateSettings, resetSettings } = useAccessibility();

  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-md max-w-2xl mx-auto border border-gray-800">
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
              value={settings.font}
              onChange={(e) =>
                updateSettings({
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
            {settings.font === "opendyslexic" && (
              <p className="text-xs text-gray-400 mt-1">
                Note: Research shows OpenDyslexic provides no statistical
                benefit over Arial/Helvetica, but some users find it helpful.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Font Size: {settings.fontSize}px
            </label>
            <input
              type="range"
              min="16"
              max="48"
              value={settings.fontSize}
              onChange={(e) =>
                updateSettings({ fontSize: parseInt(e.target.value) })
              }
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Letter Spacing: {settings.letterSpacing}px
            </label>
            <input
              type="range"
              min="0"
              max="8"
              value={settings.letterSpacing}
              onChange={(e) =>
                updateSettings({ letterSpacing: parseInt(e.target.value) })
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
              checked={settings.largeCursor}
              onChange={(e) =>
                updateSettings({ largeCursor: e.target.checked })
              }
              className="w-4 h-4 accent-blue-500"
            />
            <span className="text-sm text-gray-300">Large Cursor</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.nonBlinkingCursor}
              onChange={(e) =>
                updateSettings({ nonBlinkingCursor: e.target.checked })
              }
              className="w-4 h-4 accent-blue-500"
            />
            <span className="text-sm text-gray-300">Non-Blinking Cursor</span>
          </label>
        </div>

        {/* Visual Settings */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Visual Settings</h3>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={(e) =>
                updateSettings({ highContrast: e.target.checked })
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
              checked={settings.ttsEnabled}
              onChange={(e) => updateSettings({ ttsEnabled: e.target.checked })}
              className="w-4 h-4 accent-blue-500"
            />
            <span className="text-sm text-gray-300">Enable Text-to-Speech</span>
          </label>

          {settings.ttsEnabled && (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Voice Speed: {settings.voiceSpeed.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.voiceSpeed}
                onChange={(e) =>
                  updateSettings({ voiceSpeed: parseFloat(e.target.value) })
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
              checked={settings.showHints}
              onChange={(e) => updateSettings({ showHints: e.target.checked })}
              className="w-4 h-4 accent-blue-500"
            />
            <span className="text-sm text-gray-300">
              Show Hints (context sentences, phonics patterns)
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.noTimerPressure}
              onChange={(e) =>
                updateSettings({ noTimerPressure: e.target.checked })
              }
              className="w-4 h-4 accent-blue-500"
            />
            <span className="text-sm text-gray-300">No Timer Pressure</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.blindMode}
              onChange={(e) => updateSettings({ blindMode: e.target.checked })}
              className="w-4 h-4 accent-blue-500"
            />
            <span className="text-sm text-gray-300">
              Blind Mode (hide text to force muscle memory)
            </span>
          </label>
        </div>

        {/* Reset Button */}
        <div className="pt-4">
          <button
            onClick={resetSettings}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}
