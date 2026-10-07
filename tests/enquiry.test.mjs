import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { compileFunction } from "node:vm";
import ts from "typescript";

// Run the real TypeScript route using the existing compiler dependency. This also
// works on the supported Node 20 releases, which cannot import TypeScript directly.
const require = createRequire(import.meta.url);
const routeSource = readFileSync(
  new URL("../src/app/api/enquiry/route.ts", import.meta.url),
  "utf8",
);
const compiledRoute = ts.transpileModule(routeSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function loadRoute() {
  const fakeModule = { exports: {} };
  compileFunction(compiledRoute, ["require", "module", "exports"])(
    require, fakeModule, fakeModule.exports,
  );
  return fakeModule.exports;
}

function setEnv(t, name, value) {
  const previous = process.env[name];
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
  t.after(() => {
    if (previous === undefined) delete process.env[name];
    else process.env[name] = previous;
  });
}

const setApiKey = (t, value) => setEnv(t, "RESEND_API_KEY", value);

const validEnquiry = {
  parentName: "Test Parent",
  email: "parent@example.com",
  phone: "",
  yearGroup: "Year 8",
  subject: "Maths",
  support: "We would like help with fractions and algebra.",
  contactMethod: "Email",
};

const SITE_ORIGIN = "https://learnthrivetuition.co.uk";

// This site's route is strict about the Origin header (a missing one is refused too), so every
// request here sends the site's own origin unless a test says otherwise.
function request(body = validEnquiry, headers = { origin: SITE_ORIGIN }) {
  return new Request("http://localhost/api/enquiry", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function mockResend(t) {
  const sent = [];
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    sent.push(JSON.parse(options.body));
    return Response.json({ id: "test-email-id" });
  });
  return sent;
}

function productionEnv(t) {
  setEnv(t, "NODE_ENV", "production");
  setEnv(t, "RESEND_API_KEY", "re_test_not_a_real_key");
  setEnv(t, "RESEND_FROM_EMAIL", "enquiries@example.test");
  setEnv(t, "ENQUIRY_EMAIL", "owner@example.test");
}

// ── Origin and validation: this site's own, stricter rules ────────────────────────────────────────

test("a request with no Origin header is refused", async (t) => {
  setApiKey(t, "re_test_not_a_real_key");
  t.mock.method(globalThis, "fetch", () => assert.fail("A refused request must not contact Resend"));
  const { POST } = loadRoute();
  const response = await POST(request(validEnquiry, {}));
  assert.equal(response.status, 403);
});

test("a request from another site's origin is refused", async (t) => {
  setApiKey(t, "re_test_not_a_real_key");
  t.mock.method(globalThis, "fetch", () => assert.fail("A refused request must not contact Resend"));
  const { POST } = loadRoute();
  const response = await POST(request(validEnquiry, { origin: "https://evil.example" }));
  assert.equal(response.status, 403);
});

test("the www origin is accepted too", async (t) => {
  setApiKey(t, "re_test_not_a_real_key");
  mockResend(t);
  const { POST } = loadRoute();
  const response = await POST(request(validEnquiry, { origin: "https://www.learnthrivetuition.co.uk" }));
  assert.equal(response.status, 200);
});

test("a contact method other than Email or Phone is rejected", async (t) => {
  setApiKey(t, "re_test_not_a_real_key");
  t.mock.method(globalThis, "fetch", () => assert.fail("An invalid enquiry must not contact Resend"));
  const { POST } = loadRoute();
  for (const contactMethod of ["email", "Carrier pigeon", ""]) {
    const response = await POST(request({ ...validEnquiry, contactMethod }));
    assert.equal(response.status, 400, `contactMethod ${JSON.stringify(contactMethod)}`);
  }
});

test("malformed JSON is a 400, not a crash", async (t) => {
  setApiKey(t, "re_test_not_a_real_key");
  const { POST } = loadRoute();
  const response = await POST(
    new Request("http://localhost/api/enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json", origin: SITE_ORIGIN },
      body: "{not json",
    }),
  );
  assert.equal(response.status, 400);
});

// ── Configuration ─────────────────────────────────────────────────────────────────────────────────

