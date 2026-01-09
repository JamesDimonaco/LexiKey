import Link from "next/link";

export default function HowItWorks() {
  return (
    <main className="bg-gray-50 dark:bg-black min-h-screen p-8">
      <article className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-black dark:text-white mb-6">
            How LexiKey Works
          </h1>

          <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
            LexiKey teaches spelling through typing using evidence-based methods
            that help words stick in long-term memory.
          </p>

          {/* The Problem */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              Why Traditional Spelling Practice Doesn&apos;t Work
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Most spelling practice asks kids to memorize words through repetition
              alone—write it 10 times, take a test on Friday, forget it by Monday.
              This approach fails because it doesn&apos;t engage multiple learning pathways.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              For struggling spellers and dyslexic learners, this is especially
              frustrating. The words simply don&apos;t stick, no matter how many times
              they write them.
            </p>
          </section>

          {/* The Solution */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              Multi-Sensory Learning Through Typing
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              LexiKey uses a multi-sensory approach based on the Orton-Gillingham
              method—the gold standard for teaching reading and spelling to
              dyslexic learners for over 80 years.
            </p>
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 mb-4">
              <h3 className="font-semibold text-black dark:text-white mb-3">
                Three Pathways Working Together
              </h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex gap-3">
                  <span className="text-blue-500 font-bold">See</span>
                  <span>The word appears on screen, engaging visual memory</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-500 font-bold">Hear</span>
                  <span>Text-to-speech reads the word aloud, engaging auditory memory</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-purple-500 font-bold">Type</span>
                  <span>Fingers learn the pattern, building muscle memory</span>
                </li>
              </ul>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              When you type a word, your fingers learn the sequence of letters as
              a motor pattern. This is the same way musicians learn scales or
              athletes learn movements—through repetition until it becomes automatic.
            </p>
          </section>

          {/* Phonics-Based */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              Organized by Phonics Patterns
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Words in LexiKey aren&apos;t random—they&apos;re grouped by spelling patterns.
              This helps learners recognize rules that apply to many words, not just
              memorize individual words.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                <h4 className="font-semibold text-black dark:text-white mb-2">CVC Words</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  cat, bat, sit, hop
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                <h4 className="font-semibold text-black dark:text-white mb-2">Silent-E</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  make, bike, hope, cute
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                <h4 className="font-semibold text-black dark:text-white mb-2">Digraphs</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ship, chat, thin, when
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                <h4 className="font-semibold text-black dark:text-white mb-2">Blends</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  stop, trip, blend, crisp
                </p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              Once a learner masters the silent-e pattern with &quot;make,&quot; they can
              apply the same rule to hundreds of other words.
            </p>
          </section>

          {/* The Bucket System */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              Adaptive Review System
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              LexiKey watches how you type each word. If you hesitate, backspace
              multiple times, or make errors, that word gets flagged for extra
              practice.
            </p>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 p-6 mb-4">
              <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                How Words Graduate
              </h3>
              <p className="text-amber-700 dark:text-amber-300 text-sm">
                Struggle words stay in your review queue until you type them
                correctly three times in a row. This ensures the pattern is truly
                learned before moving on.
              </p>
            </div>
          </section>

          {/* No Pressure */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              Learning Without Pressure
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              There are no timers counting down. No leaderboards. No penalty for
              taking your time. Research shows that stress and anxiety impair
              learning, especially for struggling readers.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              LexiKey is designed to be calm and focused. Practice at your own
              pace, take breaks when needed, and build confidence one word at a time.
            </p>
          </section>

          {/* Accessibility */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              Built for Accessibility
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Every learner is different. LexiKey includes options to customize
              the experience:
            </p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>Adjustable font sizes and letter spacing</li>
              <li>High contrast and dark mode options</li>
              <li>Text-to-speech at adjustable speeds</li>
              <li>Dictation mode (hear the word, type it without seeing it)</li>
              <li>No flashing or distracting animations</li>
            </ul>
          </section>

          {/* CTA */}
          <section className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-8 text-center">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              Ready to Try It?
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              LexiKey is free to use. No account required to start practicing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="inline-block py-3 px-8 bg-blue-600 text-white text-center font-bold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Practicing
              </Link>
              <Link
                href="/placement-test"
                className="inline-block py-3 px-8 bg-white dark:bg-gray-800 text-black dark:text-white text-center font-bold rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Take Placement Test
              </Link>
            </div>
          </section>
      </article>
    </main>
  );
}
