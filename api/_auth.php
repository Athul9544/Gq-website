<?php
/**
 * Shared helpers for the PHP admin API (login / posts / upload).
 *
 * The admin password is read from, in order:
 *   1. $ADMIN_PASSWORD_INLINE below
 *   2. api/config.php  ->  'admin_password' => '...'
 *   3. the ADMIN_PASSWORD environment variable
 *
 * Keep the inline value blank in the git repo; set it on the server.
 */
declare(strict_types=1);

/* ---------------------------------------------------------------------------
 * Admin password.
 *
 * $ADMIN_PASSWORD_HASH holds a bcrypt hash, so the password itself is never
 * stored in the repository and a git deploy is all that is needed to make the
 * login work. To change the password, run locally:
 *
 *     php -r "echo password_hash('your new password', PASSWORD_BCRYPT);"
 *
 * and paste the result below. A plain password in api/config.php
 * ('admin_password') or in the ADMIN_PASSWORD environment variable still works
 * and takes precedence.
 * ------------------------------------------------------------------------- */
$ADMIN_PASSWORD_HASH   = '$2y$10$7/Cx4jkU18L.ICDu2Xg/UetCmJJeHjEdGj1xlfi4gcZMPHwZcsx5.';
$ADMIN_PASSWORD_INLINE = '';

