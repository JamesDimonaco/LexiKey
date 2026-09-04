# LexiKey

A typing-based literacy intervention tool that uses muscle memory to reinforce phonics and spelling for dyslexic learners.

**[lexikey.org](https://www.lexikey.org)**

## What is LexiKey?

LexiKey combines touch-typing practice with the Orton-Gillingham approach to teaching phonics. By typing words organized by phonetic patterns (CVC, silent-e, digraphs, etc.), learners build spelling skills through their fingers.

## Features

- **Phonics-based curriculum** - Words grouped by phonetic rules, not just difficulty
- **Adaptive learning** - Tracks struggle words and adjusts difficulty automatically
- **Accessibility-first** - Dark mode, adjustable fonts, high contrast, TTS support
- **Dictation mode** - Listen and type for multi-sensory learning
- **Progress tracking** - Stats, streaks, and performance analytics

## Tech Stack

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: Convex (database + serverless functions)
- **Auth**: Clerk
- **Analytics**: PostHog
- **Hosting**: Vercel

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

## Environment Variables

Create a `.env.local` file:

```
CONVEX_DEPLOYMENT=your_convex_deployment
NEXT_PUBLIC_CONVEX_URL=your_convex_url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
CLERK_JWT_ISSUER_DOMAIN=your_clerk_issuer_domain
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## License

Proprietary - All rights reserved
