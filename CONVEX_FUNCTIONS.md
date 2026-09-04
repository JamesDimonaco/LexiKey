# LexiKey Convex Functions

The actual current Convex surface: 11 functions across four files, plus caller
checks in `authHelpers.ts`. This replaces an earlier version of this document
that described a Word Library, Classrooms, Assignments and Progress
Reports/IEP system — none of that was ever built, and several of the
functions it described under Users/Practice Sessions/Struggle Words were
either deleted or never existed under those names. If a B2B roadmap along
those lines gets picked up again, write it fresh against what's actually
built by then rather than resurrecting this.

## Core principles

1. **Local-first validation** — typing logic runs in the browser; only
   session summaries are ever sent to Convex, never individual keystrokes.
2. **Ownership-checked** — every query/mutation that takes a `userId` or
   `clerkId` calls `requireUser`/`requireClerkId` first (see below). Anonymous
   practice never reaches Convex at all — it lives in `localStorage`.
3. **Two calibration tracks** — reading and listening are scored and
   thresholded separately throughout (`currentLevel`/`listenLevel`,
   `thresholdParams`/`listenThresholdParams`), because measured accuracy
   differs sharply between the two (93% reading vs 65% listening).

---

## `convex/authHelpers.ts`

Not Convex functions themselves — caller checks used by every function below.

- **`requireClerkId(ctx, clerkId)`** — throws unless the caller is
  authenticated as `clerkId`.
- **`requireUser(ctx, userId)`** — throws unless the caller is authenticated
  as the `clerkId` on `userId`'s row; returns that row.

## `convex/users.ts`

### Queries

- **`getCurrentUser({ clerkId })`** — the user row for a Clerk ID, or `null`
  if none exists yet (distinct from `undefined`, which means still loading).

### Mutations

- **`createUser({ clerkId, name, email?, role, anonymousData? })`** — creates
  a user with default settings. `anonymousData` optionally migrates
  progress made before sign-up (level, struggle words, threshold params,
  inaudible-word reports, placement-test completion).
- **`updateUserStats({ userId, stats })`** — merges the given fields into
  `stats`. Streak fields (`currentStreak`, `lastActiveDate`,
  `freezesAvailable`, `freezeWeekStart`) are owned by
  `streaks.recordSessionCompleted` — this mutation only patches what it's
  given.
- **`updateThresholdParams({ userId, thresholdParams, inputMode? })`** —
  writes `thresholdParams` (reading, default) or `listenThresholdParams`
  (`inputMode: "listen"`). Called after the placement test (initial
  calibration) and after practice sessions (gradual adjustment).
- **`migrateAnonymousData({ clerkId, anonymousData })`** — merges anonymous
  progress into an already-existing account, for the case where sign-up's
  webhook created the account before the client could migrate on `createUser`.
  Struggle words merge pessimistically (lower `consecutiveCorrect`, higher
  miss counts win) rather than being skipped.

## `convex/struggleWords.ts`

Simple bucket system: a word is added when the user struggles, and removed
after 3 consecutive correct attempts. See the file's own header comment for
the current hesitation-threshold rule (it's adaptive, not a flat cutoff).

### Queries

- **`getUserStruggleWords({ userId })`** — all struggle-bucket rows for a
  user.

### Mutations

- **`batchProcessWordResults({ userId, results })`** — processes a whole
  session's word results in one call: adds/updates struggle rows, deletes a
  word once it graduates (3 consecutive correct), and records which input
  mode (`see`/`listen`) each miss happened in.

## `convex/inaudibleWords.ts`

Lets a user flag that a dictation-mode word was mangled by the TTS voice
rather than actually missed. See the file's header comment for why this
exists.

### Queries

- **`getUserInaudibleWords({ userId })`** — words this user has reported, for
  filtering future listening sessions.

### Mutations

- **`reportInaudible({ userId, word })`** — idempotent report. Also undoes
  any struggle-bucket damage the report caused: if every miss on the word
  was a listening miss, the row is deleted; if it was also missed while
  reading, only the listening-miss count is cleared.

## `convex/streaks.ts`

Timezone-aware daily streak with one weekly freeze. See the file's header
comment for the full rule set.

### Mutations

- **`recordSessionCompleted({ userId, timezoneOffsetMinutes })`** — call once
  per completed session; same-day calls are no-ops. Returns
  `{ status, currentStreak, longestStreak, freezesAvailable, milestone }`
  where `status` is one of `already_counted`, `started`, `incremented`,
  `freeze_used`, `reset`.

### Queries

- **`getStreak({ userId })`** — normalized streak state for the UI, or `null`
  if the caller doesn't own `userId`.

---

## Schema notes (`convex/schema.ts`)

`stats` carries more than session counters: `hasCompletedTour`,
`listenLevel`, `thresholdParams`/`listenThresholdParams`, and the streak
fields (`lastActiveDate`, `freezesAvailable`, `freezeWeekStart`) alongside the
legacy `lastPracticeDate`. Read the schema directly for the exact shape
rather than trusting a copy of it here — it's the source of truth and this
doc will drift again otherwise.

`practiceSessions` is defined but **unused** — no function reads or writes
it. Session summaries have never actually been persisted server-side;
per-session data lives only in the client until it's folded into `stats`,
`userStruggleWords` and the streak fields above. The table is kept only
because dropping it is a decision (is server-side session history ever
wanted?), not an oversight.

## Write discipline

Never write individual keystrokes. Batch a session's results into a single
mutation call (`batchProcessWordResults`, `updateUserStats`,
`recordSessionCompleted`) rather than one call per word.
