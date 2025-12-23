import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Placement Test",
  description:
    "Find your spelling level with a quick typing test. We'll identify which phonics patterns you need to practice and set your starting difficulty.",
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
