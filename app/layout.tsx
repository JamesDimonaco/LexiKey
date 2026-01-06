import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { AccessibilityStyler } from "@/components/AccessibilityStyler";
import { ThemeProvider } from "@/components/theme-provider";
import { PostHogProvider } from "@/components/PostHogProvider";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lexikey.org';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: '/',
  },
  title: {
    default: "LexiKey - Free Spelling Practice & Typing Games for Kids",
    template: "%s | LexiKey",
  },
  description: "Free spelling practice through typing. Help kids learn to spell with phonics-based games and repetition. Perfect for struggling spellers, dyslexic learners, and homeschool families.",
  keywords: [
    // Broad terms (top of funnel)
    "spelling practice for kids",
    "spelling games online free",
    "learn to spell",
    "spelling practice app",
    "typing games for kids",
    "how to improve spelling",
    "spelling homework help",
    // Phonics/Education terms
    "phonics practice online",
    "orton gillingham at home",
    "multisensory spelling",
    "phonics typing games",
    "learn spelling patterns",
    // Specific needs (bottom of funnel)
    "dyslexia spelling practice",
    "spelling for struggling readers",
    "spelling intervention program",
    "muscle memory spelling",
  ],
  authors: [{ name: "LexiKey" }],
  creator: "LexiKey",
  publisher: "LexiKey",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "LexiKey",
    title: "LexiKey - Free Spelling Practice & Typing Games for Kids",
    description: "Free spelling practice through typing. Help kids learn to spell with phonics-based games. Perfect for struggling spellers and homeschool families.",
    images: [
      {
        url: `${baseUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "LexiKey - Free Spelling Practice & Typing Games for Kids",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LexiKey - Free Spelling Practice & Typing Games for Kids",
    description: "Free spelling practice through typing. Help kids learn to spell with phonics-based games. Perfect for struggling spellers and homeschool families.",
    images: [`${baseUrl}/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lexikey.org';
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "LexiKey",
              description: "Free spelling practice through typing. Help kids learn to spell with phonics-based games and repetition.",
              url: siteUrl,
              applicationCategory: "EducationalApplication",
              operatingSystem: "Web",
              audience: {
                "@type": "EducationalAudience",
                educationalRole: "student",
                audienceType: "Students, parents, teachers, homeschool families",
              },
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              keywords: "spelling practice, typing games, phonics, learn to spell, kids education",
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-black text-black dark:text-white flex flex-col min-h-screen`}
      >
        <PostHogProvider>
          <ClerkProvider dynamic>
            <ConvexClientProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
              >
                <AccessibilityProvider>
                  <AccessibilityStyler />
                  <div className="flex-1">
                    {children}
                  </div>
                  <Footer />
                </AccessibilityProvider>
              </ThemeProvider>
            </ConvexClientProvider>
          </ClerkProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
