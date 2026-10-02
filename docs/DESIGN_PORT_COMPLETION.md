# Design port completion report

The public design and motion language of **LearnThriveSoftware** has been ported into the standalone
**LearnThriveTuition** marketing site. This is the record of what was done, what was left out on
purpose, how it was verified, and what needs a decision from the business. The row-by-row mapping
is in [`DESIGN_PARITY_AUDIT.md`](./DESIGN_PARITY_AUDIT.md).

## Commits

| | |
|---|---|
| Source (design authority) | `LearnThriveSoftware` `main` at `b5e6827`. Read only: not modified. |
| Target base | `LearnThriveTuition` `main` at `3493187` |
| Port | branch `design-port`, 14 commits, not pushed (`git log 3493187..design-port`) |

```
f85945d  motion runtime, capability tiers and primitives
1d6395e  shared tokens, header, footer and runtime wiring
fd9e9a4  homepage
4d56ffa  /subjects
e1f71cb  subject landing pages
64be392  /about
68bd9cb  /faq
6c49b24  /book, /contact and the enquiry form
6ed9169  safeguarding, privacy, cookies, terms and the legal shell
a01c611  design-port tests and the updated browser suite
ab277e0  FAQ jump-nav stagger
46d2348  hero: vertical centring and ultra-wide composition
9124051  keep a sentence's full stop attached to the phone numbers
(this report and the README update are the final commit)
```

78 files changed, about 6,500 lines added and 2,000 removed. `src/app/api/enquiry/route.ts` is
unchanged.

## What was ported

### Tokens

- Font chain: `--font-sans` / `--font-heading` now resolve through the three `next/font` families
  (Public Sans, Bricolage Grotesque, IBM Plex Mono) on every route. Before, the chain began with an
  unloaded `"Aptos"`, so only `/` and `/subjects` rendered in the intended fonts.
- Motion tokens: `--duration-instant/fast/standard/slow` and `--ease-snappy/smooth/gentle`.
- Reduced-motion rules for view transitions and the sitewide cap, plus the `<noscript>` reveal
  override.
- Colour, spacing, radii, shadows and breakpoints were already identical and are unchanged.

### Components copied from the source (with the import paths changed)

`MotionRuntime`, `MotionDebugOverlay`; primitives `Reveal`, `MaskedText`, `SceneShell`,
`CinematicBackdrop`, `SectionHandoff`, `ParallaxLayer`, `PointerDepth`, `ScrollProgressPath`,
`AnimatedUnderline`, `ProductLayer` (present, not currently used by any page); scenes
`LearningPathScene`, `SafeguardingScene`, `SafeguardingTrustPath`, `SubjectsScene`,
`SubjectSectionMotif`, `SubjectWorld`, `SubjectHeroMotif`, `ElevenPlusMotif`, `AboutFoundersScene`,
`FaqJumpNav`, `LegalPageMotion`; `lib/motion` (capabilities, activity, scroll, thresholds,
reduced-motion, tokens, debug, frame profiler); `SubjectIcon`, `Marquee` (+ module), `StatCounter`,
`PageHero`, `LegalPage`, `SubjectLandingPage`, `EnquiryForm`.

### Components adapted

| Component | Change from the source |
|---|---|
| `SiteHeader` | No session lookup or Login / Dashboard link |
| `SiteFooter` | Keeps Tuition's external Tutor login and four legal links; adds the registration line |
| `HeroScene` | No WebGL layer, no second "lesson report" chip, CTA to `/book`; copy centred vertically |
| Homepage | No product demo, no embedded form; CTAs to `/book` |
| `SceneShell` | Flagship scene capped at 560px (source was a full viewport) |
| `PhoneContacts` | Consistent name-over-number stacking; optional trailing `suffix` |
| `FounderPortraitParallax` | Accepts a `className` so the wrapper can carry the portrait's sizing |
| All pages | `ViewTransition` wrappers removed (React 19.3 API; this site is on 19.2) |

### New dependency

`framer-motion` 13.4.4, the same version as the source. Its `motion-dom` range (`^13.4.4`) resolves
to 13.5.0, which dropped an export that `framer-motion` 13.4.4 imports and breaks the build, so
`motion-dom` 13.4.4 and `motion-utils` 13.3.0 are pinned with an `overrides` entry in
`package.json`.

## Page by page

| Route | Change |
|---|---|
| `/` | Layered hero scene, quiet stats strip, navy-to-cream handoff, masked editorial statement, learning path with scroll-linked progress, subject cards with motifs, level rows, DBS tutor-standards band with a scroll-linked pipeline, testimonials, closing scene |
| `/subjects` | Hero scene with jump pills, early-years callout, alternating image rows, level cards with depth, Science node motif, 11+ route motif and card |
| `/maths-tuition`, `/english-tuition`, `/science-tuition`, `/11-plus-tuition` | Per-subject hero geometry (grid and curve, ruled lines and quotation mark, connected nodes, route and milestones) and tint; content from `site.ts` unchanged |
| `/about` | Founders scene, masked mission statement, section handoffs; portraits fixed |
| `/faq` | Jump nav with active category, animated accordion, 34 questions including the five special-educational-needs questions |
| `/book` | Hero with contact card, atmosphere, staged form, "What happens next?" |
| `/contact` | Email and phone cards, "what to include" list, guided-enquiry CTA |
| `/safeguarding` | Adds the tutor recruitment and DBS section, trust path, urgent-help box |
| `/privacy`, `/cookies`, `/terms` | Legal shell with contents nav, per-page review date, corrected enquiry wording |
| 404 | Content unchanged; inherits the new styling |

