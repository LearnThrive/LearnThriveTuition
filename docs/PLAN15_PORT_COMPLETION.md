# Plan 15 port: completion record

**Date:** 6 October 2026. **Branch:** `plan15-port` (from the merged design port, `e7772cd`). Nothing pushed.

**Ported through** `LearnThriveSoftware` commit `3cd2544` (27 commits by Alvi Hossain, `b5e6827..3cd2544`).
To pick up the friend's later changes, start from `git log 3cd2544..` in the Software repo and use the same
method as before: a three-way merge per shared file, with the old Software version as the base.

The plan and the decisions behind it are in `docs/PLAN15_PORT_LIST.md`.

## What the owner decided

| # | Decision | What was done |
|---|---|---|
| 1 | Update React | `react`, `react-dom` and their types pinned to exactly `19.3.0`. This is what enables route transitions (`ViewTransition`). |
| 2 | Browser storage: **yes, remember a visitor's theme or motion choice** (decided later the same day) | The friend's saved-choice theme and motion controls are ported (header and footer), with the Cookie notice updated to name exactly what is stored. See "Browser storage" below. |
| 3 | Dark theme and smooth scrolling: yes | Both ported. |
| 4 | Trust page links: yes | `/trust` plus `/accessibility`, `/complaints`, `/tuition-terms`. |
| 5 | DBS / vetting wording: **do not touch** | Left exactly as it was. The diff against `main` contains no change to it, and the new site search deliberately has no DBS or vetting keywords. |
| 6 | Keep the 5 working day wording | The enquiry route keeps Tuition's wording, strict origin check and contact-method check. |
| 7 | Complaints (2 and 10 working days) and Accessibility (aims for WCAG 2.2 AA): **confirmed** | Text kept as it was; the confirmation is recorded in `LEGAL_REVIEW.md`. |
| 8 | Command palette: **add it** | Ported as the site search (Ctrl/Cmd+K, `/`, header button) with Tuition's own pages, subjects, FAQ questions and contact options. |

### Browser storage

