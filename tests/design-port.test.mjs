import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const srcDir = join(root, "src");
const appDir = join(srcDir, "app");

function files(directory, pattern) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) return files(fullPath, pattern);
    return pattern.test(entry.name) ? [fullPath] : [];
  });
}

const sourceFiles = files(srcDir, /\.(?:ts|tsx)$/);
const cssFiles = files(srcDir, /\.css$/);
const read = (path) => readFileSync(path, "utf8");
const allSource = sourceFiles.map((file) => [relative(root, file), read(file)]);
const allCss = cssFiles.map((file) => [relative(root, file), read(file)]);

// ── Enquiry copy ───────────────────────────────────────────────────────────────────────────────

test("no page describes the retired email-draft enquiry flow", () => {
  // The form now sends the enquiry directly and the parent receives a confirmation email. Any of
  // these phrases would tell a visitor the opposite.
  const stale = [
    /prepares? (?:an? )?(?:email|draft)/i,
    /(?:draft|prepared) email/i,
    /email draft/i,
    /enquiries prepared through/i,
    /email (?:app|client)\b/i,
    /does not send the enquiry/i,
    /website does not send/i,
    /open(?:s)? your email/i,
    /Prepare (?:a consultation )?enquiry/i,
    /for you to review and send/i,
  ];
  const offences = [];
  for (const [file, source] of allSource) {
    for (const pattern of stale) {
      if (pattern.test(source)) offences.push(`${file} matches ${pattern}`);
    }
  }
  assert.deepEqual(offences, []);
});

test("the FAQ and booking page describe the direct-send flow", () => {
  const faqs = read(join(srcDir, "lib", "faqs.ts"));
  assert.match(faqs, /sends your enquiry directly to LearnThrive/);
  assert.match(faqs, /confirmation email/);
  const book = read(join(appDir, "book", "page.tsx"));
  assert.match(book, /confirmation email/i);
});

test("no page promises a reply time that contradicts the 5-working-day auto-reply", () => {
  const route = read(join(appDir, "api", "enquiry", "route.ts"));
  assert.match(route, /5 working days/);
  const offences = [];
  const promise = /(?:reply|respond|get back|be in touch)[^.<]{0,60}within 24 hours/i;
  for (const [file, source] of allSource) {
    if (file.includes("api")) continue;
    if (promise.test(source)) offences.push(file);
  }
  assert.deepEqual(offences, []);
});

test("the enquiry API keeps its origin check, rate limit and auto-reply", () => {
  const route = read(join(appDir, "api", "enquiry", "route.ts"));
  assert.match(route, /ALLOWED_ORIGINS/);
  assert.match(route, /isRateLimited/);
  assert.match(route, /contactMethod/);
  assert.match(route, /buildAutoReplyHtml/);
  assert.match(route, /replyTo:\s*RECIPIENT/);
});

