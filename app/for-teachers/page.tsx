"use client";

import Link from "next/link";
import { Header } from "@/components/Header";

export default function ForTeachers() {
  return (
    <>
      <Header />
      <main className="bg-gray-50 dark:bg-black min-h-screen p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-black dark:text-white mb-6">
            Spelling Intervention Tool for Classrooms
          </h1>

          <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
            LexiKey reinforces spelling through structured typing practice.
            Built on Orton-Gillingham principles for students who need extra support.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              Orton-Gillingham Approach
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li>Words organized by phonics patterns, not just difficulty</li>
              <li>Multi-sensory: visual, auditory, and kinesthetic learning</li>
              <li>Systematic progression through spelling rules</li>
              <li>Repetition until patterns become automatic</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              Accessibility Built In
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li>WCAG AAA compliant design</li>
              <li>Adjustable font sizes and letter spacing</li>
              <li>High contrast and dark mode options</li>
              <li>Text-to-speech for auditory reinforcement</li>
              <li>No timer pressure - students work at their own pace</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              Progress Tracking
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li>Automatic identification of struggle words</li>
              <li>Words students hesitate on get added to review</li>
              <li>Track accuracy by phonics group</li>
              <li>See which spelling patterns need more practice</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              Free for Individual Use
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Students can start practicing immediately. Create a free account to
              save progress. School licenses coming soon for classroom management
              and IEP reporting features.
            </p>
          </section>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/"
              className="inline-block py-4 px-8 bg-blue-600 text-white text-center text-xl font-bold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try It Free
            </Link>
            <Link
              href="/placement-test"
              className="inline-block py-4 px-8 bg-gray-200 dark:bg-gray-800 text-black dark:text-white text-center text-xl font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              View Placement Test
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
