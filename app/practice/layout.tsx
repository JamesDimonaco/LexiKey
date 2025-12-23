import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Practice",
  description:
    "Practice spelling through typing. Repeat words until they stick. Adaptive difficulty that adjusts to your level - perfect for dyslexic learners.",
  openGraph: {
    title: "Practice Spelling & Typing | LexiKey",
    description:
      "Practice spelling through typing. Repeat words until they stick with muscle memory.",
  },
};

export default function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
