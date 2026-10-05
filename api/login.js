import { isAuthed, json } from "./_store.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return json(res, 500, { ok: false, error: "Admin password is not configured" });
  const given = (req.body && req.body.password) || "";
  if (given !== pw) return json(res, 401, { ok: false, error: "Wrong password" });
  return json(res, 200, { ok: true });
}
