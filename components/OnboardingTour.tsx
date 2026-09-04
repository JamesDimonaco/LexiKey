"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

  // True only once the dialog actually has something to render — the same
  // condition the render's early-return below uses, kept as one place so
  // the focus-management effects agree with it.
  const isDialogOpen = mounted && isActive && targetRect !== null;
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

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

  // Handle keyboard navigation, including trapping Tab inside the dialog —
  // without it Tab walks straight into the page behind the spotlight.
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        skipTour();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        // Enter on a focused button is that button's own activation. Before
        // the panel was keyboard-reachable this could never collide; now it
        // would fire the button AND advance, skipping a step.
        const active = document.activeElement;
        if (
          e.key === "Enter" &&
          active instanceof HTMLElement &&
          panelRef.current?.contains(active) &&
          active.closest("button")
        ) {
          return;
        }
        nextStep();
      } else if (e.key === "ArrowLeft") {
        prevStep();
      } else if (e.key === "Tab") {
        const panel = panelRef.current;
        if (!panel) return;
        const focusable = Array.from(
          panel.querySelectorAll<HTMLElement>(
            'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => !el.hasAttribute("disabled"));
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (e.shiftKey) {
          if (active === first || !panel.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else if (active === last || !panel.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, nextStep, prevStep, skipTour]);

  // Move focus into the dialog on open (and back in if a step change removes
  // whatever was focused, e.g. "Back" disappearing on step 0), then restore
  // the caller's focus when the tour closes.
  useEffect(() => {
    if (isDialogOpen) {
      if (previouslyFocusedRef.current === null) {
        previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      }
      if (!panelRef.current?.contains(document.activeElement)) {
        panelRef.current?.focus();
      }
    } else if (previouslyFocusedRef.current) {
      previouslyFocusedRef.current.focus();
      previouslyFocusedRef.current = null;
    }
  }, [isDialogOpen, currentStep]);

  // Hide the rest of the page from assistive tech while the dialog is open —
  // otherwise a screen reader can still read/navigate the app behind it.
  useEffect(() => {
    if (!isDialogOpen) return;
    const overlay = overlayRef.current;
    if (!overlay) return;

    const hidden: Element[] = [];
    Array.from(document.body.children).forEach((el) => {
      if (el === overlay || el.hasAttribute("aria-hidden")) return;
      el.setAttribute("aria-hidden", "true");
      hidden.push(el);
    });

    return () => {
      hidden.forEach((el) => el.removeAttribute("aria-hidden"));
    };
  }, [isDialogOpen]);

  if (!mounted || !isActive || !targetRect) return null;

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  // Calculate tooltip position
  const tooltipStyle = getTooltipPosition(targetRect, step.position);

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100]"
      aria-modal="true"
      role="dialog"
      aria-labelledby="tour-step-heading"
      aria-describedby="tour-step-content"
    >
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
        ref={panelRef}
        tabIndex={-1}
        className="absolute bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-5 max-w-sm border border-gray-200 dark:border-gray-700 outline-none"
        style={tooltipStyle}
      >
        {/* Arrow */}
        <TooltipArrow position={step.position} targetRect={targetRect} />

        {/* Content */}
        <h3
          id="tour-step-heading"
          className="text-lg font-bold text-gray-900 dark:text-white mb-2"
        >
          {step.title}
        </h3>
        <p id="tour-step-content" className="text-gray-600 dark:text-gray-300 mb-4">
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
