<?php
/**
 * Blog posts API (PHP version for Hostinger).
 * Mirrors api/posts.js: GET list/one, POST create/update, DELETE, PATCH reorder.
 * Posts are stored in api/data/posts.json.
 */
declare(strict_types=1);
require __DIR__ . '/_auth.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$posts  = gq_read_posts();

// ---------------- read ----------------
if ($method === 'GET') {
    $all = isset($_GET['all']) && $_GET['all'] === '1' && gq_is_authed();
    $visible = $all ? $posts : array_values(array_filter($posts, static fn($p) => ($p['published'] ?? true) !== false));

    if (isset($_GET['slug']) && $_GET['slug'] !== '') {
        foreach ($visible as $p) {
            if (($p['slug'] ?? '') === $_GET['slug']) gq_json(200, $p);
        }
        gq_json(404, ['error' => 'Not found']);
    }
    gq_json(200, array_values($visible));
}

// ---------------- everything below needs the admin key ----------------
if (!gq_is_authed()) {
    gq_json(401, ['error' => 'Unauthorized']);
}

if ($method === 'POST' || $method === 'PUT') {
    $b = gq_body();
    $title = trim((string)($b['title'] ?? ''));
    if ($title === '') gq_json(400, ['error' => 'Title is required']);

    $now = gmdate('c');
    $slug = gq_slugify((string)($b['slug'] ?? '') !== '' ? (string)$b['slug'] : $title);

    $idx = -1;
    if (!empty($b['id'])) {
        foreach ($posts as $i => $p) {
            if (($p['id'] ?? '') === $b['id']) { $idx = $i; break; }
        }
    }
    // keep slugs unique
    foreach ($posts as $i => $p) {
        if (($p['slug'] ?? '') === $slug && $i !== $idx) {
            $slug .= '-' . substr(str_replace('.', '', (string)microtime(true)), -4);
            break;
        }
    }

    $services = $b['services'] ?? '';
    if (is_string($services)) {
        $services = array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n|,/', $services) ?: [])));
    } elseif (!is_array($services)) {
        $services = [];
    }

    $post = [
        'id'        => $idx >= 0 ? $posts[$idx]['id'] : (base_convert((string)time(), 10, 36) . bin2hex(random_bytes(2))),
        'slug'      => $slug,
        'title'     => $title,
        'excerpt'   => trim((string)($b['excerpt'] ?? '')),
        'content'   => (string)($b['content'] ?? ''),
        'image'     => trim((string)($b['image'] ?? '')),
        'link'      => trim((string)($b['link'] ?? '')),
        'category'  => trim((string)($b['category'] ?? '')),
        'industry'  => trim((string)($b['industry'] ?? '')),
        'services'  => $services,
        'published' => ($b['published'] ?? true) !== false,
        'date'      => (string)($b['date'] ?? ($idx >= 0 ? ($posts[$idx]['date'] ?? $now) : $now)),
        'updated'   => $now,
    ];

    if ($idx >= 0) { $posts[$idx] = $post; } else { array_unshift($posts, $post); }
    if (!gq_write_posts($posts)) gq_json(500, ['error' => 'Could not save (check folder permissions)']);
    gq_json(200, ['ok' => true, 'post' => $post, 'posts' => array_values($posts)]);
}

if ($method === 'DELETE') {
    $id = (string)($_GET['id'] ?? (gq_body()['id'] ?? ''));
    $next = array_values(array_filter($posts, static fn($p) => ($p['id'] ?? '') !== $id));
    if (count($next) === count($posts)) gq_json(404, ['error' => 'Not found']);
    if (!gq_write_posts($next)) gq_json(500, ['error' => 'Could not save']);
    gq_json(200, ['ok' => true, 'posts' => $next]);
}

if ($method === 'PATCH') {
    $order = gq_body()['order'] ?? [];
    if (!is_array($order)) $order = [];
    $byId = [];
    foreach ($posts as $p) { $byId[$p['id'] ?? ''] = $p; }
    $next = [];
    foreach ($order as $id) {
        if (isset($byId[$id])) { $next[] = $byId[$id]; unset($byId[$id]); }
    }
    foreach ($posts as $p) {
        if (isset($byId[$p['id'] ?? ''])) { $next[] = $p; }
    }
    if (!gq_write_posts($next)) gq_json(500, ['error' => 'Could not save']);
    gq_json(200, ['ok' => true, 'posts' => $next]);
}

gq_json(405, ['error' => 'Method not allowed']);
