import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works | Orton-Gillingham Spelling Through Typing",
  description: "Learn how LexiKey uses the Orton-Gillingham method and multi-sensory learning to teach spelling through typing. See it, hear it, type it - build muscle memory that makes spelling stick.",
  keywords: [
    "orton gillingham method",
    "multi-sensory spelling",
    "how to teach spelling",
    "muscle memory spelling",
    "spelling through typing",
    "dyslexia teaching method",
    "phonics based spelling",
    "structured literacy",
    "spelling intervention method",
  ],
  openGraph: {
    title: "How LexiKey Works | Multi-Sensory Spelling Practice",
    description: "Discover the science behind typing-based spelling practice. Orton-Gillingham method meets modern technology.",
  },
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