for (const key of [undefined, "   "]) {
  test(`route loads without email credentials and returns 503 (${key === undefined ? "missing" : "blank"} key)`, async (t) => {
    setApiKey(t, key);
    t.mock.method(globalThis, "fetch", () => assert.fail("Unconfigured enquiries must not contact Resend"));
    const { POST } = loadRoute();
    const response = await POST(request());
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(typeof body.error, "string");
    assert.match(body.error, /info@learnthrivetuition\.co\.uk/);
    assert.equal(body.success, undefined);
  });
}

test("invalid enquiries still return 400 when email is unconfigured", async (t) => {
  setApiKey(t, undefined);
  const { POST } = loadRoute();
  const response = await POST(request({ ...validEnquiry, email: "not-an-email" }));
  assert.equal(response.status, 400);
});

test("email credentials are read at request time and a configured enquiry can succeed", async (t) => {
  setApiKey(t, undefined);
  const { POST } = loadRoute();
  process.env.RESEND_API_KEY = "re_test_not_a_real_key";
  t.after(() => delete process.env.RESEND_API_KEY);
  const sentEmails = mockResend(t);
  const response = await POST(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true });

  // Two emails: an admin notification and an auto-reply confirmation to the parent, both awaited
  // (not fire-and-forget) so this ordering is deterministic.
  assert.equal(sentEmails.length, 2);
  const [adminEmail, autoReply] = sentEmails;
  assert.equal(adminEmail.reply_to, "parent@example.com");
  assert.match(adminEmail.html, /fractions and algebra/);
  assert.deepEqual(adminEmail.to, ["info@learnthrivetuition.co.uk"]);

  assert.deepEqual(autoReply.to, ["parent@example.com"]);
  assert.equal(autoReply.reply_to, "info@learnthrivetuition.co.uk");
  assert.match(autoReply.html, /Thank you for your enquiry, Test Parent/);
});

test("a failed auto-reply does not fail the overall enquiry submission", async (t) => {
  setApiKey(t, "re_test_not_a_real_key");
  const { POST } = loadRoute();
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls += 1;
    // Fail only the second call (the auto-reply) — the admin notification must still succeed.
    if (calls === 2) throw new Error("simulated Resend outage");
    return Response.json({ id: "test-email-id" });
  });
  const response = await POST(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true });
  assert.equal(calls, 2);
});

// ── Abuse protection and fail-closed production config ────────────────────────────────────────────

test("a filled honeypot gets the normal success answer and sends nothing", async (t) => {
  setApiKey(t, "re_test_not_a_real_key");
  const sent = mockResend(t);
  const { POST } = loadRoute();
  const response = await POST(request({ ...validEnquiry, website: "https://spam.example" }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true });
  assert.equal(sent.length, 0);
});

test("in production a submission that arrives too fast, or with no timing at all, is dropped silently", async (t) => {
  productionEnv(t);
  const sent = mockResend(t);
  const { POST } = loadRoute();
  for (const extra of [{ elapsedMs: 400 }, {}, { elapsedMs: "soon" }]) {
    const response = await POST(request({ ...validEnquiry, ...extra }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true });
  }
  assert.equal(sent.length, 0);
});

test("in production a human-paced submission is sent", async (t) => {
  productionEnv(t);
  const sent = mockResend(t);
  const { POST } = loadRoute();
  const response = await POST(request({ ...validEnquiry, website: "", elapsedMs: 41000 }));
  assert.equal(response.status, 200);
  assert.equal(sent.length, 2);
  assert.deepEqual(sent[0].to, ["owner@example.test"]);
  assert.match(sent[0].from, /enquiries@example\.test/);
});

test("outside production a fast submission is allowed (developers and un-mocked e2e runs)", async (t) => {
  setApiKey(t, "re_test_not_a_real_key");
  const sent = mockResend(t);
  const { POST } = loadRoute();
  const response = await POST(request({ ...validEnquiry, elapsedMs: 50 }));
  assert.equal(response.status, 200);
  assert.equal(sent.length, 2);
});

