"use client";

import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Header } from "@/components/Header";
import { useSyncPlacementData } from "@/hooks/useSyncPlacementData";
import { AuthWall } from "./AuthWall";
import { PracticeSession } from "./PracticeSession";

export default function PracticePage() {
  useSyncPlacementData();

  return (
    <>
      <SignedOut>
        <AuthWall />
      </SignedOut>
      <SignedIn>
        <Header />
        <main className="bg-gray-50 dark:bg-black min-h-screen p-8 flex flex-col items-center justify-center">
          <PracticeSession />
        </main>
      </SignedIn>
    </>
  );
}
