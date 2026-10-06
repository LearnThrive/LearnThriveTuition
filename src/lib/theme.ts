/**
 * Theme support: the site follows the visitor's device setting (light or dark) and nothing else.
 *
 * This is the storage-free subset of the Software project's theme module. There is no Light / Dark /
 * System control here and no saved choice: tokens.css applies the dark values under
 * `@media (prefers-color-scheme: dark)` when `html[data-themes="on"]` is set (layout.tsx), and a
 * visitor whose device is set to light sees exactly the light site. Because nothing is chosen on the
 * page, nothing is written to the browser, so the cookie notice's "no cookies, no browser storage"
 * statement stays true. A visible control that remembers a choice would need that notice and its legal
 * review updated first (see docs/PLAN15_PORT_LIST.md, decision D2).
 *
 * The whole feature has a kill switch: NEXT_PUBLIC_THEME_TOGGLE=0 at build time leaves the light site
 * exactly as it was (no `data-themes`, so the dark CSS never applies).
 */

/** Read at build time (NEXT_PUBLIC_*), so it is a constant per build. On unless "0". */
export const THEMES_ENABLED = process.env.NEXT_PUBLIC_THEME_TOGGLE !== "0";

/** The `theme-color` of each scheme: the navy browser chrome of the light site, a deeper one in dark. */
export const THEME_COLOURS = { light: "#0e2a47", dark: "#061321" } as const;
