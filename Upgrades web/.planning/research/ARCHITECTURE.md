# Architecture Research — Kinetic Power Website

**Domain:** Multi-page gym marketing site with headless CMS
**Researched:** 2026-05-20
**Overall confidence:** HIGH (Next.js + Sanity patterns are well-documented and stable)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CONTENT AUTHORING                        │
│                                                                 │
│   Gym Owner Browser                                             │
│   ──────────────────                                            │
│   /studio (embedded Sanity Studio)                              │
│   Updates prices, photos, hours, trainer bio                    │
└────────────────────┬────────────────────────────────────────────┘
                     │ Publish event
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SANITY CONTENT LAKE                        │
│                                                                 │
│   Hosted by Sanity (sanity.io)                                  │
│   Stores: siteSettings, membershipTier, trainer,                │
│           amenitySection, page (home/contact)                   │
│   GROQ API exposed over HTTPS                                   │
└────────────────────┬────────────────────────────────────────────┘
                     │ Publish webhook fires → POST /api/revalidate
                     │ GROQ queries via next-sanity client
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NEXT.JS APP (Vercel)                          │
│                                                                 │
│   Pages (Server Components, statically pre-rendered + ISR):    │
│   / (Home)         — hero, brand statement, CTA                 │
│   /amenities       — equipment highlights, photos               │
│   /membership      — pricing tiers                              │
│   /schedule        — Google Calendar booking embed              │
│   /contact         — form, map, hours, social links             │
│   /studio/[[...tool]] — embedded Sanity Studio (client-only)   │
│                                                                 │
│   API Routes:                                                   │
│   /api/revalidate  — Sanity webhook handler (ISR trigger)       │
│   /api/contact     — contact form submission (if needed)        │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTML + CSS + minimal JS
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         VISITOR BROWSER                         │
│                                                                 │
│   Static HTML (fast, SEO-friendly)                              │
│   Google Calendar iframe (schedule page)                        │
│   Google Maps iframe (contact page)                             │
└─────────────────────────────────────────────────────────────────┘
```

**Key principle:** Nearly all pages are Server Components that pre-render at build time (ISR). The only Client Components are interactive UI islands: the mobile nav toggle, any animated elements, and the Google Calendar iframe wrapper. Sanity Studio is fully client-rendered at `/studio`.

---

## Folder Structure

```
kinetic-power/
├── sanity.config.ts              # Sanity project config (root-level, required)
├── next.config.ts                # Next.js config — image domains, headers
├── tsconfig.json
├── .env.local                    # SANITY_PROJECT_ID, SANITY_DATASET, etc.
│
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout — fonts, global nav, footer
│   │   ├── page.tsx              # Home page
│   │   │
│   │   ├── amenities/
│   │   │   └── page.tsx
│   │   ├── membership/
│   │   │   └── page.tsx
│   │   ├── schedule/
│   │   │   └── page.tsx          # Google Calendar embed
│   │   ├── contact/
│   │   │   └── page.tsx
│   │   │
│   │   ├── studio/
│   │   │   └── [[...tool]]/
│   │   │       └── page.tsx      # Embedded Sanity Studio (force-static, client)
│   │   │
│   │   └── api/
│   │       ├── revalidate/
│   │       │   └── route.ts      # Sanity webhook → revalidatePath()
│   │       └── contact/
│   │           └── route.ts      # Contact form POST handler (optional)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── SiteHeader.tsx    # Nav logo, links, mobile menu button
│   │   │   ├── MobileNav.tsx     # 'use client' — drawer/toggle state
│   │   │   └── SiteFooter.tsx    # Address, hours, social links
│   │   │
│   │   ├── sections/             # Page-level section components (Server)
│   │   │   ├── HeroSection.tsx
│   │   │   ├── MembershipGrid.tsx
│   │   │   ├── AmenitiesGrid.tsx
│   │   │   ├── TrainerBio.tsx
│   │   │   └── ContactInfo.tsx
│   │   │
│   │   └── ui/                   # Primitive, reusable UI (Server unless noted)
│   │       ├── Button.tsx
│   │       ├── SectionHeading.tsx
│   │       ├── PricingCard.tsx
│   │       ├── AmenityCard.tsx
│   │       ├── CalendarEmbed.tsx # 'use client' — iframe wrapper
│   │       └── GoogleMap.tsx     # 'use client' — iframe wrapper
│   │
│   ├── sanity/
│   │   ├── lib/
│   │   │   ├── client.ts         # createClient() with projectId, dataset, apiVersion
│   │   │   ├── queries.ts        # All GROQ queries exported as defineQuery()
│   │   │   └── image.ts          # urlFor() image builder helper
│   │   │
│   │   └── schemas/
│   │       ├── index.ts          # Aggregates and exports all schema types
│   │       ├── siteSettings.ts   # Singleton: gym name, address, hours, phone
│   │       ├── membershipTier.ts # Array document: name, price, features, CTA
│   │       ├── trainer.ts        # Document: name, bio, photo, specialties
│   │       ├── amenitySection.ts # Document: title, description, photos
│   │       └── page.ts           # Document: slug, hero content, SEO meta
│   │
│   └── lib/
│       └── sanityFetch.ts        # Thin wrapper: client.fetch() with Next.js cache tags
│
└── public/
    └── fonts/                    # Self-hosted if not using next/font
