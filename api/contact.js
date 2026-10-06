// Contact form -> email via Resend (https://resend.com).
// Needs one environment variable on Vercel: RESEND_API_KEY
// Optional overrides: CONTACT_TO (inbox), CONTACT_FROM (verified sender).
function json(res, status, data) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(status).send(JSON.stringify(data));
}

const esc = (s) =>
  String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { ok: false, error: "Method not allowed" });

  const key = process.env.RESEND_API_KEY;
  if (!key) return json(res, 500, { ok: false, error: "Email is not configured yet." });

  const b = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body) || {};
  const name = String(b.name || "").trim();
  const phone = String(b.phone || "").trim();
  const email = String(b.email || "").trim();
  const message = String(b.message || "").trim();

  if (!name || !phone || !email) return json(res, 400, { ok: false, error: "Name, number and email are required." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json(res, 400, { ok: false, error: "Please enter a valid email address." });
  if (message.length > 5000) return json(res, 400, { ok: false, error: "Message is too long." });

  const to = process.env.CONTACT_TO || "info@goldenqube.com";
  const from = process.env.CONTACT_FROM || "Golden Qube Website <info@goldenqube.com>";

  const text =
    `New enquiry from the Golden Qube website\n\n` +
    `Name:   ${name}\nNumber: ${phone}\nEmail:  ${email}\n\n` +
    `Message:\n${message || "(no message)"}\n`;

  const html =
    `<div style="font-family:Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f1915">` +
    `<h2 style="margin:0 0 16px;font-size:18px">New enquiry from the Golden Qube website</h2>` +
    `<table cellpadding="6" style="border-collapse:collapse">` +
    `<tr><td style="color:#8a8178">Name</td><td><strong>${esc(name)}</strong></td></tr>` +
    `<tr><td style="color:#8a8178">Number</td><td><a href="tel:${esc(phone)}">${esc(phone)}</a></td></tr>` +
    `<tr><td style="color:#8a8178">Email</td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>` +
    `</table>` +
    `<p style="margin:18px 0 6px;color:#8a8178">Message</p>` +
    `<div style="white-space:pre-wrap;border-left:3px solid #dac171;padding-left:12px">${esc(message) || "<em>(no message)</em>"}</div>` +
    `</div>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `Website enquiry - ${name}`,
        text,
        html,
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error("Resend error", r.status, data);
      return json(res, 502, { ok: false, error: data.message || "Could not send the message." });
    }
    return json(res, 200, { ok: true, id: data.id });
  } catch (e) {
    console.error("Resend request failed", e);
    return json(res, 502, { ok: false, error: "Could not send the message." });
  }
}
