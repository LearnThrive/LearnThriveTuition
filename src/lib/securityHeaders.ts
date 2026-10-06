/**
 * The response headers every route is served with (plan15 Wave 12 section 16.2). Pure and framework-free
 * so next.config.ts can import it and tests/securityHeaders.test.mjs can load it.
 *
 * CONTENT-SECURITY-POLICY, and why it is not nonce-based. A nonce has to be fresh per request, which
 * forces every page to render per request (installed Next docs, "Content Security Policy"): the site is
 * static and CDN-cached, and that is worth more here than the extra strictness. So `script-src` allows
 * 'unsafe-inline' (Next's own bootstrap is inline) and the policy earns its keep elsewhere: nothing may
 * load from any other origin, no `eval`, no plugins, no <base> tag, forms post only to this site, and
 * nothing may frame the site. There are no third-party requests on this site (fonts are self-hosted by
 * next/font), so `'self'` is the whole allow-list. Moving to hashes later (the experimental `sri` option)
 * is the route to dropping 'unsafe-inline'.
 *
 * It is sent in PRODUCTION builds only: `next dev` needs eval and its own websocket, and the dev server
 * is not the thing being protected. `CSP_REPORT_ONLY=1` at build downgrades it to report-only, the
 * quick way back if a deploy ever finds something it blocks that it should not.
 */

export type SecurityHeaderOptions = {
  /** NODE_ENV === "production". */
  production: boolean;
  /** CSP_REPORT_ONLY === "1". */
  cspReportOnly?: boolean;
};

export type HeaderEntry = { key: string; value: string };

export function buildContentSecurityPolicy(): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'"],
    "media-src": ["'self'", "blob:"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "frame-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'self'"],
  };
  return [...Object.entries(directives).map(([name, values]) => `${name} ${values.join(" ")}`), "upgrade-insecure-requests"].join("; ");
}

export function buildSecurityHeaders({ production, cspReportOnly }: SecurityHeaderOptions): HeaderEntry[] {
  const headers: HeaderEntry[] = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "SAMEORIGIN" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // This site uses none of these, so they are denied everywhere, including its own pages.
    { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=()" },
    // Keeps another site's window from holding a reference to ours (and the other way round).
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];

  if (production) {
    headers.push({
      key: cspReportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy",
      value: buildContentSecurityPolicy(),
    });
    // One year for this host only. Deliberately neither `includeSubDomains` nor `preload`: both
    // reach beyond this site (every subdomain, and browsers' built-in lists, which are close to a
    // one-way door), and both wait for the owner to confirm the whole domain is permanently HTTPS.
    headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000" });
  }

  return headers;
}
