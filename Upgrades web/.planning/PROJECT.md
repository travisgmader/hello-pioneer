# Kinetic Power — Website

## What This Is

A multi-page marketing and member resource site for Kinetic Power, a local gym with a high-octane, elite brand identity. The site serves two audiences simultaneously: prospects deciding whether to join, and existing members checking schedules and booking trainer sessions. Content is managed through a headless CMS so non-developers can update prices, hours, and other details without touching code.

## Core Value

A prospect landing on the site should immediately feel the brand intensity and be able to book a training session or view membership options within two clicks — no friction between interest and action.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Multi-page site with Home, Amenities, Membership, Schedule/Booking, and Contact pages
- [ ] Brand matches DESIGN.md (Modern Brutalism — dark, high-contrast, red CTAs, Anton/Barlow Condensed/Hanken Grotesk)
- [ ] Membership pricing section with 3–5 tiers (prices/details supplied by gym)
- [ ] Google Calendar appointment booking embedded for training sessions
- [ ] Amenities page highlighting: free weights + racks, cardio machines, personal training
- [ ] Trainer bio section with name, specialties, and photo
- [ ] Contact page with form, phone number, social links, and Google Maps embed
- [ ] Sanity CMS so non-dev gym owner can update content (prices, hours, photos, etc.)
- [ ] Deployed to Vercel
- [ ] Gym address and hours displayed (supplied by gym)
- [ ] Mobile-responsive layout

### Out of Scope

- Member portal / login system — no authenticated member area; schedule + booking is public via Google Calendar
- E-commerce / online payment — membership sign-up happens in person or via external link, not on-site
- Custom domain configuration — domain not yet purchased; DNS setup is post-launch
- Blog or news feed — content stays focused, no ongoing editorial effort needed

## Context

- Existing DESIGN.md at project root defines the complete design system: colors, typography, spacing, components, and do/don't rules. All UI must follow this spec.
- Google Calendar booking will use Google Calendar's built-in appointment scheduling feature (to be set up before integration). The site embeds or links to the scheduler.
- Gym owner will supply: real photos, membership tier details and prices, trainer bio and photo, gym address, phone number, social handles, and hours of operation.
- Domain purchase is post-launch — Vercel preview URL is sufficient for initial review.

## Constraints

- **CMS:** Sanity — non-dev owner must be able to update content without code changes
- **Deployment:** Vercel — free tier, integrates natively with Next.js
- **Design system:** Must follow DESIGN.md strictly — brand consistency is non-negotiable
- **Booking:** Google Calendar appointment slots — no custom booking backend to build or maintain

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js as framework | Sanity + Vercel pairing is first-class; SSR/SSG handles SEO and fast loads | — Pending |
| Sanity CMS | Non-dev content updates required; Sanity's Studio UI is accessible to gym owner | — Pending |
| Google Calendar for booking | Trainer already uses Google Calendar; no custom backend needed | — Pending |
| Multi-page over single-scroll | Cleaner navigation for two distinct audiences; each page has a clear job | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-20 after initialization*