The site sets **no cookies**. It stores three things in the visitor's own browser, each only because of a choice
the visitor makes: `lt-theme` (local storage, set when they pick Light or Dark, removed when they pick System),
`lt-motion` (local storage, set when they pick Reduce, removed when they pick System) and
`lt-palette-public:recent` (session storage, the search's recent results, gone when the tab closes). Browsing
alone stores nothing. `tests/storage.test.mjs` keeps that list honest, and the browser check verifies it end to
end. Two points are still for you and a legal reviewer; see "What you need to do".

## What was ported

The commits on the branch, in order:

1. **Phase 1, assets and SEO:** optimised photos (the subject photos are now 75-200 KB each), vector brand
   mark and illustrations, icons and web manifest, branded error and not-found pages, the `/og/...` preview cards,
   structured data (JSON-LD), `security.txt`.
2. **Design layer:** semantic tokens (`tokens.css`) and the dark theme; the v2 motion system (scroll store, depth,
   `ScrubStatement`, `Stagger`, `MagneticLink`, `SpotlightPointer`, subject "worlds", the pinned hero handoff); Lenis smooth
   scrolling; route transitions; the new header (sliding indicator, Subjects dropdown, directional transitions) and footer;
   breadcrumbs; the phone "Book a free consultation" bar; the slim navigation progress bar; the trust hub and its three pages;
   sitemap and robots.
3. **Hardening:** enquiry route and form protections; security headers; 23 enquiry tests, 6 security-header tests, and the
   ported motion, theme, smooth-scroll, subject-stage, structured-data, capability, reveal and compositor tests.
4. **Fixes and coverage:** dark-mode menu icon; `GET /api/health`; sitemap, preview-card, robots and trust-hub tests; README
   and `LEGAL_REVIEW.md` updates.
5. **Security upgrade:** Next.js 16.3.8 (see below).
6. **This completion record.**
7. **Saved choices and site search:** the theme control (header icon, footer radio), the motion control (footer),
   the pre-paint script that applies a saved choice before first paint, the Ctrl/Cmd+K site search and its header
   button, the updated Cookie notice, `tests/storage.test.mjs`, and the browser checks for all of it.

## What was deliberately not ported

| Item | Why |
|---|---|
| Signed-in app, login, dashboard, classroom, portal notice, `proxy.ts`, `lib/portal.ts`, `app-*.css` | Out of scope for the marketing site. A test fails if a login, dashboard or portal route appears. |
| WebGL hero gradient | A canvas, a shader and a pointer listener for what the CSS glow already carries. |
| Bare-domain to `www` redirect in `next.config.ts` | Which host is canonical is a hosting setting. A rule in code that disagreed with the host's would redirect forever. Pages already declare the `www` address as canonical. |
| `classroomUrl` CSP entries and the camera/microphone permissions | No classroom here, so camera, microphone and location stay denied. |

## Where this site differs from the Software project

| Area | Difference | Reason |
|---|---|---|
| Enquiry route | Missing `Origin` is refused; contact method must be `Email` or `Phone`; auto-reply says 5 working days; reads headers from `request` | Tuition's route was already stricter and newer (decision 6). |
| Enquiry route | `NEXT_PUBLIC_SITE_URL` still sets the link in emails | Existing Tuition behaviour. |
| Header | The search and theme buttons sit in a `.header-tools` wrapper that adds no box on desktop and puts them side by side in the phone menu | In the Software markup they stack one per row in the phone menu. |
| Smooth scroll | `?smooth=0` lasts for the visit only; Software also keeps it in session storage | It is a debugging switch, and keeping it out of storage keeps the Cookie notice's list short. |
| Dialog styles | The palette's base dialog and round-button CSS is written afresh in `globals.css` with this site's tokens, above the header (`z-index` 120) | Software keeps them in its signed-in app stylesheets, which are not ported. |
| Site search list | The Safeguarding entry has no "DBS" or "vetting" keywords; the page and FAQ lists are Tuition's | Decision 5: nothing about DBS or vetting is touched or added. |
| Cookie notice | The Software project's wording for the saved choices and recent searches, with this page's own "last reviewed" date (10 September 2026) left as it was | See "What you need to do". |
| Phone enquiry bar | Dismissal kept in memory only (same as the Software version) and no portal route in its hide list | No portal. |
| HSTS | `max-age=31536000` for this host only: no `includeSubDomains`, no `preload` | Those reach beyond this site and wait for confirmation that the whole domain is HTTPS. |
| Permissions-Policy | `camera=(), geolocation=(), microphone=()` | No classroom here. |
| `robots.txt` | Disallows `/api/` only | No app, login or dev routes. |
| Footer | Keeps the external Tutor login (opens in a new tab) and the registration line | Tuition's own content. |
| Tokens | `--app-*` tokens and the product scope removed | A test forbids authenticated-app code in this project. |
| `ScrubStatement` | Muted state is 0.56 opacity, not 0.42 | At 0.42 the large heading text blended to 2.4:1, below the 3:1 large text needs. Axe flagged it. |
| Menu icon bars | Use `--fg-strong`, not `--surface-inverse` | They were 1.2:1 against their button in dark mode. |
| Pending "How it works" badge | Uses `--border-subtle`, not the fixed cream `--lt-border` | A light number on a cream badge in dark mode. |

The last three are bugs in the Software project's own CSS, worth passing back to Alvi.

## Evidence

All run on production builds unless stated.

- **`npm run check:full` passes:** lint, types, 169 unit tests, production build, browser check. The browser check covers
  all 18 routes at six viewports, axe, reduced motion, the enquiry flow, the mobile menu, no-JavaScript, the security
  headers, and a fresh-browser block for saved choices and the site search (below).
- **Dark and light accessibility sweep:** axe (WCAG 2 A and AA, 2.1 AA) reports no serious or critical failures on 19
  routes (including the 404 page) at 1440 and 390 px, in both schemes, on the settled page.
- **Interaction checks, 27 of 27:** phone menu (open, Escape, focus return, body lock), phone enquiry bar (hidden at
  the top, appears, dismisses, absent on `/book`), Subjects dropdown by mouse and by keyboard (Tab, Enter, Escape),
  sliding indicator, smooth scroll on for a mouse and off for touch, reduced motion and `?smooth=0`.
- **Storage, end to end:** a fresh visit stores nothing. Choosing Dark stores exactly `{"lt-theme":"dark"}`, and after a
  reload the site is painted dark before first paint (checked on `data-theme` and the body colour). Choosing Reduce adds
  `lt-motion`, and after a reload the site is on its reduced motion tier. Choosing System again leaves nothing saved. The
  search stores only `lt-palette-public:recent` in session storage, and a new browser session starts empty. No cookie is
  ever set. The choice beats the device in both directions (Dark on a light device, Light on a dark one).
- **Site search checks, 11 of 11:** `/` opens it from the page but not while typing in a form field; Tab stays inside it;
  Ctrl+K opens it; a result navigates; an FAQ result lands on that question, open; the dark-theme and reduce-motion
  commands apply and save the choice; recent results are offered first; the call commands list the two published
  numbers; focus returns to the button on Escape; axe is clean with it open.
- **Theme contrast:** `tests/theme.test.mjs` checks every text and background token pair against WCAG AA in both themes.
- **Performance, compared with `main` built the same way:** about +40 KB of JavaScript and +8 KB of CSS, and roughly
  +90 to 110 KB in total per page over the wire; home-page photos are lighter. The first LCP is not slower
  (for example `/subjects` about 320 ms against about 500 ms in one comparison run). A 2.4 s "LCP" my harness reported on two desktop pages was an
  artifact: the harness scrolls programmatically, which does not freeze LCP the way a real visitor's first scroll does.
  Measured on localhost with no throttling, so use the numbers for comparison only. A real Lighthouse and Safari/iPhone
  pass on the deployed site has not been done.
- **Dependencies:** `main` was on Next.js 16.3.2, which `npm audit` flags critically (a Windows-host RCE, an AVIF image
  optimiser RCE and a `next/og` RCE; the last needs visitor-controlled input in the image, and this site's `/og` route
  only renders fixed text). Upgraded to 16.3.8; `npm audit --omit=dev` now reports 0. The remaining findings are the
  dev-only linter chain (`braces` through `eslint-config-next`); npm's suggested fix is a downgrade to version 14, which
  was not taken.
- **One transient finding:** a light-mode axe run once flagged a heading on `/11-plus-tuition` at 390 px. Re-measured four
  times, it was clean once the heading's reveal had finished; that run caught it mid-animation.

## What you need to do

1. **Set the production environment variables.** `RESEND_API_KEY`, `RESEND_FROM_EMAIL` and `ENQUIRY_EMAIL` must all be
   set. If any is missing, the form sends nothing and tells the visitor to email the inbox directly.
2. **Read the new Cookie notice, then update its date.** You confirmed the 2 and 10 working day complaints promise and
   the WCAG 2.2 AA aim, and asked for remembered choices and the search. The Cookie notice
   (`src/app/cookies/page.tsx`) now describes the stored choices in the Software project's wording. Its "last reviewed"
   date is still **10 September 2026** on purpose: change `reviewedOn` once someone has read the new text, so the page
   does not claim a review that has not happened. Whether remembering an appearance choice needs consent is a legal
   question this project has not answered; the site shows no consent banner on the basis that the storage exists only
   because the visitor used the control. `/complaints` also lists "billing" as a complaint topic, and `/tuition-terms`
   says lesson terms are confirmed in writing before tuition: both are still worth a glance. Details are in
   `LEGAL_REVIEW.md`.
3. **Check `security.txt`.** It names `info@learnthrivetuition.co.uk` and expires 30 September 2027. Confirm that
   inbox is watched.
4. **If a deploy ever blocks something it should not,** set `CSP_REPORT_ONLY=1` at build time and redeploy. The
   Content-Security-Policy is enforced by default in production.
5. **Optionally ask for a real device pass:** Lighthouse and Safari on iPhone or Mac, and a hands-on feel test of smooth
   scrolling with a mouse and a touchpad.

## Open decisions

- **Decision 5, DBS and vetting wording.** Untouched, as instructed. The trust page makes no accreditation or vetting
  claim. Searching the site for "DBS" currently finds nothing, because the search has no DBS keywords; say if you want a
  search for it to land on the Safeguarding page.
- **The search's "recent" list.** It uses session storage (gone when the tab closes), as the Software project does, and
  the Cookie notice says so. If you would rather it kept nothing, it can be held in memory instead; the notice would
  lose one paragraph.
- **Legal review of the storage wording** (see "What you need to do", item 2).
- **`www` redirect.** If you want one in code, confirm first which host your hosting provider treats as primary.
- **`includeSubDomains` / `preload` on HSTS.** Only after you confirm the whole domain, every subdomain included, is
  permanently HTTPS.
- **Hosting rate limit.** The route's own IP limit is per server instance, so on a serverless host it is a second layer.
  A rule at the host (for example 5 requests per 10 minutes per IP on `POST /api/enquiry`) is the first.
