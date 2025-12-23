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
  title: {
    default: "LexiKey - Spelling & Typing Practice for Dyslexia",
    template: "%s | LexiKey",
  },
  description: "Learn to spell and type through repetition. LexiKey uses muscle memory to make spelling stick for dyslexic learners. Practice phonics patterns until they become automatic.",
  keywords: [
    "dyslexia spelling practice",
    "typing for dyslexia",
    "spell and type",
    "dyslexia repetition",
    "muscle memory spelling",
    "phonics typing",
    "dyslexia keyboard practice",
    "spelling through typing",
    "learn to spell dyslexia",
    "dyslexia learning tool",
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
    icon: "/convex.svg",
    apple: "/convex.svg",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "LexiKey",
    title: "LexiKey - Spelling & Typing Practice for Dyslexia",
    description: "Learn to spell and type through repetition. Make spelling stick with muscle memory practice designed for dyslexic learners.",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "LexiKey - Spelling & Typing Practice for Dyslexia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LexiKey - Spelling & Typing Practice for Dyslexia",
    description: "Learn to spell and type through repetition. Make spelling stick with muscle memory practice designed for dyslexic learners.",
    images: [`${baseUrl}/og-image.png`],
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
              description: "Learn to spell and type through repetition. Muscle memory practice designed for dyslexic learners.",
              url: siteUrl,
              applicationCategory: "EducationalApplication",
              operatingSystem: "Web",
              audience: {
                "@type": "EducationalAudience",
                educationalRole: "student",
                audienceType: "Dyslexic learners, students, teachers",
              },
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
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
