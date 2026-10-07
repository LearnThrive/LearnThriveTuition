# LearnThrive Tuition marketing website

A production-focused public marketing website for LearnThrive Tuition, built with Next.js, React and TypeScript.

## Local development

Use a supported Node.js version matching `package.json`, then run from the repository root:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

For a production preview, stop any existing server with Ctrl+C, then run:

```bash
npm run build
npm start
```

Open `http://localhost:3000` and hard-refresh with Ctrl+F5. `npm start` serves the
last production build, so rebuild and restart after changing source files. Use
`npm run dev` for live updates while editing; do not run both servers on port 3000.

## Quality checks

```bash
npm run check
```

This runs linting, TypeScript, the content, link and design-port tests (`tests/`) and a production
build.

After a successful build, the responsive browser and accessibility checks can
be run with:

```bash
npm run test:browser
```

The browser check uses a locally installed Chrome or Edge executable and writes
review screenshots to `artifacts/browser`. It visits every route at six viewports (360 to
1920px) and checks for horizontal overflow, runs axe-core on the settled page and again under
reduced motion, exercises the enquiry form with the API answered by the test (no email is
sent), and checks the site with JavaScript off.

Run both the production checks and browser suite together with `npm run check:full`.

## Enquiries

The booking form sends the enquiry directly to LearnThrive through `/api/enquiry`, and the
parent receives a confirmation email. The route validates every field, requires the request
origin to be an allowed one, rate-limits by IP and sends two emails through Resend (each with a
plain-text version): the notification to LearnThrive and the auto-reply to the enquirer, which
promises a reply within 5 working days. It reads these environment variables (see `.env.local`;
never commit real values):

- `RESEND_API_KEY` — required; without it the enquiry cannot be sent.
- `RESEND_FROM_EMAIL` — the verified sender address.
- `ENQUIRY_EMAIL` — where enquiries are delivered (defaults to the published inbox in
  development).
- `ALLOWED_ORIGINS` — comma-separated origins allowed to post (defaults to the production site;
  `http://localhost:3000` is added in development, so run `npm run dev` on port 3000 if you want
  to submit a real test enquiry).

**In production all three of `RESEND_API_KEY`, `RESEND_FROM_EMAIL` and `ENQUIRY_EMAIL` must be set.**
If any is missing the route fails closed: it sends nothing and the form tells the visitor to email
the inbox directly, rather than sending from a shared sender or to a default address.

Abuse protection is invisible to a real visitor and uses no third-party service: a honeypot field
(`website`), a minimum time between opening and sending the form (2.5 seconds, production only),
the same enquiry sent twice within a minute counts once, and a per-IP limit. A request that trips
the honeypot or the timer gets the normal success answer and nothing is sent. The route logs one
line per outcome and never logs a name, email, phone, message or IP. `tests/enquiry.test.mjs`
covers all of this.

`GET /api/health` answers `{"status":"ok"}` for an uptime monitor. It reads no configuration and
calls nothing.

## Security headers

`src/lib/securityHeaders.ts` builds the response headers, and `next.config.ts` applies them. In
production every page gets a Content-Security-Policy (this site's own origin only, no `eval`, no
framing, forms post only to this site), `Strict-Transport-Security` for this host (a year, without
`includeSubDomains` or `preload`), `Cross-Origin-Opener-Policy: same-origin`, and the existing
baseline; `/api/*` also sends `X-Robots-Tag: noindex`. `script-src` keeps `'unsafe-inline'` because
a per-request nonce would make every page dynamic; the policy's value is that nothing can load from
any other origin. If a deploy ever blocks something it should not, set `CSP_REPORT_ONLY=1` at build
time to downgrade the policy to report-only, then fix the cause.

Which of `learnthrivetuition.co.uk` and `www.learnthrivetuition.co.uk` is the canonical host is a
setting at the hosting provider (pages declare the `www` address as canonical). There is deliberately
no redirect between them in `next.config.ts`: a rule in code that disagreed with the host's own would
loop.

Do not describe the form as preparing an email draft anywhere on the site: that was the old
flow, and `tests/design-port.test.mjs` fails if that wording comes back.

## Design system

The public design (tokens, typography, header, footer, buttons, forms and the motion language) is
ported from the LearnThriveSoftware product so the marketing site and the product read as one
brand. `docs/DESIGN_PARITY_AUDIT.md` maps each area of the design to what was ported, adapted or
left out, and `docs/DESIGN_PORT_COMPLETION.md` records the port itself.

- Tokens, typography and component styles: `src/app/tokens.css` (semantic tokens: what a colour is
  *for*) and `src/app/globals.css` (the raw palette and the shared components).
- Motion: `src/lib/motion/` (capability tiers, reduced motion, activity suspension) and
  `src/components/motion/` (the runtime, primitives such as `Reveal`, and the page scenes).
  Content on the first screen must never wait on a reveal.
- Dark theme and motion: the site follows the visitor's device by default. A visitor can also choose
  System, Light or Dark (the icon button in the header, or the Appearance control in the footer) and
  System or Reduce for motion (the footer, or the site search). Those choices are remembered in the
  visitor's own browser: `lt-theme` and `lt-motion` in local storage, written only when a choice is made
  and removed when System is chosen again, and applied before first paint by a small script in
  `src/app/layout.tsx` so there is no flash. The site sets no cookies. Set `NEXT_PUBLIC_THEME_TOGGLE=0` at
  build time to switch the dark theme and its controls off. `tests/theme.test.mjs` checks every text and
  background token pair against WCAG AA in both themes.
- Browser storage is a short, reviewable list: `tests/storage.test.mjs` fails if any other file touches it,
  if anything sets a cookie, or if the Cookie notice (`src/app/cookies/page.tsx`) stops naming each key.
  Add a new use only after updating that notice and `LEGAL_REVIEW.md`.
- Site search (Ctrl or Cmd + K, `/`, or the header's search button): `src/components/palette/` and
  `src/lib/palette/`. `PaletteHost` is tiny and always loaded; the palette and its page, subject and FAQ
  list are a separate chunk fetched when someone shows intent to use it. Its "recent" list lives in session
  storage and is gone when the tab closes. To add a page to the search, add it to
  `src/lib/palette/publicCommands.ts`.
- Smooth scrolling (Lenis): only for a mouse or trackpad on the full and standard motion tiers, never
  for touch, reduced motion or Save-Data, and precision-touchpad scrolling is left to the browser.
  Set `NEXT_PUBLIC_SMOOTH_SCROLL=0` at build time to remove it, or add `?smooth=0` to a URL to turn it
  off for that visit (nothing is remembered).
- Page transitions use React's `ViewTransition` (React 19.3, so `react` and `react-dom` are pinned to
  exactly `19.3.0`) and degrade to an instant navigation without the browser API or under reduced
  motion.

## Content

The FAQ page and its categories come from `src/lib/faqs.ts`; native accordions work without
JavaScript. Privacy, Cookies, Website Terms, Tuition Terms, Safeguarding, Complaints and
Accessibility pages describe the current marketing and enquiry website, each states its own review
date, and `/trust` links to all of them in one place (it makes no claim of its own). Outstanding
company decisions and the authoritative guidance consulted are recorded in `LEGAL_REVIEW.md`.

Every public route is listed in `src/app/sitemap.ts` and has a preview card in `src/lib/ogPages.ts`
(served from `/og/...`); `tests/site.test.mjs` fails if a page folder is missing from either.

The old public tutor URLs permanently redirect to About. The separate external Tutor login
remains available in the footer.
