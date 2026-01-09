import Link from "next/link";

/**
 * Layout for static content pages (no auth needed)
 * Pages: /for-parents, /for-teachers, /how-it-works, /privacy, /terms
 */
export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-950 p-4 border-b-2 border-gray-200 dark:border-gray-800 flex flex-row justify-between items-center">
        <Link
          href="/"
          className="text-xl font-bold text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          LexiKey
        </Link>
        <Link
          href="/"
          className="text-sm font-medium px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Practicing
        </Link>
      </header>
      {children}
    </>
  );
}
