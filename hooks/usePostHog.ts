"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { posthog } from "@/components/PostHogProvider";
import { useUser } from "@clerk/nextjs";

export function usePostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const hasIdentifiedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !posthog || !posthog.__loaded) return;

    posthog.capture("$pageview", {
      $current_url: window.location.href,
      path: pathname,
    });
  }, [pathname, searchParams]);

  // Identify user when they sign in (only once per session)
  useEffect(() => {
    if (!isLoaded || !user?.id || hasIdentifiedRef.current) return;
    if (typeof window === "undefined" || !posthog || !posthog.__loaded) return;

    // Check if this is a new sign-in by checking if user was just created
    // We'll track sign-in completion when user is identified
    const wasAnonymous = !posthog.get_distinct_id() || posthog.get_distinct_id() === user.id;
    
    posthog.identify(user.id, {
      email: user.emailAddresses[0]?.emailAddress,
      name: user.fullName,
    });

    hasIdentifiedRef.current = true;

    // Track sign-in completion
    posthog.capture("user_signed_in", {
      email: user.emailAddresses[0]?.emailAddress,
      name: user.fullName,
      wasAnonymous,
    });
  }, [user, isLoaded]);
}

export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined" || !posthog) return;

  // Wait for PostHog to load if not ready
  if (!posthog.__loaded) {
    // Queue the event to be sent once PostHog loads
    setTimeout(() => trackEvent(eventName, properties), 100);
    return;
  }

  posthog.capture(eventName, properties);
}

/**
 * Track an error/exception to PostHog
 * Use this for caught errors that you want to monitor
 */
export function trackError(
  error: Error | string,
  context?: {
    component?: string;
    action?: string;
    userId?: string;
    extra?: Record<string, unknown>;
  }
) {
  if (typeof window === "undefined" || !posthog) return;

  const errorObj = typeof error === "string" ? new Error(error) : error;

  // Wait for PostHog to load if not ready
  if (!posthog.__loaded) {
    setTimeout(() => trackError(error, context), 100);
    return;
  }

  posthog.capture("$exception", {
    $exception_message: errorObj.message,
    $exception_stack: errorObj.stack,
    $exception_type: errorObj.name || "Error",
    // Custom context
    component: context?.component,
    action: context?.action,
    userId: context?.userId,
    ...context?.extra,
  });

  // Also log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error("[PostHog Error]", errorObj, context);
  }
}

// ============================================
// LEARNING ANALYTICS
// ============================================

/**
 * Track when a practice session is completed
 */
export function trackSessionCompleted(data: {
  wordsAttempted: number;
  wordsCompleted: number;
  accuracy: number;
  durationSeconds: number;
  phonicsGroup?: string;
  struggleWordsAdded: number;
  mode: "practice" | "review" | "lesson";
}) {
  trackEvent("practice_session_completed", {
    ...data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track when a word is mastered (graduated from review)
 */
export function trackWordMastered(data: {
  word: string;
  phonicsGroup: string;
  /** Attempts within THIS session only. Graduation counts consecutive clean
   *  attempts across sessions, and the client cannot see the earlier ones. */
  attemptsThisSession: number;
}) {
  trackEvent("word_mastered", data);
}

/**
 * Track when a word is added to the struggle bucket
 */
export function trackWordStruggle(data: {
  word: string;
  phonicsGroup: string;
  reason: "hesitation" | "backspaces" | "error";
  /** true = the word was spoken, not shown. Listening misses are a different
   *  skill from spelling misses and must be segmentable apart. */
  dictationMode: boolean;
}) {
  trackEvent("word_struggle", data);
}

/**
 * Track placement test completion
 */
export function trackPlacementTestCompleted(data: {
  determinedLevel: number;
  accuracy: number;
  wordsAttempted: number;
  durationSeconds: number;
  struggleGroups: string[];
  isAnonymous: boolean;
}) {
  trackEvent("placement_test_completed", data);
}

/**
 * Track when user starts practicing
 */
export function trackPracticeStarted(data: {
  phonicsGroup?: string;
  mode: "practice" | "review" | "lesson";
  currentLevel: number;
}) {
  trackEvent("practice_started", data);
}

// ============================================
// USER PROPERTIES
// ============================================

/**
 * Update user properties for segmentation
 */
export function updateUserProperties(properties: {
  currentLevel?: number;
  totalWords?: number;
  totalSessions?: number;
  hasCompletedPlacementTest?: boolean;
  accountType?: "free" | "premium" | "school";
  userRole?: "student" | "teacher" | "parent";
  struggleWordsCount?: number;
  currentStreak?: number;
}) {
  if (typeof window === "undefined" || !posthog) return;

  if (!posthog.__loaded) {
    setTimeout(() => updateUserProperties(properties), 100);
    return;
  }

  posthog.people.set(properties);
}

/**
 * Increment a user property (e.g., totalWords, totalSessions)
 * Note: PostHog JS SDK doesn't support increment directly, so we track via events
 * The actual incrementing should be done server-side or via PostHog's backend
 */
export function incrementUserProperty(
  property: string,
  value: number = 1
) {
  if (typeof window === "undefined" || !posthog) return;

  if (!posthog.__loaded) {
    setTimeout(() => incrementUserProperty(property, value), 100);
    return;
  }

  // Track as an event instead - PostHog can aggregate these server-side
  posthog.capture("user_property_increment", {
    property,
    incrementBy: value,
  });
}

// ============================================
// FUNNEL TRACKING
// ============================================

/**
 * Track funnel steps for conversion analysis
 */
export function trackFunnelStep(
  funnel: "onboarding" | "signup" | "practice",
  step: string,
  properties?: Record<string, unknown>
) {
  trackEvent(`funnel_${funnel}_${step}`, {
    funnel,
    step,
    ...properties,
  });
}

// ============================================
// SURVEYS
// ============================================

/**
 * Track when a user becomes eligible for a survey
 * Configure actual surveys in PostHog dashboard
 */
export function triggerSurveyEligibility(
  surveyTrigger: "after_5_sessions" | "after_first_week" | "after_word_mastered" | "nps",
  properties?: Record<string, unknown>
) {
  trackEvent("survey_eligible", {
    surveyTrigger,
    ...properties,
  });
}

