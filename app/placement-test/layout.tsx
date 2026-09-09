import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Placement Test",
  description:
    "Find your spelling level with a quick typing test. We'll identify which phonics patterns you need to practice and set your starting difficulty.",
  // The root layout declares canonical "/" and child routes inherit it, which
  // would tell Google this page is a duplicate of the homepage.
  alternates: {
    canonical: "/placement-test",
  },
  openGraph: {
    title: "Spelling Placement Test | LexiKey",
    description:
      "Find your spelling level with a quick typing test. Get personalized practice based on your results.",
  },
};

export default function PlacementTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
