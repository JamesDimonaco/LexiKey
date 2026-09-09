import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // NEXT_PUBLIC_SITE_URL carries a trailing slash in production, which turned
  // every entry below into a //double-slashed URL — and pointed robots.txt at
  // a sitemap address that does not resolve.
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || 'https://lexikey.org'
  ).replace(/\/+$/, '')
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
