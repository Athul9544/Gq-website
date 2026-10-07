<?php
declare(strict_types=1);
require __DIR__ . '/_auth.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    // /api/login.php?selftest=1 tells you whether the password is configured
    if (isset($_GET['selftest'])) {
        gq_json(200, [
            'ok'               => gq_admin_password() !== '',
            'php'              => PHP_VERSION,
            'password_set'     => gq_admin_password() !== '',
            'data_dir_writable'=> is_writable(gq_data_dir()),
            'posts_stored'     => count(gq_read_posts()),
            'hint'             => gq_admin_password() !== ''
                ? 'Ready. Log in at /admin.'
                : 'Set the admin password in api/_auth.php ($ADMIN_PASSWORD_INLINE).',
        ]);
    }
    gq_json(405, ['ok' => false, 'error' => 'Method not allowed']);
}

$pw = gq_admin_password();
if ($pw === '') {
    gq_json(500, ['ok' => false, 'error' => 'Admin password is not configured']);
}

$given = (string)(gq_body()['password'] ?? '');
if ($given === '' || !hash_equals($pw, $given)) {
    gq_json(401, ['ok' => false, 'error' => 'Wrong password']);
}

gq_json(200, ['ok' => true]);
