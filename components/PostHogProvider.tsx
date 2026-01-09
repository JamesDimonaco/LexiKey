"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_POSTHOG_KEY &&
      process.env.NEXT_PUBLIC_POSTHOG_HOST
    ) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        person_profiles: "identified_only",
        capture_pageview: true,
        capture_pageleave: true,
        // Error tracking
        autocapture: true,
        capture_performance: true,
        // Session replay
        disable_session_recording: false,
        session_recording: {
          maskAllInputs: false, // Show typed spelling words
          maskTextSelector: "[data-mask]", // Mask elements with data-mask attribute
          recordCrossOriginIframes: false,
        },
        // Feature flags
        bootstrap: {
          featureFlags: {},
        },
      });

      // Global error handler for uncaught errors
      window.onerror = (message, source, lineno, colno, error) => {
        posthog.capture("$exception", {
          $exception_message: String(message),
          $exception_source: source,
          $exception_lineno: lineno,
          $exception_colno: colno,
          $exception_stack: error?.stack,
          $exception_type: error?.name || "Error",
        });
      };

      // Global handler for unhandled promise rejections
      window.onunhandledrejection = (event) => {
        posthog.capture("$exception", {
          $exception_message: event.reason?.message || String(event.reason),
          $exception_stack: event.reason?.stack,
          $exception_type: "UnhandledPromiseRejection",
        });
      };
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

// Export posthog instance for direct usage
export { posthog };
