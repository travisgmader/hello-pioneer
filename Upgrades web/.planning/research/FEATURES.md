# Features Research — Kinetic Power Website

**Domain:** Local gym marketing + member resource site
**Researched:** 2026-05-20
**Confidence:** HIGH (multiple converging sources, verified against official and practitioner sources)

---

## Table Stakes

Features users expect from any gym site. Missing one of these and a significant fraction of visitors leave or call a competitor instead.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Clear value proposition in hero | Visitors decide in ~5 seconds whether to keep reading. No headline = no reason to stay. | Low | One punchy line + CTA above the fold. Do NOT bury this behind a video background. |
| Prominent CTA above the fold | "Join Now" or "Book a Session" must be visible without scrolling. Missing this is the #1 conversion killer for gym sites. | Low | One primary CTA per page. Red button per brand system. |
| Membership pricing, fully visible | Hiding pricing behind a "Contact Us" wall kills conversions. Prospects who don't see pricing bounce immediately. | Low | Side-by-side tier cards. Highlight the middle tier as "Most Popular." |
| Class / trainer schedule | Visitors expect to know when they can train before committing. Lack of schedule is a trust gap. | Low–Med | Google Calendar embed is sufficient. Must not require a login to view. |
| Trainer bio with photo | Personal training is a relationship purchase. A real person with credentials builds trust before the first interaction. | Low | Name, photo, specialties, certifications. One trainer is fine for v1. |
| Gym hours and address | 60%+ of gym site traffic comes from mobile "gym near me" searches. If hours aren't immediately visible, visitors call — or leave. | Low | Display in footer on every page AND on Contact page. CMS-managed. |
| Google Maps embed | Users expect to see the gym's location. Maps build physical credibility and help with local SEO. | Low | Embed on Contact page. No custom map needed. |
| Contact form + phone number | Users want at least two contact paths: form for non-urgent, phone for immediate. Missing either reduces trust. | Low | Form: name, email, message — no more. Phone number clickable on mobile. |
| Social media links | Most gym prospects check Instagram before joining. No social links = no community signal. | Low | Link to accounts; don't embed feeds (performance cost not worth it). |
| Mobile-responsive layout | 70%+ of gym website traffic is mobile. A non-responsive site loses most of its audience. | Low | Non-negotiable. Mobile comes first in layout decisions. |
| Real photography of the gym | Stock photos destroy credibility immediately. Prospects specifically look for evidence the gym is real and the equipment is quality. | Low | Owner supplies photos. At minimum: floor/equipment shots, exterior, trainer portrait. |
| Page load under 3 seconds | 40% of visitors abandon sites that take over 3 seconds. Hero images and videos are the primary offender. | Med | Compress images at build time. No autoplay video backgrounds without lazy loading. |

---

## Differentiators

Features that separate a great local gym site from a mediocre one. Not universally expected, but they meaningfully lift conversions and reinforce the brand.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Member testimonials with specifics | Generic "great gym!" reviews don't convert. Specific results ("lost 30 lbs in 4 months with personal training") build real credibility. 91% of millennials trust peer reviews as much as a recommendation from a friend. | Low | 3–5 quotes with name and photo. Source from existing clients. Sanity-managed so owner can update. |
| Before/after transformation results | Visual proof of results is the most powerful trust signal available for a fitness business. Prospects are buying an outcome, not equipment access. | Med | Requires member consent and real photos. Do not launch without at least 2–3 real examples. |
| Free pass / trial CTA | Offering a free 2-day pass removes the commitment barrier. One studio saw a 180% conversion increase after introducing this. | Low | CTA links to a simple form (name + email + phone). No custom backend — owner follows up manually or via email tool. |
| Amenities detail with equipment photos | Prospects comparison-shop on equipment. A rack count, free weight range, and cardio machine list with real photos answers the question before it's asked. | Low | Bulleted list + photo gallery. CMS-managed. |
| Sticky "Book a Session" CTA on scroll | Persistent CTA removes friction at the moment of decision, wherever that moment occurs on the page. | Low | Sticky header or floating button. One action only — don't stack multiple sticky CTAs. |
| Named neighborhood / local signals | "The best gym in [Neighborhood]" copy and location-specific meta tags materially improves local SEO rank for "gym near me" searches. | Low | Write this into the copy and meta description, not into a separate page. |
| Page speed above 90 (Lighthouse) | Fast sites rank higher in Google and convert better. Most gym sites are slow. A fast site is an actual competitive edge, not just good hygiene. | Med | Next.js SSG + image optimization via next/image gets this for free if used correctly. |
| FAQ section on Membership page | Reduces pre-sale phone calls about contracts, cancellation, and what's included. Prospects who get their questions answered on-site convert more often. | Low | 5–8 questions. CMS-managed so owner can add as questions come in. |

