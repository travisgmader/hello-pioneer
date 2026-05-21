<!-- GSD:project-start source:PROJECT.md -->
## Project

**Kinetic Power — Website**

A multi-page marketing and member resource site for Kinetic Power, a local gym with a high-octane, elite brand identity. The site serves two audiences simultaneously: prospects deciding whether to join, and existing members checking schedules and booking trainer sessions. Content is managed through a headless CMS so non-developers can update prices, hours, and other details without touching code.

**Core Value:** A prospect landing on the site should immediately feel the brand intensity and be able to book a training session or view membership options within two clicks — no friction between interest and action.

### Constraints

- **CMS:** Sanity — non-dev owner must be able to update content without code changes
- **Deployment:** Vercel — free tier, integrates natively with Next.js
- **Design system:** Must follow DESIGN.md strictly — brand consistency is non-negotiable
- **Booking:** Google Calendar appointment slots — no custom booking backend to build or maintain
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

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
## Key Integrations
### 1. Next.js + Sanity CMS
- [next-sanity GitHub](https://github.com/sanity-io/next-sanity) — v12.4.5 confirmed
- [Sanity Next.js Docs](https://www.sanity.io/docs/nextjs)
- [Sanity App Router blog](https://www.sanity.io/blog/sanity-nextjs-enhancements)
### 2. Google Calendar Appointment Scheduling
- Embed options: inline booking page (iframe) or popup button
- Inline embed fills available width/height you specify
- Google handles availability logic, timezone detection, confirmation emails
- No API key required
- [Google Calendar embed docs](https://support.google.com/calendar/answer/10733297)
- [Cal.com](https://cal.com/)
- [Zapier: Google Calendar Appointment Scheduling](https://zapier.com/blog/google-calendar-appointment-slots/)
### 3. Tailwind CSS v4 Design System Implementation
- [Tailwind v4 release notes](https://fireup.pro/news/tailwind-css-v4-0)
- [Tailwind v4 + Next.js overview](https://blog.malahim.dev/web-development/tailwind-css-v4-what-actually-changed-and-what-it-means-for-your-nextjs-project)
### 4. Contact Form (React Hook Form + Zod + Resend)
- [Next.js Server Actions Forms](https://nextjs.org/docs/app/guides/forms)
- [React Hook Form + Zod + Server Actions](https://medium.com/@techwithtwin/handling-forms-in-next-js-with-react-hook-form-zod-and-server-actions-e148d4dc6dc1)
- [@hookform/resolvers v5.2.2 on npm](https://www.npmjs.com/package/@hookform/resolvers)
### 5. Google Maps Embed
- [Google Maps Static API Best Practices](https://developers.google.com/maps/documentation/maps-static/static-web-api-best-practices)
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
## Installation Reference
# Core
# Sanity
# Form handling
# Email
# Animation
# Fonts (Google Fonts via next/font — no npm install needed)
# Anton, Barlow Condensed, Hanken Grotesk loaded via next/font/google
## Open Questions
| Question | Impact | Who Decides |
|----------|--------|-------------|
| Does the trainer have Google Workspace or a free Gmail account? | Determines whether booking page embed is available (free: 1 page, no reminders); higher tiers unlock multiple pages and automated email reminders | Gym owner |
| Is branding mismatch on the Google Calendar iframe a dealbreaker? | If yes, Cal.com hosted ($12/month) is the alternative; if no, iframe with a styled wrapper is sufficient | Client |
| What is the Sanity project ID / dataset? (or will one be created fresh?) | Required before any content queries can be written | Developer setup |
| Will the gym want draft preview (live editing in Studio)? | Adds `defineLive` + `SanityLive` setup; low complexity but adds a feature to scope | Gym owner / client |
| What email address should contact form submissions go to? | Required for Resend `to:` field | Gym owner |
| Is the Google Maps embed key required (paid) or will we use the no-API-key share URL? | Determines whether a Google Cloud billing account must be set up | Developer decision — start with no-key share URL, upgrade if styling control is needed |
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
