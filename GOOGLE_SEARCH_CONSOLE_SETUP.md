# Google Search Console Setup Guide

Follow these steps to set up Google Search Console for LexiKey and improve your SEO visibility.

## Prerequisites

1. A Google account
2. Your site deployed and accessible via HTTPS
3. Access to your domain's DNS settings (if using domain verification)

## Step 1: Add Property to Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click "Add Property"
3. Choose "URL prefix" method (recommended for Next.js apps)
4. Enter your site URL: `https://lexikey.app` (or your actual domain)
5. Click "Continue"

## Step 2: Verify Ownership

You have several verification options:

### Option A: HTML File Upload (Easiest for Next.js)

1. Download the HTML verification file from Google Search Console
2. Place it in your `public/` directory
3. Deploy your site
4. Click "Verify" in Search Console

### Option B: HTML Tag (Recommended)

1. Copy the meta tag provided by Google Search Console
2. Add it to your `.env.local` file:
   ```
   NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-verification-code-here
   ```
3. The meta tag is already configured in `app/layout.tsx`
4. Deploy your site
5. Click "Verify" in Search Console

### Option C: DNS Verification

1. Add a TXT record to your domain's DNS settings
2. Use the value provided by Google Search Console
3. Wait for DNS propagation (can take up to 48 hours)
4. Click "Verify" in Search Console

## Step 3: Submit Your Sitemap

1. Once verified, go to "Sitemaps" in the left sidebar
2. Enter: `https://lexikey.app/sitemap.xml`
3. Click "Submit"
4. Wait a few minutes, then refresh to see if it was successfully submitted

## Step 4: Request Indexing (Optional)

1. Go to "URL Inspection" tool
2. Enter your homepage URL: `https://lexikey.app`
3. Click "Request Indexing"
4. Repeat for important pages:
   - `/practice`
   - `/placement-test`
   - `/settings`

## Step 5: Monitor Performance

After a few days/weeks, check:

1. **Performance Report**: See which queries bring users to your site
2. **Coverage Report**: Check for indexing errors
3. **Mobile Usability**: Ensure your site works well on mobile
4. **Core Web Vitals**: Monitor page speed and user experience metrics

## Step 6: Set Up Email Notifications

1. Go to Settings → Users and permissions
2. Add email addresses that should receive alerts
3. Configure notification preferences for:
   - Critical issues
   - Security issues
   - Manual actions

## Environment Variables

Make sure these are set in your production environment:

```bash
NEXT_PUBLIC_SITE_URL=https://lexikey.app
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-verification-code
```

## Additional SEO Checklist

- [x] Sitemap.xml created (`/app/sitemap.ts`)
- [x] Robots.txt created (`/app/robots.ts`)
- [x] Meta tags configured (Open Graph, Twitter Cards)
- [x] Structured data (JSON-LD) added
- [x] Canonical URLs set
- [ ] Create `public/og-image.png` (1200x630px) for social sharing
- [ ] Create `public/manifest.json` for PWA support
- [ ] Set up Google Analytics (optional but recommended)
- [ ] Submit to Bing Webmaster Tools (optional)

## Troubleshooting

### Sitemap Not Found
- Ensure `app/sitemap.ts` exists and exports default function
- Check that `NEXT_PUBLIC_SITE_URL` is set correctly
- Verify sitemap is accessible at `/sitemap.xml`

### Verification Failed
- Double-check meta tag is in `<head>` section
- Ensure site is deployed and accessible
- Try a different verification method

### Pages Not Indexing
- Check robots.txt isn't blocking crawlers
- Ensure pages return 200 status codes
- Use URL Inspection tool to debug specific pages
- Submit sitemap and request indexing manually

## Next Steps

1. **Monitor regularly**: Check Search Console weekly for issues
2. **Optimize content**: Use search query data to improve content
3. **Fix errors**: Address any crawl errors or indexing issues
4. **Track rankings**: Use Search Console data to measure SEO progress
