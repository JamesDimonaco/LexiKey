/**
 * Renders the whole word pool to MP3 files served from public/audio/.
 *
 * Dictation audio is a closed set — 1,114 words that only change when the
 * pool does — so it is generated once and shipped with the app rather than
 * synthesised per request. No API key at runtime, no per-user quota, no
 * latency on the word the learner is waiting to hear.
 *
 *   node --env-file=.env.local scripts/generate-tts.mts
 *
 * Resumable: existing files are skipped, so a run killed halfway just picks up.
 */

import { mkdir, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import words from "../app/practice/words.json" with { type: "json" };

const API = "https://api.elevenlabs.io/v1";
const MODEL = "eleven_multilingual_v2";

/** Rendered at speed 1.0 — the app's 0.5-2.0 voiceSpeed drives playbackRate. */
const VOICE_SETTINGS = { stability: 0.75, similarity_boost: 0.75, style: 0 };

const VOICES = {
  alice: "Xb7hH8MSUJpSbSDYk0k2",
  roger: "CwhRBWXzGAHq8TQ4Fs17",
};

/**
 * One at a time. Three concurrent requests drew sustained 429s that survived
 * a minute of backoff (2026-09-09), and this is a one-off batch job — there is
 * nothing to gain by racing the rate limiter.
 */
const CONCURRENCY = 1;

const PUBLIC = join(import.meta.dirname, "..", "public", "audio");

const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.error("Set ELEVENLABS_API_KEY in .env.local");
  process.exit(1);
}

const exists = (p: string) => access(p).then(() => true, () => false);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Exponential, capped at a minute, but a server-sent Retry-After always wins. */
const backoff = (attempt: number, retryAfter?: string | null) =>
  sleep(retryAfter ? Number(retryAfter) * 1000 : Math.min(2 ** attempt * 500, 60_000));

async function synth(voiceId: string, text: string, attempt = 1): Promise<Buffer> {
  let res: Response;
  try {
    res = await fetch(`${API}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: { "xi-api-key": key!, "Content-Type": "application/json" },
      body: JSON.stringify({ text, model_id: MODEL, voice_settings: VOICE_SETTINGS }),
    });
  } catch (err) {
    // A connect timeout or dropped socket rejects rather than returning a
    // response — over 2,228 requests that will happen, and it must not end
    // the run.
    if (attempt > 8) throw new Error(`${text}: network failure after ${attempt} attempts`, { cause: err });
    await backoff(attempt);
    return synth(voiceId, text, attempt + 1);
  }

  if (res.status === 429 || res.status >= 500) {
    if (attempt > 8) throw new Error(`${text}: gave up after ${attempt} attempts (${res.status})`);
    await backoff(attempt, res.headers.get("retry-after"));
    return synth(voiceId, text, attempt + 1);
  }
  if (!res.ok) throw new Error(`${text}: ${res.status} ${await res.text()}`);

  return Buffer.from(await res.arrayBuffer());
}

const pool = [...new Set(words.map((w) => w.word.toLowerCase()))];
let done = 0;
let skipped = 0;
let spent = 0;
const failed: string[] = [];

for (const [name, voiceId] of Object.entries(VOICES)) {
  const dir = join(PUBLIC, name);
  await mkdir(dir, { recursive: true });

  const queue = [...pool];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    for (let word = queue.shift(); word; word = queue.shift()) {
      const file = join(dir, `${word}.mp3`);
      if (await exists(file)) {
        skipped++;
        continue;
      }
      try {
        await writeFile(file, await synth(voiceId, word));
      } catch (err) {
        // One unlucky word must not cost the other 2,000. The run is resumable,
        // so a rerun retries exactly the failures.
        failed.push(`${name}/${word}: ${(err as Error).message}`);
        continue;
      }
      spent += word.length;
      done++;
      if (done % 50 === 0) console.log(`  ${name}: ${done} written, ${spent} chars`);
    }
  });

  await Promise.all(workers);
  console.log(`${name}: complete`);
}

await writeFile(
  join(PUBLIC, "manifest.json"),
  JSON.stringify({ model: MODEL, voiceSettings: VOICE_SETTINGS, voices: VOICES, words: pool.length, generatedAt: new Date().toISOString() }, null, 2),
);

console.log(`\n${done} files written, ${skipped} already present, ${spent} characters used.`);
if (failed.length) {
  console.error(`\n${failed.length} failed — rerun to retry just these:`);
  for (const f of failed) console.error(`  ${f}`);
  process.exit(1);
}
