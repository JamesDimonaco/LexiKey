import Link from "next/link";

export default function ForParents() {
  return (
    <main className="bg-gray-50 dark:bg-black min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-black dark:text-white mb-6">
            Help Your Child Learn to Spell
          </h1>

          <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
            LexiKey uses typing practice to build spelling skills through muscle memory.
            Perfect for kids who struggle with spelling, including those with dyslexia.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              Why Typing Helps Spelling
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li>Repetition builds muscle memory - fingers learn the patterns</li>
              <li>Multi-sensory learning: see it, hear it, type it</li>
              <li>No pressure - practice at your own pace</li>
              <li>Phonics-based word groups reinforce spelling rules</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              Built for Struggling Spellers
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li>Words grouped by phonics patterns (silent-e, digraphs, blends)</li>
              <li>Struggling words automatically added to review</li>
              <li>Adjustable font size and letter spacing</li>
              <li>Dark mode to reduce eye strain</li>
              <li>Text-to-speech to hear words spoken aloud</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              Free to Use
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Start practicing immediately - no account required. Create a free account
              to save progress across devices.
            </p>
          </section>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/"
              className="inline-block py-4 px-8 bg-blue-600 text-white text-center text-xl font-bold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Practicing Free
            </Link>
            <Link
              href="/placement-test"
              className="inline-block py-4 px-8 bg-gray-200 dark:bg-gray-800 text-black dark:text-white text-center text-xl font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              Take Placement Test
            </Link>
          </div>
      </div>
    </main>
  );
}
