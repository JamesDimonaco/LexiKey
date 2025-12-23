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
    if (typeof window === "undefined" || !posthog || !(posthog as any).__loaded) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    
    posthog.capture("$pageview", {
      $current_url: window.location.href,
      path: pathname,
    });
  }, [pathname, searchParams]);

  // Identify user when they sign in (only once per session)
  useEffect(() => {
    if (!isLoaded || !user?.id || hasIdentifiedRef.current) return;
    if (typeof window === "undefined" || !posthog || !(posthog as any).__loaded) return;

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

export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window === "undefined" || !posthog) return;
  
  // Wait for PostHog to load if not ready
  if (!(posthog as any).__loaded) {
    // Queue the event to be sent once PostHog loads
    setTimeout(() => trackEvent(eventName, properties), 100);
    return;
  }
  
  posthog.capture(eventName, properties);
}
