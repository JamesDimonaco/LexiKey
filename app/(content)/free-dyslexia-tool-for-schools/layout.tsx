import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Dyslexia Spelling Tool for Schools and Learning Support",
  description:
    "A free spelling tool for dyslexic students that a school can use today: nothing to install, nothing to buy, no student account needed to start. Orton-Gillingham word groups, recorded voices, hesitation tracking. Used in class by a secondary school.",
  keywords: [
    "free dyslexia tool for schools",
    "dyslexia software for schools free",
    "learning support spelling tool",
    "SEN spelling app free",
    "dyslexia spelling intervention free",
    "free spelling program for dyslexic students",
    "special education spelling practice",
  ],
  // The root layout declares canonical "/" and child routes inherit it, which
  // would tell Google this page is a duplicate of the homepage.
  alternates: {
    canonical: "/free-dyslexia-tool-for-schools",
  },
  openGraph: {
    title: "Free Dyslexia Spelling Tool for Schools | LexiKey",
    description:
      "Spelling practice for dyslexic students that runs in a browser, costs nothing and needs no sign-off. What it does today and what it does not do yet.",
  },
};

export default function FreeDyslexiaToolForSchoolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
