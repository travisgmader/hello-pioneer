# Stack Research — Kinetic Power Website

**Researched:** 2026-05-20
**Overall Confidence:** HIGH (all versions verified via npm; integration patterns verified via official docs and GitHub)

---

## Recommended Stack

| Layer | Choice | Version | Rationale | Confidence |
|-------|--------|---------|-----------|------------|
| Framework | Next.js | 16.x (latest: 16.2.6) | Sanity + Vercel pairing is first-class; App Router enables SSG per page for near-zero TTFB on marketing content; image optimization built-in | HIGH |
| Language | TypeScript | ~5.x (bundled with Next.js) | Sanity TypeGen generates GROQ query types automatically — massive DX win, no manual type maintenance | HIGH |
| CMS | Sanity | 5.26.0 | Non-dev content management is a hard requirement; Sanity Studio UI is accessible to gym owners; GROQ query language returns exactly the fields requested (no overfetch) | HIGH |
| Sanity/Next.js bridge | next-sanity | 12.4.5 | Official Sanity toolkit for Next.js; wraps `@sanity/client`, adds `sanityFetch`, `defineLive`, `SanityLive`, and draft mode/preview support in one package | HIGH |
| CSS | Tailwind CSS | 4.3.0 | v4 ships with Lightning CSS (Rust-based, ~5x faster builds); design tokens live in CSS `@theme` block as native CSS variables — ideal for this design system with 20+ named color tokens; no PostCSS config file needed | HIGH |
| Form handling (validation) | React Hook Form + Zod | react-hook-form@7.76.0, zod@4.4.3, @hookform/resolvers@5.2.2 | Server Actions + RHF gives uncontrolled form performance with type-safe validation; Zod v4 support landed in resolvers v5.1.0 (current: v5.2.2) — pairing is now stable | HIGH |
| Email delivery | Resend | 6.12.3 | Server Action sends contact form data directly; free tier (3,000 emails/month) is ample for a gym contact form; React Email templates for styled confirmation emails | HIGH |
| Animation | Motion (formerly Framer Motion) | 12.39.0 | `whileInView` scroll reveals and `useScroll` parallax hooks are the fastest path to high-energy UX without timeline complexity; App Router compatible with `'use client'` directive; 32 KB gzipped is acceptable for a marketing site | MEDIUM |
| Deployment | Vercel | Free tier | Native Next.js deployment; automatic preview URLs per PR; zero-config for App Router; explicitly required by project | HIGH |

---

## Key Integrations

### 1. Next.js + Sanity CMS

**Approach:** Embedded Studio pattern — Sanity Studio lives inside the Next.js app at `/app/studio/[[...tool]]/page.tsx`. The gym owner visits `yourdomain.com/studio` to edit content.

**Core packages:**
```bash
npm install next-sanity sanity
```

**Query pattern (App Router, Server Component):**
```ts
// lib/sanity/client.ts
import { createClient } from "next-sanity";

export const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: true,
});

// app/membership/page.tsx (Server Component — no 'use client')
import { sanityFetch } from "@/lib/sanity/client";
import { defineQuery } from "next-sanity";

const MEMBERSHIP_QUERY = defineQuery(`
  *[_type == "membershipTier"] | order(order asc) {
    _id, name, price, features
  }
`);

export default async function MembershipPage() {
  const tiers = await sanityFetch({ query: MEMBERSHIP_QUERY });
  // ...
}
```

**Sanity TypeGen:** Run `npx sanity typegen generate` to auto-generate TypeScript types from the schema. `defineQuery` marks queries for type extraction.

**Draft Mode / Visual Editing:** Not needed for Phase 1. Add `defineLive` + `SanityLive` in root layout when the gym owner wants live preview of draft content.

**Official starter command (use to bootstrap, then customize):**
```bash
npm create sanity@latest -- --template sanity-io/sanity-template-nextjs-clean
```

