# Design parity audit

Maps each area of the public design in **LearnThriveSoftware** (the design authority, commit
`b5e6827`) to what the standalone **LearnThriveTuition** site had before the port
(`3493187`), what was done, and the result. Where the source design had a defect, the row says so
and the fix is recorded under "Deviations from the source".

Legend — **Port**: taken across as is. **Adapt**: taken across and changed to fit this site.
**Skip**: deliberately not ported (reason given). **Fix**: a defect found in the source or the
legacy site and corrected.

## Foundations

| Area | Final software site | Marketing site before | Action | Result |
|---|---|---|---|---|
| Colour tokens | Navy, LearnThrive greens, mint, cream, white, ink/muted, focus | Same palette | Port | Unchanged values; nothing to move |
| Fonts | `next/font` Bricolage Grotesque (headings), Public Sans (body), IBM Plex Mono (eyebrows, data) wired to `--font-heading` / `--font-sans` everywhere | The same three fonts were loaded, but the CSS chain began with `"Aptos"`, which nothing loads, so every route except `/` and `/subjects` fell back to Segoe UI | Port + Fix | Complete. One font system on every route |
| Motion tokens | `--duration-instant/fast/standard/slow`, `--ease-snappy/smooth/gentle` | `--duration-fast/medium`, one easing | Port | Complete |
| Spacing / gutters | `--section-space`, 40px page gutter, 16px on phones | Same | Port | Unchanged; per-page modules replaced with Software's |
| Responsive breakpoints | Component-specific `rem` breakpoints; no device names | Identical set | Port | Unchanged (verified: same max-widths in `globals.css`) |
| Focus states | Marketing keeps its yellow halo + brown outline; the app's accent ring is product-only | Same | Port | Unchanged; verified a visible indicator on every header tab stop and on the skip link |
| Reduced motion | Blanket `animation/transition-duration: 0.01ms` rule, view-transition rule, per-component checks for JS-driven effects | Blanket rule only; `ScrollReveal` checked `matchMedia` itself | Port | Complete. Tested: no content held behind a reveal, no looping animation |
| No-JS | `<noscript>` override so a reveal's server-rendered start state never hides content | Reveals were hidden by CSS until a script added a class: with JavaScript off, 20 of 20 revealed blocks on the homepage stayed at opacity 0 | Port + Fix | Complete. Measured: 0 of 26 hidden with JavaScript off; covered by the browser suite |

## Components

| Area | Final software site | Marketing site before | Action | Result |
|---|---|---|---|---|
| Header | Airy at the top, compact and solid once scrolled (threshold flip, no per-pixel state); mobile menu with backdrop, panel, staggered links | Static translucent bar with `backdrop-filter` | Port, minus Login | Complete. Session-aware "Login / Dashboard" link left out: it belongs to the authenticated app |
| Mobile menu | Backdrop dims the page and closes it when tapped; Escape returns focus to the toggle | Escape only | Port | Complete. Tested at 390px |
| Footer | Atmosphere layer, soft reveal, company registration line | Plain navy block | Port, keeping Tuition's links | Complete. Keeps the external Tutor login (new tab) and Tuition's four legal links |
| Buttons | `.button` shared CTA with tactile press; homepage `.btnPrimary/.btnSecondary` matched to it | `.btnPrimary` was a full pill; `.button` a 0.62rem radius | Port | Complete. One radius |
| Links | `.text-link`, nav underline, arrow affordance | Same | Port | Unchanged |
| Cards | Surface hierarchy: flat pathway cards, lifted support cards, navy/white/green "why" cards | Uniform lifted cards | Adapt | Complete. Fewer repeated rounded cards; see "Layout variety" below |
| Pills / chips | Jump-nav pills with counts and an active state (FAQ, subjects) | FAQ pills without active state | Port | Complete |
| Forms | Staged layout (your details / about the student), outlined labels, animated validation summary, focus management, success/error panels | Single block with an error summary that took focus; the server-error message did not | Port | Complete. Server errors now take focus too. Payload and API unchanged; tested end to end with the API answered by the test |
| Marquee | Owns its styles; pauses off-screen and when the tab is hidden | Styles lived in `home.module.css`, so a direct visit to `/subjects` showed an unstyled strip (measured: `overflow: visible`, no background, no animation) | Port + Fix | Complete |
| Icons | `SubjectIcon` set plus per-subject motifs | Icons drawn inline per page | Port | Complete. Icons hidden from assistive technology |
| Imagery | Same photography; hero photo on a parallax plane; `next/image` with `sizes` | Same photography | Port + Fix | Complete. Founder portraits fixed (see Deviations) |

## Pages

