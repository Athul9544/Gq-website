import { put, list, del } from "@vercel/blob";

// Every save writes a NEW versioned file (blog/posts/<timestamp>.json) and readers take the newest.
// Nothing is overwritten, so the Blob CDN can never hand back a stale copy.
const PREFIX = "blog/posts/";

export function isAuthed(req) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const given = req.headers["x-admin-key"] || "";
  return given === pw;
}

async function versions() {
  const out = [];
  let cursor;
  do {
    const r = await list({ prefix: PREFIX, limit: 1000, cursor });
    out.push(...r.blobs);
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  // newest first by the timestamp encoded in the filename
  return out.sort((a, b) => stamp(b.pathname) - stamp(a.pathname));
}
function stamp(p) { const m = /\/(\d+)[^/]*\.json$/.exec(p); return m ? Number(m[1]) : 0; }

export async function readPosts() {
  const v = await versions();
  if (!v.length) return [];
  const r = await fetch(v[0].url, { cache: "no-store" });
  if (!r.ok) return [];
  try { const d = await r.json(); return Array.isArray(d) ? d : []; } catch { return []; }
}

export async function writePosts(posts) {
  await put(PREFIX + Date.now() + ".json", JSON.stringify(posts), {
    access: "public", addRandomSuffix: true, contentType: "application/json",
  });
  // prune old versions, keep the latest 5 as a safety net
  try {
    const v = await versions();
    const old = v.slice(5).map((b) => b.url);
    if (old.length) await del(old);
  } catch { }
}

export function slugify(s) {
  return String(s || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "post";
}

export function json(res, status, data) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(status).send(JSON.stringify(data));
}
