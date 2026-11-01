import Link from "next/link";
import { FaqSection, type Faq } from "@/components/FaqSection";
import { TeacherSignup } from "@/components/TeacherSignup";

const FAQS: Faq[] = [
  {
    question: "Is LexiKey really free for schools?",
    answer:
      "Yes. There is no license, no trial that expires and nothing to buy. The free version is the whole tool. A classroom version for teachers may come later, and may be paid for; the practice itself is free now.",
  },
  {
    question: "Is there a teacher dashboard?",
    answer:
      "Not yet. Progress is stored in each student's own free account and shown on their results screen, including their accuracy and the words they hesitated on. A teacher sees it by looking at the student's screen.",
  },
  {
    question: "What age range is it for?",
    answer:
      "The words run from three-letter short-vowel words to multisyllable words like 'wonderful' and 'receive', so it covers upper primary through secondary. The screen is plain, with no cartoons.",
  },
  {
    question: "Do students need accounts?",
    answer:
      "No account is needed to start practicing. A free account saves progress between sessions and across devices. Signing in is handled by Clerk; see the privacy policy for what is stored.",
  },
  {
    question: "What does the IT department need to do?",
    answer:
      "Nothing to install and no admin rights. It runs in a web browser on any laptop with a keyboard. Students' keystrokes are checked in the browser and never sent to a server; only a summary of each session is saved.",
  },
];

/**
 * Search-intent page for "free dyslexia tool for schools" and the learning
 * support / SEN variants.
 *
 * The person asking is a learning support teacher with no budget and a
 * student in front of them this week. The page leads with the cost (nothing)
 * and the setup (nothing), and is plain about the missing teacher dashboard,
 * because a school that discovers that gap after rolling it out will not
 * come back when the dashboard exists.
 */
export default function FreeDyslexiaToolForSchools() {
  return (
    <main className="bg-gray-100 dark:bg-black min-h-screen p-8">
      <article className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-black dark:text-white mb-6 text-balance">
          A free spelling tool for dyslexic students in schools
        </h1>

        <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
          LexiKey is free spelling practice through typing, built for dyslexic
          learners. Words are grouped into 108 phonics patterns following the
          Orton-Gillingham approach, every word is spoken aloud by a recorded
          voice, and words a student hesitates on come back until they are
          secure. It runs in a web browser, needs no installation and no
          account to start, and there is nothing to buy.
        </p>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
            What it costs and what it needs
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Nothing, and almost nothing. There is no license to approve, no
            trial that expires and no card to enter. Students open the site on
            a laptop with a keyboard and start typing. No admin rights, no
            software install.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            There are no class lists or teacher dashboards today, and this
            page will not pretend there are.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
            How a learning support teacher uses it
          </h2>
          <ul className="space-y-3 text-gray-700 dark:text-gray-300">
            <li>
              <strong className="text-black dark:text-white">
                Place each student.
              </strong>{" "}
              The{" "}
              <Link
                href="/placement-test"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                placement test
              </Link>{" "}
              finds which phonics patterns are already secure, so a
              fifteen-year-old is not started on &quot;cat&quot;.
            </li>
            <li>
              <strong className="text-black dark:text-white">
                Match the pattern to the lesson.
              </strong>{" "}
              If this week is vowel teams, the student practices vowel teams.
              The pattern list follows the order an{" "}
              <Link
                href="/orton-gillingham-spelling-practice"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Orton-Gillingham
              </Link>{" "}
              tutor would teach.
            </li>
            <li>
              <strong className="text-black dark:text-white">
                Ten minutes, often.
              </strong>{" "}
              Short daily sessions beat a weekly hour for spelling. Nothing is
              timed, so a slow typist is not punished for being slow.
            </li>
            <li>
              <strong className="text-black dark:text-white">
                Read the review list.
              </strong>{" "}
              A word typed correctly after a pause of more than a second and a
              half is flagged, as are errors. Those words return until they are
              right three times running. The list of what keeps returning is
              the most useful thing the tool produces for a teacher.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
            Built for the students it is for
          </h2>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li>Adjustable font, text size and letter spacing</li>
            <li>High contrast and dark mode</li>
            <li>
              Recorded British and American voices, with adjustable speed
            </li>
            <li>
              Dictation mode: hear the word and type it without seeing it
            </li>
            <li>No timer, no leaderboard, no points, nothing that flashes</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
            Student data
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            Typing is checked in the browser. Individual keystrokes are never
            sent to a server. Only a summary of each session is stored, in the
            student&apos;s own account if they have one. The{" "}
            <Link
              href="/privacy"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              privacy policy
            </Link>{" "}
            lists what that includes.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
            What it does not do
          </h2>
          <ul className="space-y-3 text-gray-700 dark:text-gray-300">
            <li>
              No teacher dashboard yet. Progress lives on the student&apos;s
              results screen.
            </li>
            <li>It cannot diagnose dyslexia or replace an assessment.</li>
            <li>
              It covers spelling only, not reading, comprehension or writing.
            </li>
            <li>
              It does not teach touch typing or measure words per minute.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
            Want the school features when they exist?
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Try it on one student first. If it earns a place, leave an address
            and I will tell you if a classroom version is ready to try.
          </p>
          <TeacherSignup source="free-dyslexia-tool-for-schools" />
        </section>

        <FaqSection faqs={FAQS} />

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="py-4 px-8 bg-blue-600 text-white text-center text-xl font-bold rounded-lg hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
          >
            Try it on one student
          </Link>
          <Link
            href="/for-teachers"
            className="py-4 px-8 bg-gray-200 dark:bg-gray-800 text-black dark:text-white text-center text-xl font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            More for teachers
          </Link>
        </div>
      </article>
    </main>
  );
}
