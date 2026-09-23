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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://learnthrivetuition.co.uk";
const LOGO_URL = `${SITE_URL}/brand/learnthrive-logo.png`;

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f1ec;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ec;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(9,29,49,0.08);">
        <!-- Header -->
        <tr><td style="background:#ffffff;padding:28px 32px;text-align:center;border-bottom:1px solid #d8e0df;">
          <span style="font-size:18px;font-weight:800;color:#0e2a47;letter-spacing:-0.02em;">Learn<span style="color:#075f52;">Thrive</span> Tuition</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="background:#ffffff;padding:36px 32px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#091d31;padding:24px 32px;text-align:center;">
          <p style="margin:0;color:#b9cbd5;font-size:13px;line-height:1.5;">
            LearnThrive Tuition &middot; Personalised tutoring that makes a difference
          </p>
          <p style="margin:8px 0 0;color:#7a8f9c;font-size:12px;">
            <a href="${SITE_URL}" style="color:#8ed2ad;text-decoration:none;">learnthrivetuition.co.uk</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

function buildEmailHtml(data: EnquiryBody): string {
  return emailWrapper(`
    <h2 style="margin:0 0 24px;color:#0e2a47;font-size:22px;font-weight:800;">New Enquiry Received</h2>
    <table style="border-collapse:collapse;width:100%;">
      <tr>
        <td style="padding:12px 16px;font-weight:700;color:#0e2a47;background:#e9f5ef;border-bottom:1px solid #d8e0df;width:40%;">Parent/Guardian</td>
        <td style="padding:12px 16px;color:#435466;background:#ffffff;border-bottom:1px solid #d8e0df;">${escapeHtml(data.parentName)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-weight:700;color:#0e2a47;background:#e9f5ef;border-bottom:1px solid #d8e0df;">Email</td>
        <td style="padding:12px 16px;color:#435466;background:#ffffff;border-bottom:1px solid #d8e0df;">${escapeHtml(data.email)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-weight:700;color:#0e2a47;background:#e9f5ef;border-bottom:1px solid #d8e0df;">Phone</td>
        <td style="padding:12px 16px;color:#435466;background:#ffffff;border-bottom:1px solid #d8e0df;">${escapeHtml(data.phone || "Not provided")}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-weight:700;color:#0e2a47;background:#e9f5ef;border-bottom:1px solid #d8e0df;">Year Group</td>
        <td style="padding:12px 16px;color:#435466;background:#ffffff;border-bottom:1px solid #d8e0df;">${escapeHtml(data.yearGroup)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-weight:700;color:#0e2a47;background:#e9f5ef;border-bottom:1px solid #d8e0df;">Subject</td>
        <td style="padding:12px 16px;color:#435466;background:#ffffff;border-bottom:1px solid #d8e0df;">${escapeHtml(data.subject)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-weight:700;color:#0e2a47;background:#e9f5ef;border-bottom:1px solid #d8e0df;">Preferred Contact</td>
        <td style="padding:12px 16px;color:#435466;background:#ffffff;border-bottom:1px solid #d8e0df;">${escapeHtml(data.contactMethod)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-weight:700;color:#0e2a47;background:#e9f5ef;vertical-align:top;">Support Required</td>
        <td style="padding:12px 16px;color:#435466;background:#ffffff;">${escapeHtml(data.support)}</td>
      </tr>
    </table>
  `);
}

function buildAutoReplyHtml(name: string): string {
  return emailWrapper(`
    <h2 style="margin:0 0 8px;color:#0e2a47;font-size:22px;font-weight:800;">Thank you for your enquiry, ${escapeHtml(name)}!</h2>
    <div style="width:48px;height:4px;background:#075f52;border-radius:2px;margin-bottom:24px;"></div>
    <p style="margin:0 0 16px;color:#435466;font-size:15px;line-height:1.65;">We have received your enquiry and a member of the LearnThrive Tuition team will be in touch shortly.</p>
    <p style="margin:0 0 16px;color:#435466;font-size:15px;line-height:1.65;">We aim to respond to all enquiries within <strong style="color:#0e2a47;">5 working days</strong>.</p>
    <p style="margin:0 0 24px;color:#435466;font-size:15px;line-height:1.65;">In the meantime, if you have any urgent questions, feel free to reply to this email.</p>
    <p style="margin:0;color:#435466;font-size:15px;line-height:1.65;">Kind regards,<br/><strong style="color:#0e2a47;">The LearnThrive Tuition Team</strong></p>
  `);
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
