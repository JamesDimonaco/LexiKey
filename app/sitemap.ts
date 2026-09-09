import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // NEXT_PUBLIC_SITE_URL carries a trailing slash in production, which turned
  // every entry below into a //double-slashed URL — and pointed robots.txt at
  // a sitemap address that does not resolve.
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || 'https://lexikey.org'
  ).replace(/\/+$/, '')

  return [
    {
      // The app itself. Client-rendered behind an auth gate, so a crawler gets
      // a loading state here — /welcome is the page that describes the product.
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/welcome`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/spelling-tutor`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/placement-test`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/for-parents`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/for-teachers`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Note: /settings removed - it's a user-specific page not useful for SEO
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]
}
