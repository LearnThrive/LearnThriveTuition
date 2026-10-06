import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import test from "node:test";

// This site stores things in the visitor's browser only because of a choice the visitor makes, and the
// Cookie notice says exactly what. These tests make that a short, reviewable list: a new file that
// touches browser storage, a new key, or a cookie fails here until the notice (src/app/cookies/page.tsx)
// and LEGAL_REVIEW.md have been looked at.

const root = resolve(import.meta.dirname, "..");
const srcDir = join(root, "src");

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(fullPath);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [fullPath] : [];
  });
}

const files = sourceFiles(srcDir).map((path) => ({
  name: relative(root, path).split("\\").join("/"),
  source: readFileSync(path, "utf8"),
}));
const read = (name) => files.find((file) => file.name === name)?.source ?? assert.fail(`${name} not found`);

/** The only files that may use web storage, and why. */
const STORAGE_FILES = [
  "src/lib/theme.ts", // the saved theme (lt-theme) and the pre-paint script that reads it
  "src/lib/motion/preference.ts", // the saved motion choice (lt-motion)
  "src/components/ThemeToggle.tsx", // reads the saved theme so the control shows it
  "src/components/palette/CommandPalette.tsx", // the site search's "recent" list, session storage only
];

const cookieNotice = read("src/app/cookies/page.tsx");

test("only the listed files use browser storage", () => {
  const using = files
    .filter(({ source }) => /localStorage|sessionStorage/.test(source))
    .map(({ name }) => name)
    .sort();
  assert.deepEqual(using, [...STORAGE_FILES].sort());
});

test("nothing sets a cookie or uses IndexedDB", () => {
  const offenders = files
    .filter(({ source }) => /document\.cookie|indexedDB|cookies\(\)\.set|Set-Cookie/i.test(source))
    .map(({ name }) => name);
  assert.deepEqual(offenders, []);
});

test("the three keys in use are the three the Cookie notice names", () => {
  assert.ok(read("src/lib/theme.ts").includes('THEME_STORAGE_KEY = "lt-theme"'));
  assert.ok(read("src/lib/motion/preference.ts").includes('MOTION_STORAGE_KEY = "lt-motion"'));
  assert.ok(read("src/components/palette/PublicPalette.tsx").includes('storageKey="lt-palette-public"'));
  for (const name of ["lt-theme", "lt-motion"]) {
    assert.ok(cookieNotice.includes(`“${name}”`), `the Cookie notice must name ${name}`);
  }
  assert.match(cookieNotice, /local storage/);
  assert.match(cookieNotice, /session storage/);
  assert.match(cookieNotice, /recent searches/i);
  assert.match(cookieNotice, /does not set cookies/);
});

test("the search's recent list is session-only on the public site, so it is forgotten when the tab closes", () => {
  const publicPalette = read("src/components/palette/PublicPalette.tsx");
  assert.ok(publicPalette.includes('persist="session"'));
  const usingPersist = files
    .filter(({ source }) => /\bpersist=/.test(source))
    .map(({ name }) => name);
  assert.deepEqual(usingPersist, ["src/components/palette/PublicPalette.tsx"], "no other place renders the palette with its own persistence");
});

test("a saved choice is only ever written in answer to a choice: the toggles and the palette's actions", () => {
  // The writers (setTheme, setMotionPreference) are called from event handlers and palette commands only.
  const callers = files
    .filter(({ source }) => /\bset(?:Theme|MotionPreference)\(/.test(source))
    .map(({ name }) => name)
    .filter((name) => name !== "src/lib/theme.ts" && name !== "src/lib/motion/preference.ts")
    .sort();
  assert.deepEqual(callers, [
    "src/components/MotionToggle.tsx",
    "src/components/ThemeToggle.tsx",
    "src/lib/palette/publicCommands.ts",
  ]);
  for (const name of ["src/components/MotionToggle.tsx", "src/components/ThemeToggle.tsx"]) {
    assert.ok(!/useEffect\([^)]*set(?:Theme|MotionPreference)/s.test(read(name)), `${name} must not write storage from an effect`);
  }
});
