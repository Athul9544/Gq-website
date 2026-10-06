<?php
/**
 * Contact form -> email via Resend, for the Hostinger-hosted site.
 *
 * Setup:
 *   1. Copy api/config.sample.php to api/config.php
 *   2. Put your Resend API key in it (that file is never committed to git)
 *
 * The key can also come from an environment variable: RESEND_API_KEY
 */
declare(strict_types=1);

/* ---------------------------------------------------------------------------
 * EASIEST SETUP: paste your Resend API key between the quotes below, save,
 * and the form works. (Leave it empty to use api/config.php or an env var.)
 * Keep this blank in the git repo so the key never gets committed.
 * ------------------------------------------------------------------------- */
$INLINE_RESEND_KEY = '';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function out(int $status, array $data): void {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

// ?selftest=1 is allowed over GET so the setup can be checked from a browser
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST' && !isset($_GET['selftest'])) {
    out(405, ['ok' => false, 'error' => 'Method not allowed']);
}

// ---- config ---------------------------------------------------------------
// Looked for in this order, so it works wherever the file was dropped on the host.
$cfg = [];
$configPaths = [
    __DIR__ . '/config.php',
    __DIR__ . '/../config.php',
    __DIR__ . '/../api/config.php',
];
$configFound = null;
foreach ($configPaths as $path) {
    if (is_file($path)) {
        $maybe = require $path;
        if (is_array($maybe)) { $cfg = $maybe; $configFound = $path; break; }
    }
}

// Note: the key is only read from a .php file or an environment variable.
// A plain .txt key file would be downloadable over the web, so it is not supported.

$apiKey = trim($INLINE_RESEND_KEY)
    ?: trim((string)($cfg['resend_api_key'] ?? ''))
    ?: trim((string)(getenv('RESEND_API_KEY') ?: ''));
if ($apiKey !== '' && $configFound === null) { $configFound = 'inline in contact.php'; }
$to     = trim((string)($cfg['contact_to'] ?? '')) ?: (getenv('CONTACT_TO') ?: 'info@goldenqube.com');
$from   = trim((string)($cfg['contact_from'] ?? '')) ?: (getenv('CONTACT_FROM') ?: 'Golden Qube Website <info@goldenqube.com>');

// ---- self-test: /api/contact.php?selftest=1 (never prints the key) ---------
if (isset($_GET['selftest'])) {
    out(200, [
        'ok'            => (bool)$apiKey,
        'php'           => PHP_VERSION,
        'curl'          => function_exists('curl_init'),
        'openssl'       => extension_loaded('openssl'),
        'config_file'   => $configFound ? basename(dirname($configFound)) . '/' . basename($configFound) : null,
        'key_present'   => (bool)$apiKey,
        'key_length'    => strlen($apiKey),
        'key_prefix_ok' => $apiKey !== '' && strpos($apiKey, 're_') === 0,
        'send_to'       => $to,
        'send_from'     => $from,
        'hint'          => $apiKey ? 'Configured. Submit the form to test a real send.'
                                   : 'Create api/config.php next to this file with your Resend key.',
    ]);
}

if (!$apiKey) {
    out(500, ['ok' => false, 'error' => 'Email is not configured yet.']);
}

// ---- input ----------------------------------------------------------------
$raw  = file_get_contents('php://input');
$body = json_decode($raw ?: '[]', true);
if (!is_array($body)) { $body = $_POST; }

$name    = trim((string)($body['name'] ?? ''));
$phone   = trim((string)($body['phone'] ?? ''));
$email   = trim((string)($body['email'] ?? ''));
$message = trim((string)($body['message'] ?? ''));

if ($name === '' || $phone === '' || $email === '') {
    out(400, ['ok' => false, 'error' => 'Name, number and email are required.']);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    out(400, ['ok' => false, 'error' => 'Please enter a valid email address.']);
}
$msgLen = function_exists('mb_strlen') ? mb_strlen($message) : strlen($message);
if ($msgLen > 5000) {
    out(400, ['ok' => false, 'error' => 'Message is too long.']);
}

$e = fn(string $s): string => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');

$text = "New enquiry from the Golden Qube website\n\n"
      . "Name:   {$name}\nNumber: {$phone}\nEmail:  {$email}\n\n"
      . "Message:\n" . ($message !== '' ? $message : '(no message)') . "\n";

$html = '<div style="font-family:Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f1915">'
      . '<h2 style="margin:0 0 16px;font-size:18px">New enquiry from the Golden Qube website</h2>'
      . '<table cellpadding="6" style="border-collapse:collapse">'
      . '<tr><td style="color:#8a8178">Name</td><td><strong>' . $e($name) . '</strong></td></tr>'
      . '<tr><td style="color:#8a8178">Number</td><td><a href="tel:' . $e($phone) . '">' . $e($phone) . '</a></td></tr>'
      . '<tr><td style="color:#8a8178">Email</td><td><a href="mailto:' . $e($email) . '">' . $e($email) . '</a></td></tr>'
      . '</table>'
      . '<p style="margin:18px 0 6px;color:#8a8178">Message</p>'
      . '<div style="white-space:pre-wrap;border-left:3px solid #dac171;padding-left:12px">'
      . ($message !== '' ? nl2br($e($message)) : '<em>(no message)</em>')
      . '</div></div>';

// ---- send via Resend ------------------------------------------------------
$payload = json_encode([
    'from'     => $from,
    'to'       => [$to],
    'reply_to' => $email,
    'subject'  => 'Website enquiry - ' . $name,
    'text'     => $text,
    'html'     => $html,
], JSON_UNESCAPED_UNICODE);

$res = false; $code = 0; $err = '';

if (function_exists('curl_init')) {
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_USERAGENT      => 'GoldenQubeSite/1.0',
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
            'Accept: application/json',
        ],
        CURLOPT_POSTFIELDS     => $payload,
    ]);
    $res  = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    if (PHP_VERSION_ID < 80500) { curl_close($ch); }
} else {
    // hosts without the cURL extension
    $ctx = stream_context_create(['http' => [
        'method'        => 'POST',
        'header'        => "Authorization: Bearer {$apiKey}\r\nContent-Type: application/json\r\n"
                         . "Accept: application/json\r\nUser-Agent: GoldenQubeSite/1.0\r\n",
        'content'       => $payload,
        'timeout'       => 20,
        'ignore_errors' => true,
    ]]);
    $res = @file_get_contents('https://api.resend.com/emails', false, $ctx);
    if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) {
        $code = (int)$m[1];
    }
    if ($res === false) { $err = 'stream request failed'; }
}

if ($res === false) {
    error_log('Resend request failed: ' . $err);
    out(502, ['ok' => false, 'error' => 'Could not send the message.']);
}

$data = json_decode($res, true) ?: [];
if ($code < 200 || $code >= 300) {
    error_log('Resend error ' . $code . ': ' . $res);
    out(502, ['ok' => false, 'error' => $data['message'] ?? 'Could not send the message.']);
}

out(200, ['ok' => true, 'id' => $data['id'] ?? null]);
