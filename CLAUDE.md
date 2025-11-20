# CLAUDE.md - LexiKey Project Guide

This file provides guidance to Claude Code when working with code in this repository.

## 🎯 Project Vision

**LexiKey is a B2B literacy intervention tool disguised as a B2C typing app.**

It's not just a typing app; it's a reading intervention tool that uses touch-typing muscle memory to reinforce phonics and spelling for dyslexic students. By combining the **Orton-Gillingham** approach with adaptive typing practice, we solve two problems at once: computer literacy and reading fluency.

## 🛠 Tech Stack

- **Frontend**: Next.js 16+ (App Router, TypeScript)
- **State Management**: Local React state (keystroke logic handled **locally** to prevent DB lag)
- **Backend**: Convex (Reactive DB, Serverless functions)
- **Authentication**: Clerk (Pre-built UI)
- **Styling**: Tailwind CSS 4 (WCAG AAA compliance focused)
- **Theme**: next-themes (Dark mode by default, supports light/system)
- **TTS**: Web Speech API (Native browser, $0 cost, low latency)
- **Analytics**: PostHog
- **Hosting**: Vercel

## 📂 Project Structure

```
/Users/jamesdimonaco/me/lexikey/
├── app/
│   ├── layout.tsx              # Root layout with ThemeProvider
│   ├── page.tsx                # Home page
│   ├── practice/
│   │   └── page.tsx           # Practice session page
│   └── not-found.tsx          # 404 page
├── components/
│   ├── TypingEngine.tsx       # Main typing component (local-first)
│   ├── AccessibilitySettings.tsx
│   ├── theme-provider.tsx     # next-themes provider
│   └── mode-toggle.tsx        # Dark/light mode toggle
├── contexts/
│   └── AccessibilityContext.tsx
├── hooks/
│   └── useTTS.ts              # Text-to-speech hook
└── lib/
    └── types.ts               # TypeScript definitions
```

## 💡 Strategic Differentiation

### The Problem with "Just Typing"
If you only teach typing, you compete with MonkeyType (Free). Users churn once they hit 40 WPM.

### The LexiKey Solution
We organize lessons by **Phonics Rules**, not just word difficulty:
- **Lesson 1:** CVC Words (Cat, Bat, Hat)
- **Lesson 2:** Silent E (Rate, Bite, Hope)
- **Lesson 3:** Common Reversals (b/d, p/q distinction)

**Value Prop:** "Help your child learn to spell *through* their fingers."

## 🧠 Evidence-Based Design Decisions

### 1. Font Reality
- **Truth**: Research shows OpenDyslexic provides no statistical benefit over Arial/Helvetica.
- **Strategy**: Default to Helvetica/Arial with extra letter spacing.
- **User Choice**: Offer OpenDyslexic in settings (placebo is powerful) but educate users.

### 2. Orton-Gillingham Integration
- Explicitly teach word structure
- Multi-sensory: See + Hear + Type

### 3. Latency Management (CRITICAL)
- **Do NOT write every keystroke to Convex**
- Validate typing **locally in the browser**
- Only push result summaries (Word X: Correct, Time: 1.2s) to DB

## 🎨 Accessibility & Design

### Dark Mode
- Default theme: `dark`
- Supports: `light`, `dark`, `system`
- Toggle in header via `<ModeToggle />`
- All components use `dark:` Tailwind classes

### Accessibility Features
- High contrast mode (pure black/white)
- Large cursor option
- Non-blinking cursor
- Adjustable font sizes (16-48px)
- Letter spacing controls (0-8px)
- No timer pressure mode
- Blind mode (hide text for muscle memory)
- TTS with adjustable speed

