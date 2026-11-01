import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orton-Gillingham Spelling Practice Online, Free",
  description:
    "Free online spelling practice organized by Orton-Gillingham phonics patterns: short vowels, magic e, digraphs, vowel teams, r-controlled vowels and more. For practice between lessons, at home or in school. No account needed.",
  keywords: [
    "orton gillingham spelling practice",
    "orton gillingham online free",
    "orton gillingham at home",
    "orton gillingham practice app",
    "structured literacy spelling practice",
    "phonics spelling practice online",
    "multisensory spelling practice",
  ],
  // The root layout declares canonical "/" and child routes inherit it, which
  // would tell Google this page is a duplicate of the homepage.
  alternates: {
    canonical: "/orton-gillingham-spelling-practice",
  },
  openGraph: {
    title: "Orton-Gillingham Spelling Practice Online | LexiKey",
    description:
      "The practice part of Orton-Gillingham, free and online: words grouped by phonics rule, spoken aloud, typed until they stick.",
  },
};

export default function OrtonGillinghamSpellingPracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
