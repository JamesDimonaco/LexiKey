"use client";

import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useEffect } from "react";

/**
 * Component that applies accessibility settings globally via CSS custom properties
 * This allows settings to be applied across the entire app
 */
export function AccessibilityStyler() {
  const { settings } = useAccessibility();

  useEffect(() => {
    // Apply font settings to document root
    document.documentElement.style.setProperty(
      "--accessibility-font-family",
      settings.font === "opendyslexic"
        ? "OpenDyslexic, sans-serif"
        : settings.font
    );
    document.documentElement.style.setProperty(
      "--accessibility-font-size",
      `${settings.fontSize}px`
    );
    document.documentElement.style.setProperty(
      "--accessibility-letter-spacing",
      `${settings.letterSpacing}px`
    );

    // Apply cursor settings
    if (settings.largeCursor) {
      document.documentElement.style.setProperty("--cursor-width", "3px");
    } else {
      document.documentElement.style.setProperty("--cursor-width", "1px");
    }

    // Cursor never blinks (reduces visual distraction)
    document.documentElement.style.setProperty("--cursor-animation", "none");

    // Apply high contrast mode
    if (settings.highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [settings]);

  return null; // This component doesn't render anything
}
