import { put } from "@vercel/blob";
import { isAuthed, json, slugify } from "./_store.js";

export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (!isAuthed(req)) return json(res, 401, { error: "Unauthorized" });
  const b = req.body || {};
  const m = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(b.dataUrl || "");
  if (!m) return json(res, 400, { error: "Send an image as a data URL" });
  const type = m[1];
  const buf = Buffer.from(m[2], "base64");
  if (buf.length > 3.5 * 1024 * 1024) return json(res, 413, { error: "Image too large (max 3.5 MB)" });
  const ext = type.split("/")[1].replace("jpeg", "jpg").replace("svg+xml", "svg");
  const name = slugify((b.name || "image").replace(/\.[a-z0-9]+$/i, "")) + "." + ext;
  const blob = await put("blog/img/" + name, buf, { access: "public", contentType: type, addRandomSuffix: true });
  return json(res, 200, { ok: true, url: blob.url });
}
