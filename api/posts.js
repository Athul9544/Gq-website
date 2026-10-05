import { isAuthed, json, readPosts, writePosts, slugify } from "./_store.js";

export default async function handler(req, res) {
  const method = req.method;

  if (method === "GET") {
    const posts = await readPosts();
    const all = req.query && req.query.all === "1" && isAuthed(req);
    const visible = all ? posts : posts.filter((p) => p.published !== false);
    if (req.query && req.query.slug) {
      const p = visible.find((x) => x.slug === req.query.slug);
      return p ? json(res, 200, p) : json(res, 404, { error: "Not found" });
    }
    return json(res, 200, visible);
  }

  if (!isAuthed(req)) return json(res, 401, { error: "Unauthorized" });

  const posts = await readPosts();

  if (method === "POST" || method === "PUT") {
    const b = req.body || {};
    if (!b.title || !String(b.title).trim()) return json(res, 400, { error: "Title is required" });
    const now = new Date().toISOString();
    let slug = slugify(b.slug || b.title);
    const idx = b.id ? posts.findIndex((p) => p.id === b.id) : -1;
    // keep slugs unique
    if (posts.some((p, i) => p.slug === slug && i !== idx)) slug = slug + "-" + Date.now().toString(36).slice(-4);
    const post = {
      id: idx >= 0 ? posts[idx].id : Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      slug,
      title: String(b.title).trim(),
      excerpt: String(b.excerpt || "").trim(),
      content: String(b.content || ""),
      image: String(b.image || "").trim(),
      link: String(b.link || "").trim(),
      category: String(b.category || "").trim(),
      industry: String(b.industry || "").trim(),
      services: String(b.services || "").split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean),
      published: b.published !== false,
      date: b.date || (idx >= 0 ? posts[idx].date : now),
      updated: now,
    };
    if (idx >= 0) posts[idx] = post; else posts.unshift(post);
    await writePosts(posts);
    return json(res, 200, { ok: true, post, posts });
  }

  if (method === "DELETE") {
    const id = (req.query && req.query.id) || (req.body && req.body.id);
    const next = posts.filter((p) => p.id !== id);
    if (next.length === posts.length) return json(res, 404, { error: "Not found" });
    await writePosts(next);
    return json(res, 200, { ok: true, posts: next });
  }

  if (method === "PATCH") {
    // reorder: body.order = [ids]
    const order = (req.body && req.body.order) || [];
    const map = new Map(posts.map((p) => [p.id, p]));
    const next = order.map((id) => map.get(id)).filter(Boolean);
    posts.forEach((p) => { if (!order.includes(p.id)) next.push(p); });
    await writePosts(next);
    return json(res, 200, { ok: true, posts: next });
  }

  return json(res, 405, { error: "Method not allowed" });
}