---

## Anti-Features (Don't Build in v1)

Features that are commonly built by agencies on gym sites but create unnecessary complexity, ongoing maintenance cost, and frequently don't improve conversion for a local single-location gym.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Member login portal / dashboard | Requires auth infrastructure, session management, and ongoing security maintenance. The PROJECT.md explicitly excludes this. Existing members already use Google Calendar for booking. | Public schedule embed via Google Calendar. No login required. |
| In-house online payment / checkout | Significant PCI compliance burden, backend work, and ongoing maintenance. No payment processing happens on this site per scope. | Link out to whatever the gym uses in person (Square, etc.) or direct phone/in-person signup. |
| Custom booking backend | Google Calendar appointment scheduling already handles trainer session booking. A custom backend adds dev time and bugs for zero UX gain. | Embed or deep-link to the Google Calendar booking URL. |
| Blog / news feed | Requires ongoing editorial commitment the gym owner is unlikely to sustain. Stale blog posts hurt credibility more than no blog. | Skip entirely for v1. If SEO content is ever prioritized, revisit after initial launch. |
| Live class feed / Mindbody/Glofox embed | These third-party scheduling embeds are slow, visually inconsistent with the brand, and require a paid subscription. The gym has one trainer and a simple weekly schedule. | Simple static schedule block (days + times) managed in Sanity. Update as needed. |
| Social media feed embeds (Instagram wall, etc.) | Third-party embed SDKs (Instagram API) are slow, frequently break, and add JS weight. Page speed impact is real and the visual payoff is minimal. | Link to social profiles. Keep the site fast. |
| Multi-location pages | Kinetic Power is a single-location gym. Multi-location architecture adds routing complexity for zero current business value. | Single location. One address, one map. |
| Chatbot / live chat widget | Adds JS weight, rarely gets staffed properly at a small gym, and creates an expectation of instant response the owner likely can't maintain. | Phone number + contact form. Set expectations clearly (response within X hours). |
| App download CTA | The gym doesn't have an app. A placeholder CTA for a non-existent product damages credibility. | Only promote products that exist. |
| Countdown timers / urgency popups | Dark patterns erode trust with a fitness audience that is skeptical of marketing tactics. The Kinetic Power brand is high-intensity and authentic — fake urgency contradicts that. | Let the offer stand on its own. Real scarcity (limited personal training slots) can be stated plainly. |
| Video background autoplay hero | These are the #1 cause of slow gym sites. They play on desktop, are disabled by iOS/Android by default on mobile, and add load-time overhead. | High-quality static hero image with strong typography does the same job and loads instantly. |

---

## Conversion Best Practices

What the research consistently shows actually moves prospects toward membership at a local gym site. These are implementation principles, not discrete features.

### 1. One primary action per page
Every page should have a single dominant CTA. The home page drives to "Book a Free Session" or "View Membership." The Membership page drives to "Join Now" or "Talk to Us." Competing CTAs (five buttons in a row) reduce action.

**Implementation:** Define the primary action for each page before designing it. Every other link is secondary.

### 2. Pricing transparency is non-negotiable
Prospects who don't see pricing on the site look up a competitor who shows theirs. Displaying prices filters in serious buyers and filters out time-wasters. The psychological framing matters: show tiers side-by-side, highlight the middle tier as "Most Popular," and anchor the premium tier high so the mid-tier feels like a deal.