```

**Decision — embedded Studio vs. standalone:** Embed the Studio at `/studio` inside the Next.js app. This is the pattern Sanity now recommends for most projects: single deployment, no CORS configuration needed, shared TypeScript types between schema definitions and page components. The gym owner accesses the CMS at `yourdomain.com/studio`.

---

## Sanity Schema Design

All schemas use `defineType` / `defineField` / `defineArrayMember` from `sanity` for full TypeScript narrowing (Sanity v3 pattern, HIGH confidence).

### `siteSettings` — Singleton document

Used for global values the gym owner must be able to update: hours, phone, address, social handles. Queried once and reused across layout and contact page.

```typescript
// sanity/schemas/siteSettings.ts
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'gymName',   type: 'string' }),
    defineField({ name: 'phone',     type: 'string' }),
    defineField({ name: 'address',   type: 'string' }),
    defineField({ name: 'hours',     type: 'array', of: [defineArrayMember({
      type: 'object',
      fields: [
        defineField({ name: 'days',  type: 'string' }), // "Mon–Fri"
        defineField({ name: 'times', type: 'string' }), // "5am–10pm"
      ]
    })] }),
    defineField({ name: 'instagram', type: 'url' }),
    defineField({ name: 'facebook',  type: 'url' }),
    defineField({ name: 'googleCalendarUrl', type: 'url' }), // appointment schedule URL
  ],
})
```

### `membershipTier` — Repeating document

One document per tier (Basic, Elite, etc.). The gym owner can add, reorder, or remove tiers without touching code.

```typescript
export const membershipTier = defineType({
  name: 'membershipTier',
  title: 'Membership Tier',
  type: 'document',
  fields: [
    defineField({ name: 'name',        type: 'string' }),          // "Elite"
    defineField({ name: 'price',       type: 'number' }),          // 79
    defineField({ name: 'period',      type: 'string' }),          // "/month"
    defineField({ name: 'features',    type: 'array', of: [defineArrayMember({ type: 'string' })] }),
    defineField({ name: 'highlighted', type: 'boolean' }),         // "Best Value" badge
    defineField({ name: 'ctaLabel',    type: 'string' }),          // "Join Now"
    defineField({ name: 'ctaUrl',      type: 'url' }),             // sign-up link
    defineField({ name: 'order',       type: 'number' }),          // manual sort
  ],
})
```

### `trainer` — Repeating document

One document per trainer. Extensible to a team page later.

```typescript
export const trainer = defineType({
  name: 'trainer',
  title: 'Trainer',
  type: 'document',
  fields: [
    defineField({ name: 'name',        type: 'string' }),
    defineField({ name: 'photo',       type: 'image', options: { hotspot: true } }),
    defineField({ name: 'bio',         type: 'text' }),
    defineField({ name: 'specialties', type: 'array', of: [defineArrayMember({ type: 'string' })] }),
    defineField({ name: 'certifications', type: 'array', of: [defineArrayMember({ type: 'string' })] }),
  ],
})
```

### `amenitySection` — Repeating document

Each amenity category (Free Weights, Cardio, Personal Training) is a document. Studio user can add photos and a description.

```typescript
export const amenitySection = defineType({
  name: 'amenitySection',
  title: 'Amenity Section',
  type: 'document',
  fields: [
    defineField({ name: 'title',       type: 'string' }),          // "Free Weights & Racks"
    defineField({ name: 'description', type: 'text' }),
    defineField({ name: 'photos',      type: 'array', of: [defineArrayMember({ type: 'image', options: { hotspot: true } })] }),
    defineField({ name: 'order',       type: 'number' }),
  ],
})
```

### `homePage` + `contactPage` — Singleton page documents

Hero copy, headline, and any CTA text for home. Contact page stores the form intro text and the Google Maps embed URL separately. Keeping these as CMS documents means the gym owner can update hero text without a developer.

```typescript
export const homePage = defineType({
  name: 'homePage',
  title: 'Home Page',
  type: 'document',
  fields: [
    defineField({ name: 'heroHeadline', type: 'string' }),
    defineField({ name: 'heroSubline',  type: 'string' }),
    defineField({ name: 'heroImage',    type: 'image', options: { hotspot: true } }),
    defineField({ name: 'heroCtaLabel', type: 'string' }),
    defineField({ name: 'heroCtaUrl',   type: 'url' }),
  ],
})
```

**Schema→Page mapping:**

| Schema | Pages using it |
|--------|---------------|
| `siteSettings` | Layout (nav, footer), Contact |
| `membershipTier` | Membership |
| `trainer` | Home (bio section), Amenities |
| `amenitySection` | Amenities |
| `homePage` | Home |

---

## Data Flow

```
AUTHOR ACTION
    │
    │  Gym owner edits tier price in Sanity Studio (/studio)
    ▼
