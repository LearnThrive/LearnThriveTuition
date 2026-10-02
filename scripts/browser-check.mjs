import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import axeCore from "axe-core";
import { chromium } from "playwright-core";

const root = resolve(import.meta.dirname, "..");
const port = 3100;
const baseUrl = `http://127.0.0.1:${port}`;
const screenshotDir = resolve(root, "artifacts", "browser");
const subjectLandingRoutes = [
  { path: "/maths-tuition", ctaLabel: "Explore Maths Tuition" },
  { path: "/english-tuition", ctaLabel: "Explore English Tuition" },
  { path: "/science-tuition", ctaLabel: "Explore Science Tuition" },
  { path: "/11-plus-tuition", ctaLabel: "Explore 11+ Preparation" },
];
const removedTutorRoutes = ["/our-tutors", "/ourTutors"];
const primaryRoutes = [
  "/",
  "/about",
  "/subjects",
  "/faq",
  ...subjectLandingRoutes.map(({ path }) => path),
  "/book",
  "/contact",
  "/privacy",
  "/cookies",
  "/terms",
  "/safeguarding",
];
const viewports = [
  { name: "mobile-360", width: 360, height: 800 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "laptop-1024", width: 1024, height: 768 },
  { name: "desktop-1440", width: 1440, height: 1000 },
  { name: "wide-1920", width: 1920, height: 1080 },
];

function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].filter(Boolean);

  const executable = candidates.find((candidate) => existsSync(candidate));
  if (!executable) {
    throw new Error("No local Chromium executable found. Set CHROME_PATH to run browser checks.");
  }
  return executable;
}

async function waitForServer(serverOutput) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // The production server is still starting.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error(`Production server did not start.\n${serverOutput.join("")}`);
}

async function auditA11y(page) {
  await page.addScriptTag({ content: axeCore.source });
  return page.evaluate(async () => {
    const results = await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
    });
    return results.violations
      .filter((violation) => ["critical", "serious"].includes(violation.impact))
      .map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.length,
        help: violation.help,
        targets: violation.nodes.map((node) => node.target.join(" ")),
        details: violation.nodes.map((node) => node.failureSummary),
      }));
  });
}

// Scroll the whole page so every reveal fires, then wait for those animations to finish. Auditing a
// page that is still mid-fade measures transient opacity (axe blends it into the colour contrast),
// which reports contrast failures a visitor never sees on the settled page.
async function settleReveals(page) {
  await page.evaluate(async () => {
    const step = Math.max(300, innerHeight * 0.6);
    for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((done) => setTimeout(done, 120));
    }
    await Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    );
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(250);
}

// Wait for in-flight (finite) animations to complete, e.g. a message fading in, so an audit sees the
// settled colours rather than a half-faded frame.
async function finishAnimations(page) {
  await page.evaluate(async () => {
    await Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    );
  });
  await page.waitForTimeout(100);
}

