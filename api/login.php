<?php
declare(strict_types=1);
require __DIR__ . '/_auth.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    // /api/login.php?selftest=1 tells you whether the password is configured
    if (isset($_GET['selftest'])) {
        gq_json(200, [
            'ok'               => gq_admin_password_set(),
            'php'              => PHP_VERSION,
            'password_set'     => gq_admin_password_set(),
            'password_source'  => gq_admin_password() !== '' ? 'plain' : (gq_admin_password_hash() !== '' ? 'hash' : 'none'),
            'data_dir_writable'=> is_writable(gq_data_dir()),
            'posts_stored'     => count(gq_read_posts()),
            'hint'             => gq_admin_password_set()
                ? 'Ready. Log in at /admin.'
                : 'Set the admin password in api/_auth.php ($ADMIN_PASSWORD_HASH) or api/config.php.',
        ]);
    }
    gq_json(405, ['ok' => false, 'error' => 'Method not allowed']);
}

if (!gq_admin_password_set()) {
    gq_json(500, ['ok' => false, 'error' => 'Admin password is not configured']);
}

if (!gq_check_password((string)(gq_body()['password'] ?? ''))) {
    gq_json(401, ['ok' => false, 'error' => 'Wrong password']);
}

gq_json(200, ['ok' => true]);
