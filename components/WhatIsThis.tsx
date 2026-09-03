"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Ear, Keyboard, Repeat } from "lucide-react";

export const SEEN_INTRO_KEY = "lexikey-seen-intro";

/**
 * Shown once, to first-ever visitors, above the practice area.
 *
 * Analytics reason: 220 people have reached the homepage and 15 have ever
 * typed a word. The page opens straight into a typing box with nothing saying
 * what it's for. Returning visitors skip this entirely — once you know what
 * the app is, the input is the only thing you want.
 */
export function WhatIsThis({ onDismiss }: { onDismiss: () => void }) {
  // Marked seen here rather than on the page, so someone routed to the merge
  // dialog or the placement-test prompt on their first visit still gets the
  // introduction once they reach the practice screen.
  useEffect(() => {
    localStorage.setItem(SEEN_INTRO_KEY, "1");
  }, []);

  return (
    <section
      aria-labelledby="what-is-this-heading"
      className="w-full mb-6 bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none animate-in fade-in duration-300 motion-reduce:animate-none"
    >
      <h2
        id="what-is-this-heading"
        className="text-2xl font-bold text-black dark:text-white mb-2"
      >
        What is this?
      </h2>
      <p className="text-gray-700 dark:text-gray-300 mb-5 max-w-2xl">
        LexiKey is spelling practice that runs through your fingers. You type
        words grouped by the spelling rule behind them — not random text, and
        not a speed test. It was built for dyslexic learners, and it works for
        anyone who keeps misspelling the same handful of words.
      </p>

      <div className="grid gap-3 sm:grid-cols-3 mb-5">
        <Point
          icon={<Keyboard className="h-5 w-5 shrink-0" aria-hidden="true" />}
          title="Type what you see"
          body="Words appear on screen. Type them, and the letters fill in as you go."
        />
        <Point
          icon={<Ear className="h-5 w-5 shrink-0" aria-hidden="true" />}
          title="Or type what you hear"
          body="Switch to listening and the word is spoken instead of shown. Harder, and scored separately."
        />
        <Point
          icon={<Repeat className="h-5 w-5 shrink-0" aria-hidden="true" />}
          title="Words you miss come back"
          body="Anything you stumble on returns until you get it right three times running."
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          type="button"
          onClick={onDismiss}
          className="py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
        >
          Start typing
        </button>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Or read{" "}
          <Link
            href="/how-it-works"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            how it works
          </Link>
          ,{" "}
          <Link
            href="/for-teachers"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            for teachers
          </Link>{" "}
          or{" "}
          <Link
            href="/for-parents"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            for parents
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

function Point({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <span className="text-blue-600 dark:text-blue-400 mt-0.5">{icon}</span>
      <span className="min-w-0">
        <span className="block font-semibold text-black dark:text-white text-sm">
          {title}
        </span>
        <span className="block text-sm text-gray-600 dark:text-gray-400 mt-0.5">
          {body}
        </span>
      </span>
    </div>
  );
}
