# Research Summary — Kinetic Power Website

## Executive Summary

Kinetic Power is a local gym marketing site — a well-understood domain with clear conventions. The goal is a fast, mobile-first site that converts "gym near me" searchers into booked sessions and memberships. Recommended stack: **Next.js 16 + Sanity v5 + Tailwind CSS v4 deployed to Vercel**, with Google Calendar appointment scheduling embedded as an iframe.

The biggest risks are not technical: real photography and pricing data must come from the gym owner before launch, and the Google Calendar appointment scheduling feature must be confirmed available on the trainer's account tier before any booking work begins.

---

## Recommended Stack

| Layer | Choice | Version |
|-------|--------|---------|
| Framework | Next.js App Router | 16.x |
| Language | TypeScript | ~5.x |
| CMS | Sanity + next-sanity | v5 + v12.4.5 |
| CSS | Tailwind CSS v4 | 4.3.0 |
| Forms | React Hook Form + Zod + resolvers | 7.76.0 + 4.4.3 + 5.2.2 |
| Email | Resend | 6.12.3 |
| Animation | Motion (Framer Motion) | 12.39.0 |
| Scheduling | Google Calendar iframe embed | — |
| Maps | Google Maps no-API-key iframe | — |
| Deployment | Vercel free tier | — |

**Do not use:** styled-components, Cal.com self-hosted, GSAP, autoplay video backgrounds, Pages Router, Nodemailer, @react-google-maps/api.

---

## Table Stakes (Must Be in v1)

1. Clear value proposition in hero with a single primary CTA above the fold
2. Membership pricing fully visible — no "call for pricing," tier cards side-by-side
3. Trainer bio with real photo and credentials (no stock photography)
4. Gym hours and address in footer on every page AND on Contact page (CMS-managed)
5. Google Maps embed on Contact page (no-API-key iframe)
6. Contact form (name, email, message) + click-to-call phone number
7. Google Calendar booking embed on `/schedule` page
8. Mobile-responsive layout (70%+ of gym site traffic is mobile)
9. Page load under 3 seconds
10. Social media links (Instagram at minimum)
11. Real photography of the gym (hard launch blocker — owner must supply)

**High-value additions:** Member testimonials with specific results, free session CTA, FAQ on Membership page, sticky booking CTA, amenities photos.

**Defer to v2+:** Member login, online payments, blog, Instagram feed embeds, chatbot.

---

## Top 5 Critical Pitfalls

1. **Content changes don't appear after Sanity publish** — Two caching layers compound. Fix: `defineLive` from `next-sanity`, `useCdn: false`, `revalidate` on every page. Phase 1 infrastructure, non-negotiable.

2. **Contact form spam bots within days of launch** — Three-layer prevention: honeypot + Cloudflare Turnstile (free) + server-side rate limiting. All three before any public launch.

3. **Google Calendar appointment scheduling not available on trainer's account tier** — Missing on Frontline, Essentials, and some legacy plans. **Day 0 blocker**: have the trainer create a test appointment schedule before any development starts.

4. **CORS not configured for Vercel preview deployments** — Use Vercel's Sanity Marketplace integration to auto-populate env vars and CORS. Add all origins before first deploy.

5. **Portable Text editor breaks the design system** — Restrict toolbar in schema to H2/H3/bold/italic/links only. Map every style to a custom React component. Must be done before Studio access is handed to the gym owner.

---

## Suggested Build Order

| Phase | Focus | Gate |
|-------|-------|------|
| 1 | Routing + design system + Vercel pipeline (no CMS) | All pages render with correct nav and design tokens |
| 2 | UI components with hardcoded content | All pages visually complete, mobile-responsive, stakeholder-approved |
| 3 | Sanity CMS schema + wiring + Studio handoff | Gym owner can update pricing without a developer |
| 4 | ISR webhook revalidation | Price change in Studio → live site updates within 30 seconds |
| 5 | Contact form with spam protection + Resend | Form delivers to inbox (not spam), auto-reply works |
| 6 | Google Calendar booking integration | Visitor can book a session from the site end-to-end |

---

## Blockers Needing Gym Owner Action

| Blocker | Impact if Delayed |
|---------|------------------|
| Real photography (gym floor, equipment, trainer portrait) | Hero, amenities, trainer bio — all blocked. Launch blocked. |
| Membership pricing and tier structure | Membership page cannot be built accurately |
| Contact email address | Contact form cannot be configured |
| Google Calendar appointment schedule created + tested | Booking page blocked; must confirm account tier supports it |
| Sanity project created under gym owner's Google account | Owner locked out if under developer's account |
| Custom domain + DNS access | Resend email verification requires DNS before Phase 5 |

---

## Open Questions

| Question | Default if Undecided |
|----------|----------------------|
| Gmail personal vs. Google Workspace (which plan)? | Assume free — one booking page, no automated reminders |
| Is Google Calendar iframe branding mismatch acceptable? | Accept iframe; wrap in branded container |
| Sanity draft preview / live visual editing? | Skip for v1 |
| Real testimonials with name + photo available? | Placeholder; don't launch with generic quotes |
| Primary hero CTA: "Book a Free Session" or "View Membership"? | "Book a Free Session" — lower friction, research-backed |
