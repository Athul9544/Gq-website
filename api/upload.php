<?php
/**
 * Image upload for the blog admin (PHP version for Hostinger).
 * POST { name, dataUrl } -> { ok: true, url: "/assets/blog/img/<file>" }
 * Files land in assets/blog/img/ next to the site, so they are served directly.
 */
declare(strict_types=1);
require __DIR__ . '/_auth.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    gq_json(405, ['error' => 'Method not allowed']);
}
if (!gq_is_authed()) {
    gq_json(401, ['error' => 'Unauthorized']);
}

$b = gq_body();
if (!preg_match('#^data:(image/[a-z0-9.+-]+);base64,(.+)$#i', (string)($b['dataUrl'] ?? ''), $m)) {
    gq_json(400, ['error' => 'Send an image as a data URL']);
}
$type = strtolower($m[1]);
$bin  = base64_decode($m[2], true);
if ($bin === false || $bin === '') {
    gq_json(400, ['error' => 'Could not read the image data']);
}
if (strlen($bin) > 3.5 * 1024 * 1024) {
    gq_json(413, ['error' => 'Image too large (max 3.5 MB)']);
}

$extByType = [
    'image/jpeg' => 'jpg', 'image/jpg' => 'jpg', 'image/png' => 'png',
    'image/webp' => 'webp', 'image/gif' => 'gif', 'image/avif' => 'avif',
    'image/svg+xml' => 'svg',
];
if (!isset($extByType[$type])) {
    gq_json(400, ['error' => 'Unsupported image type']);
}
$ext = $extByType[$type];

$base = gq_slugify(preg_replace('/\.[a-z0-9]+$/i', '', (string)($b['name'] ?? 'image')) ?? 'image');
$name = $base . '-' . bin2hex(random_bytes(4)) . '.' . $ext;

$dir = dirname(__DIR__) . '/assets/blog/img';
if (!is_dir($dir) && !@mkdir($dir, 0775, true)) {
    gq_json(500, ['error' => 'Could not create assets/blog/img (check permissions)']);
}
if (@file_put_contents($dir . '/' . $name, $bin) === false) {
    gq_json(500, ['error' => 'Could not save the image (check folder permissions)']);
}

gq_json(200, ['ok' => true, 'url' => '/assets/blog/img/' . $name]);
