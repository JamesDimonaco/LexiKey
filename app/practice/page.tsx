"use client";

import { Header } from "@/components/Header";
import { PracticeSession } from "./PracticeSession";

export default function PracticePage() {
  return (
    <>
      <Header />
      <main className="bg-gray-50 dark:bg-black min-h-screen p-8 flex flex-col items-center justify-center">
        <PracticeSession />
      </main>
    </>
  );
}
