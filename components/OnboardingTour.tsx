"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { trackEvent } from "@/hooks/usePostHog";
import { Button } from "@/components/ui/button";

const TOUR_STORAGE_KEY = "lexikey_tour_completed";

type TourStep = {
  target: string; // data-tour attribute value
  title: string;
  content: string;
  position: "top" | "bottom" | "left" | "right";
};

// The tour runs on the session setup screen (the app's front door)
const TOUR_STEPS: TourStep[] = [
  {
    target: "focus-picker",
    title: "Choose Your Focus",
    content:
      "Practice a smart mix at your level, retry your own tricky words, or drill one spelling pattern.",
    position: "bottom",
  },
  {
    target: "typing-mode",
    title: "See It or Hear It",
    content:
      "Type words you see on screen, or hide them and spell from audio - great for testing yourself!",
    position: "top",
  },
  {
    target: "start-button",
    title: "Start Typing",
    content:
      "Type each word - it moves on by itself when you get it right. Your level adapts as you go - no timers, no pressure.",
    position: "top",
  },
  {
    target: "settings-button",
    title: "Customize",
    content: "Adjust fonts, text size, voice speed, and accessibility options.",
    position: "bottom",
  },
];

type OnboardingTourProps = {
  userId?: Id<"users">;
  hasCompletedTourInDb?: boolean;
  onComplete?: () => void;
};

