import Link from "next/link";
import { FaqSection, type Faq } from "@/components/FaqSection";

const FAQS: Faq[] = [
  {
    question: "Is LexiKey an Orton-Gillingham program?",
    answer:
      "No. Orton-Gillingham is a way of teaching, delivered by a trained person. LexiKey is the practice that sits alongside it: 1,114 words grouped into 108 phonics patterns in the order an Orton-Gillingham tutor would introduce them. It drills a rule; it does not explain one.",
  },
  {
    question: "Can I use it for Orton-Gillingham practice at home without a tutor?",
    answer:
      "Yes, and it is free. The placement test finds the right starting pattern and each session covers one rule. What you will not get is someone explaining why 'hope' has an e and 'hop' does not, so if a child is stuck on a rule rather than on the words, that is the moment to find a teacher.",
  },
  {
    question: "Which phonics patterns does it cover?",
    answer:
      "Short vowels, magic e, digraphs, blends, vowel teams, r-controlled vowels, diphthongs, silent letters, double letters, compound words, longer multisyllable words and a set of tricky rules such as 'receive' and 'giant'. Those headings cover 108 finer groups underneath.",
  },
  {
    question: "Does it follow a particular published Orton-Gillingham scope and sequence?",
    answer:
      "No. It is not affiliated with or aligned to any named program. The groups follow the common Orton-Gillingham progression from short-vowel words upwards, and a tutor can pick whichever pattern matches the current lesson.",
  },
  {
    question: "Is it multisensory?",
    answer:
      "The student sees the word, hears it spoken by a recorded voice, and types it. Dictation mode removes the visual so the student types from hearing alone. It cannot do the tactile parts of a lesson, such as tracing letters in sand.",
  },
];

/**
 * Search-intent page for "Orton-Gillingham spelling practice online" and
 * "Orton-Gillingham at home".
 *
 * People who ask this already know the method; what they want is somewhere
 * to practice it between lessons without paying for another program. The page
 * is honest that LexiKey is the drill, not the instruction, because a tutor
 * who feels misled will not recommend it and a parent who expects teaching
 * will be let down.
 */
export default function OrtonGillinghamSpellingPractice() {
  return (
    <main className="bg-gray-100 dark:bg-black min-h-screen p-8">
      <article className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-black dark:text-white mb-6 text-balance">
          Orton-Gillingham spelling practice online, free
        </h1>

        <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
          Orton-Gillingham is a way of teaching, not a worksheet. A trained
          tutor introduces one phonics rule at a time, in order, through sight,
          sound and movement. LexiKey is the practice part of that: words
          grouped by the same rules, spoken aloud and typed until they stick.
          It does not replace the lesson. It fills the days between lessons.
        </p>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
            What Orton-Gillingham looks like in the word list
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            1,114 words are grouped into 108 phonics patterns. On the practice
            screen they are gathered under headings a tutor will recognize:
          </p>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300 mb-4">
            <li>Short vowels: cat, bed, sip</li>
            <li>Magic E: rate, bite, hope</li>
            <li>Digraphs: ship, chat, patch</li>
            <li>Blends: stop, trip, sand</li>
            <li>Vowel teams: rain, beach, seed</li>
            <li>R-controlled: car, bird, fort</li>
            <li>Diphthongs: coin, cloud, town</li>
            <li>Silent letters: knee, wrist, ghost</li>
            <li>Double letters: letter, ballot, sudden</li>
            <li>Tricky rules: receive, giant, once</li>
            <li>Compound words: sunset, backpack</li>
            <li>Longer words: wonderful, remember</li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300">
            A session stays inside one pattern. The point is the same as in a
            lesson: learn the rule through a run of words that share it, rather
            than memorizing each word on its own.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
            The three principles, and how far software gets
          </h2>
          <ul className="space-y-3 text-gray-700 dark:text-gray-300">
            <li>
              <strong className="text-black dark:text-white">
                Multisensory.
              </strong>{" "}
              The student sees the word, hears it in a recorded voice (British
              or American) and types it. Dictation mode hides the word so they
              type from the sound alone. The tactile parts of a lesson, tracing
              letters or tapping out sounds, cannot be done on a keyboard and
              LexiKey does not pretend to.
            </li>
            <li>
              <strong className="text-black dark:text-white">
                Systematic and sequential.
              </strong>{" "}
              A{" "}
              <Link
                href="/placement-test"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                placement test
              </Link>{" "}
              finds which patterns are already secure, and practice starts at
              the first one that is not. Patterns run from short-vowel words
              upwards.
            </li>
            <li>
              <strong className="text-black dark:text-white">
                Practised to mastery.
              </strong>{" "}
              A word typed correctly after a long pause is not mastered. It
              returns in later sessions until it is right three times running,
              then retires. Errors and hesitations are both tracked, locally,
              as the student types.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
            What it does not do
          </h2>
          <ul className="space-y-3 text-gray-700 dark:text-gray-300">
            <li>
              It does not teach the rule. The screen names the pattern and
              shows the words; it does not explain why &quot;hope&quot; has an
              e and &quot;hop&quot; does not. That is the tutor&apos;s job, or
              the parent&apos;s.
            </li>
            <li>
              It is not aligned to any named published program and makes no
              claim to be accredited Orton-Gillingham instruction.
            </li>
            <li>
              It does not cover reading or comprehension. Spelling only,
              through typing.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
            If you are a tutor
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Pick the pattern that matches this week&apos;s lesson and set ten
            minutes a day as homework. The student does not need an account to
            start; a free one saves which words keep coming back, which is the
            list worth looking at before the next session.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            There is no tutor dashboard yet. Progress lives in the
            student&apos;s own account. If you would use a view across your
            students, the{" "}
            <Link
              href="/for-teachers"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              teacher page
            </Link>{" "}
            has a place to say so.
          </p>
        </section>

        <FaqSection faqs={FAQS} />

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="py-4 px-8 bg-blue-600 text-white text-center text-xl font-bold rounded-lg hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
          >
            Pick a pattern and start
          </Link>
          <Link
            href="/how-it-works"
            className="py-4 px-8 bg-gray-200 dark:bg-gray-800 text-black dark:text-white text-center text-xl font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            How it works
          </Link>
        </div>
      </article>
    </main>
  );
}