SANITY CONTENT LAKE
    │
    │  Content saved → Publish event fires
    │  Webhook POST → https://yourdomain.com/api/revalidate
    │  Payload: { path: '/membership' }
    ▼
NEXT.JS API ROUTE  /api/revalidate/route.ts
    │
    │  parseBody() validates Sanity signature (HMAC)
    │  revalidatePath('/membership')  ← purges ISR cache for that route
    ▼
NEXT.JS ISR REBUILD
    │
    │  Next background-fetches /membership
    │  Server Component runs: client.fetch(MEMBERSHIP_QUERY)
    │  GROQ query returns fresh tier array from Sanity
    │  React renders → static HTML cached at Vercel CDN edge
    ▼
VISITOR BROWSER
    │
    │  GET /membership → Vercel serves cached HTML (< 50ms globally)
    │  Images served via next/image with Sanity CDN URLs
    │  Google Calendar iframe loaded client-side (schedule page only)
    └
```

**GROQ query pattern** (from `src/sanity/lib/queries.ts`):

```typescript
import { defineQuery } from 'next-sanity'

export const MEMBERSHIP_QUERY = defineQuery(
  `*[_type == "membershipTier"] | order(order asc) {
    _id, name, price, period, features, highlighted, ctaLabel, ctaUrl
  }`
)

export const SITE_SETTINGS_QUERY = defineQuery(
  `*[_type == "siteSettings"][0] {
    gymName, phone, address, hours, instagram, facebook, googleCalendarUrl
  }`
)

export const TRAINERS_QUERY = defineQuery(
  `*[_type == "trainer"] {
    _id, name, bio, specialties, certifications,
    "photo": photo.asset->url
  }`
)

export const AMENITIES_QUERY = defineQuery(
  `*[_type == "amenitySection"] | order(order asc) {
    _id, title, description,
    "photos": photos[].asset->url
  }`
)

export const HOME_PAGE_QUERY = defineQuery(
  `*[_type == "homePage"][0] {
    heroHeadline, heroSubline, heroCtaLabel, heroCtaUrl,
    "heroImage": heroImage.asset->url
  }`
)
```

**Image handling:** Sanity stores images in its own CDN. Use `@sanity/image-url` to build URLs, then pass them to `next/image` with the Sanity CDN hostname allowed in `next.config.ts`. This gives automatic WebP conversion, lazy loading, and size optimization.

---

## Rendering Strategy

| Page | Strategy | Rationale | Revalidation |
|------|----------|-----------|--------------|
| `/` (Home) | ISR | Marketing content changes rarely; SEO critical | Sanity webhook → `revalidatePath('/')` |
| `/amenities` | ISR | Photos/descriptions change occasionally | Sanity webhook → `revalidatePath('/amenities')` |
| `/membership` | ISR | Pricing must be accurate; gym owner updates it manually | Sanity webhook → `revalidatePath('/membership')` — highest priority |
| `/schedule` | ISR | Page shell is static; iframe loads dynamically | Same webhook pattern; iframe always pulls live from Google |
| `/contact` | ISR | Hours / address may change; Google Maps is iframe | Sanity webhook → `revalidatePath('/contact')` |
| `/studio/[[...tool]]` | `force-static` (shell) + CSR | Studio is a full SPA; Next just serves the shell | N/A — Studio authenticates to Sanity directly |
| `/api/revalidate` | Serverless function | Must execute on every webhook call | N/A |

**Why ISR over full SSR:** This site has no per-user dynamic content. Full SSR would cold-render on every request for no benefit and would increase Vercel serverless invocation costs. ISR gives static speed with CMS-driven freshness via webhooks.

**Why ISR over pure SSG (build-time only):** A pure SSG build requires a re-deploy every time the gym owner updates prices or hours. ISR + webhooks lets the gym owner publish from Sanity Studio and see the change live within seconds without any developer involvement.

**Fallback / revalidate timing:** Set `export const revalidate = 3600` (1 hour) as a safety net on each page in addition to webhooks. This ensures stale content never persists more than an hour even if a webhook delivery fails.

---

## Google Calendar Booking Integration

**Chosen approach: iframe embed on `/schedule` page** (not full Calendar API).

**Rationale:**
- The trainer already manages their schedule in Google Calendar
- Google Calendar Appointment Scheduling generates a booking page URL with a native scheduling UI
- The booking page requires no backend: visitors pick a slot, enter their name/email, and Google handles confirmation and reminders
- Building a custom booking flow would recreate functionality Google already provides for free

**Implementation pattern:**

```tsx
// src/components/ui/CalendarEmbed.tsx
'use client'