export function OnboardingTour({ userId, hasCompletedTourInDb, onComplete }: OnboardingTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  const updateUserStats = useMutation(api.users.updateUserStats);

  // Check if tour should show (check both localStorage and DB)
  useEffect(() => {
    setMounted(true);
    const hasSeenTourLocal = localStorage.getItem(TOUR_STORAGE_KEY);
    const hasSeenTour = hasSeenTourLocal || hasCompletedTourInDb;

    if (!hasSeenTour) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        setIsActive(true);
        trackEvent("onboarding_tour_started");
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedTourInDb]);

  // Update target element position
  useEffect(() => {
    if (!isActive) return;

    const updateTargetPosition = () => {
      const step = TOUR_STEPS[currentStep];
      const element = document.querySelector(`[data-tour="${step.target}"]`);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      }
    };

    updateTargetPosition();
    window.addEventListener("resize", updateTargetPosition);
    window.addEventListener("scroll", updateTargetPosition);

    return () => {
      window.removeEventListener("resize", updateTargetPosition);
      window.removeEventListener("scroll", updateTargetPosition);
    };
  }, [isActive, currentStep]);

  const saveTourCompletion = useCallback(async () => {
    // Always save to localStorage
    localStorage.setItem(TOUR_STORAGE_KEY, "true");

    // Save to database if user is logged in
    if (userId) {
      try {
        await updateUserStats({
          userId,
          stats: { hasCompletedTour: true },
        });
      } catch (error) {
        console.error("Failed to save tour completion to database:", error);
      }
    }
  }, [userId, updateUserStats]);

  const completeTour = useCallback(async () => {
    await saveTourCompletion();
    setIsActive(false);
    trackEvent("onboarding_tour_completed", { stepsViewed: currentStep + 1 });
    onComplete?.();
  }, [currentStep, onComplete, saveTourCompletion]);

  const skipTour = useCallback(async () => {
    await saveTourCompletion();
    setIsActive(false);
    trackEvent("onboarding_tour_skipped", { skippedAtStep: currentStep });
    onComplete?.();
  }, [currentStep, onComplete, saveTourCompletion]);

  const nextStep = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
      trackEvent("onboarding_tour_step_viewed", { step: currentStep + 1 });
    } else {
      completeTour();
    }
  }, [currentStep, completeTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        skipTour();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        nextStep();
      } else if (e.key === "ArrowLeft") {
        prevStep();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, nextStep, prevStep, skipTour]);

  if (!mounted || !isActive || !targetRect) return null;

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  // Calculate tooltip position
  const tooltipStyle = getTooltipPosition(targetRect, step.position);

  return createPortal(
    <div className="fixed inset-0 z-[100]" aria-modal="true" role="dialog">
      {/* Backdrop with spotlight cutout */}
      <div className="absolute inset-0">
        <svg className="w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="8"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
          />
        </svg>
      </div>

      {/* Spotlight border */}
      <div
        className="absolute border-2 border-blue-400 rounded-lg pointer-events-none"
        style={{
          left: targetRect.left - 8,
          top: targetRect.top - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16,
        }}
      />

      {/* Tooltip */}
      <div
        className="absolute bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-5 max-w-sm border border-gray-200 dark:border-gray-700"
        style={tooltipStyle}
      >
        {/* Arrow */}
        <TooltipArrow position={step.position} targetRect={targetRect} />

        {/* Content */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          {step.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {step.content}
        </p>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-4">
          {TOUR_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentStep
                  ? "bg-blue-500"
                  : idx < currentStep
                  ? "bg-blue-300"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={skipTour}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Skip tour
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={prevStep}
              >
                Back
              </Button>
            )}
            <Button
              size="sm"
              onClick={nextStep}
            >
              {isLastStep ? "Got it!" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function getTooltipPosition(
  targetRect: DOMRect,
  position: TourStep["position"]
): React.CSSProperties {
  const margin = 16;
  const tooltipWidth = 320;
  const tooltipHeight = 280; // Approximate

  // The tooltip lives in a fixed overlay, so an off-viewport position can
  // never be scrolled into view — flip to the other side of the target when
  // there's no room, and clamp to the viewport as a last resort.
  const centeredLeft = Math.max(16, Math.min(
    targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
    window.innerWidth - tooltipWidth - 16
  ));
  const fitsBelow =
    targetRect.bottom + margin + tooltipHeight <= window.innerHeight - 16;
  const fitsAbove = targetRect.top - margin - tooltipHeight >= 16;

  switch (position) {
    case "top":
      if (!fitsAbove && fitsBelow) {
        return { left: centeredLeft, top: targetRect.bottom + margin };
      }
      return {
        left: centeredLeft,
        bottom: Math.min(
          window.innerHeight - targetRect.top + margin,
          window.innerHeight - tooltipHeight - 16
        ),
      };
    case "bottom":
      if (!fitsBelow && fitsAbove) {
        return {
          left: centeredLeft,
          bottom: window.innerHeight - targetRect.top + margin,
        };
      }
      return {
        left: centeredLeft,
        top: Math.min(
          targetRect.bottom + margin,
          window.innerHeight - tooltipHeight - 16
        ),
      };
    case "left":
      return {
        right: window.innerWidth - targetRect.left + margin,
        top: Math.max(16, targetRect.top + targetRect.height / 2 - tooltipHeight / 2),
      };
    case "right":
      return {
        left: targetRect.right + margin,
        top: Math.max(16, targetRect.top + targetRect.height / 2 - tooltipHeight / 2),
      };
  }
}

function TooltipArrow({
  position,
  targetRect,
}: {
  position: TourStep["position"];
  targetRect: DOMRect;
}) {
  const arrowClass = "absolute w-3 h-3 bg-white dark:bg-gray-800 rotate-45 border-gray-200 dark:border-gray-700";

  switch (position) {
    case "top":
      return (
        <div
          className={`${arrowClass} border-b border-r -bottom-1.5`}
          style={{ left: "calc(50% - 6px)" }}
        />
      );
    case "bottom":
      return (
        <div
          className={`${arrowClass} border-t border-l -top-1.5`}
          style={{ left: "calc(50% - 6px)" }}
        />
      );
    case "left":
      return (
        <div
          className={`${arrowClass} border-t border-r -right-1.5`}
          style={{ top: "calc(50% - 6px)" }}
        />
      );
    case "right":
      return (
        <div
          className={`${arrowClass} border-b border-l -left-1.5`}
          style={{ top: "calc(50% - 6px)" }}
        />
      );
  }
}

// Hook to reset tour (for testing or settings)
export function useResetTour() {
  return useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    trackEvent("onboarding_tour_reset");
  }, []);
}