function gq_json(int $status, $data): void {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Where everything the site writes at runtime lives: posts, uploaded images and
 * config.php. Deploying from git is a clean checkout, so anything inside the web
 * folder is deleted on every deploy - this has to sit one level above it.
 * Returns '' only if nothing is writable.
 */
function gq_storage_dir(): string {
    static $dir = null;
    if ($dir !== null) return $dir;

    $web = dirname(__DIR__);                 // public_html
    $candidates = [];
    $env = getenv('GQ_STORAGE');
    if ($env) $candidates[] = rtrim($env, '/\\');
    $candidates[] = dirname($web) . '/gq-storage';   // above the web root: survives deploys
    $candidates[] = $web . '/gq-storage';            // fallback: works, but a deploy wipes it
    $candidates[] = __DIR__ . '/data';

    foreach ($candidates as $c) {
        if (!is_dir($c)) { @mkdir($c, 0775, true); }
        if (is_dir($c) && is_writable($c)) { $dir = $c; break; }
    }
    if ($dir === null) { $dir = ''; return $dir; }

    // if it ended up inside the web root after all, at least keep it unreadable
    if (strpos($dir, $web) === 0) {
        $ht = $dir . '/.htaccess';
        if (!is_file($ht)) {
            @file_put_contents($ht, "Require all denied\n<IfModule !mod_authz_core.c>\nDeny from all\n</IfModule>\n");
        }
    }
    return $dir;
}

/** true when the storage folder is above the web root, i.e. a deploy cannot delete it */
function gq_storage_is_outside_web(): bool {
    $dir = gq_storage_dir();
    if ($dir === '') return false;
    $dirReal = realpath($dir) ?: $dir;
    $webReal = realpath(dirname(__DIR__)) ?: dirname(__DIR__);
    return strpos($dirReal, rtrim($webReal, '/\\') . DIRECTORY_SEPARATOR) !== 0 && $dirReal !== $webReal;
}

function gq_storage_subdir(string $name): string {
    $base = gq_storage_dir();
    if ($base === '') return '';
    $d = $base . '/' . $name;
    if (!is_dir($d)) { @mkdir($d, 0775, true); }
    return is_dir($d) ? $d : '';
}

function gq_config(): array {
    static $cfg = null;
    if ($cfg !== null) return $cfg;
    $cfg = [];
    $paths = [];
    $store = gq_storage_dir();
    if ($store !== '') $paths[] = $store . '/config.php';   // survives deploys, so look here first
    $paths[] = __DIR__ . '/config.php';
    $paths[] = __DIR__ . '/../config.php';
    foreach ($paths as $p) {
        if (is_file($p)) {
            $maybe = require $p;
            if (is_array($maybe)) { $cfg = $maybe; break; }
        }
    }
    return $cfg;
}

function gq_admin_password(): string {
    global $ADMIN_PASSWORD_INLINE;
    $cfg = gq_config();
    return trim((string)($ADMIN_PASSWORD_INLINE ?? ''))
        ?: trim((string)($cfg['admin_password'] ?? ''))
        ?: trim((string)(getenv('ADMIN_PASSWORD') ?: ''));
}

function gq_admin_password_hash(): string {
    global $ADMIN_PASSWORD_HASH;
    $cfg = gq_config();
    return trim((string)($cfg['admin_password_hash'] ?? ''))
        ?: trim((string)($ADMIN_PASSWORD_HASH ?? ''));
}

/** is a password configured at all? */
function gq_admin_password_set(): bool {
    return gq_admin_password() !== '' || gq_admin_password_hash() !== '';
}

/** check a password against the plain value or the bcrypt hash */
function gq_check_password(string $given): bool {
    if ($given === '') return false;
    $plain = gq_admin_password();
    if ($plain !== '' && hash_equals($plain, $given)) return true;
    $hash = gq_admin_password_hash();
    return $hash !== '' && password_verify($given, $hash);
}

/** true when the request carries the right admin key */
function gq_is_authed(): bool {
    if (!gq_admin_password_set()) return false;
    $given = $_SERVER['HTTP_X_ADMIN_KEY'] ?? '';
    if ($given === '' && function_exists('getallheaders')) {
        foreach (getallheaders() as $k => $v) {
            if (strtolower($k) === 'x-admin-key') { $given = $v; break; }
        }
    }
    return is_string($given) && gq_check_password($given);
}

function gq_body(): array {
    $raw = file_get_contents('php://input');
    $b = json_decode($raw ?: '[]', true);
    return is_array($b) ? $b : (is_array($_POST) ? $_POST : []);
}

/** where posts.json lives (created on first write) */
function gq_data_dir(): string {
    $dir = gq_storage_subdir('data');
    return $dir !== '' ? $dir : __DIR__ . '/data';
}

function gq_posts_file(): string { return gq_data_dir() . '/posts.json'; }

function gq_read_posts(): array {
    $f = gq_posts_file();
    if (!is_file($f)) {
        // posts written before the storage folder moved, then the seed from the repo
        foreach ([__DIR__ . '/data/posts.json', __DIR__ . '/data/posts.seed.json'] as $old) {
            if (is_file($old)) { $f = $old; break; }
        }
    }
    if (!is_file($f)) return [];
    $d = json_decode((string)file_get_contents($f), true);
    return is_array($d) ? $d : [];
}

function gq_write_posts(array $posts): bool {
    $f = gq_posts_file();
    $json = json_encode(array_values($posts), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $tmp = $f . '.tmp';
    if (@file_put_contents($tmp, $json, LOCK_EX) === false) return false;
    return @rename($tmp, $f);
}

/** where uploaded cover images live */
function gq_uploads_dir(): string {
    $dir = gq_storage_subdir('uploads');
    if ($dir !== '') return $dir;
    $fallback = dirname(__DIR__) . '/assets/blog/img';
    if (!is_dir($fallback)) { @mkdir($fallback, 0775, true); }
    return is_dir($fallback) ? $fallback : '';
}

/** image mime -> file extension, and the reverse; '' when unsupported */
function gq_media_types(): array {
    return [
        'image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp',
        'image/gif'  => 'gif', 'image/avif' => 'avif', 'image/svg+xml' => 'svg',
    ];
}
function gq_media_ext(string $mime): string {
    $mime = strtolower($mime) === 'image/jpg' ? 'image/jpeg' : strtolower($mime);
    return gq_media_types()[$mime] ?? '';
}
function gq_media_mime(string $ext): string {
    $found = array_search(strtolower($ext), gq_media_types(), true);
    return $found === false ? '' : $found;
}

function gq_slugify(string $s): string {
    // mbstring is not guaranteed on shared hosting, so stay on the plain functions
    $s = str_replace('&', ' and ', strtolower($s));
    $s = preg_replace('/[^a-z0-9]+/', '-', $s) ?? '';
    $s = trim($s, '-');
    $s = substr($s, 0, 80);
    $s = trim($s, '-');
    return $s !== '' ? $s : 'post';
}