**Implementation:** Membership page shows all tiers, all prices, all included features. No "call for pricing."

### 3. Social proof must be specific
"Great gym!" does nothing. "I dropped 25 lbs in 3 months doing personal training twice a week" makes a specific, believable claim. The transformation from generic to specific testimonials is the highest-ROI content upgrade a local gym can make.

**Implementation:** Collect 3–5 testimonials from real clients with real results. Name + photo required. Brief consent process.

### 4. Remove friction from the first step
The prospect's first action should require minimum commitment. "Book a Free Intro Session" is lower friction than "Join Now." A free 2-day pass form (name, email, phone) is lower friction than a membership sign-up form. Get contact information first; close the membership in person.

**Implementation:** Primary homepage CTA is a low-commitment offer (free session, free pass) rather than a hard sell. Owner follows up via phone/email.

### 5. Real photos beat design
No amount of design polish recovers from stock photography. Prospects are evaluating whether this gym is real, whether the equipment matches the price, and whether the environment feels like somewhere they'd train. Only real photos answer these questions.

**Implementation:** Launch is blocked until the gym owner supplies real photography. This is a hard dependency for the site to convert.

### 6. Mobile-first information hierarchy
Hours, address, phone, and a "Book" button should be accessible within one tap from any page on mobile. Most gym site visits from "near me" searches end in either a phone call or a visit — make both effortless.

**Implementation:** Footer on every page: address, phone (click-to-call), hours. Sticky header includes CTA.

### 7. Local SEO signals belong in copy, not separate pages
For a single-location gym, the name of the neighborhood and city should appear naturally in body copy, headings, and meta descriptions. A page titled "Best Gym in [City] for Personal Training" gets indexed faster than a generic "About Us" page.

**Implementation:** Copywriting brief to include city/neighborhood name in hero headline, page titles, and meta descriptions.

---

## Feature Dependencies

```
Real photography (owner supply)
  └─→ Hero section (blocked without it)
  └─→ Trainer bio (blocked without trainer photo)
  └─→ Amenities page (blocked without equipment photos)
  └─→ Testimonials (blocked without member photos/consent)

Membership tier details (owner supply)
  └─→ Pricing section (blocked without prices)
  └─→ FAQ (partially blocked — some answers need pricing context)

Google Calendar appointment scheduling (gym owner must set up)
  └─→ Schedule/Booking page (embed/link is blocked until calendar is configured)

Sanity CMS schema design
  └─→ All CMS-managed content (pages cannot be built until schema matches content types)
```

---

## Sources

- [10 Must-Have Gym Website Features — FitHive](https://myfithive.com/blog/view/10-ways-to-improve-your-gym-website-for-more-leads-and-local-seo-success)
- [How to Optimize Your Gym Website for More Leads — Kilo](https://usekilo.com/how-to-optimize-your-gym-website-for-more-leads/)
- [Gym Website Must-Haves — Spruce Web Design](https://www.sprucewebdesign.com/uncategorized/gym-website-must-haves/)
- [Conversion Optimization for Fitness Sites — Zen Planner](https://zenplanner.com/marketing/conversion-optimization-for-fitness-sites/)
- [37 Social Proof Statistics for Fitness Studios — WellnessLiving](https://www.wellnessliving.com/blog/convincing-social-proof-statistics-skyrocket-fitness-studio-success/)
- [Gym Lead Magnets That Convert — Gymdesk](https://gymdesk.com/blog/gym-lead-magnets-convert/)
- [Gym Membership Pricing Strategies — GymMaster](https://www.gymmaster.com/blog/gym-membership-pricing-strategies-for-profit/)
- [8 Strategies for a High-Converting Fitness Studio Website — Walla](https://www.hellowalla.com/blog/8-strategies-for-creating-a-high-converting-fitness-studio-website)
- [Top Fitness Website Design Mistakes — MyPersonalTrainerWebsite](https://mypersonaltrainerwebsite.com/blog/fitness-website-design-mistakes)
- [How to Create the Best Gym Website — Wodify](https://www.wodify.com/blog/how-to-create-a-great-gym-website)
