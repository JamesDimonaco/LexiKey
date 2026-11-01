import Link from "next/link";
import { FaqSection, type Faq } from "@/components/FaqSection";

const FAQS: Faq[] = [
  {
    question: "Is LexiKey suitable for teenagers, or only young children?",
    answer:
      "It is used in class by a secondary school. The screen shows a word, a sentence and nothing else: no cartoons, no mascot, no points. The word list runs from three-letter words up to words like 'receive' and 'wonderful', and the placement test skips what a student already knows.",
  },
  {
    question: "Does LexiKey teach touch typing?",
    answer:
      "No. It does not teach finger placement or measure words per minute. It is spelling practice that happens to use a keyboard. A student who needs to learn to touch type should do a typing course as well; the two do not conflict.",
  },
  {
    question: "What does a dyslexic student need to use it?",
    answer:
      "A web browser and a physical keyboard. There is nothing to install and no account is needed to start. A free account saves progress between sessions and devices.",
  },
  {
    question: "How long should a session be?",
    answer:
      "About ten minutes a day. Spelling is a memory problem, and memory responds to short, frequent practice better than one long session a week. A session covers one spelling pattern.",
  },
  {
    question: "Is it free?",
    answer:
      "Yes. There is nothing to buy. The free version is the whole tool, for students, parents and schools.",
  },
];

/**
 * Search-intent page for "typing practice for dyslexic students" and its
 * secondary-school variants.
 *
 * Dyslexic teenagers are usually told to type instead of handwrite by the time
 * they reach secondary school, and the typing tools they are handed are either
 * speed trainers or built for seven-year-olds. The question people bring to an
 * assistant is whether anything exists in between. This page is the answer.
 */
export default function TypingPracticeForDyslexicStudents() {
  return (
    <main className="bg-gray-100 dark:bg-black min-h-screen p-8">
      <article className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-black dark:text-white mb-6 text-balance">
          Typing practice for dyslexic teenagers and secondary students
        </h1>

        <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
          LexiKey is free typing practice where the typing teaches the
          spelling. Words are grouped by the phonics rule behind them, spoken
          aloud, and brought back when a student hesitates. There is no timer
          and no leaderboard. A secondary school uses it in class.
        </p>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
            Why most typing apps do not help
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            By secondary school, a dyslexic student has usually been told to
            type their work, and often been given a typing app to get faster.
            Those apps are speed trainers. They drill random words or random
            text, count the words per minute, and put a clock on the screen.
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Put a countdown in front of the slowest typist in the room and you
            rebuild the thing that made them hate spelling in the first place.
            The alternative is usually a spelling game drawn for a
            seven-year-old, which a fourteen-year-old will not open twice.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Neither fixes the actual problem, which is that the student does
            not know which letters go in the word. Speed does not teach that.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
            What LexiKey does instead
          </h2>
          <ul className="space-y-3 text-gray-700 dark:text-gray-300">
            <li>
              <strong className="text-black dark:text-white">
                Words grouped by rule.
              </strong>{" "}
              1,114 words sorted into 108 phonics groups following the{" "}
              <Link
                href="/orton-gillingham-spelling-practice"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Orton-Gillingham
              </Link>{" "}
              approach. A session drills one pattern, so getting
              &quot;shine&quot; right helps with &quot;stripe&quot;.
            </li>
            <li>
              <strong className="text-black dark:text-white">
                Every word spoken aloud.
              </strong>{" "}
              Each word has a recorded voice, British or American, rather than
              a robotic browser voice that mangles half of them. Students can
              type the word they see, or switch to dictation and type what they
              hear.
            </li>
            <li>
              <strong className="text-black dark:text-white">
                Hesitation counts.
              </strong>{" "}
              A word typed correctly after a pause of more than a second and a
              half has not been learned yet. It goes into a review set and
              comes back in later sessions until it is right three times
              running.
            </li>
            <li>
              <strong className="text-black dark:text-white">
                Starts at the right level.
              </strong>{" "}
              A short{" "}
              <Link
                href="/placement-test"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                placement test
              </Link>{" "}
              finds which patterns are already solid, so a sixteen-year-old is
              not made to type &quot;cat&quot;.
            </li>
            <li>
              <strong className="text-black dark:text-white">
                Nothing childish on the screen.
              </strong>{" "}
              A word, a sentence that uses it, and the letters filling in as
              they are typed. No points, no streaks, no mascot.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
            Built to be adjusted
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            Font, text size and letter spacing can all be changed. There is a
            high contrast option and dark mode. The voice speed is adjustable.
            Nothing flashes and nothing is timed, so a student can work at
            whatever pace suits them, including on a bad day.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
            What it does not do
          </h2>
          <ul className="space-y-3 text-gray-700 dark:text-gray-300">
            <li>
              It does not teach touch typing. There is no finger placement
              guide and no words-per-minute score.
            </li>
            <li>
              It cannot diagnose dyslexia. That needs a qualified assessor.
            </li>
            <li>
              It only covers spelling. Not reading, comprehension or essay
              writing.
            </li>
            <li>
              It will not nag a student into coming back. There is no reward
              loop, on purpose.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
            Where to start
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            Take the placement test, then practice the first pattern it
            suggests for ten minutes. If the student has a learning support
            teacher or tutor, the list of patterns that keep coming back is
            worth showing them.
          </p>
        </section>

        <FaqSection faqs={FAQS} />

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/placement-test"
            className="py-4 px-8 bg-blue-600 text-white text-center text-xl font-bold rounded-lg hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
          >
            Find my level
          </Link>
          <Link
            href="/free-dyslexia-tool-for-schools"
            className="py-4 px-8 bg-gray-200 dark:bg-gray-800 text-black dark:text-white text-center text-xl font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Using it in a school
          </Link>
        </div>
      </article>
    </main>
  );
}