## Intentional differences

See the "Intentional differences" table in the audit. In short: no product demo or lesson-report
claims, no embedded homepage form, no WebGL hero, no `ViewTransition`, no Login link, four legal
links rather than seven, external Tutor login retained, enquiry API untouched.

## Content retained from the legacy site

Founder biographies and the mission statement; the early-years / Key Stage 1 note; the Science GCSE
breakdown (Biology, Chemistry, Physics); 11+ components (maths, English, verbal and non-verbal
reasoning); the five special-educational-needs FAQs and the "does not provide specialist diagnostic
or therapeutic support" statement; all five testimonials in `site.ts` (the homepage shows three);
phone contacts and the contact email; company number, registered address and the external Tutor
login. A unit test (`tests/design-port.test.mjs`) asserts each of these is still present.

## Stale enquiry wording removed

The enquiry form sends directly and the parent receives a confirmation email. These statements said
otherwise and are gone:

- FAQ: "The booking form prepares an email on your device for you to review and send" and its link
  label "Prepare a consultation enquiry".
- Privacy: "It then prepares a draft email on your device. The website does not send or store the
  answers..." and, in the scope paragraph, "enquiries prepared through it" (now "sent through it").
- Cookies: "It prepares a draft email on your device..."
- Terms: "The consultation form prepares an email draft on your device. The website does not send the
  enquiry: you review and send it using your email app."
- `/book`: "We'll get back to you within 24 hours", which contradicted the 5-working-day auto-reply.

A unit test fails if any of the old phrasings returns.

## Testing

### Automated (final code)

| Check | Result |
|---|---|
| `eslint .` | 0 errors, 1 warning (`LOGO_URL` unused in the enquiry route, which was not touched). The original had 3 errors |
| `tsc --noEmit` | clean |
| Unit tests | 22 of 22 (8 existing, 14 new) |
| `next build` | passes, 20 routes |
| `npm run test:browser` | passes: 14 routes at six viewports, axe on the settled page and again under reduced motion, form flows, JavaScript-off, 34 FAQ questions, no console errors, no third-party requests |

Starting point: on the original `main`, `npm run test:browser` already failed at its first route
with four serious colour-contrast violations on the homepage (ratios 2.39, 3.00, 3.52 and 4.12
against 4.5:1), and several later assertions encoded behaviour `main` had since replaced: the
"Prepare enquiry email" flow, a homepage FAQ preview, 29 FAQ questions, and "Explore X Tuition"
link text. The suite was brought up to the current site without weakening it, and extended
(see the commit message of `a01c611`).

### Responsive

- **Overflow**: no horizontal overflow on any of the 14 routes at 360, 390, 768, 1024, 1440 and
  1920px (automated, in the browser suite), at 2560px on the homepage, or at 720px (200% zoom
  equivalent) on eight routes.
- **Visual review**: I looked at full-height contact sheets of all 14 routes at 834 × 1112, and at
  360px for home, subjects, maths, science, about, FAQ, book and safeguarding; at 1440px for every
  route; and at 390px for home, about and FAQ. The 360px sheets for English, 11+, contact, privacy
  and the remaining legal pages were generated and pass the overflow and axe checks, but I did not
  inspect those images individually.
- **Reveals**: every scroll-reveal block (113 per size) becomes fully visible when brought to the
  centre of the screen, at 1440, 834, 390 and 360px.

### Accessibility

- axe-core (WCAG 2.0/2.1 A and AA, critical and serious) on every route, settled and under reduced
  motion: no violations. Also on the open mobile menu, the form error state and the form server-error
  state.
- Keyboard: skip link first in the tab order and slides on-screen with a 3px outline; every header
  stop has a visible focus indicator; Escape closes the menu and returns focus to the toggle; FAQ
  opens with Enter and closes with Space.
- Touch targets 44px or larger in the header; form errors are associated through `aria-describedby`
  and `aria-invalid`; decorative SVG and arrows are `aria-hidden`; founder articles are named by
  their headings.
- JavaScript off: 0 of 26 revealed blocks hidden on the homepage (the original hid 20 of 20).
- Reduced motion: no content held behind a reveal and no looping animation on any route.

## Performance

Production builds, caches disabled, three runs per cell (median), Chrome headless.

| | Original | Port |
|---|---|---|
| JavaScript transferred, every route (gzip) | 159 KB | 236 KB (+77 KB, the motion runtime) |
| CSS transferred | 29 KB | 23 KB (−6 KB) |
| Images | identical | identical |
| Total, e.g. `/` mobile | 468 KB | 551 KB (+18%) |
| Cumulative layout shift, every route | 0 | 0 |

