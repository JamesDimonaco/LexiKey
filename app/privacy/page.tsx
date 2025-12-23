import { Metadata } from "next";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "LexiKey Privacy Policy - How we collect, use, and protect your data",
};

export default function PrivacyPolicy() {
  return (
    <>
      <Header />
      <main className="bg-gray-50 dark:bg-black min-h-screen p-8">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
          <h1 className="text-3xl font-bold mb-6 text-black dark:text-white">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
                1. Introduction
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                LexiKey ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our literacy intervention application.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
                2. Information We Collect
              </h2>
              <h3 className="text-xl font-semibold mb-3 text-black dark:text-white">
                2.1 Account Information
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you create an account, we collect:
              </p>
              <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Email address</li>
                <li>Name (if provided)</li>
                <li>Authentication credentials (handled securely by Clerk)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-black dark:text-white">
                2.2 Usage Data
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We automatically collect information about how you use LexiKey:
              </p>
              <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Practice session data (words typed, accuracy, time spent)</li>
                <li>Placement test results</li>
                <li>Progress and learning statistics</li>
                <li>Settings preferences</li>
                <li>Device information and browser type</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-black dark:text-white">
                2.3 Analytics Data
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use PostHog analytics to understand how users interact with our application. This includes page views, feature usage, and performance metrics. This data is anonymized and aggregated.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
                3. How We Use Your Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Provide and maintain the LexiKey service</li>
                <li>Personalize your learning experience</li>
                <li>Track your progress and adapt difficulty levels</li>
                <li>Improve our application and develop new features</li>
                <li>Analyze usage patterns to enhance user experience</li>
                <li>Communicate with you about your account or the service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
                4. Data Storage and Security
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Your data is stored securely using:
              </p>
              <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>Convex</strong> - For user progress and learning data</li>
                <li><strong>Clerk</strong> - For authentication and user account information</li>
                <li><strong>PostHog</strong> - For analytics data</li>
                <li><strong>Local Storage</strong> - For anonymous users' temporary data</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
                5. Data Sharing
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only:
              </p>
              <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300 space-y-2">
                <li>With service providers who assist us in operating our application (Convex, Clerk, PostHog)</li>
                <li>When required by law or to protect our rights</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
                6. Your Rights
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and associated data</li>
                <li>Opt-out of analytics tracking (contact us for instructions)</li>
                <li>Export your data</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                To exercise these rights, please contact us or delete your account through the settings page.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
                7. Children's Privacy
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                LexiKey is designed to support learners of all ages, including children. We comply with applicable privacy laws including COPPA. If you are a parent or guardian and believe your child has provided us with personal information, please contact us to have it removed.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
                8. Cookies and Local Storage
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use cookies and local storage to:
              </p>
              <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Maintain your session</li>
                <li>Store your preferences and settings</li>
                <li>Enable anonymous user functionality</li>
                <li>Track analytics (anonymized)</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You can control cookies through your browser settings, though this may affect functionality.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
                9. Changes to This Policy
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
                10. Contact Us
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have questions about this Privacy Policy, please contact us through your preferred method or visit our GitHub repository.
              </p>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
