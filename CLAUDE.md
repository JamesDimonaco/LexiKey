# CLAUDE.md - LexiKey

LexiKey is a B2B literacy intervention tool disguised as a B2C typing app: typing practice
organised by phonics rules (Orton-Gillingham) to reinforce spelling for dyslexic students,
not a WPM trainer. Calm and educational, not gamified — B2B (teachers/schools) is the revenue,
the free B2C tier is the funnel.

**Stack:** Next.js 16 (App Router, TypeScript), Convex, Clerk, Tailwind CSS 4,
next-themes (dark default — always pair `dark:` classes), Web Speech API for TTS,
PostHog, Vercel.

**The non-negotiable — local-first keystroke handling:** NEVER write individual keystrokes
to Convex. Validate typing locally in the browser (zero latency), track hesitations
(>1.5s → review bucket) locally, and only persist session summaries.

Words must stay categorised by phonics rules — quality over quantity; context sentences for TTS.

## Field notes (2026-08)

- PostHog project **252090**, personal org — the connected Dama MCP can't read it; use `phog personal "<HogQL>"`.
- **Traction root cause (found 2026-07-25):** 19 people reached the practice screen in 90 days but only James ever completed a word — `practice_word_completed` only fired on spacebar/enter and nobody discovered the spacebar. Zero session completions ever. Fix shipped 2026-07-25: auto-advance on correct words (single-word mode: every word; sentence mode: last word only — spacebar stays the mid-sentence rhythm), type-over-the-word UI on practice AND placement test (placement uses neutral blue, no red — measurement not teaching), and a "Words Mastered" results section (client replays the server's 3-consecutive graduation rule against a session-start snapshot, because Convex deletes graduated words reactively before results render). Funnel to watch: per-person `practice_word_completed`, and `practice_session_completed` (previously zero).
- Ideas James has NOT greenlit (don't build unprompted): TTS-by-default, kid-first results screen (demote WPM), teacher-side IEP report.

## Review checklist (repo-specific)

- **React Compiler is ON** (`reactCompiler: true` in next.config.ts) — render purity is load-bearing. Watch side effects in lazy `useState` initializers and module-level cache mutation during render. `npx next build` is the definitive compiler check.
- **AdaptiveEngine treats PostHog events as alarms** (`insufficient_words_for_level`) — changes to the word pool (focus filters etc.) can turn an alarm into routine noise; check alarm semantics on pool-math changes.
- **Contrast baseline:** WCAG AAA is not met repo-wide — `text-gray-500/600` small text (~4.6:1) is the accepted convention. Don't re-raise the convention; DO flag anything below it (gray-400 on white ≈ 3.0:1 fails even AA).
- Custom `role="radio"` buttons keep appearing without roving tabindex/arrow keys — recurring pattern to catch; native inputs in the same files do it right.
- Lint baseline: 62 accepted pre-existing problems (as of 2026-07-06) — diff-only review; new files add zero.
- SSR safety of client-only work (Math.random/localStorage in render) is usually guaranteed by the `userProgress.isLoading` gate — verify the gate still wraps it.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