| Route | Final software site | Marketing site before | Action | Result |
|---|---|---|---|---|
| `/` | One continuous narrative: layered hero, stats, editorial statement, learning path, subjects, levels, tutor standards, testimonials, closing scene | Hero, why, how, subjects, levels, stats | Adapt | Complete. Omitted: product demo, embedded enquiry form, WebGL hero (see Intentional differences) |
| `/subjects` | Hero scene, per-subject motifs, level cards with depth, 11+ route motif | Conventional section stack | Port + Fix | Complete. 11+ card now links to its landing page |
| `/maths-tuition` | Coordinate grid and drawn curve | Template hero | Port | Complete |
| `/english-tuition` | Editorial / annotation language | Template hero | Port | Complete |
| `/science-tuition` | Connected nodes | Template hero | Port | Complete |
| `/11-plus-tuition` | Route / milestone path, own tint | Template hero | Port | Complete |
| `/about` | Founders scene, masked mission statement, section handoffs | Cards and a mission block | Port + Fix | Complete. Founder biographies and mission unchanged |
| `/faq` | Jump nav with active category, animated accordion, SEN category | Static jump pills, instant accordion | Port + Fix | Complete. 34 questions; copy updated to the direct-send flow |
| `/book` | Simplified hero + staged form + "What happens next?" | Custom hero with a "within 24 hours" promise | Adapt | Complete. Current wording; no reply-time promise |
| `/contact` | Email and phone cards, "what to include" list | Same content | Port | Complete |
| `/safeguarding` | Legal shell, tutor recruitment and DBS section, scroll-linked trust path, urgent-help box | Legal shell without the DBS section | Port | Complete. Review date comes from the page |
| `/privacy`, `/cookies`, `/terms` | Legal shell with per-page review date and contents nav | Same shell; copy said the form "prepares a draft email" and the site "does not send" it | Port + Fix | Complete. Copy now describes the direct-send flow |
| 404 | Same content on the public shell | Same content | Port | Unchanged content; new styling inherited |

## Typography

| Area | Final software site | Marketing site before | Action | Result |
|---|---|---|---|---|
| Heading scale | Bricolage 600–800, clamp-based hero sizes, tight tracking on large display | Same on `/` and `/subjects` only | Port | Complete on every route |
| Eyebrows | IBM Plex Mono, letter-spaced, uppercase | Same | Port | Unchanged |
| Body | Public Sans 400–700, measure capped on prose | Aptos chain (see Fonts) | Port + Fix | Complete |
| Text measure | `max-width: 70ch` on legal prose, 62ch on FAQ answers | Same | Port | Unchanged |

## Layout variety

The plan asks the site to avoid "eyebrow, heading, paragraph, three rounded cards" everywhere. What
changed in practice: the homepage is a sequence of different compositions (hero scene, stat strip,
full-width statement, path with a photograph, image cards, level rows, one dark trust band, offset
testimonials, a closing scene); the Science and Maths sections on `/subjects` carry drawn motifs
rather than another card grid; the subject landing pages share one structure but each has its own
hero geometry. The repeated white rounded card remains in the FAQ and level cards, where it is the
right container for a list of equivalent items.

## Intentional differences from the source

| Difference | Why |
|---|---|
| No "One platform, built around every lesson" product tabs, sticky product story, or "Lesson report, every time" hero chip | They market the authenticated app (live lessons, family-visible lesson reports). The plan excludes product-only functionality, and those service claims cannot be verified for Tuition |
| No embedded enquiry form on the homepage; hero and closing CTAs go to `/book` | Tuition's homepage has no form today; the standalone `/book` page is the enquiry route. The source's form promised a reply "within 24 hours", which conflicts with Tuition's 5-working-day auto-reply |
| No WebGL hero gradient | The static CSS glow gives every tier the same atmosphere with no canvas, shader or pointer listener. Plan: prefer CSS/SVG unless a high-value effect needs WebGL |
| No React `ViewTransition` (subject card to subject page morph) | It is a React 19.3 API; this site is on 19.2. The wrappers were removed and the content they wrapped kept |
| Header has no Login / Dashboard link | Authenticated-app functionality. Tuition keeps its external Tutor login in the footer |
| Footer keeps four legal links, not seven | The source's `/tuition-terms`, `/complaints` and `/accessibility` pages do not exist on Tuition. They are company legal documents, so adding them is a decision for the business; see the completion report |
| `tutorLoginUrl` stays the external TutorCruncher URL | The source points at its own in-app `/login` |
| Enquiry API left exactly as it was | Plan: do not change the enquiry backend. Tuition's route is newer than the source's (5-working-day auto-reply, stricter origin check) |

## Deviations from the source (defects fixed rather than copied)

| Defect | Where it came from | Fix |
|---|---|---|
| Founder portraits squeezed to a ~40px sliver, faces cropped out | Source: the parallax wrapper became the flex item and shrank | Wrapper carries the portrait's sizing; full width when stacked |
| FAQ accordion marker drew an offset "=" instead of "+", and the open state's white "−" was green-on-green (invisible) | Source: the bundler dropped the combined `::before, ::after` rules, so global fallbacks won | Each pseudo-element written out as its own rule |
| Closing CTA scene was a full viewport of mostly empty navy | Source: `min-height: 100svh` on a 4-line block | Capped at 560px, padding tightened |
| Hero buttons wrapped their labels (arrow orphaned) at 390px | Source | Stack full-width below 640px |
| Footer phone numbers laid out inconsistently (one inline, one wrapped) | Source and legacy | Name above number for every contact |
| Contents nav: list number aligned to the last line of a wrapped link; active state shifted the text sideways | Source | Block links with a reserved border |
| 11+ block on `/subjects` was a dead end | Source and legacy | "Explore 11+ Preparation in depth" link, matching the other three |
| FAQ jump nav painted late on phones (largest first-screen element behind a 0.42s stagger) | Source | Shorter stagger |
| `/#enquire` links pointed at a homepage anchor Tuition's homepage does not have | Source (its homepage has the form) | `/book` for enquiries, `/contact` for "get in touch" |
| Homepage failed WCAG AA contrast in four places (2.39, 3.00, 3.52, 4.12 against 4.5:1) | Legacy | Resolved by the ported colours; verified with axe |
| Every below-the-fold block on the homepage was invisible with JavaScript off | Legacy | `<noscript>` override; verified 0 of 26 hidden |
| Three lint errors (`<a href="/">` on two pages, an unescaped apostrophe in the form) | Legacy | Gone with the rewritten pages and form |