### Color Scheme
**Dark Mode (Default):**
- Background: Black (#000000) / Gray-900 (#111827)
- Text: White (#FFFFFF) / Gray-300 (#D1D5DB)
- Borders: Gray-800 (#1F2937)
- Accents: Blue-500, Green-400, Purple-400

**Light Mode:**
- Background: Gray-50 (#F9FAFB) / White (#FFFFFF)
- Text: Black (#000000) / Gray-700 (#374151)
- Borders: Gray-200 (#E5E7EB)
- Accents: Blue-600, Green-600, Purple-600

## 📊 Core Features

### Phase 1: MVP (The Engine) ✅ Completed
- ✅ **Phonics-Based Word Seeder** - Words grouped by phonics tags
- ✅ **Local-First Typing Engine** - Zero-latency, blind mode toggle
- ✅ **The "Bucket" System** - Hesitation >1.5s → Review Bucket
- ✅ **Accessibility UI** - WCAG AAA compliant

### Phase 2: School Features (B2B Revenue)
- [ ] **IEP Report Generator** 💰 - PDF reports for teachers
- [ ] **Assignment System** - Teachers create homework lists
- [ ] **Classroom Management** - Teacher→Students relationships

### Phase 3: Engagement
- [ ] **Co-op Story Mode** - Multiplayer collaborative typing
- [ ] **Streak Freeze** - Accommodate bad days without penalty

## 🗄 Data Models

```typescript
// Users
users: {
  clerkId, name, role: "student" | "teacher" | "parent",
  settings: { font, fontSize, contrast, voiceSpeed, showHints },
  stats: { totalWords, currentStreak, lastPracticeDate }
}

// Curriculum
wordLibrary: {
  word,
  phonicsGroup: "silent-e" | "digraph-th" | "blend-st",
  difficultyLevel: 1-10,
  sentenceContext
}

// Session Summaries (NOT keystrokes!)
practiceSessions: {
  userId, mode, phonicsGroupFocus,
  wordsAttempted: number,
  accuracy: number,
  durationSeconds: number,
  struggleWords: string[], // word IDs for review
  timestamp
}

// Bucket System
userStruggleWords: {
  userId, wordId, errorCount,
  lastReviewedAt, nextReviewAt
}

// B2B
classrooms: {
  teacherId, name, studentIds: []
}
```

## 💰 Business Model

### Free Tier (Trojan Horse)
- Core typing practice
- Standard phonics lists
- Web Speech TTS
- **Goal**: Build SEO, let teachers verify it works

### School License (Revenue)
- **$199/year per teacher** (30 students)
- **$3/student** district-wide
- **Killer Features:**
  - IEP Report Generator (saves hours)
  - Custom CSV word list uploads
  - Class management dashboard
  - COPPA/FERPA compliance

### Premium Individual
- **$5/month**
- Advanced analytics
- Unlimited custom lists
- Premium TTS voices (future)

## 🚨 Critical Rules

### Performance
1. **NEVER write individual keystrokes to DB**
2. Validate typing locally (zero latency)
3. Only persist session summaries
4. Track hesitations locally, flag for review

### Accessibility
1. Default to dark mode
2. Support light/dark/system themes
3. Always use `dark:` classes for theme support
4. WCAG AAA compliance
5. No timer pressure by default

### Data
1. Words MUST be categorized by phonics rules
2. Quality over quantity for word lists
3. Orton-Gillingham approach
4. Context sentences for TTS

### Code Style
1. Use TypeScript strictly
2. Components should be client-side (`"use client"`)
3. Follow Next.js 15 App Router conventions
4. Use Tailwind for all styling

## 📈 Key Metrics

- **User hesitations** (>1.5s pause)
- **Backspace count** (>3 indicates struggle)
- **Accuracy per phonics group**
- **Time per word**
- **Words added to review bucket**

## 🎯 Target Users

### Primary: Teachers & Schools
- Special Education Coordinators
- Reading interventionists
- IEP-focused educators
- Sales cycle: 6-12 months

### Secondary: Parents
- Parents of dyslexic students
- Homeschoolers
- Early literacy advocates

## ⚠️ Known Risks

1. **Schools are slow** - 6-12 month sales cycles
2. **Curriculum quality** - Bad phonics categorization = failure
3. **Gamification balance** - Must be "calm but engaging"
4. **Competition** - MonkeyType is free, must differentiate on literacy

## 🔄 Development Workflow

### Adding New Features
1. Check if it serves B2B (teachers) or B2C (students)
2. Prioritize B2B features (that's the revenue)
3. Keep B2C free tier functional (that's the funnel)
4. Always maintain accessibility standards

### Testing
1. Test with both light and dark themes
2. Verify WCAG AAA compliance
3. Test TTS functionality
4. Ensure zero-latency typing experience
5. Validate local-first architecture

### Deployment
- Hosted on Vercel
- Convex for backend
- PostHog for analytics
- Clerk for auth

## 📝 Common Tasks

### Adding a new component
```typescript
"use client"; // Required for client components

import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useTheme } from "next-themes";

export function MyComponent() {
  const { settings } = useAccessibility();
  const { theme } = useTheme();

  return (
    <div className="bg-white dark:bg-gray-900 p-4">
      {/* Always use dark: classes */}
    </div>
  );
}
```

### Working with TTS
```typescript
import { useTTS } from "@/hooks/useTTS";

const { speakWord, speakLetter } = useTTS(
  settings.voiceSpeed,
  settings.ttsEnabled
);

speakWord("cat");
```

### Local-first validation
```typescript
// ✅ Good: Local validation
const handleKeyPress = (char: string) => {
  const isCorrect = char === expectedChar;
  setFeedback(isCorrect ? "correct" : "incorrect");
  // Only track, don't write to DB yet
};

// ❌ Bad: Writing every keystroke
const handleKeyPress = async (char: string) => {
  await convex.mutation(api.keystrokes.create, { char }); // NO!
};
```

## 🎓 Learning Resources

- [Orton-Gillingham Approach](https://www.ortonacademy.org/)
- [WCAG AAA Guidelines](https://www.w3.org/WAI/WCAG2AAA-Conformance)
- [Web Speech API Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [next-themes Documentation](https://github.com/pacocoursey/next-themes)

## 💡 Remember

> "It's not about typing speed. It's about reading fluency through muscle memory."

The app should feel calm, focused, and educational - not gamified or stressful. We're teaching phonics, not creating the next MonkeyType.
