import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Online Spelling Tutor: What It Can and Can't Replace",
  description:
    "Looking for a spelling tutor for your child? Here's honestly what daily software practice covers, what only a human tutor can do, and how to tell which one you need. Free to try, no account.",
  keywords: [
    "spelling tutor",
    "spelling tutor for kids",
    "spelling tutor online",
    "online spelling tutor",
    "spelling help for kids",
    "spelling tutoring",
    "do i need a spelling tutor",
    "dyslexia tutor alternative",
  ],
  // The root layout declares canonical "/" and child routes inherit it, which
  // would tell Google this page is a duplicate of the homepage.
  alternates: {
    canonical: "/spelling-tutor",
  },
  openGraph: {
    title: "Online Spelling Tutor: What It Can and Can't Replace | LexiKey",
    description:
      "An honest comparison between a human spelling tutor and daily software practice, from someone who is dyslexic and has tried both.",
  },
};

export default function SpellingTutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
