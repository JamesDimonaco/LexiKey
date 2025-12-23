"use client";

import { Header } from "@/components/Header";
import { PracticeSession } from "./PracticeSession";
import { usePostHogPageView } from "@/hooks/usePostHog";

export default function PracticePage() {
  usePostHogPageView();
  return (
    <>
      <Header />
      <main className="bg-gray-50 dark:bg-black min-h-screen p-8 flex flex-col items-center justify-center">
        <PracticeSession />
      </main>
    </>
  );
}
