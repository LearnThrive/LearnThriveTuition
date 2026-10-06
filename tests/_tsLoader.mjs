import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { compileFunction } from "node:vm";
import ts from "typescript";

// Shared by every tests/*.test.mjs that needs to load real (untranspiled) TypeScript source —
// works on the supported Node 20 releases, which cannot import TypeScript directly (see
// tests/enquiry.test.mjs, the original example this pattern is copied from). It recursively
// resolves a loaded module's own relative imports and the `@/*` path alias, neither of which a
// plain require() anchored to the test file would ever find.
const moduleCache = new Map();

/** `./x` -> x.ts or x.tsx, relative to the importing file; falls back to the exact path. */
function resolveSource(base, specifier) {
  for (const suffix of [".ts", ".tsx", ""]) {
    const candidate = new URL(`${specifier}${suffix}`, base);
    if (existsSync(candidate) && !candidate.pathname.endsWith("/")) return candidate;
  }
  throw new Error(`Cannot resolve "${specifier}" from ${base.href}`);
}

function loadTsModule(fileUrl) {
  const cacheKey = fileUrl.href;
  if (moduleCache.has(cacheKey)) return moduleCache.get(cacheKey);

  const source = readFileSync(fileUrl, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;

  const nodeRequire = createRequire(fileUrl);
  const scopedRequire = (specifier) => {
    if (specifier.startsWith(".")) return loadTsModule(resolveSource(fileUrl, specifier));
    // tsconfig's path alias (@/* -> ./src/*): real Node require() has no idea it exists.
    if (specifier.startsWith("@/")) {
      return loadTsModule(resolveSource(new URL("../src/", import.meta.url), specifier.slice(2)));
    }
    return nodeRequire(specifier); // bare specifier (node:*, an npm package) — real Node resolution
  };

  const fakeModule = { exports: {} };
  moduleCache.set(cacheKey, fakeModule.exports); // set before executing, in case of circular imports
  compileFunction(compiled, ["require", "module", "exports"])(scopedRequire, fakeModule, fakeModule.exports);
  moduleCache.set(cacheKey, fakeModule.exports);
  return fakeModule.exports;
}

/** `fromUrl` must be the caller's own `import.meta.url`, so `relativePath` resolves against the
 * calling test file's own directory. */
export function loadTsFrom(fromUrl, relativePath) {
  return loadTsModule(new URL(relativePath, fromUrl));
}
