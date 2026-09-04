# SEO & Analytics Implementation Summary

## SEO

### Sitemap & Robots

- **Sitemap**: `app/sitemap.ts` — lists `/`, `/placement-test`, `/for-parents`,
  `/for-teachers`, `/how-it-works`, `/privacy`, `/terms` (`/settings` is
  deliberately excluded — user-specific, not useful for SEO).
- **Robots**: `app/robots.ts` — allows all crawlers, disallows `/api/` and
  `/_next/`.
- Both use `NEXT_PUBLIC_SITE_URL`.

### Metadata

- **Root layout** (`app/layout.tsx`): meta tags, Open Graph, Twitter Card,
  JSON-LD WebApplication schema, Google Site Verification, canonical URLs.

## PostHog analytics

Tracking helpers live in `hooks/usePostHog.ts`. Verify this list against that
file and its call sites before trusting it — events get renamed and added
often enough that a static list here goes stale.

### Page views & identity

- Automatic `$pageview` on every route that calls `usePostHogPageView()`
  (`app/page.tsx`, `app/settings/page.tsx`, `app/placement-test/page.tsx`).
- `user_signed_in` — fired once per session when Clerk resolves a signed-in
  user.

### Practice session events

- `practice_setup_started` — leaving the session-setup screen to start
  practicing (`app/practice/SessionSetup.tsx`).
- `practice_started` / `practice_session_started` — a session begins.
  `practice_session_started` carries `dictationMode` among its properties.
- `practice_word_completed` — each word finished.
- `practice_session_completed` — session finished, with stats.
- `practice_session_restarted` / `practice_session_refreshed`.
- `word_struggle` — a word entered the struggle bucket. Carries
  `dictationMode` (listening vs. reading misses are different skills, tracked
  separately) and `reason` (`hesitation` / `backspaces` / `error`).
- `word_reported_inaudible` — user flags a dictation-mode word as unclear
  TTS, not a real miss.
- `session_complete_viewed` — completion screen shown.
- `streak_incremented` / `streak_freeze_used` / `streak_reset`.

### Placement test events

- `placement_test_word_completed` — each word in the test.
- `placement_test_completed` — test finished with results. Also mirrored as
  `funnel_onboarding_placement_test_completed` via the funnel-step helper.

### Settings events

- `settings_changed` — any setting modification.
- `settings_reset`.

### Onboarding tour events

- `onboarding_tour_started` / `onboarding_tour_step_viewed` /
  `onboarding_tour_completed` / `onboarding_tour_skipped` /
  `onboarding_tour_reset` (`components/OnboardingTour.tsx`).

### Auth events

- `sign_in_clicked` / `sign_up_clicked` (`components/Header.tsx`).

### Errors

- `$exception` — uncaught errors and promise rejections
  (`components/PostHogProvider.tsx`'s global handlers), plus caught errors
  routed through `trackError()` (`hooks/usePostHog.ts`), used by
  `components/ErrorBoundary.tsx`.

### Alarms

- `insufficient_words_for_level` (`lib/AdaptiveEngine.ts`) — not a UX event,
  a signal that the word pool at a level/focus combination has run dry.
  Treat this as an alarm, not routine noise, when reviewing changes to word
  pool filtering.

## Environment variables

```bash
# SEO
NEXT_PUBLIC_SITE_URL=https://lexikey.org
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-verification-code

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## Testing

### SEO

1. Check sitemap: `https://your-domain.com/sitemap.xml`
2. Check robots: `https://your-domain.com/robots.txt`
3. Validate meta tags with Google Rich Results Test / Facebook Sharing
   Debugger / Twitter Card Validator.

### PostHog

1. Confirm PostHog initializes (check browser console/network tab).
2. Perform actions and verify events land in the PostHog dashboard.
3. Check user identification on sign-in.
