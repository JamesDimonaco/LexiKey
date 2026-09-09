import Link from "next/link";

/**
 * Answers as structured data, so assistants and AI overviews that answer
 * "do I need a spelling tutor" can quote the page instead of guessing.
 * Every answer here restates something visible below — schema that does not
 * match the page is a violation, not a shortcut.
 */
const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Do I need a spelling tutor for my child?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "If your child is behind on spelling and nobody knows why, get an assessment first. If spelling is the specific known problem, daily practice on the right phonics patterns will do more than one hour a week, and you can start that for free.",
      },
    },
    {
      "@type": "Question",
      name: "Can an app replace a spelling tutor?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. A specialist tutor watches a child work and adjusts in the moment, noticing that the problem is confidence rather than phonics, or that a word was misread rather than misspelled. Software cannot do that. What it can do is run every day, which matters because spelling is a memory problem and memory responds to short frequent repetition rather than one long session a week.",
      },
    },
    {
      "@type": "Question",
      name: "Can LexiKey diagnose dyslexia?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Diagnosing dyslexia needs a qualified assessor, and if you suspect it the assessment is worth more than any app. LexiKey can show you which spelling patterns a child keeps missing, which is useful information to bring to someone who can diagnose.",
      },
    },
    {
      "@type": "Question",
      name: "What does LexiKey do between tutoring sessions?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It finds the learner's level with a placement test, groups 1,114 words into 108 phonics patterns following the Orton-Gillingham approach tutors are trained in, and tracks hesitation rather than only errors. A word typed correctly after a long pause returns until it is right three times running.",
      },
    },
  ],
};

/**
 * Search-intent page for "spelling tutor" and its variants.
 *
 * Search Console shows this cluster is most of what LexiKey is already shown
 * for, at zero clicks — the site has never had a page that answers the
 * question being asked. The answer is genuinely "no, and here is what it does
 * instead", so the page says that rather than pretending otherwise.
 */
export default function SpellingTutor() {
  return (
    <main className="bg-gray-100 dark:bg-black min-h-screen p-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      <article className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-black dark:text-white mb-6 text-balance">
          Do you need a spelling tutor?
        </h1>

        <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
          LexiKey is not a tutor, and it would be easy to let you assume
          otherwise. It is daily spelling practice that does some of what a
          tutor does, for free. Here is where the line actually falls, so you
          can work out which one your child needs.
        </p>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
            What a human tutor gives you
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            A good specialist tutor watches your child work and adjusts in the
            moment. They notice that the problem is confidence rather than
            phonics, or that a word was misread rather than misspelled. They
            hold a child&apos;s attention on a bad afternoon. None of that can
            be automated, and this page is not going to claim it can.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            The constraint is arithmetic. Tutoring is priced by the hour and
            usually happens once a week. Spelling is a memory problem, and
            memory responds to short, frequent repetition rather than one long
            session every seven days.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
            What LexiKey does in between
          </h2>
          <ul className="space-y-3 text-gray-700 dark:text-gray-300">
            <li>
              <strong className="text-black dark:text-white">
                Finds the level.
              </strong>{" "}
              A short{" "}
              <Link
                href="/placement-test"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                placement test
              </Link>{" "}
              works out which spelling patterns are already solid, so practice
              starts where the gaps are.
            </li>
            <li>
              <strong className="text-black dark:text-white">
                Teaches by rule, not by list.
              </strong>{" "}
              Words are grouped into 108 phonics patterns following the same{" "}
              <Link
                href="/how-it-works"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Orton-Gillingham
              </Link>{" "}
              approach specialist tutors are trained in. Learning one word in a
              group helps with the rest of it.
            </li>
            <li>
              <strong className="text-black dark:text-white">
                Notices hesitation, not just errors.
              </strong>{" "}
              A word typed correctly after a long pause has not been learned
              yet. Those go into a review bucket and come back until they are
              right three times running.
            </li>
            <li>
              <strong className="text-black dark:text-white">
                Runs every day.
              </strong>{" "}
              Ten minutes daily beats an hour weekly for this particular
              problem, and it costs nothing to do it.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
            What it does not do
          </h2>
          <ul className="space-y-3 text-gray-700 dark:text-gray-300">
            <li>
              It cannot diagnose dyslexia. That needs a qualified assessor, and
              if you suspect it, the assessment is worth more than any app.
            </li>
            <li>
              It does not teach reading, comprehension or writing — only
              spelling, through typing.
            </li>
            <li>
              It will not persuade a reluctant child to sit down. There is no
              reward loop pushing them to come back, on purpose.
            </li>
            <li>
              It cannot tell you why your child is struggling. It can show you
              which patterns they miss, which is a useful thing to bring to
              someone who can.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
            So which do you need?
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            If your child is behind on spelling and nobody knows why, get an
            assessment first. If spelling is the specific problem and you know
            it, daily practice on the right patterns will do more than a weekly
            hour — and you can start that this afternoon for nothing.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            If you already have a tutor, this is what fills the six days
            between sessions. Bring them the list of patterns that keep coming
            back; it is the part they would otherwise spend the first twenty
            minutes working out.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
            Why I built it
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            I am dyslexic. Writing a word out ten times never made it stick, and
            it did not stick for anyone I went to school with either. What
            eventually fixed a handful of words for me was typing them a few
            thousand times as a developer, entirely by accident. LexiKey is that
            on purpose, organized by the rules a tutor would teach.
          </p>
        </section>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="py-4 px-8 bg-blue-600 text-white text-center text-xl font-bold rounded-lg hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
          >
            Try it free
          </Link>
          <Link
            href="/for-parents"
            className="py-4 px-8 bg-gray-200 dark:bg-gray-800 text-black dark:text-white text-center text-xl font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            More for parents
          </Link>
        </div>
      </article>
    </main>
  );
}
