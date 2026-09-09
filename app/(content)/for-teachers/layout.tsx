import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spelling Intervention Tool | Orton-Gillingham Typing Practice",
  description: "Free spelling intervention tool for classrooms. Orton-Gillingham based typing practice for struggling readers and dyslexic students. Track progress by phonics patterns.",
  keywords: [
    "spelling intervention program",
    "orton gillingham online",
    "classroom spelling tool",
    "dyslexia intervention",
    "structured literacy program",
    "IEP spelling goals",
    "special education spelling",
    "phonics intervention",
    "multisensory spelling instruction",
  ],
  // The root layout declares canonical "/" and child routes inherit it, which
  // would tell Google this page is a duplicate of the homepage.
  alternates: {
    canonical: "/for-teachers",
  },
  openGraph: {
    title: "Spelling Intervention Tool for Classrooms | LexiKey",
    description: "Orton-Gillingham based spelling practice through typing. Free tool for teachers supporting struggling readers and dyslexic students.",
  },
};

export default function ForTeachersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