interface CalendarEmbedProps {
  src: string  // comes from Sanity siteSettings.googleCalendarUrl
}

export function CalendarEmbed({ src }: CalendarEmbedProps) {
  return (
    <iframe
      src={src}
      style={{ border: 0 }}
      width="100%"
      height="700"
      frameBorder="0"
      title="Book a Training Session"
    />
  )
}
```

The `src` URL is stored in Sanity `siteSettings.googleCalendarUrl` — the gym owner or developer pastes the Google Calendar appointment schedule URL once, and it's CMS-managed from that point. No hard-coded URLs in code.

**Why not the Google Calendar API:** API integration requires OAuth and a backend service to read/write calendar events. For a trainer who just wants visitors to pick appointment slots, the embedded appointment scheduling page achieves 100% of the goal with zero backend infrastructure.

**Iframe embed vs. linking out:** Use an iframe on the dedicated `/schedule` page (high-intent visitors who have already decided to book). On other pages (e.g., a CTA button in the hero), link directly to the Google Calendar scheduling URL in a new tab — do not embed an iframe on every page.

---

## Component Boundaries

| Component | Server or Client | Communicates With | Reason |
|-----------|-----------------|-------------------|--------|
| `app/layout.tsx` | Server | `siteSettings` (Sanity via GROQ) | Nav links and footer data come from CMS |
| `SiteHeader.tsx` | Server | `MobileNav` (renders as child) | Static structure |
| `MobileNav.tsx` | **Client** | None (local state only) | Toggle open/close requires `useState` |
| `app/page.tsx` | Server | `homePage`, `siteSettings` (Sanity) | ISR data fetch |
| `HeroSection.tsx` | Server | Props from page | Pure render |
| `app/membership/page.tsx` | Server | `membershipTier[]` (Sanity) | ISR data fetch |
| `MembershipGrid.tsx` | Server | Props from page | Pure render |
| `PricingCard.tsx` | Server | Props | Pure render |
| `app/amenities/page.tsx` | Server | `amenitySection[]` (Sanity) | ISR data fetch |
| `app/contact/page.tsx` | Server | `siteSettings` (Sanity) | ISR data fetch |
| `CalendarEmbed.tsx` | **Client** | Google Calendar (iframe) | Iframe requires browser context |
| `GoogleMap.tsx` | **Client** | Google Maps (iframe) | Iframe requires browser context |
| `app/studio/[[...tool]]/page.tsx` | **Client** | Sanity Content Lake (direct) | NextStudio is fully client-rendered |
| `app/api/revalidate/route.ts` | Serverless | `revalidatePath()` (Next.js cache) | Webhook receiver |

**Rule of thumb:** Default to Server Components. Add `'use client'` only when a component needs `useState`, `useEffect`, browser APIs, or wraps a third-party client-only library. For this project that means: `MobileNav`, `CalendarEmbed`, `GoogleMap`, and the Studio route.

---

## Build Order

Dependencies drive this order. Each phase produces working, deployable software.

### Phase 1 — Foundation (no CMS, no content)

Build the structural skeleton first, with hardcoded placeholder content. This validates routing, layout, design system, and deployment pipeline before CMS complexity is introduced.

1. `next.config.ts` + `tsconfig.json` + `tailwind.config.ts` (design tokens from DESIGN.md)
2. `app/layout.tsx` — root layout with fonts, global CSS variables
3. `SiteHeader.tsx` + `MobileNav.tsx` — navigation shell
4. `SiteFooter.tsx` — footer shell
5. All five page routes (`/`, `/amenities`, `/membership`, `/schedule`, `/contact`) with placeholder `<h1>` content
6. Deploy to Vercel — confirm routing works end-to-end

**Gate:** Vercel preview URL shows all pages with correct nav and design tokens.

### Phase 2 — Design System Components (no CMS)

Build UI primitives with hardcoded content so visual design is reviewed before CMS is wired.

1. `Button.tsx`, `SectionHeading.tsx` (design system primitives)
2. `HeroSection.tsx` with hardcoded copy + image
3. `PricingCard.tsx` + `MembershipGrid.tsx` with 3 hardcoded tiers
4. `AmenitiesGrid.tsx` + `AmenityCard.tsx` with placeholder content
5. `TrainerBio.tsx` with placeholder photo
6. `ContactInfo.tsx` with placeholder address/hours
7. `CalendarEmbed.tsx` + `GoogleMap.tsx` (iframes work without CMS)

**Gate:** All pages render correctly with design system. Mobile-responsive. DESIGN.md compliance verified.

### Phase 3 — Sanity CMS Integration

Wire the data layer. Because UI is already built, this is purely about replacing hardcoded values with live GROQ queries.

1. `npx sanity init` inside project — creates project, dataset, embeds Studio
2. Write all schemas (`siteSettings`, `membershipTier`, `trainer`, `amenitySection`, `homePage`)
3. Add schema to `sanity.config.ts`
4. Write `src/sanity/lib/client.ts` + `queries.ts` + `image.ts`
5. Add `.env.local` variables (`SANITY_PROJECT_ID`, `SANITY_DATASET`, `NEXT_PUBLIC_SANITY_PROJECT_ID`)
6. Replace hardcoded data in each page with `client.fetch(QUERY)` calls
7. Configure `next.config.ts` to allow Sanity CDN image domain
8. Seed CMS with real content from gym owner

**Gate:** All pages render real content from Sanity. Images served via `next/image`. Studio accessible at `/studio`.

### Phase 4 — ISR + Webhook Revalidation

Activate the production-grade caching and update pipeline.

1. Add `export const revalidate = 3600` to each page file
2. Build `/api/revalidate/route.ts` webhook handler using `parseBody` + `revalidatePath`
3. Create Sanity webhook in Sanity Manage dashboard pointing to the deployed API route
4. Add `SANITY_REVALIDATE_SECRET` to Vercel environment variables
5. Test: publish a price change in Studio → confirm page updates within 10 seconds

**Gate:** Gym owner can update pricing in Studio and see it live on the site within 10 seconds without a redeploy.

### Phase 5 — Google Calendar Integration

1. Gym owner creates Google Calendar Appointment Schedule (external — they do this in Google Calendar settings)
2. Copy the appointment scheduling URL into `siteSettings.googleCalendarUrl` in Sanity Studio
3. `/schedule` page fetches URL from `siteSettings` and passes it to `CalendarEmbed`
4. Test booking flow end-to-end in staging

**Gate:** Visitors can book a training session from the website without leaving the page (or with an acceptable new-tab redirect as fallback).

---

## Sources

- Sanity Next.js embedding docs: https://www.sanity.io/docs/nextjs/embedding-sanity-studio-in-nextjs
- Sanity + Next.js data fetching: https://www.sanity.io/docs/nextjs/query-content-nextjs
- Sanity Visual Editing / App Router: https://www.sanity.io/docs/visual-editing/visual-editing-with-next-js-app-router
- Sanity webhook revalidation: https://www.sanity.io/docs/nextjs/validating-sanity-webhooks-nextjs
- Sanity agent-toolkit best practices: https://github.com/sanity-io/agent-toolkit/blob/main/skills/sanity-best-practices/references/nextjs.md
- Next.js ISR docs: https://nextjs.org/docs/app/guides/incremental-static-regeneration
- Next.js project structure: https://nextjs.org/docs/app/getting-started/project-structure
- Next.js Server vs Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Google Calendar appointment scheduling embed: https://www.silvermine.ai/newsletter/google-calendar-appointment-schedule-embed-iframe-guide
- On-demand ISR with Sanity webhooks: https://www.sanity.io/guides/sanity-webhooks-and-on-demand-revalidation-in-nextjs
