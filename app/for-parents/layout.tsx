import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spelling Practice for Kids | Help Your Child Learn to Spell",
  description: "Free spelling practice app for kids who struggle with spelling. Build muscle memory through typing. Perfect for dyslexic learners, homeschool families, and spelling homework help.",
  keywords: [
    "help child with spelling",
    "spelling practice for kids",
    "child struggling with spelling",
    "spelling homework help",
    "dyslexia spelling help",
    "homeschool spelling program",
    "spelling games for kids",
    "learn to spell app",
  ],
  openGraph: {
    title: "Help Your Child Learn to Spell | LexiKey",
    description: "Free spelling practice through typing. Build muscle memory to make spelling stick. Perfect for struggling spellers and dyslexic learners.",
  },
};

export default function ForParentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
