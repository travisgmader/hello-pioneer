# Pitfalls Research — Kinetic Power Website

**Domain:** Local business marketing site — Next.js + Sanity CMS + Vercel + Google Calendar
**Researched:** 2026-05-20
**Overall confidence:** HIGH (multiple official docs + community verification)

---

## Integration Pitfalls

### Google Calendar

---

#### CRITICAL: Appointment Scheduling May Not Be Available on the Trainer's Current Account

**What goes wrong:** Google Calendar appointment scheduling (the "appointment schedule" feature, not just event invites) is not available on all Google account tiers. Users on Workspace Frontline, Workspace Essentials, and some legacy Workspace plans cannot create appointment schedules at all. Workspace Business Starter users get a severely limited single-schedule version.

**Why it happens:** The gym owner or trainer may have a Google Workspace account through a reseller or legacy plan that looks like a regular Google account but lacks this feature.

**Warning signs:** Trainer logs into Google Calendar and does not see the "appointment schedules" option in the left sidebar when creating a new event.

**Consequences:** The core booking feature fails before the site is built around it. Discovering this after building the booking page requires either a plan upgrade or a complete rethink of the booking strategy.

**Prevention:**
1. Confirm with the trainer/gym owner — before any development — that they can create an appointment schedule by navigating to calendar.google.com and verifying the feature exists.
2. Have them create a test appointment schedule and send you the booking page URL to embed. If they can't do this, the integration needs a different approach.
3. Document the Google account tier used.

**Phase:** Foundation / Phase 1. Must be validated before any booking page work begins.

---

#### MODERATE: Free-Tier Appointment Scheduling Has No Email Verification

**What goes wrong:** On personal Google accounts (free tier), Google does not require bookers to verify their email address. This means spam bookings, fake reservations, and no-shows are more common. Paid plans unlock email PIN verification that dramatically reduces bad bookings.

**Warning signs:** Trainer reports getting bookings from obviously fake email addresses or large numbers of no-shows.

**Prevention:** Set trainer expectations upfront. The site cannot control this — it's a Google limitation. If it becomes a problem, the solution is upgrading to a paid Google Workspace plan or switching to a dedicated scheduling tool like Calendly.

**Phase:** Phase 1 scope decision. Note it in handoff documentation.

---

#### MODERATE: Iframe Embed Has a Poor Mobile Experience by Default

**What goes wrong:** The Google Calendar appointment scheduling booking page was designed primarily for desktop. When embedded in an iframe on mobile, common problems include: clipped heights that require double-scrolling (page scroll + iframe scroll), sticky navigation headers overlapping the booking UI, and touch targets that are too small.

**Warning signs:** Testing on real mobile devices (not just browser responsive mode) shows the iframe is cramped, the "Book" button is hard to tap, or users must scroll inside the iframe separately from the page.

**Consequences:** Mobile conversion rate drops significantly. Most gym-seekers are on mobile.

**Prevention:**
- Set the iframe height explicitly (min 700px) and verify on actual iOS and Android devices.
- Consider using a direct link (`<a href="[booking-url]" target="_blank">`) on mobile instead of an iframe. Detect viewport and swap implementation.
- Test the booking flow end-to-end on mobile before launch, not just visual layout.

**Phase:** Booking page phase. Add mobile device testing to definition of done.

---

#### MODERATE: All-Day Events and Secondary Calendars Block Availability Unexpectedly

**What goes wrong:** If the trainer's Google Calendar has all-day events (holidays, blocked days) marked as "Busy," these block the entire day in the appointment schedule. Secondary calendars included in the schedule conflict check can also silently eat availability — if a secondary calendar has an event marked Busy at 10am, that slot disappears from the public booking page with no explanation.

**Warning signs:** Trainer sees available time on their calendar but clients report "no slots available" on specific days.

**Prevention:** After setting up the appointment schedule, have the trainer do a complete review of which calendars are being checked for conflicts, and change all-day events to "Free" status if they shouldn't block bookings.

**Phase:** Booking setup / trainer onboarding. Document in handoff guide.

---

#### MINOR: Booking Duration Miscalculation Cuts Off Last Slots

**What goes wrong:** Google calculates availability end time as when the appointment must *finish*, not when it can *start*. A 60-minute session with availability ending at 6pm means the last bookable start is 5pm, not 6pm. Trainers consistently misconfigure this and then wonder why the last hour looks blocked.

