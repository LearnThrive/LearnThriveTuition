import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { loadTsFrom } from "./_tsLoader.mjs";

// plan15 Wave 11 feature A3: the visitor's own motion preference. Reduce always wins; there is no override
// of an OS reduced-motion setting. This site has the storage-free subset: nothing is saved, so the
// preference is "system" unless something sets html[data-motion="reduce"] for the page view.

const pref = loadTsFrom(import.meta.url, "../src/lib/motion/preference.ts");

const fakeRoot = () => {
  const attrs = new Map();
  return { attrs, getAttribute: (k) => attrs.get(k) ?? null, setAttribute: (k, v) => attrs.set(k, v), removeAttribute: (k) => attrs.delete(k) };
};

test("there are exactly two choices: no 'full motion' override exists", () => {
  assert.deepEqual([...pref.MOTION_CHOICES], ["system", "reduce"]);
  assert.equal(pref.isMotionPreference("system"), true);
  assert.equal(pref.isMotionPreference("reduce"), true);
  assert.equal(pref.isMotionPreference("full"), false);
  assert.equal(pref.isMotionPreference("always"), false);
  assert.equal(pref.isMotionPreference(undefined), false);
});

test("applying sets and clears the html attribute, and the attribute is what the runtime reads", () => {
  const root = fakeRoot();
  assert.equal(pref.currentMotionPreference(root), "system");
  pref.applyMotionPreference("reduce", root);
  assert.equal(root.getAttribute("data-motion"), "reduce");
  assert.equal(pref.currentMotionPreference(root), "reduce");
  pref.applyMotionPreference("system", root);
  assert.equal(root.getAttribute("data-motion"), null);
  assert.equal(pref.currentMotionPreference(root), "system");
});

test("only the exact attribute value 'reduce' means Reduce", () => {
  for (const value of ["system", "full", "REDUCE", "", "true", "1"]) {
    const root = fakeRoot();
    root.setAttribute("data-motion", value);
    assert.equal(pref.currentMotionPreference(root), "system", value);
  }
});

test("with no document (server rendering) the preference is System", () => {
  assert.equal(pref.currentMotionPreference(undefined), "system");
});

test("nothing about the motion preference is kept in browser storage", () => {
  // This site stores nothing in the browser (the cookie notice says so). A control that remembered a
  // choice would need that notice and its legal review updated first (docs/PLAN15_PORT_LIST.md, D2).
  for (const file of ["../src/lib/motion/preference.ts", "../src/lib/motion/useMotionPreference.ts", "../src/lib/theme.ts"]) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    for (const storage of ["localStorage", "sessionStorage", "document.cookie", "indexedDB"]) {
      assert.ok(!source.includes(storage), `${file} must not use ${storage}`);
    }
  }
});