for (const missing of ["ENQUIRY_EMAIL", "RESEND_FROM_EMAIL"]) {
  test(`production fails closed when ${missing} is missing`, async (t) => {
    productionEnv(t);
    setEnv(t, missing, undefined);
    t.mock.method(globalThis, "fetch", () => assert.fail("A misconfigured production deploy must not send"));
    const { POST } = loadRoute();
    const response = await POST(request({ ...validEnquiry, elapsedMs: 41000 }));
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /Please email \S+@\S+ directly/);
  });
}

test("the same enquiry sent twice in a row is one enquiry (double click, retry)", async (t) => {
  setApiKey(t, "re_test_not_a_real_key");
  const sent = mockResend(t);
  const { POST } = loadRoute();
  const first = await POST(request());
  const second = await POST(request());
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.deepEqual(await second.json(), { success: true });
  assert.equal(sent.length, 2, "one admin email and one auto-reply, not four");
});

test("a failed send does not leave the parent's retry blocked as a duplicate", async (t) => {
  setApiKey(t, "re_test_not_a_real_key");
  let attempt = 0;
  t.mock.method(globalThis, "fetch", async () => {
    attempt += 1;
    if (attempt === 1) return Response.json({ name: "application_error", message: "down" }, { status: 500 });
    return Response.json({ id: "ok" });
  });
  const { POST } = loadRoute();
  assert.equal((await POST(request())).status, 500);
  assert.equal((await POST(request())).status, 200);
});

test("the log line for an outcome carries no personal data", async (t) => {
  setApiKey(t, "re_test_not_a_real_key");
  mockResend(t);
  const lines = [];
  t.mock.method(console, "info", (line) => lines.push(String(line)));
  const { POST } = loadRoute();
  await POST(request());
  const joined = lines.join("\n");
  assert.match(joined, /"outcome":"sent"/);
  assert.doesNotMatch(joined, /parent@example\.com|Test Parent|fractions/);
});

// ── The messages themselves ───────────────────────────────────────────────────────────────────────

test("both emails carry a plain-text alternative that says what the HTML says", async (t) => {
  setApiKey(t, "re_test_not_a_real_key");
  const sent = mockResend(t);
  const { POST } = loadRoute();
  await POST(request());
  const [adminEmail, autoReply] = sent;
  assert.match(adminEmail.text, /Parent\/Guardian: Test Parent/);
  assert.match(adminEmail.text, /fractions and algebra/);
  assert.match(adminEmail.text, /Preferred Contact: Email/);
  assert.match(autoReply.text, /Thank you for your enquiry, Test Parent!/);
  for (const email of sent) assert.doesNotMatch(email.text, /<[a-z]+[^>]*>/, "plain text has no markup");
});

test("the auto-reply promises a response within 5 working days, in the HTML and the text alike", async (t) => {
  setApiKey(t, "re_test_not_a_real_key");
  const sent = mockResend(t);
  const { POST } = loadRoute();
  await POST(request());
  const autoReply = sent[1];
  assert.match(autoReply.html, /within <strong[^>]*>5 working days<\/strong>/);
  assert.match(autoReply.text, /within 5 working days/);
  assert.doesNotMatch(autoReply.html + autoReply.text, /24 hours/);
});

test("the HTML declares a light-only design, gives every surface its own background and has no images", async (t) => {
  setApiKey(t, "re_test_not_a_real_key");
  const sent = mockResend(t);
  const { POST } = loadRoute();
  await POST(request());
  for (const email of sent) {
    assert.match(email.html, /<meta name="color-scheme" content="light"\/>/);
    assert.match(email.html, /bgcolor="#ffffff"/);
    assert.doesNotMatch(email.html, /<img\b/i, "nothing in the message is an image");
    assert.match(email.html, /<html lang="en">/);
  }
});

test("everything a sender typed is escaped in the HTML and appears untouched in the plain text", async (t) => {
  setApiKey(t, "re_test_not_a_real_key");
  const sent = mockResend(t);
  const { POST } = loadRoute();
  await POST(request({ ...validEnquiry, parentName: "<b>Eve</b> & Co", support: "We need <script>alert(1)</script> help with algebra." }));
  const [adminEmail] = sent;
  assert.doesNotMatch(adminEmail.html, /<script>alert/);
  assert.match(adminEmail.html, /&lt;script&gt;/);
  assert.match(adminEmail.text, /<script>alert\(1\)<\/script>/);
});
