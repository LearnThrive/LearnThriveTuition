# What to port from the friend's Software changes

> **Status (6 October 2026): done.** This was the plan. What was actually built, where it differs, and the
> evidence are in `docs/PLAN15_PORT_COMPLETION.md`. Since this list was written the owner decided to remember
> theme and motion choices and to add the command palette (3.9), so both are built. Only the bare-domain redirect
> (4.1) was left out on purpose.

**Source.** `LearnThriveSoftware` `main` at `3cd2544`: 27 commits by Alvi Hossain between 1 and 5 October,
236 files, on top of `b5e6827` (the commit the first design port was taken from). The friend's own
write-up is `LearnThriveSoftware/docs/PLAN15_COMPLETION_REPORT.md` (plus `BRAND.md`, `DEPLOYMENT.md`,
`PLAN15_OWNER_INPUTS.md`).

**Target.** `LearnThriveTuition` `main` (the merged design port, `e7772cd`).

**How "difficulty" was measured.** For every shared file I ran a real three-way merge: the friend's old
version (`b5e6827`), my Tuition version, and the friend's new version. "Clean" means Git merged it with
no overlap. "N conflicts" means N regions where my port and the friend's changes both edited the same
lines and a person has to decide. Nothing has been changed in either repo; this is a plan.

Of 47 shared files, **31 merge cleanly** and **16 have 1 to 7 conflicts** (the friend edited two layout files that I merged into one, so the root layout shows up twice in the raw count). 65 files are new.

---

## 0. Decide these first (they gate the rest)

