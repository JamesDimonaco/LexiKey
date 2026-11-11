# LexiKey

Typing practice organised by phonics rules (Orton-Gillingham) to reinforce spelling for dyslexic
students. Not a WPM trainer. Calm and educational, not gamified. Teachers and schools (B2B) are
the revenue; the free B2C tier is the funnel.

## Stack and commands

- Next.js 16 (App Router, React Compiler on), Convex, Clerk, Tailwind CSS 4, PostHog. pnpm.
- next-themes with dark as default: always pair `dark:` classes.
- `pnpm dev` (Next + `convex dev` in parallel), `pnpm build`, `pnpm lint`. No test suite.
- `npx next build` is the definitive React Compiler check.
- TTS: pre-rendered ElevenLabs MP3s in `public/audio/<voice>/`, built by
  `node --env-file=.env.local scripts/generate-tts.mts`. Web Speech API is the fallback.

## Rules

- Local-first keystrokes: NEVER write individual keystrokes to Convex. Validate typing in the
  browser, track hesitations (>1.5s goes to the review bucket) locally, persist session summaries only.
- Words stay categorised by phonics rules. Quality over quantity; context sentences for TTS.
- Not greenlit, don't build unprompted: TTS by default, kid-first results screen, teacher IEP report.

## Where things live

- Identity lane: personal.
- Vercel project `lexi-key` (lexikey.org). Production builds run `npx convex deploy` first
  (`vercel.json`), so a push to `main` deploys Convex prod too.
- Convex: dev `capable-hippopotamus-953`, prod `prestigious-snail-572`.
- Auth: Clerk.
- PostHog project 252090. Query with `phog personal 252090 "<HogQL>"`. Funnel to watch:
  `practice_word_completed` per person and `practice_session_completed`.
- Env: `.env.local`. `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
  `CLERK_SECRET_KEY`, `CLERK_JWT_ISSUER_DOMAIN`, `CLERK_WEBHOOK_SECRET`, `NEXT_PUBLIC_POSTHOG_KEY`,
  `NEXT_PUBLIC_POSTHOG_HOST`, `ELEVENLABS_API_KEY` (TTS script only).

## Review checklist

- React Compiler makes render purity load-bearing. Watch side effects in lazy `useState`
  initialisers and module-level cache mutation during render.
- AdaptiveEngine treats some PostHog events as alarms (`insufficient_words_for_level`). Word-pool
  changes can turn an alarm into routine noise; check alarm semantics on pool-math changes.
- Contrast: `text-gray-500/600` small text (~4.6:1) is the accepted baseline. Don't re-raise it;
  flag anything below it (gray-400 on white fails AA).
- Custom `role="radio"` buttons keep appearing without roving tabindex and arrow keys. Catch them.
- Lint has accepted pre-existing problems. Review the diff only; new files add zero.
- Client-only work in render (Math.random, localStorage) relies on the `userProgress.isLoading`
  gate for SSR safety. Check the gate still wraps it.

## Gotchas

- Convex deletes graduated words reactively before results render. The results screen replays the
  3-in-a-row graduation rule against a session-start snapshot instead.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