test("the enquiry form still submits exactly the fields the API validates", () => {
  const form = read(join(srcDir, "components", "EnquiryForm.tsx"));
  const route = read(join(appDir, "api", "enquiry", "route.ts"));
  for (const field of ["parentName", "email", "phone", "yearGroup", "subject", "support", "contactMethod"]) {
    assert.ok(form.includes(`${field}:`), `Form is missing ${field}`);
    assert.ok(route.includes(field), `API does not know ${field}`);
  }
  assert.match(form, /fetch\("\/api\/enquiry"/);
});

// ── Content that must survive the design port ──────────────────────────────────────────────────

test("marketing content from the legacy site is preserved", () => {
  const expectations = [
    ["lib/faqs.ts", ["Special educational needs", "does not provide specialist diagnostic or therapeutic support", "formal diagnosis"]],
    ["app/about/page.tsx", ["Abdurrahman Mustafa", "Tahasin Hasan", "A global platform where every student is understood", "Founders", "childhood friends"]],
    ["app/subjects/page.tsx", ["early years and Key Stage 1", "Biology", "Chemistry", "Physics", "Verbal reasoning", "Non-verbal reasoning"]],
    ["app/page.tsx", ["target={40}", "students supported", "Every tutor is DBS-checked", "Four steps, no obligation", "Levels we cover", "testimonials"]],
    ["components/motion/scenes/HeroScene.tsx", ["40+ students supported", "Through our first academic year", "Never in groups", "One-to-one, 60 min"]],
    ["lib/site.ts", ["Mohammed M", "James H", "Aisha K", "16680738", "England and Wales"]],
  ];
  for (const [file, needles] of expectations) {
    const source = read(join(srcDir, file));
    for (const needle of needles) {
      assert.ok(source.includes(needle), `${file} lost: ${needle}`);
    }
  }
});

test("the footer keeps the external tutor login and company registration", () => {
  const footer = read(join(srcDir, "components", "SiteFooter.tsx"));
  assert.match(footer, /tutorLoginUrl/);
  assert.match(footer, /target="_blank"/);
  assert.match(footer, /rel="noreferrer"/);
  assert.match(footer, /companyNumber/);
});

test("every legal page states its own review date", () => {
  const legal = read(join(srcDir, "components", "LegalPage.tsx"));
  assert.match(legal, /reviewedOn:\s*string/);
  assert.doesNotMatch(legal, /10 September 2026/, "A shared hardcoded date would be shown on every page");
  for (const page of ["privacy", "cookies", "terms", "safeguarding"]) {
    assert.match(read(join(appDir, page, "page.tsx")), /reviewedOn="[^"]+"/, `${page} needs its own review date`);
  }
});

// ── Port boundaries ────────────────────────────────────────────────────────────────────────────

test("no authenticated-app functionality has been ported into the marketing site", () => {
  const forbidden = [/@learnthrive\//, /["'`]\/dashboard/, /["'`]\/login/, /\/api\/auth/, /app-shell|app-dashboard|app-auth/, /socket\.io/i];
  const offences = [];
  for (const [file, source] of allSource) {
    for (const pattern of forbidden) {
      if (pattern.test(source)) offences.push(`${file} matches ${pattern}`);
    }
  }
  for (const [file, source] of allCss) {
    if (/\.login-|\.header-login|\.app-shell|\.dashboard/.test(source)) offences.push(`${file} carries app styles`);
  }
  assert.deepEqual(offences, []);
  assert.equal(existsSync(join(appDir, "dashboard")), false);
  assert.equal(existsSync(join(appDir, "login")), false);
});

test("product-demo claims are not on the marketing site", () => {
  // The 'One platform' product tabs and the 'Lesson report, every time' hero chip market the
  // authenticated app, which this site does not offer.
  for (const [file, source] of allSource) {
    assert.doesNotMatch(source, /One platform, built around every lesson/, file);
    assert.doesNotMatch(source, /Lesson report, every time/, file);
  }
});

// ── Motion rules ───────────────────────────────────────────────────────────────────────────────

test("styles never use 'transition: all' or a global will-change", () => {
  const offences = [];
  for (const [file, source] of allCss) {
    // Comments may legitimately discuss these, so strip them before checking.
    const code = source.replace(/\/\*[\s\S]*?\*\//g, "");
    if (/transition:\s*all\b/.test(code)) offences.push(`${file}: transition: all`);
    if (/(?:^|[},])\s*(?:\*|html|body)\s*(?:,[^{]*)?\{[^}]*will-change/m.test(code)) {
      offences.push(`${file}: global will-change`);
    }
  }
  assert.deepEqual(offences, []);
});

test("reduced motion is honoured sitewide and without JavaScript", () => {
  const globals = read(join(appDir, "globals.css"));
  assert.match(globals, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(globals, /animation-duration:\s*0\.01ms\s*!important/);
  const layout = read(join(appDir, "layout.tsx"));
  assert.match(layout, /<noscript>/);
  assert.match(layout, /\[data-reveal\]/);
  assert.match(layout, /MotionRuntime/);
  const reveal = read(join(srcDir, "components", "motion", "primitives", "Reveal.tsx"));
  assert.match(reveal, /static/, "Reveal needs a static variant for first-screen content");
});

test("scroll reveals never hide the first screen of a page", () => {
  // The hero is CSS-animated rather than JavaScript-revealed so it can never be held at opacity 0
  // waiting for a script (an LCP regression).
  const hero = read(join(srcDir, "components", "motion", "scenes", "HeroScene.tsx"));
  assert.doesNotMatch(hero, /<Reveal\b/);
  const home = read(join(appDir, "page.tsx"));
  const statsBlock = home.slice(home.indexOf("styles.statsStrip"), home.indexOf("SectionHandoff"));
  assert.doesNotMatch(statsBlock, /variant="soft"/);
});

test("header scroll state only updates when the threshold flips", () => {
  const header = read(join(srcDir, "components", "SiteHeader.tsx"));
  assert.match(header, /scrolledRef/);
  assert.match(header, /if \(next === scrolledRef\.current\) return/);
});