| # | Decision | Why it matters | If you say no |
|---|---|---|---|
| D1 | **Upgrade React 19.2 to 19.3** (and check Next 16.3.2 → 16.3.8) | Route transitions and the subject-icon morph use React's `ViewTransition`, a 19.3 API | Skip `PageTransition`; strip the `ViewTransition` wrappers as in the first port. Nothing else depends on it |
| D2 | **Browser storage** for the theme, motion and search-history choices | Writes `lt-theme` and `lt-motion` (local storage) and recent searches (session storage), only after a visitor chooses. Needs the cookie notice rewritten (the friend already wrote it) and a legal sign-off, which the friend lists as still open (owner input 7). Tuition's tests currently assert that no storage is used | Drop the theme and motion toggles and the palette's history; keep the site light-only and stateless |
| D3 | **Dark theme** | It follows the visitor's device setting: dark-mode devices get the dark site, everyone else sees the light site as today. No per-visitor "force dark". Needs a brand sign-off on the dark look; emails stay light | Skip `ThemeToggle`, `theme.ts` and the dark token values |
| D4 | **Smooth scrolling** (adds the `lenis` dependency) | Changes how scrolling feels for mouse users. The friend asks the owner to feel-test it (owner input 11) and shipped two kill switches | Skip `SmoothScroll.tsx` / `smoothScroll.ts` |
| D5 | **The trust hub depends on pages Tuition does not have** | `/trust` links to `/accessibility`, `/complaints` and `/tuition-terms` (the same three company documents I left out of the first port) | Port those three pages, or trim the hub to safeguarding, privacy, cookies and website terms |
| D6 | **DBS / vetting wording** | The friend's own list still marks "DBS and vetting statements, with evidence" as an open owner item (6), and their trust hub makes no such claim. Tuition's homepage band and `/safeguarding` section do (carried over from the Software safeguarding page) | Soften or remove the homepage band; keep the safeguarding page as the owner approves |
| D7 | **Enquiry route: keep Tuition's version as the base** | Tuition's is newer than the friend's: 5-working-day auto-reply (the friend's still says 24 hours), strict origin check (the friend's allows a missing origin) and validation of the contact method (the friend dropped it) | n/a (recommendation: keep Tuition's wording and checks, add only the friend's new protections, see section 4.2) |

---

## 1. Low-risk wins (do these first; mostly clean merges or plain copies)

| Item | What a visitor gets | Files (Software → Tuition) | Merge |
|---|---|---|---|
| **Optimised subject photos** | The four subject photos drop from 1.2 to 3.8 MB each to 75 to 200 KB, with per-image crop focus and blur placeholders. Also resolves the "image weight" item in the friend's deployment plan | `public/images/subject-{maths,english,science,elevenplus}.jpg` (copy), new `src/lib/imageFocus.ts`, `src/lib/imageBlur.generated.ts`, optional `scripts/optimise-images.mjs`, `scripts/images.config.json`; wire into homepage and subjects page | Copy; page edits touch 2 files with conflicts |
| **Vector brand and icons** | Crisp logo at any size, proper favicon, Apple icon, app icons (192, 512, maskable) | `public/brand/*.svg`, `src/components/brand/{BrandMark,BrandIllustration,brandPaths}`, `Brand.tsx` (clean), `src/app/{icon.svg,favicon.ico,apple-icon.png}`, `public/icons/*`, `manifest.ts` (clean); drop `public/favicon.svg` and the root layout's `icons` entry | Clean. Check the traced logo against the current one by eye |
| **Branded error pages** | A friendly page instead of Next's default on a runtime failure | `src/app/error.tsx`, `global-error.tsx` (new), `not-found.tsx` | New files; `not-found.tsx` has 1 conflict |
| **SEO and crawl files** | Better search and social previews | `sitemap.ts`, `robots.ts`, `lib/metadata.ts` (all clean); `components/seo/JsonLd.tsx`, `lib/structuredData.ts`; OG image route `app/og/[[...slug]]/route.tsx` + `lib/ogPages.ts`; `public/.well-known/security.txt` (the contact address needs confirming, owner input 5) | Clean or new |
| **Print stylesheet and announcement slot** | Pages print cleanly; a one-line banner can be switched on later | in `globals.css`; `components/AnnouncementBar.tsx` | Part of the `globals.css` merge |
| **Plain-text email versions** | Spam-filter and accessibility benefit | in the enquiry route (see section 4.2) | With the route |
| **Marquee fixes** | Direction and loop corrected, scroll coupling | `Marquee.tsx`, `Marquee.module.css` | Clean |
| **Small fixes already isolated** | Parallax, section handoff, scene and icon fixes | `ParallaxLayer.tsx`, `SectionHandoff.tsx`, `SceneShell.module.css`, `SafeguardingScene.module.css`, `SubjectIcon.tsx`, `ProductLayer.module.css`, `MotionRuntime.tsx`, `lib/motion/{capabilities,reducedMotion}.ts` | All clean |
| **Page-level wiring** | Pages pass their path so breadcrumbs and structured data work | `book`, `contact`, `faq`, `privacy`, `terms`, `safeguarding` pages (1 to 6 lines each); `PageHero.tsx` (+4), `LegalPage.tsx` (+5), `EnquiryForm.tsx` (+42, adds the honeypot and timer fields, **port together with the route**) | All clean |

---

## 2. Fixes that overlap work I already did (choose one fix per item)

| Defect | Mine (first port) | Friend's | Recommendation |
|---|---|---|---|
| **Founder portraits** | The wrapper no longer squeezes the photo, but the 320 × 320 files are still cropped to 3:4 | `5473ee7`: portraits render **1:1** at a fixed, unsqueezable size, so nothing is cropped | **Take the friend's and drop mine.** Their ratio matches the files. Touches `about.module.css` (2 conflicts), `about/page.tsx` (2), `AboutFoundersScene.tsx` (1). Keep my `aria-labelledby` on the articles and the `/contact` CTA |
| **Hero copy vertical balance** | Centred in the panel, and moved in on ultra-wide screens (`heroCopyWrap`) | `1777c4a` F12 | Look at both at 1440 and 2560px; keep whichever reads better, not both |
| **Maths hero curve over the text** | Not addressed | `1777c4a` F5 | Take the friend's |
| **Hero chip contrast** | Not addressed | `6ffbff6` | Take the friend's (it is a contrast fix) |
| **Closing CTA height** | Capped at 560px | Not addressed | Keep mine (`SceneShell.module.css` merges cleanly with the friend's edits) |

---

## 3. The design layer (largest piece; do as one coordinated unit)

These share `globals.css` and the layouts, so they cannot be ported piecemeal. The friend shipped them
as one commit (`04b8ed5`) for the same reason.

| Item | What a visitor gets | Files | Merge |
|---|---|---|---|
| **3.1 Tokens** | One source of truth for colour, elevation and focus; the same look in both themes | new `src/app/tokens.css` (443 lines); `globals.css` (+1279 / −291); colour substitution across `home`, `about`, `contact`, `faq`, `subjects` CSS modules (the friend scripted it: `scripts/tokenise-colours.py`) | `globals.css` **4 conflicts** (my login-CSS removal, header-login removal, contents-nav fix, hero/phone edits); `home.module.css` **3**, `about.module.css` **2**; `contact` clean; `faq` and `subjects` modules clean |
| **3.2 Dark theme** (D3) | Dark site for dark-mode devices, with a Light / Dark / System control | `lib/theme.ts`, `ThemeToggle(.module.css)`, the head init script and `data-themes` in the root layout, footer appearance control | Root `layout.tsx` has **5 conflicts** (the friend edited two layouts that I merged into one) |
| **3.3 Motion v2** | Named durations for every effect; scroll store; System / Reduce preference | `lib/motion/{tokens,scroll}.ts` (clean), `depth.ts`, `scrollStore.ts`, `preference.ts`, `useMotionPreference.ts`, `components/MotionToggle.tsx` | Mostly new; two clean edits |
| **3.4 Smooth scroll** (D4) | Lenis-style eased scrolling on the marketing pages only | `SmoothScroll.tsx`, `lib/motion/smoothScroll.ts`, `lenis` in `package.json` | `package.json` has 2 conflicts (my `overrides` block); mounts in the layout |
| **3.5 Storytelling** | Statement that reads into focus on scroll, staggered cards, spotlight borders, level bars, pinned hero handoff | `ScrubStatement`, `Stagger`, `SpotlightPointer`, `MagneticLink`; homepage hero stack; `HeroScene.tsx` | `HeroScene` **7 conflicts** (I removed WebGL; the friend's pointer-lerp and context-loss edits are moot without it), `page.tsx` **2**, `home.module.css` **3** |
| **3.6 Navigation and chrome** | Sliding active-link bar, subjects dropdown, breadcrumbs, mobile "Book" bar, slim route progress bar, sitemap-style footer | `SiteHeader.tsx` (2 conflicts), `SubjectsFlyout.tsx`, `Breadcrumbs.tsx`, `MobileEnquiryBar.tsx`, `NavigationProgress`, `SiteFooter.tsx` (1 conflict) | Remove the portal parts (see "Do not port"); keep the external Tutor login |
| **3.7 Subject worlds** | Higher-fidelity maths plane, annotated English, science loop, 11+ route | `SubjectStage(.module.css)`, `lib/motion/subjectStage.ts`, `SubjectWorld.tsx` (clean), `SubjectLandingPage.tsx` (1 conflict), `subjects/page.tsx` (1) | |
| **3.8 Trust hub** (D5, D6) | One page listing the policies and who the company is | `app/trust/page.tsx`, `trustLinks` in `lib/site.ts` (clean) | Needs D5 |
| **3.9 Command palette** (D2) | Ctrl/Cmd+K search of the site's pages | `components/palette/{CommandPalette,PaletteHost,PaletteTrigger,PublicPalette,ShortcutsOverlay}`, `lib/palette/{publicCommands,score,shortcuts,events}` | New; edit the command list to Tuition's pages and routes |
| **3.10 Route transitions** (D1) | Directional page transitions | `PageTransition.tsx` | Needs React 19.3 |

**Cost to expect.** The friend measured about **+65 KB gzipped on the desktop homepage** for all of this
(their budget was +60 KB). Tuition is already +77 KB over the original site after the first port, so
the homepage would be roughly 140 KB over where it started. Several pieces are lazy (the palette),
so skip what you do not want: D1 to D4 and 3.9 are the heavy ones.

---

## 4. Deployment hardening

| Item | What it does | Files | Merge |
|---|---|---|---|
| **4.1 Security headers** | CSP (self-only, `unsafe-inline` for Next's own scripts), HSTS, COOP, `X-Robots-Tag` on the API, bare-domain to `www` redirect | `lib/securityHeaders.ts` (new), `next.config.ts` | **1 conflict.** Ship with `CSP_REPORT_ONLY=1` first and enforce after a soak. Turn HSTS on only once the domain is confirmed HTTPS-only (owner input 4). Suits Tuition because there are no third-party requests |
| **4.2 Enquiry hardening** | Honeypot field, minimum time to submit (2.5 s in production), duplicate-send suppression, "fail closed" when production variables are missing (a friendly "email us" message instead of a silent send), logs with no personal data | `app/api/enquiry/route.ts` | **7 conflicts, merge by hand on top of Tuition's route** (D7). Port with the `EnquiryForm.tsx` change in section 1. Also fixes the Resend-client-at-startup problem in the friend's `DEPLOYMENT_PLAN.md` |
| **4.3 Health and CI** | `/api/health`, a GitHub Actions workflow, a 37-test production smoke suite | `app/api/health/route.ts`, `.github/workflows/ci.yml`, `tests-prod/smoke.spec.ts`, `playwright.prod.config.ts` | New; the smoke suite uses `@playwright/test`, which Tuition does not have (Tuition uses `playwright-core`), so adapt or skip |
| **4.4 Environment and docs** | Variable table, deployment guide | `docs/DEPLOYMENT.md`, `DEPLOYMENT_READINESS.md`, `.env.example` | Copy and adapt |

---

## 5. Do not port

- The portal and signed-in app: `proxy.ts`, `lib/portal.ts`, `portal-opening-soon` page, the `PORTAL_ENABLED` Login links in the header, footer and mobile bar (`SiteHeader`, `SiteFooter`, `MobileEnquiryBar` mention it), `AppPalette*`, `ShortcutsOverlay` app shortcuts, `app-*.css`.
- Software's `tutorLoginUrl: "/login"`: Tuition keeps its external TutorCruncher login.
- The product-demo changes (`ProductStoryScene`, `ProductTabs`): still left out, for the reasons in the first port.
- App features and tests (reports PDF, calendar export, progress timeline, reminders, classroom), the `docs/PLAN*` write-ups, and Storybook stories.

---

## 6. Suggested order

1. **Decide D1 to D7** (a short conversation with the owner; D2 and D6 need a legal view).
2. **Section 1** as one or two commits (images, brand, errors, SEO, marquee and small fixes). Verify with the existing checks.
3. **Section 2**: founder portraits first (largest visible defect), then the hero items.
4. **Section 3.1 → 3.3** together (tokens, theme, motion), then **3.6** (navigation) and **3.5**; then 3.7 to 3.10 as the decisions allow. After each: `npm run check`, `npm run test:browser`, and a look at 1440, 834, 390 and 360px.
5. **Section 4**, with the CSP in report-only mode at first.
6. **Tests and docs to update as you go.** `scripts/browser-check.mjs` currently asserts that browser storage is empty after the enquiry flow, and `tests/design-port.test.mjs` forbids `/login` and `/dashboard` strings (the palette and header code will need adjusting to pass) and any `transition: all` or global `will-change`. Update these deliberately, not by weakening them, when D2 to D4 are accepted. The cookie notice and `LEGAL_REVIEW.md` must be updated at the same time as the storage.

## 7. Things I could not verify

- I have not run the friend's changes inside Tuition. The merge counts above come from three-way merges of the files only.
- The friend's performance numbers are for the Software site; Tuition's will differ.
- I have not seen the friend's dark theme, trust hub or subject worlds rendered. Review them in the Software site first (`npm run dev` in that repo) before deciding what Tuition should adopt.
