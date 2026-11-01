export type Faq = {
  question: string;
  answer: string;
};

/**
 * Renders a visible FAQ and the matching FAQPage JSON-LD from one list, so the
 * structured data an assistant quotes can never drift from what the page says.
 * Schema that does not match the page is a violation, not a shortcut.
 */
export function FaqSection({ faqs }: { faqs: Faq[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };

  return (
    <section className="mb-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          // "<" is escaped so no answer text can close the script tag.
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />
      <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
        Questions people ask
      </h2>
      <dl className="space-y-6">
        {faqs.map(({ question, answer }) => (
          <div key={question}>
            <dt className="font-semibold text-black dark:text-white mb-1">
              {question}
            </dt>
            <dd className="text-gray-700 dark:text-gray-300">{answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
