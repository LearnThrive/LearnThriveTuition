import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { loadTsFrom } from "./_tsLoader.mjs";

// plan15 Wave 12: the response headers, as built, in development and in production.

const { buildContentSecurityPolicy, buildSecurityHeaders } = loadTsFrom(import.meta.url, "../src/lib/securityHeaders.ts");

const get = (headers, key) => headers.find((h) => h.key === key)?.value;

test("production adds CSP and HSTS on top of the baseline; development adds neither", () => {
  const dev = buildSecurityHeaders({ production: false });
  const prod = buildSecurityHeaders({ production: true });
  for (const headers of [dev, prod]) {
    assert.equal(get(headers, "X-Content-Type-Options"), "nosniff");
    assert.equal(get(headers, "X-Frame-Options"), "SAMEORIGIN");
    assert.equal(get(headers, "Cross-Origin-Opener-Policy"), "same-origin");
    assert.equal(get(headers, "Referrer-Policy"), "strict-origin-when-cross-origin");
  }
  assert.equal(get(dev, "Content-Security-Policy"), undefined);
  assert.equal(get(dev, "Strict-Transport-Security"), undefined);
  assert.ok(get(prod, "Content-Security-Policy"));
  assert.equal(get(prod, "Strict-Transport-Security"), "max-age=31536000");
});

test("this site uses no camera, microphone or location, so all three stay denied", () => {
  for (const production of [false, true]) {
    assert.equal(get(buildSecurityHeaders({ production }), "Permissions-Policy"), "camera=(), geolocation=(), microphone=()");
  }
});

test("HSTS reaches no further than this host until the owner has confirmed the whole domain", () => {
  const hsts = get(buildSecurityHeaders({ production: true }), "Strict-Transport-Security") ?? "";
  assert.doesNotMatch(hsts, /preload/);
  assert.doesNotMatch(hsts, /includeSubDomains/);
});

test("the policy allows nothing from another origin, no eval, no plugins, no base tag", () => {
  const csp = buildContentSecurityPolicy();
  assert.doesNotMatch(csp, /unsafe-eval/);
  assert.doesNotMatch(csp, /https?:\/\//, "no external origin appears anywhere in the policy");
  for (const directive of ["default-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'self'", "upgrade-insecure-requests"]) {
    assert.ok(csp.includes(directive), directive);
  }
});

test("report-only mode swaps the header name and nothing else", () => {
  const enforced = buildSecurityHeaders({ production: true });
  const reportOnly = buildSecurityHeaders({ production: true, cspReportOnly: true });
  assert.equal(get(reportOnly, "Content-Security-Policy"), undefined);
  assert.equal(get(reportOnly, "Content-Security-Policy-Report-Only"), get(enforced, "Content-Security-Policy"));
});

test("next.config.ts serves those headers on every route and keeps the API out of search results", () => {
  const config = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
  assert.match(config, /buildSecurityHeaders\(/);
  assert.match(config, /source: "\/:path\*"/);
  assert.match(config, /source: "\/api\/:path\*"[\s\S]*X-Robots-Tag/);
  assert.match(config, /CSP_REPORT_ONLY/);
});
