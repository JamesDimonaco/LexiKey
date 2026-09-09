/**
 * Voice bake-off for LexiKey dictation audio.
 *
 * Picking a TTS voice from its marketing description does not work — what
 * matters is whether a struggling listener can tell "bad" from "bed", and
 * which reading a homograph gets. So this renders the words that break voices
 * and lets you judge by ear.
 *
 *   node scripts/tts-bakeoff.mts --list          # voices your account can use
 *   node scripts/tts-bakeoff.mts <id> [<id>...]  # render the test set per voice
 *
 * Needs ELEVENLABS_API_KEY. Costs ~180 characters per voice.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import words from "../app/practice/words.json" with { type: "json" };

const API = "https://api.elevenlabs.io/v1";
const MODEL = "eleven_multilingual_v2";
const OUT = join(import.meta.dirname, "..", ".tts-bakeoff");

/**
 * Rendered at speed 1.0 on purpose. The app already exposes a 0.5-2.0
 * voiceSpeed setting, which will drive playbackRate on the audio element —
 * baking a slower rate in here would apply the slowdown twice.
 */
const VOICE_SETTINGS = { stability: 0.75, similarity_boost: 0.75, style: 0 };

/**
 * Three ways a voice can fail this app, in the words we actually ship.
 * Intersected with the real pool so the set can never drift from content.
 */
const CANDIDATES = {
  // British vs American split — the voice teaches pronunciation either way
  broadA: ["bath", "path", "past", "fast", "last", "laugh", "answer", "after"],
  // Each comes out as exactly one reading, and the voice chooses which
  homographs: ["read", "lead", "wind", "close", "use", "minute", "present", "subject", "number"],
  // Dictation is unusable if these are not distinguishable
  minimalPairs: ["cat", "cot", "cut", "bad", "bed", "bud", "man", "men", "not", "nut"],
};

const pool = new Set(words.map((w) => w.word.toLowerCase()));
const testSet = [...new Set(Object.values(CANDIDATES).flat())].filter((w) => pool.has(w));

const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.error("Set ELEVENLABS_API_KEY (get one at elevenlabs.io > Profile > API Keys)");
  process.exit(1);
}

async function listVoices() {
  const res = await fetch(`${API}/voices`, { headers: { "xi-api-key": key! } });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const { voices } = await res.json();
  for (const v of voices) {
    const l = v.labels ?? {};
    console.log(`${v.voice_id}  ${v.name.padEnd(18)} ${[l.accent, l.age, l.gender, l.use_case].filter(Boolean).join(", ")}`);
  }
  console.log(`\n${voices.length} voices. Pass the ids you want to compare.`);
}

/**
 * Folder name for a voice. An API key scoped to text-to-speech only cannot
 * read the voice list, so fall back to the id rather than refusing to render.
 */
async function voiceName(voiceId: string) {
  const res = await fetch(`${API}/voices/${voiceId}`, { headers: { "xi-api-key": key! } });
  if (!res.ok) return voiceId;
  return (await res.json()).name.replace(/[^a-z0-9]/gi, "-").toLowerCase();
}

async function render(voiceId: string, label?: string) {
  const name = label ?? (await voiceName(voiceId));

  const dir = join(OUT, name);
  await mkdir(dir, { recursive: true });

  for (const [i, word] of testSet.entries()) {
    const r = await fetch(`${API}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: { "xi-api-key": key!, "Content-Type": "application/json" },
      body: JSON.stringify({ text: word, model_id: MODEL, voice_settings: VOICE_SETTINGS }),
    });
    if (!r.ok) throw new Error(`${word}: ${r.status} ${await r.text()}`);

    // Numeric prefix so the files sort in test order, not alphabetically
    const file = join(dir, `${String(i + 1).padStart(2, "0")}-${word}.mp3`);
    await writeFile(file, Buffer.from(await r.arrayBuffer()));
    process.stdout.write(".");
  }
  console.log(` ${name} (${testSet.length} words)`);
}

const args = process.argv.slice(2);
if (args[0] === "--list") {
  await listVoices();
} else if (args.length === 0) {
  console.error("Usage: node scripts/tts-bakeoff.mts --list | <voiceId> [<voiceId>...]");
  process.exit(1);
} else {
  console.log(`Test set (${testSet.length}): ${testSet.join(" ")}\n`);
  // Accepts "name=id" so a key without voices_read still gets readable folders
  for (const arg of args) {
    const [a, b] = arg.split("=");
    await render(b ?? a, b ? a : undefined);
  }
  console.log(`\nListen: open ${OUT}`);
}