**Prevention:** Walk the trainer through this calculation explicitly when they set up their schedule.

**Phase:** Booking setup / trainer onboarding docs.

---

### Sanity + Vercel Integration

---

#### CRITICAL: CORS Must Be Configured for Every Deployment URL

**What goes wrong:** Sanity requires every domain that makes client-side API calls to be explicitly whitelisted in Sanity's CORS settings (manage.sanity.io → API → CORS Origins). Missing a URL produces cryptic CORS errors in the browser. The most common failure point: the Vercel preview deployment URL is never added, so the site works locally and in production but not on preview links.

**Warning signs:** Console shows `Access-Control-Allow-Origin` errors. Site works on localhost but not on Vercel deployment URL.

**Consequences:** Sanity Studio embedded in the Next.js app may fail to load. Live preview or any client-side queries break silently.

**Prevention:**
1. Add these to Sanity CORS origins before first deployment:
   - `http://localhost:3000` (development)
   - `https://[project].vercel.app` (production preview)
   - Any custom domain once DNS is set up
2. Use server-side data fetching (Next.js Server Components or `getStaticProps`) instead of client-side fetches — this bypasses CORS entirely for content queries.
3. Sanity Studio hosted at `/studio` in the Next.js app also needs its own CORS entry.

**Phase:** Phase 1 / infrastructure setup. Must be in deployment checklist.

---

#### CRITICAL: Content Changes Don't Appear on the Live Site Without Proper Revalidation

**What goes wrong:** Next.js aggressively caches responses. When the gym owner publishes a price change in Sanity Studio, the live site continues serving the old cached data until either the cache expires or a revalidation webhook fires. By default with no revalidation configured, changes may take hours to appear — or never appear until the next Vercel deployment.

**Why it happens:** Two caching layers compound each other: Next.js's own fetch cache, and the Sanity CDN. If a webhook fires but the Sanity CDN hasn't propagated yet, Next.js refetches the old data and caches that.

**Warning signs:** Gym owner updates a membership price in Sanity Studio, checks the live site immediately, and the old price is still showing.

**Consequences:** Gym owner loses trust in the CMS. They may start calling for manual deployments every time they change content, or give up using the CMS entirely.

