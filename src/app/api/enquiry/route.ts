import { headers } from "next/headers";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const RECIPIENT = process.env.ENQUIRY_EMAIL ?? "info@learnthrivetuition.co.uk";

const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS ?? "https://learnthrivetuition.co.uk,https://www.learnthrivetuition.co.uk")
    .split(",")
    .map((o) => o.trim()),
);

if (process.env.NODE_ENV === "development") {
  ALLOWED_ORIGINS.add("http://localhost:3000");
}

// ── In-memory sliding-window rate limiter ────────────────────────
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_MAX = 5; // max submissions per window per IP

const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = hits.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_WINDOW_MS);

  if (recent.length >= RATE_MAX) {
    hits.set(ip, recent);
    return true;
  }

  recent.push(now);
  hits.set(ip, recent);
  return false;
}

// Prune stale entries every 10 minutes to avoid unbounded growth
setInterval(() => {
  const cutoff = Date.now() - RATE_WINDOW_MS;
  for (const [ip, timestamps] of hits) {
    const fresh = timestamps.filter((t) => t > cutoff);
    if (fresh.length === 0) hits.delete(ip);
    else hits.set(ip, fresh);
  }
}, 10 * 60 * 1000).unref?.();

type EnquiryBody = {
  parentName: string;
  email: string;
  phone: string;
  yearGroup: string;
  subject: string;
  support: string;
  contactMethod: string;
};

const fieldLimits: Record<keyof EnquiryBody, number> = {
  parentName: 100,
  email: 160,
  phone: 25,
  yearGroup: 50,
  subject: 50,
  support: 1000,
  contactMethod: 10,
};

function validateBody(body: unknown): body is EnquiryBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  const required: (keyof EnquiryBody)[] = [
    "parentName",
    "email",
    "yearGroup",
    "subject",
    "support",
    "contactMethod",
  ];
  for (const key of required) {
    if (typeof b[key] !== "string" || !(b[key] as string).trim()) return false;
    if ((b[key] as string).length > fieldLimits[key]) return false;
  }
  if (typeof b.phone !== "string") return false;
  if (b.phone.length > fieldLimits.phone) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email as string)) return false;
  if ((b.support as string).trim().length < 20) return false;
  if (b.contactMethod !== "Email" && b.contactMethod !== "Phone") return false;
  return true;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEmailHtml(data: EnquiryBody): string {
  return `
    <h2>New Enquiry from LearnThrive Tuition Website</h2>
    <table style="border-collapse:collapse;width:100%;max-width:600px;">
      <tr><td style="padding:8px;font-weight:bold;">Parent/Guardian</td><td style="padding:8px;">${escapeHtml(data.parentName)}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;">Email</td><td style="padding:8px;">${escapeHtml(data.email)}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;">Phone</td><td style="padding:8px;">${escapeHtml(data.phone || "Not provided")}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;">Year Group</td><td style="padding:8px;">${escapeHtml(data.yearGroup)}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;">Subject</td><td style="padding:8px;">${escapeHtml(data.subject)}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;">Preferred Contact</td><td style="padding:8px;">${escapeHtml(data.contactMethod)}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;vertical-align:top;">Support Required</td><td style="padding:8px;">${escapeHtml(data.support)}</td></tr>
    </table>
  `.trim();
}

function buildAutoReplyHtml(name: string): string {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#333;">
      <h2 style="color:#2563eb;">Thank you for your enquiry, ${escapeHtml(name)}!</h2>
      <p>We have received your enquiry and a member of the LearnThrive Tuition team will be in touch shortly.</p>
      <p>We aim to respond to all enquiries within <strong>24 hours</strong>.</p>
      <p>In the meantime, if you have any urgent questions, feel free to reply to this email.</p>
      <br/>
      <p>Kind regards,<br/><strong>The LearnThrive Tuition Team</strong></p>
    </div>
  `.trim();
}

export async function POST(request: Request) {
  try {
    // ── Origin check ──────────────────────────────────────────
    const reqHeaders = await headers();
    const origin = reqHeaders.get("origin");

    if (!origin || !ALLOWED_ORIGINS.has(origin)) {
      return Response.json(
        { error: "Forbidden." },
        { status: 403 },
      );
    }

    // ── Rate limiting ─────────────────────────────────────────
    const forwarded = reqHeaders.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";

    if (isRateLimited(ip)) {
      return Response.json(
        { error: "Too many enquiries. Please try again later." },
        { status: 429 },
      );
    }

    const body: unknown = await request.json();

    if (!validateBody(body)) {
      return Response.json(
        { error: "Invalid form data. Please check your answers and try again." },
        { status: 400 },
      );
    }

    const { error } = await resend.emails.send({
      from: `LearnThrive Tuition <${process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"}>`,
      to: [RECIPIENT],
      replyTo: body.email,
      subject: `Free consultation enquiry — ${body.subject}`,
      html: buildEmailHtml(body),
    });

    if (error) {
      console.error("Resend error:", error);
      return Response.json(
        { error: "We could not send your enquiry right now. Please try again shortly." },
        { status: 500 },
      );
    }

    const fromAddress = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

    resend.emails.send({
      from: `LearnThrive Tuition <${fromAddress}>`,
      to: [body.email],
      replyTo: RECIPIENT,
      subject: "We've received your enquiry — LearnThrive Tuition",
      html: buildAutoReplyHtml(body.parentName),
    }).catch((err) => {
      console.error("Auto-reply failed:", err);
    });

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
