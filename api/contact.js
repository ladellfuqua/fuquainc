/**
 * Contact form delivery (LAD-14) — Vercel Serverless Function.
 *
 * Receives the JSON POST from /contact (LAD-18), validates server-side, applies
 * a honeypot + best-effort rate limit, and delivers valid submissions to a
 * private inbox via the Resend transactional email API. The visitor's validated
 * email is set as Reply-To. No database, no auto-reply.
 *
 * Secrets & destination come ONLY from environment variables (never hardcoded,
 * never returned to the client, never logged):
 *   - RESEND_API_KEY   : Resend API key (protected)
 *   - CONTACT_TO_EMAIL : private destination inbox (protected)
 * Sender is fixed to the verified domain address (not secret):
 *   FUQUA INC. Website <contact@fuquainc.com>
 *
 * Responses are generic and reveal no infrastructure details.
 */

const REASONS = new Set([
  'Leadership inquiry',
  'Advisory inquiry',
  'Response to an essay or idea',
  'Other professional inquiry',
]);

const LIMITS = { name: 100, email: 254, organization: 150, message: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Control characters to strip. Keep \n (\x0A) and \r (\x0D) in message bodies.
// eslint-disable-next-line no-control-regex
const CTRL_KEEP_NEWLINES = /[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g;
// eslint-disable-next-line no-control-regex
const CTRL_ALL = /[\x00-\x1F\x7F]/g;

// Best-effort in-memory rate limit (per warm instance). Durable limiting would
// use Vercel KV / Upstash; this is a proportionate baseline for a low-traffic
// contact form.
const RL_WINDOW_MS = 10 * 60 * 1000;
const RL_MAX = 5;
const hits = new Map(); // ip -> number[] (timestamps)

function rateLimited(ip, now) {
  const arr = (hits.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear(); // crude memory guard
  return arr.length > RL_MAX;
}

// Single-line value (headers/subject): drop all control chars, collapse spaces.
function oneLine(s) {
  return String(s).replace(CTRL_ALL, ' ').replace(/\s+/g, ' ').trim();
}
// Body value: strip control chars but keep line breaks.
function cleanBody(s) {
  return String(s).replace(CTRL_KEEP_NEWLINES, '').trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  // Parse JSON body (Vercel usually parses it; fall back for safety).
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ ok: false });
  }

  // Honeypot: real users never fill this. Pretend success, deliver nothing.
  if (oneLine(body.website || '')) {
    return res.status(200).json({ ok: true });
  }

  // Rate limit (best-effort).
  const ip = oneLine(
    (req.headers['x-forwarded-for'] || '').split(',')[0] ||
      req.socket?.remoteAddress ||
      ''
  );
  if (ip && rateLimited(ip, Date.now())) {
    return res.status(429).json({ ok: false });
  }

  // Extract + validate.
  const name = oneLine(body.name || '');
  const email = oneLine(body.email || '');
  const organization = oneLine(body.organization || '');
  const reason = oneLine(body.reason || '');
  const message = cleanBody(body.message || '');

  const valid =
    name.length > 0 && name.length <= LIMITS.name &&
    email.length <= LIMITS.email && EMAIL_RE.test(email) &&
    organization.length <= LIMITS.organization &&
    REASONS.has(reason) &&
    message.length > 0 && message.length <= LIMITS.message;

  if (!valid) {
    return res.status(400).json({ ok: false });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL;
  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL) {
    // Misconfiguration — generic error to the client, no details leaked.
    return res.status(500).json({ ok: false });
  }

  const text = [
    `Reason: ${reason}`,
    `Name: ${name}`,
    `Email: ${email}`,
    organization ? `Organization: ${organization}` : null,
    '',
    'Message:',
    message,
  ].filter((l) => l !== null).join('\n');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'FUQUA INC. Website <contact@fuquainc.com>',
        to: [CONTACT_TO_EMAIL],
        reply_to: email,
        subject: `Contact: ${reason}`,
        text,
      }),
    });

    if (!r.ok) {
      return res.status(502).json({ ok: false });
    }
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ ok: false });
  }
}