LCP measured at load, before any scrolling, nine runs per cell:

| Route (mobile, 4× CPU throttle) | Original | Port |
|---|---|---|
| `/` | 768 ms | 544 ms |
| `/subjects` | 736 ms | 540 ms |
| `/maths-tuition` | 864 ms | 460 ms |
| `/about` | 824 ms | 536 ms |
| `/book` | 724 ms | 540 ms |
| `/safeguarding` | 892 ms | 452 ms |
| `/faq` | 780 ms | 1484 ms |

`/` and `/book` were re-measured on the final build; the other rows were measured one commit earlier (the later hero and phone-number changes do not touch their LCP element). Desktop (1440px) LCP is between 156 and 272 ms on every route for both builds (`/`: 216 → 188 ms; `/book`: 236 → 264 ms, within run-to-run noise). The `/faq` mobile
figure is a metric artefact rather than a slow page: the logo and heading paint at about 400 ms, and
LCP moves to the first jump pill (marginally the larger element) at about 1.4 s; the original's LCP
in the same setup is also about 1.3 s in a single run. It is well inside the "good" threshold.

No WebGL or Three.js was added; the hero uses CSS only. Motion is compositor-first (transform and
opacity), reveals never wrap first-screen content, and the infinite marquee pauses when off-screen
or when the tab is hidden.

## Browser issues found and fixed

Found by viewing the site rather than from the source:

1. The `motion-dom` 13.5.0 mismatch that broke the build (pinned).
2. Founder portraits squeezed to a sliver (inherited from the source).
3. FAQ accordion marker: an offset "=" instead of "+", and an invisible "−" when open (inherited;
   caused by the bundler dropping combined `::before, ::after` selector lists).
4. Hero copy pinned to the top of the panel, and 600px of dead space on a 2560px screen.
5. Closing CTA scene: a full viewport of mostly empty navy.
6. Hero buttons wrapping their labels at 390px.
7. Footer phone contacts laid out inconsistently.
8. Contents nav: list number aligned to the last line of a wrapped link; active state shifted text.
9. 11+ block on `/subjects` was a dead end.
10. Full stop orphaned on its own line after the phone numbers in legal contact boxes.
11. `/#enquire` links to a homepage anchor that does not exist on this site.
12. Marquee unstyled on a direct visit to `/subjects` (legacy).
13. Every below-the-fold block invisible with JavaScript off (legacy).
14. Stale legal and FAQ copy (see above).

Two measurement traps worth knowing, because they produced false alarms while verifying: an
overwritten `next start` build serving stale HTML (CSS chunk 500, serif fallback fonts), and axe or
screenshots taken mid-reveal.

## Decisions for the business

These were settled by default so the work could finish; each is cheap to reverse.

1. **Product demo**: the source's "One platform, built around every lesson" tabs, sticky product
   story and "Lesson report, every time" chip were left out. They describe the authenticated app;
   include them only if Tuition's clients actually get that product.
2. **Extra legal pages**: the source has `/tuition-terms`, `/complaints` and `/accessibility`. They
   are not on Tuition, so the footer does not link them. Adding company legal documents to the live
   site is a business and legal decision.
3. **DBS claim**: "Every tutor goes through a thorough hiring process... including a DBS check. No
   tutor begins teaching until this process is complete" is now on the homepage and `/safeguarding`.
   The source records it as confirmed by the business; please confirm it is accurate for Tuition.
4. **Legal review dates and `LEGAL_REVIEW.md`**: Privacy and Cookies still say "last reviewed
   10 September 2026" although their enquiry wording changed, and `LEGAL_REVIEW.md` still describes
   the old "prepares a `mailto:` draft; does not submit to a backend" flow. The review should be
   refreshed for the direct-send flow, which now involves an email delivery provider (Resend) and a
   confirmation email.
5. **Reply time**: the auto-reply says 5 working days; the source's homepage said 24 hours. The site
   no longer states a reply time anywhere except the auto-reply email.
6. **Local review**: the branch is not pushed. The Software repository was only read.

## Remaining limitations

- JavaScript is 77 KB larger per route (the motion runtime). A lighter runtime would need the
  primitives rewritten without `framer-motion`.
- The subject-card to subject-page transition (React `ViewTransition`) was not ported; it needs
  React 19.3.
- `SubjectCard`, `SubjectDetail` and `TestimonialCard` were already unused before this work and
  remain; `ProductLayer` is unused after the product demo was left out.
- Source comments referring to `plan11.md` and `plan12.md` came across with the code; those
  documents are not in this repository.
- The English hero's ruled lines run across the eyebrow text. They are faint and pass contrast, but
  the line positions are fixed rather than aligned to the text.
- The enquiry route's `LOGO_URL` constant is unused (lint warning); it was left because the route
  was deliberately not touched. In development the route only accepts the `localhost:3000` origin.
- The 360px images for English, 11+, contact and the remaining legal pages were not individually
  inspected (see Responsive).
