# Requirements — Kinetic Power Website

## v1 Requirements

### Home Page

- [ ] **HOME-01**: User sees a hero section with headline, tagline, and a primary CTA ("Book a Free Session") above the fold
- [ ] **HOME-02**: User can navigate from the hero to the Amenities, Membership, and Schedule pages via quick links

### Amenities

- [ ] **AMEN-01**: User sees individual equipment sections for free weights + racks, cardio machines, and personal training — each with a photo and description (CMS-managed)
- [ ] **AMEN-02**: User sees gym hours of operation on the Amenities page (CMS-managed)
- [ ] **AMEN-03**: User sees a photo gallery of the real gym facility (CMS-managed)

### Membership

- [ ] **MEMB-01**: User sees 3–5 membership tier cards each showing price, features list, and a CTA (CMS-managed)
- [ ] **MEMB-02**: User can compare tiers side-by-side via a comparison table
- [ ] **MEMB-03**: User can read a FAQ section answering common pre-sale questions (CMS-managed)
- [ ] **MEMB-04**: User sees a free pass or trial CTA as a low-commitment first step

### Schedule

- [ ] **SCHED-01**: User can book a training session via a Google Calendar appointment scheduling embed on the /schedule page
- [ ] **SCHED-02**: User sees the trainer's bio (name, specialties, photo) above the calendar embed (CMS-managed)
- [ ] **SCHED-03**: User reads brief instructions explaining how to pick a slot and what to expect

### Contact

- [ ] **CONT-01**: User can submit a contact form (name, email, message) and receives an auto-reply confirmation; the gym owner receives the submission in their inbox
- [ ] **CONT-02**: User can tap to call the gym on mobile, and can view the gym's location via a Google Maps embed
- [ ] **CONT-03**: User can find social media links and gym hours on the Contact page (CMS-managed)
- [ ] **CONT-04**: Contact form is protected from spam via honeypot + Cloudflare Turnstile

### Global

- [ ] **GLOB-01**: Site has a responsive top navigation bar with a mobile hamburger menu on small screens
- [ ] **GLOB-02**: Gym owner can update all site content (prices, hours, photos, trainer bio, FAQ, etc.) via Sanity CMS Studio without touching code
- [ ] **GLOB-03**: Every page has a footer with address, hours, social links, and quick page navigation
- [ ] **GLOB-04**: All UI follows DESIGN.md exactly — colors, typography (Anton/Barlow Condensed/Hanken Grotesk), spacing, and component rules
- [ ] **GLOB-05**: Site is deployed to Vercel and loads in under 3 seconds on mobile

---

## v2 Requirements (Deferred)

- Member testimonials with name, photo, and specific outcome — deferred until gym owner can supply real content
- Sticky "Book a Session" CTA persistent on scroll
- Sanity draft preview / live visual editing

---

## Out of Scope

- Member login or member portal — no authenticated area; scope is public-facing only
- Online payments / e-commerce — membership sign-up happens in person or via external link
- Blog or news feed — no ongoing editorial effort required for v1
- Custom domain configuration — domain not yet purchased; DNS setup is post-launch
- Instagram feed embed — third-party embeds slow load times and are visually inconsistent with the design system
- Chatbot
- Autoplay video backgrounds — documented performance and mobile-compatibility issues

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| GLOB-01 | Phase 1 — Foundation | Pending |
| GLOB-03 | Phase 1 — Foundation | Pending |
| GLOB-04 | Phase 1 — Foundation | Pending |
| GLOB-05 | Phase 1 — Foundation | Pending |
| HOME-01 | Phase 2 — Home & Amenities | Pending |
| HOME-02 | Phase 2 — Home & Amenities | Pending |
| AMEN-01 | Phase 2 — Home & Amenities | Pending |
| AMEN-02 | Phase 2 — Home & Amenities | Pending |
| AMEN-03 | Phase 2 — Home & Amenities | Pending |
| MEMB-01 | Phase 3 — Membership & Schedule | Pending |
| MEMB-02 | Phase 3 — Membership & Schedule | Pending |
| MEMB-03 | Phase 3 — Membership & Schedule | Pending |
| MEMB-04 | Phase 3 — Membership & Schedule | Pending |
| SCHED-01 | Phase 3 — Membership & Schedule | Pending |
| SCHED-02 | Phase 3 — Membership & Schedule | Pending |
| SCHED-03 | Phase 3 — Membership & Schedule | Pending |
| CONT-01 | Phase 4 — Contact | Pending |
| CONT-02 | Phase 4 — Contact | Pending |
| CONT-03 | Phase 4 — Contact | Pending |
| CONT-04 | Phase 4 — Contact | Pending |
| GLOB-02 | Phase 5 — Sanity CMS | Pending |
