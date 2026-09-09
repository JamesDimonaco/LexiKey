import Link from "next/link";
import { Ear, Keyboard, Repeat } from "lucide-react";
import { TeacherSignup } from "@/components/TeacherSignup";

/**
 * Marketing landing page.
 *
 * `/` is the app — returning users land straight in the typing box, which is
 * what they want and what the analytics say they use. This is where anyone who
 * has never heard of LexiKey should arrive instead: campaign links, Product
 * Hunt, and search.
 *
 * Deliberately a server component. `/` renders a loading state until Convex and
 * Clerk resolve, so a crawler sees nothing there; this page has no auth gate,
 * so its content is in the HTML of the response. (ClerkProvider makes every
 * route render on demand rather than at build time — that changes nothing for
 * a crawler, which gets the full markup either way.)
 */
export default function Welcome() {
  return (
    <main className="bg-gray-100 dark:bg-black">
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-black dark:text-white mb-5 text-balance">
          Typing practice that teaches spelling, not speed
        </h1>
        <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-2xl">
          Most typing apps drill random words and time you. LexiKey groups words
          by the spelling rule behind them, so the practice actually transfers
          to writing. Free, and you don&apos;t need an account.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="py-4 px-8 bg-blue-600 text-white text-center text-xl font-bold rounded-lg hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
          >
            Start typing
          </Link>
          <Link
            href="/placement-test"
            className="py-4 px-8 bg-gray-200 dark:bg-gray-800 text-black dark:text-white text-center text-xl font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Find my level
          </Link>
        </div>
      </section>

      <TypingDemo />

      <section className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-black dark:text-white mb-8">
          What makes it different
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <Feature
            icon={<Keyboard className="h-6 w-6" aria-hidden="true" />}
            title="Words grouped by rule"
            body="1,114 words sorted into 108 phonics groups. A session teaches one pattern, so learning &ldquo;shine&rdquo; helps you spell &ldquo;stripe&rdquo;."
          />
          <Feature
            icon={<Ear className="h-6 w-6" aria-hidden="true" />}
            title="See it or hear it"
            body="Type the word on screen, or switch to listening and type what you hear. They are scored separately, because they are different skills."
          />
          <Feature
            icon={<Repeat className="h-6 w-6" aria-hidden="true" />}
            title="Misses come back"
            body="Hesitate on a word and it returns in later sessions until you get it right three times running. Then it retires."
          />
        </div>
      </section>

      <section className="bg-white dark:bg-gray-950 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-black dark:text-white mb-5">
            No timer. No leaderboard.
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4 max-w-2xl">
            Every other typing app is a race, which is fine if you are already
            fast. Put a countdown in front of the person who is slowest in the
            room and you rebuild the thing that made them hate spelling in the
            first place.
          </p>
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl">
            Nothing here is timed and nothing is ranked. You can change the
            font, the size and the letter spacing, turn the voice on, and work
            at whatever pace suits you.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-black dark:text-white mb-5">
          Built for dyslexic learners
        </h2>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-4 max-w-2xl">
          The word groups follow the{" "}
          <Link
            href="/how-it-works"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Orton-Gillingham
          </Link>{" "}
          approach, which specialists have used to teach spelling to dyslexic
          students for eighty years. Typing adds the part that is hard to do on
          paper: your fingers learn the pattern while your eyes and ears work on
          the same word.
        </p>
        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl">
          I built it because I am dyslexic and nothing else worked on me.
          Writing a word out ten times never stuck. Typing the same words for
          years, by accident, did.
        </p>
      </section>

      <section className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-black dark:text-white mb-4">
            Teaching a class?
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 max-w-2xl">
            The free tier is the whole tool — try it on one student before you
            trust it with thirty. Classroom management and progress reports are
            what I am building next. See{" "}
            <Link
              href="/for-teachers"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              the teacher page
            </Link>{" "}
            for what it tracks today.
          </p>
          <TeacherSignup source="welcome" />
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold text-black dark:text-white mb-4 text-balance">
          Pick a spelling rule and type a few words
        </h2>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
          Takes about two minutes. Nothing to sign up for.
        </p>
        <Link
          href="/"
          className="inline-block py-4 px-10 bg-blue-600 text-white text-xl font-bold rounded-lg hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
        >
          Start typing
        </Link>
      </section>
    </main>
  );
}

/**
 * A still of the practice screen mid-word: the letters you have typed are
 * filled in, the rest stay as a guide. Drawn rather than screenshotted so it
 * stays sharp and costs no page weight — replace it with the demo recording
 * once that exists.
 */
function TypingDemo() {
  const typed = "shi";
  const remaining = "ne";

  return (
    <section
      aria-label="What a practice session looks like"
      className="max-w-4xl mx-auto px-6"
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-8 shadow-sm dark:shadow-none">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-1">
          Magic E
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Word 4 of 10 &middot; rate, bite, hope, shine
        </p>

        <p className="font-mono text-5xl sm:text-6xl tracking-[0.15em] mb-6">
          <span className="text-black dark:text-white">{typed}</span>
          <span className="text-gray-500 dark:text-gray-500">{remaining}</span>
        </p>

        <p className="text-gray-700 dark:text-gray-300">
          The lamp will <span className="font-semibold">shine</span> all night.
        </p>
      </div>
    </section>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <span className="text-blue-600 dark:text-blue-400 block mb-3">
        {icon}
      </span>
      <h3 className="font-bold text-black dark:text-white mb-2">{title}</h3>
      <p className="text-gray-700 dark:text-gray-300 text-sm">{body}</p>
    </div>
  );
}
