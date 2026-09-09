import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Online Spelling Practice for Kids Who Struggle to Spell",
  description:
    "Free spelling practice that finds your child's level and targets the patterns they get wrong. Words are grouped by phonics rule and practiced through typing, with no timer and no leaderboard. Built for dyslexic learners.",
  keywords: [
    "spelling tutor",
    "spelling tutor for kids",
    "spelling tutor online",
    "spelling help for kids",
    "typing practice spelling",
    "spelling practice app",
    "phonics typing games",
    "learn to spell by typing",
    "dyslexia typing practice",
    "orton gillingham typing",
    "multisensory spelling practice",
    "free spelling practice online",
  ],
  // The root layout declares canonical "/" and child routes inherit it, which
  // would tell Google this page is a duplicate of the homepage.
  alternates: {
    canonical: "/welcome",
  },
  openGraph: {
    title: "LexiKey — Typing Practice That Teaches Spelling",
    description:
      "Words grouped by the spelling rule behind them, not random text. No timer, no leaderboard. Free and no account needed.",
  },
};

export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
