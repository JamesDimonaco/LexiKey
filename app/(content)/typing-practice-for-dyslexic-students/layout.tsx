import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Typing Practice for Dyslexic Teenagers and Secondary Students",
  description:
    "Free typing practice for dyslexic students in secondary school. Words are grouped by spelling rule and spoken aloud, hesitations are tracked, and there is no timer or leaderboard. Used in class by a secondary school.",
  keywords: [
    "typing practice for dyslexic students",
    "typing for dyslexic teenagers",
    "dyslexia typing program secondary school",
    "typing practice dyslexia free",
    "spelling practice for dyslexic teenagers",
    "typing app for dyslexic child",
  ],
  // The root layout declares canonical "/" and child routes inherit it, which
  // would tell Google this page is a duplicate of the homepage.
  alternates: {
    canonical: "/typing-practice-for-dyslexic-students",
  },
  openGraph: {
    title: "Typing Practice for Dyslexic Teenagers | LexiKey",
    description:
      "Typing practice where the typing teaches the spelling. Built for dyslexic students who are past the age of cartoon spelling games.",
  },
};

export default function TypingPracticeForDyslexicStudentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
