# Roadmap: Kinetic Power Website

## Overview

Five phases take the Kinetic Power site from blank repo to a fully CMS-managed, Vercel-deployed gym marketing site. Phase 1 establishes the Next.js project, design tokens, and Vercel pipeline so a shareable preview URL exists immediately. Phases 2–4 build each page in full with hardcoded content — stakeholder can review and approve visuals before any CMS work begins. Phase 5 wires Sanity CMS and hands Studio access to the gym owner so they can manage all content without a developer.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Next.js scaffold, design tokens, all page routes + shells, nav + footer, Vercel deploy
- [ ] **Phase 2: Home & Amenities** - Hero, quick links, and complete Amenities page with equipment sections and gallery
- [ ] **Phase 3: Membership & Schedule** - Tier cards, comparison table, FAQ, booking embed, and trainer bio
- [ ] **Phase 4: Contact** - Contact form with spam protection, click-to-call, Google Maps embed, and social links
- [ ] **Phase 5: Sanity CMS** - Schema, wiring, ISR revalidation, and Studio handoff to gym owner

## Phase Details

### Phase 1: Foundation
**Goal:** The project skeleton is live on Vercel — all routes resolve, design system tokens are applied globally, and nav/footer are pixel-complete against DESIGN.md.
**Mode:** mvp
**Depends on:** Nothing (first phase)
**Requirements:** GLOB-01, GLOB-03, GLOB-04, GLOB-05
**Success Criteria** (what must be TRUE):
  1. Visiting the Vercel preview URL loads a dark (#131313) page with the correct Anton/Barlow Condensed/Hanken Grotesk fonts and red CTA color
  2. All five routes (/home, /amenities, /membership, /schedule, /contact) render without errors and show the nav and footer shell
  3. The nav collapses to a hamburger menu on mobile and expands on tap
  4. The footer displays address, hours, social links, and quick page navigation on every page
  5. Lighthouse mobile performance score meets the under-3-second load target on the deployed preview URL
**Plans:** 3 plans
Plans:
- [ ] 01-01-PLAN.md — Walking Skeleton: Next.js scaffold, Tailwind v4 @theme tokens, fonts, 5 route shells, GitHub + Vercel deploy
- [ ] 01-02-PLAN.md — TopNav with mobile overlay (Motion animation), Playwright nav E2E tests
- [ ] 01-03-PLAN.md — Footer (3-col desktop / 1-col mobile), Playwright footer + smoke tests, Lighthouse mobile verification
**UI hint:** yes

### Phase 2: Home & Amenities
**Goal:** A visitor landing on the home page immediately feels the brand and can navigate to any section within two clicks; the Amenities page shows all equipment categories, gym hours, and photo gallery with hardcoded placeholder content.
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** HOME-01, HOME-02, AMEN-01, AMEN-02, AMEN-03
**Success Criteria** (what must be TRUE):
  1. The home page hero shows a headline, tagline, and red "Book a Free Session" CTA button above the fold on both desktop and mobile
  2. Quick-link cards below the hero navigate the user to Amenities, Membership, and Schedule pages in one click
  3. The Amenities page displays three distinct equipment sections (free weights + racks, cardio machines, personal training), each with a placeholder photo and description
  4. Gym hours of operation are visible on the Amenities page
  5. A photo gallery section renders on the Amenities page with placeholder images in the correct grid layout
**Plans:** TBD
**UI hint:** yes

### Phase 3: Membership & Schedule
**Goal:** A prospect can compare all membership tiers and a member or prospect can book a training session — both pages are visually complete with hardcoded content and the Google Calendar embed is live.
**Mode:** mvp
**Depends on:** Phase 2
**Requirements:** MEMB-01, MEMB-02, MEMB-03, MEMB-04, SCHED-01, SCHED-02, SCHED-03
**Blocker note:** Before any Schedule page work begins, confirm the trainer's Google account tier supports "Appointment schedules" in Google Calendar — this feature is absent on Frontline, Essentials, and some legacy plans. Have the trainer create and share a test appointment schedule as a Day-0 check.
**Success Criteria** (what must be TRUE):
  1. The Membership page shows 3–5 tier cards side-by-side, each displaying price, features list, and a CTA button
  2. A comparison table below the tier cards lets the user evaluate tiers in one view
  3. An FAQ accordion answers pre-sale questions on the Membership page
  4. A free trial or free-pass CTA is visible as a low-commitment option on the Membership page
  5. The /schedule page embeds a working Google Calendar appointment scheduler so a user can pick and confirm a slot end-to-end
  6. The trainer's bio (name, specialties, photo placeholder) and brief booking instructions appear above the calendar embed
**Plans:** TBD
**UI hint:** yes

### Phase 4: Contact
**Goal:** A visitor can reach the gym by form, phone, or map — and the form is hardened against spam before any public link is shared.
**Mode:** mvp
**Depends on:** Phase 3
**Requirements:** CONT-01, CONT-02, CONT-03, CONT-04
**Success Criteria** (what must be TRUE):
  1. Submitting the contact form sends the message to the gym owner's inbox and delivers an auto-reply confirmation email to the sender
  2. On mobile, tapping the phone number opens the native dialer
  3. A Google Maps iframe embeds the gym location without requiring an API key
  4. Social media links and gym hours are visible on the Contact page
  5. The contact form silently rejects bot submissions via honeypot and Cloudflare Turnstile — a human submitter sees no friction but automated submissions are blocked
**Plans:** TBD
**UI hint:** yes

### Phase 5: Sanity CMS
**Goal:** The gym owner can log into Sanity Studio and update any piece of content — prices, hours, photos, trainer bio, FAQ entries — and see the change live on the site within 30 seconds, without writing any code.
**Mode:** mvp
**Depends on:** Phase 4
**Requirements:** GLOB-02
**Success Criteria** (what must be TRUE):
  1. The gym owner can log into Sanity Studio at the project's Studio URL and edit content without any developer involvement
  2. Changing a membership price in Studio and clicking Publish causes the live Vercel site to display the updated price within 30 seconds via ISR webhook revalidation
  3. Uploading a new gym photo in Studio replaces the corresponding image on the live site after the next revalidation
  4. The Studio rich-text editor is restricted to H2/H3/bold/italic/links only — no formatting options that would break the design system are accessible
**Plans:** TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/3 | Not started | - |
| 2. Home & Amenities | 0/? | Not started | - |
| 3. Membership & Schedule | 0/? | Not started | - |
| 4. Contact | 0/? | Not started | - |
| 5. Sanity CMS | 0/? | Not started | - |