**Prevention:**
1. Use `next-sanity`'s `defineLive` helper — it handles revalidation and real-time updates automatically and is the current recommended approach.
2. If using tag-based revalidation manually: set `useCdn: false` in the Sanity client configuration, and add a small propagation delay in the webhook handler (the `parseBody` third argument) to let Sanity's CDN catch up before Next.js revalidates.
3. Use Sanity Functions (serverless compute on Sanity's infrastructure) to call `revalidateTag` on publish events — no external webhook hosting needed.
4. Verify revalidation is working by publishing a test change and confirming it appears on the live site within 30 seconds before handing over to the gym owner.

**Phase:** Phase 1 infrastructure. Non-negotiable before CMS handoff.

---

#### MODERATE: Sanity Studio Fails to Load in the Next.js App on First Vercel Deploy

**What goes wrong:** Sanity Studio v3 requires Node.js 20+. Vercel's default Node.js version for older projects may be 18. The studio route (`/studio`) will fail to build or load with cryptic errors.

**Warning signs:** Build succeeds but `/studio` returns a blank page or error in production. Works fine locally.

**Prevention:** Explicitly set `"engines": { "node": ">=20" }` in `package.json` and set the Node.js version to 20.x in Vercel project settings before first deploy.

**Phase:** Phase 1 / Vercel setup.

---

#### MODERATE: Environment Variables Not Available at Build Time Breaks Sanity

**What goes wrong:** Sanity requires `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, and `SANITY_API_TOKEN` to be set. Public variables (`NEXT_PUBLIC_*`) must be present at build time, not just runtime. If they're missing from Vercel's environment variable configuration, the build may succeed but the site will fail to fetch content, or fail to build entirely.

**Warning signs:** Build logs show undefined project ID or missing dataset. Or locally everything works but Vercel deployment returns empty content.

**Prevention:**
1. After creating the Vercel project, immediately add all three environment variables in Settings → Environment Variables before the first deploy.
2. Use Vercel's Sanity integration (via Vercel Marketplace) to auto-populate Sanity environment variables — it links the project and handles the configuration.
3. Never commit `.env.local` — but do maintain a `.env.example` file with variable names (not values) for reference.

**Phase:** Phase 1 / Vercel setup. Add to deployment checklist.

---

## CMS / Non-Dev Editor Pitfalls

---

#### CRITICAL: Rich Text Fields With Unrestricted Formatting Break the Design System

**What goes wrong:** Sanity's Portable Text editor (the rich text field) shows editors a full toolbar by default: multiple heading levels, bold, italic, underline, bulleted lists, numbered lists. A non-technical gym owner will naturally use whatever looks good in the editor. They'll make subheadings H1, paste in colored text via annotations, or apply inline styles that don't exist in the design system. None of this looks wrong in the editor — but it renders incorrectly or inconsistently on the front end.

**Why it happens:** Sanity's Portable Text stores content as structured JSON, but what renders on the front end is determined by the frontend's component mappings, not by what the editor sees. Editors assume "what I see is what I get." It's not.

**Warning signs:** Gym owner asks "why does the heading look different on the site than it does when I'm editing?" or "I changed the color in the editor but it's not red on the site."

**Consequences:** Membership pricing section uses H1 inside body text. Trainer bio uses inconsistent heading sizes. Brand typography breaks.

**Prevention:**
1. Lock down the Portable Text toolbar in the schema to only the styles that exist in the design system. For this project: remove color annotations entirely, restrict headings to H2/H3 only (H1 is always the page title, never in body copy), disable underline (not in the design system).
2. Map every allowed style to a custom React component in `@portabletext/react` that applies design system classes — no raw `<h2>` tags.
3. Add `description` fields in the schema to tell the editor exactly what each field is for.

**Phase:** Schema design phase. Must be done before handing off Studio access.

---

#### CRITICAL: Schema Field Names That Don't Match Mental Models Cause Editor Confusion and Abandonment

**What goes wrong:** If a field is named `heroCta` or `membershipTierDescription` in the schema, the editor sees those exact names. A gym owner scanning a form with fields called `bodyCopy`, `sectionHeader`, `ctaLabel`, and `cardSubtitle` has no idea what populates what on the site. They may fill the wrong field, leave fields empty, or give up updating content.

**Prevention:**
1. Name every field in plain language: "Button text," "Section heading," "Short description," "Photo."
2. Add `description` strings to every field explaining where it appears on the site: "This text appears below the price on the membership card."
3. Add `placeholder` text showing example values: "e.g. 'Start Your Free Week'"
4. Group related fields with `fieldsets` so the editor sees logical sections, not a wall of inputs.

**Phase:** Schema design phase.

---

#### MODERATE: Missing Required Field Validation Allows Publishing Broken Pages

**What goes wrong:** If the Sanity schema doesn't mark critical fields as required with `validation: Rule => Rule.required()`, editors can publish documents with empty hero images, missing headings, or blank prices. The published page either breaks (JavaScript error from a null reference), renders awkwardly (empty sections), or looks incomplete.

**Warning signs:** A section of the site goes blank after a Sanity publish event. No error in the CMS — the document published fine.

**Prevention:** Mark every field that the frontend requires as `validation: Rule => Rule.required()`. For images, also validate `hotspot` is set if the image will be cropped. Test what happens when each field is null on the frontend — handle gracefully with fallbacks, but prevent it at the schema level.

**Phase:** Schema design phase.

---

#### MODERATE: Uploading Images Without Setting Hotspot Causes Bad Crops

**What goes wrong:** Sanity's image field supports hotspot and crop — the editor clicks a focal point on the image so Sanity knows where to crop when the image is resized. If the editor never sets a hotspot (it's not obvious it exists), and the frontend passes the full image object to `@sanity/image-url` with a specific aspect ratio, Sanity will crop from the center by default. Trainer faces get cropped out. Gym equipment shots cut off the key element.

**Warning signs:** Images look fine at full size but are badly cropped in card thumbnails or hero banners.

**Prevention:**
1. Add a description to every image field: "Click the image after uploading to set the focal point (the dot) on the most important part of the photo."
2. On the frontend, always pass the full image object (not just the asset URL) to the URL builder so hotspot data is respected.
3. Always specify both `width` and `height` when building image URLs — hotspot only applies when explicit dimensions are requested.

**Phase:** Schema design phase + image component implementation.

---

#### MINOR: Content Trapped in Sanity When the Developer Relationship Ends

**What goes wrong:** If the Sanity project is created under the developer's personal Sanity account, the gym owner has no way to access the project settings, manage API tokens, or invite new developers. If the developer relationship ends, the gym owner is locked out of their own CMS backend.

**Prevention:** Create the Sanity project under a Google account the gym owner controls, or invite the gym owner as an admin to the Sanity project before launch. Document login credentials and recovery methods in the handoff guide.

**Phase:** Project setup / Phase 1.

---

## Design System Enforcement Pitfalls

---

#### CRITICAL: Hardcoded Colors and Fonts in Portable Text Annotations

**What goes wrong:** Sanity allows adding color annotations to Portable Text out of the box via plugins. If a color picker is enabled, editors will use it. The selected colors are stored as inline styles or class names — neither of which maps to the design system's CSS custom properties. The result is arbitrary hex values scattered through body copy that override the design system.

**Prevention:** Do not install color annotation plugins. The Kinetic Power design system uses a strict palette (black background, white text, red CTAs). Color in body copy is not part of the design. Remove the formatting option entirely from the schema — if it's not in the toolbar, it can't be misused.

**Phase:** Schema design / Phase 1 CMS setup.

---

#### CRITICAL: Frontend Portable Text Renderer Must Map Styles to Design System Classes

**What goes wrong:** Even with a restricted Portable Text toolbar, the frontend's `@portabletext/react` component needs explicit mappings for every allowed style. Without custom components, Sanity renders bare `<h2>`, `<p>`, `<strong>` tags with whatever CSS the browser applies. The design system's typography (Anton for headings, Barlow Condensed for labels, Hanken Grotesk for body) won't apply unless every block element is mapped to the correct Tailwind class or CSS module.

**Warning signs:** Rich text sections on the site use a generic sans-serif instead of the brand fonts. Heading hierarchy looks inconsistent across pages.

**Prevention:** For every block type in the Portable Text schema, write a corresponding React component that applies design system classes. Map `h2` to `className="font-anton text-white text-4xl uppercase"`, `normal` to `className="font-hanken text-white/80"`, etc. Never rely on global CSS cascade to catch it — be explicit.

**Phase:** Frontend implementation phase. Must be done before any rich text content goes live.

---

#### MODERATE: Images Uploaded Through Sanity Without Proper Next.js Domain Configuration

**What goes wrong:** Next.js's `<Image>` component requires all external image domains to be whitelisted in `next.config.js`. Sanity serves images from `cdn.sanity.io`. If this domain isn't configured, the Next.js image optimization pipeline rejects the request and the image fails to load in production (works fine in development where the rule may be bypassed).

**Warning signs:** Images show in development but produce 400 errors or blank spaces in production.

**Prevention:** Add `cdn.sanity.io` to `images.remotePatterns` in `next.config.js` before writing any image components.

**Phase:** Phase 1 / infrastructure. Add to project scaffolding checklist.

---

#### MODERATE: Non-Dev Editor Changes Introduce Long Lines of Text That Break Layout

**What goes wrong:** A gym owner editing a "hero headline" field may type a long sentence instead of a punchy 3-word phrase. The design system calls for short, high-impact headlines (e.g., "TRAIN HARDER"). A 15-word sentence in an Anton font set to `text-6xl` overflows or wraps badly on mobile, especially on the hero banner.

**Prevention:**
1. Add `validation: Rule => Rule.max(40)` (or appropriate character limit) to all headline and button text fields.
2. Add field descriptions showing the expected format: "Short, punchy (2–5 words). Example: 'TRAIN HARDER'"
3. The frontend should also implement `text-balance` or `overflow-hidden` as a safety net.

**Phase:** Schema design phase.

---

## Contact Form Pitfalls

---

#### CRITICAL: No Spam Protection Means the Form Gets Hammered Within Days of Launch

**What goes wrong:** An unprotected contact form on a public website gets discovered by spam bots. The gym owner's inbox fills with junk within the first week. If the email service (Resend, SendGrid) accounts flag the spike in volume, legitimate emails may also start going to spam — or the account gets suspended.

**Warning signs:** Gym owner reports receiving emails from the contact form with nonsensical content, Russian text, or link spam.

**Prevention:**
1. Use a layered approach: honeypot field (hidden input that humans ignore, bots fill) as the first layer.
2. Add Cloudflare Turnstile as the second layer — it's free up to 1M requests/month, fully invisible in most cases, and significantly better UX than reCAPTCHA v2.
3. Add server-side rate limiting in the Next.js API route — no more than 3 submissions per IP per hour.

**Phase:** Contact form implementation. All three layers before launch.

---

#### CRITICAL: Email Goes to Spam Because the Sending Domain Isn't Authenticated

**What goes wrong:** A Next.js API route sends email via Resend or SendGrid. If the "From" address uses a domain without SPF, DKIM, and DMARC records, Gmail (where the gym owner's email likely lives) routes it to the spam folder. The gym owner thinks the form is broken.

**Why it happens:** Vercel-deployed apps send from the API provider's shared infrastructure. Without domain authentication, the email looks like it originates from a suspicious relay.

**Warning signs:** Test submission confirmation emails land in spam. Gym owner says "I never got anything."

**Prevention:**
1. Use Resend (recommended for Next.js — it has a native Next.js SDK). Configure a verified sender domain.
2. Add SPF and DKIM DNS records for the sender domain before launch.
3. Use the gym's actual email domain as the "From" address, not a generic `noreply@vercel.app`.
4. If the gym doesn't have a custom domain at launch (the project notes domain purchase is post-launch), use the email provider's verified subdomain as a temporary sender and switch after DNS is configured.

**Phase:** Contact form phase. DNS setup must happen before any real submissions.

---

#### MODERATE: No Confirmation Email Means Users Don't Know the Form Worked

**What goes wrong:** User submits the contact form. The page shows a success message. But they never get a confirmation email. Two days later they're not sure if the gym received their inquiry. They submit again, call the gym frustrated, or post a negative review about unresponsiveness. Gym owner also has no audit trail.

**Prevention:**
1. Always send an auto-reply confirmation email to the submitter: "Thanks for reaching out! We'll get back to you within 24 hours."
2. Send the inquiry to the gym owner's email as well as optionally saving submissions to a Sanity document (provides a backup log).
3. Show a clear success state on the form with expected response time ("We'll be in touch within 1 business day").

**Phase:** Contact form implementation.

---

#### MODERATE: Form Submits on Enter Key Inside Text Field, Submitting Incomplete Form

**What goes wrong:** Users pressing Enter to go to the next line in a message field, or pressing Enter after filling one field, accidentally submit the form prematurely. The gym owner gets incomplete inquiries.

**Prevention:** Set `type="submit"` only on the actual submit button. Use `onKeyDown` on the textarea to prevent accidental submissions. Add client-side validation that prevents submission when required fields are empty and highlights which field needs attention.

**Phase:** Contact form implementation.

---

#### MINOR: Google Maps Embed API Key Exposes Billing Risk

**What goes wrong:** The contact page includes a Google Maps embed showing the gym's location. The easiest implementation uses the Maps Embed API with an unrestricted API key. If the key isn't restricted to the specific domain and specific Maps API, it can be scraped from the page source and used for billing fraud.

**Prevention:**
1. Restrict the Maps API key in Google Cloud Console to: (a) HTTP referrer for the gym's domain and Vercel preview URL, and (b) only the Maps Embed API.
2. Set a monthly billing cap in Google Cloud Console.
3. Alternatively, use an `<iframe>` embed via Google Maps' built-in "Share → Embed a map" feature — this uses a public embed that doesn't require an API key.

**Phase:** Contact page implementation.

---

## Prevention Checklist

Ordered by when each item should be addressed (earliest first):

### Before Any Development (Pre-Flight)

- [ ] **Verify Google Calendar appointment scheduling is available** on the trainer's specific Google account — have them create a test booking page and confirm the URL before building anything around it
- [ ] **Confirm the gym owner controls the Google account** used for booking, and understands they'll manage availability in Google Calendar
- [ ] **Create the Sanity project under the gym owner's Google account** (not the developer's) so ownership doesn't get stranded

### Phase 1 — Infrastructure Setup

- [ ] Add `cdn.sanity.io` to `images.remotePatterns` in `next.config.js`
- [ ] Set Node.js version to 20.x in Vercel project settings
- [ ] Add all CORS origins to Sanity (localhost, Vercel production URL, future custom domain placeholder)
- [ ] Configure all Sanity environment variables in Vercel before first deploy — use Vercel's Sanity integration to automate this
- [ ] Implement `defineLive` from `next-sanity` for cache revalidation — test that a Sanity publish reflects on the live site within 30 seconds
- [ ] Set `useCdn: false` in the Sanity client used for ISR/SSG fetches

### Schema Design (Before Handing Over Studio)

- [ ] Restrict Portable Text toolbar to only design-system-approved styles (H2, H3, bold, italic, links — no colors, no underline, no H1)
- [ ] Add `description` strings to every Sanity field in plain language with site location context
- [ ] Add character limits to all headline and CTA text fields
- [ ] Mark all required fields with `validation: Rule => Rule.required()`
- [ ] Add hotspot instructions to every image field description
- [ ] Name all fields in plain language — no camelCase or technical abbreviations visible to the editor

### Frontend Implementation

- [ ] Map every Portable Text block type to a custom React component using design system classes — never rely on bare HTML element defaults
- [ ] Always pass the full Sanity image object (not just asset URL) to `@sanity/image-url` with explicit width and height so hotspots are respected

### Contact Form Implementation

- [ ] Add honeypot field (first spam layer)
- [ ] Add Cloudflare Turnstile (second spam layer — free, invisible)
- [ ] Add server-side rate limiting on the form API route
- [ ] Configure Resend or SendGrid with domain authentication (SPF + DKIM) before launch
- [ ] Send auto-reply confirmation email to every submitter
- [ ] Restrict Google Maps API key to the deployment domain and Maps Embed API only (or use the no-key iframe embed)

### Booking Page Implementation

- [ ] Test the embedded booking flow end-to-end on real iOS and Android devices (not just browser responsive mode)
- [ ] Verify iframe height renders correctly on mobile (min 700px) — switch to a direct booking link on mobile if iframe is cramped
- [ ] Walk the trainer through the availability end-time calculation to prevent the last-slot disappearing problem
- [ ] Review which secondary calendars are included in conflict checking and remove any that shouldn't block public bookings

### Pre-Launch / Handoff

- [ ] Verify a content change in Sanity Studio appears on the live Vercel deployment within 60 seconds
- [ ] Verify contact form submission arrives in the gym owner's inbox (not spam folder)
- [ ] Verify auto-reply confirmation email is received
- [ ] Record a short screen recording walkthrough of Sanity Studio for the gym owner showing how to update pricing, hours, and photos
- [ ] Document the Google Calendar appointment schedule setup so the trainer can adjust availability independently

---

## Sources

- Sanity CORS configuration: https://www.sanity.io/answers/how-to-fix-cors-errors-when-running-sanity-studio-in-a-next-js-project-
- Sanity + Next.js caching and revalidation: https://www.sanity.io/docs/nextjs/caching-and-revalidation-in-nextjs
- Cache invalidation — Sanity CDN + Next.js ISR conflict: https://dev.to/valse/nextjs-on-demand-isr-by-sanity-groq-powered-webhooks-221n
- Sanity image hotspot pitfalls: https://www.sanity.io/answers/using-the-image-hot-spot-feature-in-a-next-js-project
- Sanity schema design mistakes: https://www.halo-lab.com/blog/creating-schema-in-sanity
- Sanity Portable Text custom components: https://www.sanity.io/docs/studio/customizing-the-portable-text-editor
- Google Calendar appointment scheduling free vs paid: https://support.google.com/calendar/answer/16287038
- Google Calendar common booking issues: https://www.thatonlinestuff.com.au/how-to-solve-common-issues-with-google-appointment-schedule/
- Google Calendar embed checklist for real sites: https://www.silvermine.ai/newsletter/2026-03-14-google-calendar-appointment-schedule-embed-checklist-for-real-sites
- Vercel + Sanity deployment: https://www.sanity.io/learn/course/content-driven-web-application-foundations/deploy-to-vercel
- Vercel CORS for preview deployments: https://www.sanity.io/answers/vercel-nextjs-how-to-grant-access-to-vercel
- Contact form spam protection (honeypot + Turnstile): https://www.websyro.com/blogs/secure-form-stack-rate-limit-turnstile-honeypot-spam-detection-logging
- Anti-bot solution comparison 2026: https://prospect-hub.app/en/blog/honeypot-captcha-ai-anti-bot-comparison/
- Email deliverability and domain authentication: https://arnab-k.medium.com/building-secure-and-resilient-contact-forms-in-next-js-450cbb437e68
