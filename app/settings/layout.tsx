import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Customize your LexiKey experience. Adjust accessibility options, session preferences, and learning settings.",
  openGraph: {
    title: "Settings | LexiKey",
    description:
      "Customize your learning experience with accessibility options and session preferences.",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