async function run() {
  assert.ok(existsSync(resolve(root, ".next")), "Run npm run build before browser checks.");
  await mkdir(screenshotDir, { recursive: true });

  const serverOutput = [];
  const server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(port)],
    { cwd: root, stdio: ["ignore", "pipe", "pipe"] },
  );
  server.stdout.on("data", (chunk) => serverOutput.push(chunk.toString()));
  server.stderr.on("data", (chunk) => serverOutput.push(chunk.toString()));

  let browser;
  try {
    await waitForServer(serverOutput);
    browser = await chromium.launch({ executablePath: chromePath(), headless: true });
    const context = await browser.newContext({ locale: "en-GB" });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const externalRequests = new Set();
    const titles = new Set();
    const internalPaths = new Set(primaryRoutes);
    const auditSummary = [];

    // The enquiry-failure test deliberately answers the API with a 503; the browser logs that as a
    // console error, which is expected there and nowhere else.
    let expectingEnquiryFailure = false;
    page.on("console", (message) => {
      if (message.type() !== "error") return;
      if (expectingEnquiryFailure && /status of 503/.test(message.text())) return;
      consoleErrors.push(`${page.url()}: ${message.text()}`);
    });
    page.on("pageerror", (error) => pageErrors.push(`${page.url()}: ${error.message}`));
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (["http:", "https:"].includes(url.protocol) && url.origin !== baseUrl) {
        externalRequests.add(request.url());
      }
    });

    for (const route of primaryRoutes) {
      await page.setViewportSize({ width: 1440, height: 1000 });
      const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
      assert.equal(response?.status(), 200, `${route} should return 200`);
      assert.equal(response?.headers()["set-cookie"], undefined, `${route} unexpectedly sets a cookie`);
      await page.locator("main h1").waitFor({ state: "visible" });

      const metadata = await page.evaluate(() => ({
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute("content"),
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
        robots: document.querySelector('meta[name="robots"]')?.getAttribute("content"),
        openGraphTitle: document.querySelector('meta[property="og:title"]')?.getAttribute("content"),
        openGraphDescription: document
          .querySelector('meta[property="og:description"]')
          ?.getAttribute("content"),
        openGraphUrl: document.querySelector('meta[property="og:url"]')?.getAttribute("content"),
        h1Count: document.querySelectorAll("main h1").length,
        brokenImages: Array.from(document.images)
          .filter((image) => image.complete && image.naturalWidth === 0)
          .map((image) => image.currentSrc || image.src),
        links: Array.from(document.querySelectorAll('a[href^="/"]')).map((link) =>
          link.getAttribute("href"),
        ),
      }));

      assert.ok(metadata.title, `${route} needs a page title`);
      assert.ok(!titles.has(metadata.title), `${route} repeats title: ${metadata.title}`);
      titles.add(metadata.title);
      assert.ok(metadata.description, `${route} needs a meta description`);
      const canonical = `https://www.learnthrivetuition.co.uk${route === "/" ? "" : route}`;
      assert.equal(metadata.canonical, canonical, `${route} needs its exact canonical URL`);
      assert.doesNotMatch(metadata.robots ?? "", /noindex/i, `${route} should be indexable`);
      assert.ok(metadata.openGraphTitle, `${route} needs an Open Graph title`);
      assert.ok(metadata.openGraphDescription, `${route} needs an Open Graph description`);
      assert.equal(metadata.openGraphUrl, canonical, `${route} needs its exact Open Graph URL`);
      assert.equal(metadata.h1Count, 1, `${route} should have one main H1`);
      assert.deepEqual(metadata.brokenImages, [], `${route} has broken images`);
      metadata.links.filter(Boolean).forEach((href) => {
        const path = href.split("#")[0].split("?")[0] || "/";
        assert.ok(!removedTutorRoutes.includes(path), `${route} links to removed tutor route ${path}`);
        internalPaths.add(path);
      });

      if (route === "/about") {
        for (const name of ["Abdurrahman Mustafa", "Tahasin Hasan"]) {
          // The portrait's accessible name is "<Name>, co-founder"; the heading below is the bare name.
          const portrait = page.getByRole("img", { name: `${name}, co-founder`, exact: true });
          assert.equal(await portrait.count(), 1, `About needs ${name}'s supplied portrait`);
          await portrait.scrollIntoViewIfNeeded();
          await portrait.evaluate((image) => image.decode());
          assert.ok(await portrait.isVisible(), `${name}'s portrait must be visible`);
          assert.ok(
            await page.getByRole("heading", { name, exact: true }).isVisible(),
            `About needs a visible profile for ${name}`,
          );
        }
        const contactCta = page.getByRole("link", { name: "Get in touch", exact: true });
        assert.equal(await contactCta.getAttribute("href"), "/contact");
        await contactCta.click();
        await page.waitForURL(`${baseUrl}/contact`);
        await page.goBack({ waitUntil: "domcontentloaded" });
        await page.evaluate(() => window.scrollTo(0, 0));
      }

      for (const [name, display, href] of [
        ["Tahasin Hasan", "+44 7459 839595", "tel:+447459839595"],
        ["Abdurrahman Mustafa", "+44 7883 745337", "tel:+447883745337"],
      ]) {
        const scopes = [page.locator("footer")];
        if (["/contact", "/book", "/privacy", "/cookies", "/terms", "/safeguarding"].includes(route)) {
          scopes.push(page.locator("main"));
        }
        for (const scope of scopes) {
          const phone = scope.getByRole("link", { name: display, exact: true }).first();
          assert.equal(await phone.getAttribute("href"), href, `${route} must dial ${name}'s correct number`);
          assert.ok(await phone.isVisible(), `${route} must display ${name}'s number`);
          assert.ok(
            await phone.evaluate((link, person) => link.parentElement.textContent.includes(person), name),
            `${route} must label ${name}'s number with their name`,
          );
        }
      }
      assert.equal(await page.locator('a[href="tel:+442080591035"]').count(), 0);

      await settleReveals(page);
      const axeResults = await auditA11y(page);
      assert.deepEqual(axeResults, [], `${route} has serious axe violations`);

      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      assert.ok(
        dimensions.scrollWidth <= dimensions.clientWidth + 1,
        `${route} overflows at 1440px: ${dimensions.scrollWidth}/${dimensions.clientWidth}`,
      );

      await page.screenshot({
        path: resolve(screenshotDir, `${route === "/" ? "home" : route.slice(1)}-desktop.png`),
        fullPage: true,
      });
      auditSummary.push({ route, metadata, axeResults });
    }

    await page.goto(`${baseUrl}/faq`, { waitUntil: "domcontentloaded" });
    const faqItems = page.locator("main details.faq-item");
    // The jump navigation lists every category with its question count, so the expected total is
    // read from the page itself rather than a number that goes stale whenever a question is added.
    const jumpCounts = await page
      .locator("nav[aria-label='FAQ categories'] a")
      .evaluateAll((links) =>
        links.map((link) => Number(link.lastElementChild?.textContent?.trim())),
      );
    assert.ok(jumpCounts.length >= 6 && jumpCounts.every(Number.isInteger), "FAQ jump nav should list every category with its count");
    const expectedFaqTotal = jumpCounts.reduce((sum, count) => sum + count, 0);
    assert.equal(await faqItems.count(), expectedFaqTotal, `FAQ page should render all ${expectedFaqTotal} questions`);
    assert.equal(
      await page.getByRole("heading", { name: "Special educational needs", exact: true }).count(),
      1,
      "FAQ page must keep its special educational needs section",
    );
    assert.equal(
      await page.locator("nav[aria-label='FAQ categories'] a", { hasText: "Special educational needs" }).count(),
      1,
      "FAQ jump navigation must list the special educational needs section",
    );
    const firstFaq = faqItems.first();
    const firstSummary = firstFaq.locator("summary");
    await firstSummary.focus();
    await page.keyboard.press("Enter");
    assert.ok(await firstFaq.locator(".faq-item__answer").isVisible(), "Enter should reveal an FAQ answer");
    assert.ok(
      await firstSummary.evaluate((element) => getComputedStyle(element).outlineStyle !== "none"),
      "Keyboard focus on the FAQ must remain visible",
    );
    await page.keyboard.press("Space");
    assert.equal(await firstFaq.getAttribute("open"), null, "Space should close an FAQ answer");

    const fullFaqContent = await faqItems.evaluateAll((items) =>
      Object.fromEntries(items.map((item) => [item.id, {
        question: item.querySelector("summary").textContent.trim(),
        answer: item.querySelector(".faq-item__answer").textContent.trim(),
      }])),
    );
    for (const [id, content] of Object.entries(fullFaqContent)) {
      assert.ok(content.question && content.answer, `FAQ ${id} needs both a question and an answer`);
    }
    // The homepage no longer carries an FAQ preview: the FAQ is reached through the main navigation.
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "FAQ", exact: true })
      .click();
    await page.waitForURL(`${baseUrl}/faq`);

    const noJsContext = await browser.newContext({ javaScriptEnabled: false });
    const noJsPage = await noJsContext.newPage();
    await noJsPage.goto(`${baseUrl}/faq`, { waitUntil: "domcontentloaded" });
    await noJsPage.locator("main details summary").first().click();
    assert.ok(
      await noJsPage.locator("main details .faq-item__answer").first().isVisible(),
      "FAQ should remain usable with JavaScript disabled",
    );
    await noJsPage.goto(`${baseUrl}/about`, { waitUntil: "domcontentloaded" });
    for (const name of ["Abdurrahman Mustafa", "Tahasin Hasan"]) {
      assert.ok(
        await noJsPage.getByRole("article", { name, exact: true }).isVisible(),
        `About must show ${name}'s profile without JavaScript`,
      );
    }
    await noJsContext.close();

    for (const sourceRoute of ["/", "/subjects"]) {
      await page.goto(`${baseUrl}${sourceRoute}`, { waitUntil: "domcontentloaded" });
      // The subject cards on the homepage and the "Explore ... in depth" links on /subjects name
      // the subject; each must be a visible link to that subject's landing page.
      const subjectNames = {
        "/maths-tuition": "Maths",
        "/english-tuition": "English",
        "/science-tuition": "Science",
        "/11-plus-tuition": "11+",
      };
      for (const { path } of subjectLandingRoutes) {
        const subjectLink = page.locator(`main a[href="${path}"]`, {
          hasText: subjectNames[path],
        });
        assert.ok(
          (await subjectLink.count()) > 0 && (await subjectLink.first().isVisible()),
          `${sourceRoute} needs a visible ${subjectNames[path]} link to ${path}`,
        );
      }
    }

    for (const { path } of subjectLandingRoutes) {
      await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
      assert.ok(
        await page.locator('.page-hero a[href="/book"]').first().isVisible(),
        `${path} needs a hero booking CTA`,
      );
      assert.ok(
        await page.locator('.page-hero a[href="/contact"]').first().isVisible(),
        `${path} needs a hero contact CTA`,
      );
    }

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      for (const route of primaryRoutes) {
        await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
        await page.locator("main h1").waitFor({ state: "visible" });
        if (route === "/faq") {
          for (const summary of await page.locator("main details summary").all()) {
            await summary.click();
          }
        }
        const dimensions = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
        }));
        assert.ok(
          dimensions.scrollWidth <= dimensions.clientWidth + 1,
          `${route} overflows at ${viewport.width}px: ${dimensions.scrollWidth}/${dimensions.clientWidth}`,
        );

        if (viewport.width === 390 && ["/about", "/contact", "/faq", "/privacy", "/cookies", "/terms", "/safeguarding"].includes(route)) {
          await settleReveals(page);
          assert.deepEqual(await auditA11y(page), [], `${route} has serious mobile axe violations`);
        }

        if (route === "/" || viewport.width === 390) {
          const pageName = route === "/" ? "home" : route.slice(1);
          await page.screenshot({
            path: resolve(screenshotDir, `${pageName}-${viewport.name}.png`),
            fullPage: true,
          });
        }
      }
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    const menuButton = page.locator("button.menu-toggle");
    await menuButton.click();
    assert.equal(await menuButton.getAttribute("aria-expanded"), "true");
    await page.locator(".navigation-shell").evaluate(async (element) => {
      await Promise.all(element.getAnimations().map((animation) => animation.finished));
    });
    assert.ok(await page.getByRole("navigation", { name: "Main navigation" }).isVisible());
    assert.deepEqual(
      await auditA11y(page),
      [],
      "The open mobile navigation has serious axe violations",
    );
    await page.keyboard.press("Escape");
    assert.equal(await menuButton.getAttribute("aria-expanded"), "false");
    assert.equal(
      await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
      "Open main menu",
    );

    // The mobile menu's backdrop dims the page and dismisses the menu when tapped.
    await menuButton.click();
    assert.equal(await menuButton.getAttribute("aria-expanded"), "true");
    assert.equal(
      await page.locator(".navigation-backdrop").evaluate((element) => getComputedStyle(element).pointerEvents),
      "auto",
      "The open menu's backdrop must catch taps",
    );
    await page.mouse.click(195, 820);
    assert.equal(await menuButton.getAttribute("aria-expanded"), "false", "Tapping the backdrop should close the menu");

    // The enquiry API is answered by this test, so no email is ever sent. What matters here is what
    // the browser does: validation, the request it makes, and how it reports success and failure.
    const enquiryRequests = [];
    let enquiryResponse = "ok";
    await page.route("**/api/enquiry", async (route) => {
      enquiryRequests.push(JSON.parse(route.request().postData() ?? "{}"));
      if (enquiryResponse === "ok") {
        await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
      } else {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: "Enquiries are not accepting submissions right now." }),
        });
      }
    });
    const fillEnquiry = async () => {
      await page.getByLabel("Parent or guardian name").fill("Test Parent");
      await page.getByLabel("Email address").fill("test@example.com");
      await page.getByLabel(/Student.s year group/).selectOption({ label: "Year 9" });
      await page.getByLabel("Subject").selectOption({ label: "Maths" });
      await page
        .getByLabel("What support are you looking for?")
        .fill("Support with algebra confidence and structured revision practice.");
    };

    await page.goto(`${baseUrl}/book`, { waitUntil: "domcontentloaded" });
    await settleReveals(page);
    await page.getByRole("button", { name: "Send enquiry" }).click();
    assert.ok(await page.locator(".form-message--error").isVisible());
    assert.equal(enquiryRequests.length, 0, "An invalid form must not be sent");
    // Focus moves on the next animation frame, so wait for it rather than reading it once.
    await page.waitForFunction(
      () => Boolean(document.activeElement?.closest(".form-message--error")),
      undefined,
      { timeout: 3000 },
    ).catch(() => assert.fail("Focus should move to the error summary"));
    await finishAnimations(page);
    assert.deepEqual(
      await auditA11y(page),
      [],
      "The form error state has serious axe violations",
    );
    await fillEnquiry();
    await page.locator('input[name="contactMethod"][value="Phone"]').check();
    await page.getByRole("button", { name: "Send enquiry" }).click();
    assert.match(
      await page.locator("#phone-error").innerText(),
      /phone number when phone is your preferred contact method/i,
    );
    assert.equal(enquiryRequests.length, 0, "A missing phone number must block the request");
    await page.getByLabel(/Phone number/).fill("020 0000 0000");
    await page.getByRole("button", { name: "Send enquiry" }).click();
    const sent = page.locator(".form-message--success");
    await sent.waitFor({ state: "visible" });
    assert.equal(enquiryRequests.length, 1, "A valid form sends exactly one request");
    assert.deepEqual(
      Object.keys(enquiryRequests[0]).sort(),
      ["contactMethod", "email", "parentName", "phone", "subject", "support", "yearGroup"],
      "The enquiry payload must match what the API validates",
    );
    assert.equal(enquiryRequests[0].contactMethod, "Phone");
    assert.match(await sent.innerText(), /Your enquiry has been sent/i);
    assert.doesNotMatch(
      await page.locator("main").innerText(),
      /prepare|draft|email app|review and send|No information has been submitted/i,
      "The success state must describe the direct-send flow",
    );
    assert.equal(await page.locator('a[href^="mailto:"][href*="subject="]').count(), 0, "No mailto draft link may be offered");

    enquiryResponse = "fail";
    expectingEnquiryFailure = true;
    await page.goto(`${baseUrl}/book`, { waitUntil: "domcontentloaded" });
    await settleReveals(page);
    await fillEnquiry();
    await page.getByRole("button", { name: "Send enquiry" }).click();
    const failed = page.getByRole("alert").filter({ hasText: "not accepting submissions" });
    await failed.waitFor({ state: "visible" });
    expectingEnquiryFailure = false;
    await page.waitForFunction(
      () => Boolean(document.activeElement?.closest("[role=alert]")),
      undefined,
      { timeout: 3000 },
    ).catch(() => assert.fail("Focus should move to the server error"));
    await finishAnimations(page);
    assert.deepEqual(await auditA11y(page), [], "The form server-error state has serious axe violations");
    await page.unroute("**/api/enquiry");

    // Reduced motion: nothing may be held back by a reveal, and nothing may loop forever.
    const reducedContext = await browser.newContext({
      locale: "en-GB",
      reducedMotion: "reduce",
      viewport: { width: 1440, height: 900 },
    });
    const reducedPage = await reducedContext.newPage();
    for (const route of primaryRoutes) {
      await reducedPage.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
      await reducedPage.locator("main h1").waitFor({ state: "visible" });
      await reducedPage.waitForTimeout(350);
      const reduced = await reducedPage.evaluate(() => ({
        held: [...document.querySelectorAll("[data-reveal], [data-reveal-inner], [data-masked-text-inner]")]
          .filter((element) => getComputedStyle(element).opacity === "0")
          .map((element) => `${element.tagName}.${String(element.className).slice(0, 40)}`),
        looping: document
          .getAnimations()
          .filter((animation) => animation.playState === "running" && animation.effect?.getTiming().iterations === Infinity)
          .map((animation) => animation.animationName ?? animation.constructor.name),
      }));
      assert.deepEqual(reduced.held, [], `${route} holds content behind a reveal under reduced motion`);
      assert.deepEqual(reduced.looping, [], `${route} loops an animation under reduced motion`);
      assert.deepEqual(await auditA11y(reducedPage), [], `${route} has serious axe violations under reduced motion`);
    }
    await reducedContext.close();

    // Without JavaScript a reveal's server-rendered start state would hide everything below the
    // fold; the <noscript> override in the root layout must keep it all visible.
    const bareContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
    const barePage = await bareContext.newPage();
    for (const route of ["/", "/subjects", "/about", "/safeguarding"]) {
      await barePage.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
      const hiddenWithoutScript = await barePage.evaluate(() =>
        [...document.querySelectorAll("[data-reveal], [data-reveal-inner]")]
          .filter((element) => getComputedStyle(element).opacity === "0")
          .map((element) => String(element.className).slice(0, 40)),
      );
      assert.deepEqual(hiddenWithoutScript, [], `${route} hides content when JavaScript is off`);
    }
    await bareContext.close();

    assert.deepEqual(await context.cookies(), [], "The application unexpectedly set cookies");
    assert.deepEqual(
      await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })),
      { local: 0, session: 0 },
      "Enquiries must not be persisted in browser storage",
    );
    assert.deepEqual([...externalRequests], [], "The public site made unexpected third-party requests");

    for (const path of internalPaths) {
      const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
      assert.ok(
        response.status >= 200 && response.status < 400,
        `Internal path ${path} returned ${response.status}`,
      );
    }

    for (const route of removedTutorRoutes) {
      const response = await fetch(`${baseUrl}${route}`, { redirect: "manual" });
      assert.ok([301, 308].includes(response.status), `${route} should permanently redirect`);
      assert.equal(response.headers.get("location"), "/about");
    }

    const missingResponse = await fetch(`${baseUrl}/definitely-not-a-page`);
    assert.equal(missingResponse.status, 404, "Unknown paths should return 404");

    const robotsResponse = await fetch(`${baseUrl}/robots.txt`);
    assert.equal(robotsResponse.status, 200);
    assert.match(await robotsResponse.text(), /Sitemap: https:\/\/www\.learnthrivetuition\.co\.uk\/sitemap\.xml/);

    const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`);
    assert.equal(sitemapResponse.status, 200);
    assert.match(sitemapResponse.headers.get("content-type") ?? "", /xml/);
    const sitemapText = await sitemapResponse.text();
    assert.match(sitemapText, /<urlset/);
    for (const path of primaryRoutes.filter((route) => route !== "/")) {
      assert.ok(
        sitemapText.includes(`https://www.learnthrivetuition.co.uk${path}`),
        `Sitemap is missing ${path}`,
      );
    }
    assert.ok(!sitemapText.includes("/our-tutors"), "Sitemap still includes removed tutor route");

    assert.deepEqual(pageErrors, [], "Browser page errors were emitted");
    assert.deepEqual(consoleErrors, [], "Browser console errors were emitted");

    console.log(
      JSON.stringify(
        {
          routesReviewed: primaryRoutes,
          viewports: viewports.map(({ width }) => width),
          internalPathsChecked: [...internalPaths].sort(),
          consoleErrors,
          thirdPartyRequests: [...externalRequests],
          faqQuestionsChecked: Object.keys(fullFaqContent).length,
          screenshots: screenshotDir,
          auditSummary: auditSummary.map(({ route, axeResults }) => ({ route, axeResults })),
        },
        null,
        2,
      ),
    );
  } finally {
    await browser?.close();
    server.kill();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
