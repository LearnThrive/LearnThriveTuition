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
parent receives a confirmation email. The route validates every field, checks the request
origin, rate-limits by IP and sends two emails through Resend: the notification to LearnThrive
and the auto-reply to the enquirer. It reads these environment variables (see `.env.local`;
never commit real values):

- `RESEND_API_KEY` — required; without it the enquiry cannot be sent.
- `RESEND_FROM_EMAIL` — the verified sender address.
- `ENQUIRY_EMAIL` — where enquiries are delivered (defaults to the published inbox).
- `ALLOWED_ORIGINS` — comma-separated origins allowed to post (defaults to the production site;
  `http://localhost:3000` is added in development, so run `npm run dev` on port 3000 if you want
  to submit a real test enquiry).

Do not describe the form as preparing an email draft anywhere on the site: that was the old
flow, and `tests/design-port.test.mjs` fails if that wording comes back.

## Design system

The public design (tokens, typography, header, footer, buttons, forms and the motion language) is
ported from the LearnThriveSoftware product so the marketing site and the product read as one
brand. `docs/DESIGN_PARITY_AUDIT.md` maps each area of the design to what was ported, adapted or
left out, and `docs/DESIGN_PORT_COMPLETION.md` records the port itself.

- Tokens, typography and component styles: `src/app/globals.css`.
- Motion: `src/lib/motion/` (capability tiers, reduced motion, activity suspension) and
  `src/components/motion/` (the runtime, primitives such as `Reveal`, and the page scenes).
  Content on the first screen must never wait on a reveal.

## Content

The FAQ page and its categories come from `src/lib/faqs.ts`; native accordions work without
JavaScript. Privacy, Cookies, Website Terms and Safeguarding pages describe the current marketing
and enquiry website, and each states its own review date. Outstanding company decisions and the
authoritative guidance consulted are recorded in `LEGAL_REVIEW.md`.

The old public tutor URLs permanently redirect to About. The separate external Tutor login
remains available in the footer.