**Sources:**
- [next-sanity GitHub](https://github.com/sanity-io/next-sanity) — v12.4.5 confirmed
- [Sanity Next.js Docs](https://www.sanity.io/docs/nextjs)
- [Sanity App Router blog](https://www.sanity.io/blog/sanity-nextjs-enhancements)

---

### 2. Google Calendar Appointment Scheduling

**Decision:** Use Google Calendar's native booking page embed (iframe), NOT Cal.com.

**Rationale:** The trainer already uses Google Calendar (per PROJECT.md). The booking page embed requires zero custom backend. Cal.com adds infrastructure complexity (PostgreSQL, self-hosted or paid hosted plan) for no additional value when the trainer's source-of-truth is already Google Calendar.

**How it works:**
1. Trainer creates an Appointment Schedule in Google Calendar (available on personal Google accounts — limited to one booking page for free)
2. From the appointment schedule → Share → Website embed → copy the iframe snippet
3. Embed the snippet inside a styled `<div>` container on the `/booking` page in Next.js

**What you get:**
- Embed options: inline booking page (iframe) or popup button
- Inline embed fills available width/height you specify
- Google handles availability logic, timezone detection, confirmation emails
- No API key required

**Critical limitation — branding:** The iframe renders Google's UI. You cannot change fonts, colors, or remove Google Calendar branding. The iframe will be visually mismatched against the Modern Brutalism design system.

**Recommended mitigation:** Wrap the iframe in a heavily-styled container that creates a "branded frame" — thick red border, dark background, Anton heading above it. Present the embed as intentional "raw" aesthetic (fits Brutalism), not a broken UI.

**Alternative if branding is a blocker:** Cal.com hosted plan ($12/month) allows custom color theming and removes Cal.com branding. It connects to Google Calendar to read/write availability. Self-hosted Cal.com (free) requires a full Next.js + PostgreSQL deployment — overkill for this site.

**Google Workspace note:** Basic booking (one page, no payment collection) works on a free personal Gmail account. Paid Google Workspace (Business Standard, $14/user/month) unlocks multiple booking pages, automated reminders, and payment collection. Recommend starting with the free tier.

**Sources:**
- [Google Calendar embed docs](https://support.google.com/calendar/answer/10733297)
- [Cal.com](https://cal.com/)
- [Zapier: Google Calendar Appointment Scheduling](https://zapier.com/blog/google-calendar-appointment-slots/)

---

### 3. Tailwind CSS v4 Design System Implementation

**Why Tailwind v4 over v3:** Design tokens from DESIGN.md map perfectly to Tailwind's `@theme` block. Every CSS variable defined there becomes a Tailwind utility class automatically.

**Implementation approach — define all DESIGN.md tokens in `globals.css`:**
```css
@import "tailwindcss";

@theme {
  /* Colors */
  --color-background: #131313;
  --color-surface: #131313;
  --color-surface-bright: #393939;
  --color-primary: #ffb4a8;
  --color-primary-container: #e60000;
  --color-on-primary: #690000;

  /* Typography */
  --font-display: "Anton", sans-serif;
  --font-condensed: "Barlow Condensed", sans-serif;
  --font-body: "Hanken Grotesk", sans-serif;

  /* Spacing tokens */
  --spacing-xs: 4px;
  --spacing-base: 8px;
  --spacing-sm: 12px;
  --spacing-md: 24px;
  --spacing-lg: 48px;
  --spacing-xl: 80px;

  /* Border radius */
  --radius-DEFAULT: 4px;
  --radius-sm: 2px;
}
```

This gives you utility classes like `bg-primary`, `text-primary-container`, `font-display`, `p-md`, `rounded-DEFAULT` — all matching DESIGN.md tokens, all typed by Tailwind's IntelliSense.

**Why not CSS Modules:** Higher boilerplate per component; no utility-class reuse across the site; slower iteration for a design-system-heavy single-brand site.

**Why not styled-components:** No RSC compatibility — styled-components requires a client boundary, defeating Next.js SSR benefits. Bundle weight penalty at runtime vs. Tailwind's pure static CSS output.

**Sources:**
- [Tailwind v4 release notes](https://fireup.pro/news/tailwind-css-v4-0)
- [Tailwind v4 + Next.js overview](https://blog.malahim.dev/web-development/tailwind-css-v4-what-actually-changed-and-what-it-means-for-your-nextjs-project)

---

### 4. Contact Form (React Hook Form + Zod + Resend)

**Pattern:** Client component for form UI, Server Action for submission and email send.

```ts
// app/contact/actions.ts
'use server'
import { Resend } from 'resend';
import { z } from 'zod';

const ContactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
});

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendContactEmail(formData: z.infer<typeof ContactSchema>) {
  const parsed = ContactSchema.safeParse(formData);
  if (!parsed.success) return { error: 'Invalid data' };

  await resend.emails.send({
    from: 'noreply@kineticpower.com',
    to: 'trainer@kineticpower.com',
    subject: `New contact from ${parsed.data.name}`,
    text: parsed.data.message,
  });

  return { success: true };
}
```

Validation runs client-side via RHF + Zod resolver (instant feedback), then re-validates server-side in the Action before sending. CSRF protection is automatic (Server Actions use POST + header verification).

**Zod v4 + resolvers v5.2.2:** The `zodResolver` in v5.1+ auto-detects v3 vs v4 schemas at runtime. Import `zod` normally — no subpath import required.

**Sources:**
- [Next.js Server Actions Forms](https://nextjs.org/docs/app/guides/forms)
- [React Hook Form + Zod + Server Actions](https://medium.com/@techwithtwin/handling-forms-in-next-js-with-react-hook-form-zod-and-server-actions-e148d4dc6dc1)
- [@hookform/resolvers v5.2.2 on npm](https://www.npmjs.com/package/@hookform/resolvers)

---

### 5. Google Maps Embed

**Decision:** Use the Google Maps embed URL (no API key) for a static, read-only location map on the Contact page.

**Implementation:**
```tsx
<iframe
  src="https://www.google.com/maps/embed/v1/place?key=YOUR_KEY&q=GYM_ADDRESS"
  width="100%"
  height="400"
  style={{ border: 0 }}
  allowFullScreen
  loading="lazy"
/>
```

OR use the no-API-key version by grabbing the embed URL directly from Google Maps → Share → Embed a map.

**Why not `@react-google-maps/api` or similar:** Full SDK is 200 KB+ for a feature (location pin) that a static iframe handles perfectly. No need for JS-driven interactivity on a gym contact page.

**Sources:**
- [Google Maps Static API Best Practices](https://developers.google.com/maps/documentation/maps-static/static-web-api-best-practices)

---

## What NOT to Use

| Option | Why Not |
|--------|---------|
| **styled-components** | Not compatible with React Server Components; requires client boundary, losing SSR benefits. Runtime CSS injection conflicts with Next.js static optimization. |
| **CSS Modules** | High boilerplate per component. No shared utility classes. Poor fit for a consistent single-brand design system where 90% of styling is token-based. |
| **Zod v3 + @hookform/resolvers v3** | Outdated — Zod v4 is now stable with resolvers v5.2.2. No reason to pin old versions on a new project. |
| **Cal.com (self-hosted)** | Requires separate PostgreSQL database, hosting infra, and ongoing maintenance. Overkill when Google Calendar already handles trainer availability. |
| **`@react-google-maps/api`** | Heavy JS SDK for a static location pin. The embed iframe does the job at zero bundle cost. |
| **GSAP** | Better suited for timeline-driven, framework-agnostic campaigns. Motion (Framer Motion) integrates as React components — cleaner DX for scroll-reveals and entrance animations in App Router. Overkill complexity for a gym marketing site. |
| **Pages Router (Next.js)** | Deprecated path. App Router is the current standard; Sanity's `next-sanity` v12 is built around App Router patterns (`sanityFetch`, `defineLive`). |
| **Sanity v2** | End-of-life — Sanity v3 (currently v5.26.0) is required by `next-sanity` v12. |
| **Nodemailer** | Requires SMTP server configuration and credentials management. Resend's HTTP API is simpler, more reliable, and has a generous free tier. |

---

## Installation Reference

```bash
# Core
npx create-next-app@latest kinetic-power --typescript --tailwind --app --src-dir

# Sanity
npm install next-sanity sanity
npm install -D @sanity/types

# Form handling
npm install react-hook-form @hookform/resolvers zod

# Email
npm install resend

# Animation
npm install motion

# Fonts (Google Fonts via next/font — no npm install needed)
# Anton, Barlow Condensed, Hanken Grotesk loaded via next/font/google
```

---

## Open Questions

| Question | Impact | Who Decides |
|----------|--------|-------------|
| Does the trainer have Google Workspace or a free Gmail account? | Determines whether booking page embed is available (free: 1 page, no reminders); higher tiers unlock multiple pages and automated email reminders | Gym owner |
| Is branding mismatch on the Google Calendar iframe a dealbreaker? | If yes, Cal.com hosted ($12/month) is the alternative; if no, iframe with a styled wrapper is sufficient | Client |
| What is the Sanity project ID / dataset? (or will one be created fresh?) | Required before any content queries can be written | Developer setup |
| Will the gym want draft preview (live editing in Studio)? | Adds `defineLive` + `SanityLive` setup; low complexity but adds a feature to scope | Gym owner / client |
| What email address should contact form submissions go to? | Required for Resend `to:` field | Gym owner |
| Is the Google Maps embed key required (paid) or will we use the no-API-key share URL? | Determines whether a Google Cloud billing account must be set up | Developer decision — start with no-key share URL, upgrade if styling control is needed |
