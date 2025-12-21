"use client";

import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { Header } from "@/components/Header";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PracticeSession } from "./practice/PracticeSession";
import { useSyncPlacementData } from "@/hooks/useSyncPlacementData";

export default function Home() {
  useSyncPlacementData();

  return (
    <>
      <Header />
      <main className="bg-gray-50 dark:bg-black min-h-screen p-8">
        <SignedOut>
          <LandingContent />
        </SignedOut>
        <SignedIn>
          <AuthenticatedContent />
        </SignedIn>
      </main>
    </>
  );
}

function AuthenticatedContent() {
  const { user } = useUser();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const hasCompletedPlacementTest = currentUser?.stats.hasCompletedPlacementTest ?? false;

  // Show placement test prompt if not completed
  if (currentUser && !hasCompletedPlacementTest) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 text-center">
          <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">
            Welcome to LexiKey!
          </h2>
          <p className="text-gray-700 dark:text-gray-400 mb-6">
            Take a quick placement test to personalize your learning experience.
          </p>
          <Link
            href="/placement-test"
            className="block w-full py-4 bg-blue-600 text-white text-center text-xl font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Take Placement Test
          </Link>
          <button
            onClick={() => {/* Skip for now - they can start practicing */}}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <Link href="/practice">Skip for now</Link>
          </button>
        </div>
      </div>
    );
  }

  // Show practice session directly
  return (
    <div className="flex flex-col items-center justify-center">
      <PracticeSession />
    </div>
  );
}

function LandingContent() {
  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-8">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-4 text-black dark:text-white">LexiKey</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Kinesthetic Literacy & Typing for Dyslexic Students
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
        <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">Welcome to LexiKey!</h2>
        <p className="text-gray-700 dark:text-gray-400 mb-6">
          A literacy intervention tool that uses touch-typing muscle memory to
          reinforce phonics and spelling. Combining the Orton-Gillingham
          approach with adaptive typing practice.
        </p>

        <div className="space-y-4">
          <SignInButton mode="modal">
            <button className="block w-full py-4 bg-blue-600 text-white text-center text-xl font-bold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
              Get Started
            </button>
          </SignInButton>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <FeatureCard
              icon="👁️"
              title="Accessibility First"
              description="High contrast, adjustable fonts, customizable cursor - designed for dyslexic students"
            />
            <FeatureCard
              icon="🔊"
              title="Multi-Sensory"
              description="See + Hear + Type with Web Speech API for reinforced learning"
            />
            <FeatureCard
              icon="📚"
              title="Phonics-Based"
              description="Words organized by Orton-Gillingham phonics patterns, not just frequency"
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-bold mb-2 text-black dark:text-white">Key Features:</h3>
        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
          <li>✓ Zero-latency local-first typing validation</li>
          <li>✓ Automatic &ldquo;bucket system&rdquo; for struggling words</li>
          <li>✓ No timer pressure option</li>
          <li>✓ Blind mode for muscle memory practice</li>
          <li>✓ Tracks hesitations and patterns for review</li>
        </ul>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-2 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border-2 border-gray-300 dark:border-gray-700">
      <div className="text-3xl">{icon}</div>
      <h3 className="font-bold text-black dark:text-white">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}
