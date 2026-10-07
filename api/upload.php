<?php
/**
 * Image upload for the blog admin (PHP version for Hostinger).
 * POST { name, dataUrl } -> { ok: true, url: "/media/<file>" }
 *
 * Files are written to the storage folder ABOVE the web root, because deploying
 * from git is a clean checkout and would delete anything stored inside it.
 * They are served back out by api/media.php (see the /media rewrite in .htaccess).
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

$ext = gq_media_ext($type);
if ($ext === '') {
    gq_json(400, ['error' => 'Unsupported image type']);
}

$base = gq_slugify(preg_replace('/\.[a-z0-9]+$/i', '', (string)($b['name'] ?? 'image')) ?? 'image');
$name = $base . '-' . bin2hex(random_bytes(4)) . '.' . $ext;

$dir = gq_uploads_dir();
if ($dir === '') {
    gq_json(500, ['error' => 'No writable storage folder on the server']);
}
if (@file_put_contents($dir . '/' . $name, $bin) === false) {
    gq_json(500, ['error' => 'Could not save the image (check folder permissions)']);
}

gq_json(200, ['ok' => true, 'url' => '/media/' . $name]);
