<?php
/**
 * Serves an uploaded cover image out of the storage folder above the web root.
 * /media/<file>  ->  this script (see the rewrite in .htaccess)
 *
 * Read-only and public on purpose: these are the images shown on the blog.
 */
declare(strict_types=1);
require __DIR__ . '/_auth.php';

function gq_media_404(): void {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-store');
    echo "Not found";
    exit;
}

$name = (string)($_GET['f'] ?? '');
// only ever a plain file name inside the uploads folder
if (!preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]{0,120}$/', $name) || strpos($name, '..') !== false) {
    gq_media_404();
}

$ext  = strtolower((string)pathinfo($name, PATHINFO_EXTENSION));
$mime = gq_media_mime($ext);
if ($mime === '') gq_media_404();

$dirs = array_filter([gq_uploads_dir(), dirname(__DIR__) . '/assets/blog/img']);
$file = '';
foreach ($dirs as $d) {
    $p = $d . '/' . $name;
    if (is_file($p)) { $file = $p; break; }
}
if ($file === '') gq_media_404();

$mtime = (int)filemtime($file);
$etag  = '"' . md5($name . '-' . $mtime . '-' . filesize($file)) . '"';

header('Content-Type: ' . $mime);
header('Cache-Control: public, max-age=31536000, immutable');  // the name carries a random suffix
header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $mtime) . ' GMT');
header('ETag: ' . $etag);
header('X-Content-Type-Options: nosniff');

$since = $_SERVER['HTTP_IF_MODIFIED_SINCE'] ?? '';
$match = $_SERVER['HTTP_IF_NONE_MATCH'] ?? '';
if ($match === $etag || ($since !== '' && @strtotime($since) >= $mtime)) {
    http_response_code(304);
    exit;
}

header('Content-Length: ' . filesize($file));
readfile($file);
