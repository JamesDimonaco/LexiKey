import { Metadata } from "next";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "LexiKey Terms of Service - Rules and guidelines for using our application",
};

export default function TermsOfService() {
  return (
    <>
      <Header />
      <main className="bg-gray-50 dark:bg-black min-h-screen p-8">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
          <h1 className="text-3xl font-bold mb-6 text-black dark:text-white">
            Terms of Service
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                By accessing or using LexiKey ("the Service"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
                2. Description of Service
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                LexiKey is a literacy intervention tool that uses touch-typing muscle memory to reinforce phonics and spelling. The Service provides adaptive typing practice designed to support learners, including those with dyslexia.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
                3. User Accounts
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You may use LexiKey anonymously or create an account. When you create an account:
              </p>
              <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300 space-y-2">
                <li>You are responsible for maintaining the confidentiality of your account</li>
                <li>You are responsible for all activities that occur under your account</li>
                <li>You must provide accurate and complete information</li>
                <li>You must be at least 13 years old (or have parental consent)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
                4. Acceptable Use
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You agree not to:
              </p>
              <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Use the Service for any illegal purpose</li>
                <li>Attempt to gain unauthorized access to the Service or its systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Use automated systems to access the Service without permission</li>
                <li>Reverse engineer, decompile, or disassemble the Service</li>
                <li>Share your account credentials with others</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
                5. Intellectual Property
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The Service and its original content, features, and functionality are owned by LexiKey and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You retain ownership of any data you create or input into the Service. By using the Service, you grant us a license to use, store, and process your data as necessary to provide the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
                6. User Content
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You are responsible for any content you create or submit through the Service. You represent and warrant that:
              </p>
              <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300 space-y-2">
                <li>You own or have the right to use all content you submit</li>
                <li>Your content does not violate any third-party rights</li>
                <li>Your content is not harmful, offensive, or illegal</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
                7. Service Availability
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We strive to provide reliable service but do not guarantee:
              </p>
              <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Uninterrupted or error-free operation</li>
                <li>That the Service will meet your specific requirements</li>
                <li>That defects will be corrected</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We reserve the right to modify, suspend, or discontinue the Service at any time with or without notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
                8. Disclaimer of Warranties
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                LexiKey is an educational tool and does not provide medical, therapeutic, or professional advice. Results may vary, and we make no guarantees about learning outcomes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
                9. Limitation of Liability
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, LEXIKEY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
                10. Termination
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including if you breach these Terms.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You may terminate your account at any time by deleting it through the settings page or contacting us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
                11. Changes to Terms
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the updated Terms on this page and updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
                12. Governing Law
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which the Service operator is located, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
                13. Contact Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have any questions about these Terms of Service, please contact us through your preferred method or visit our GitHub repository.
              </p>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
