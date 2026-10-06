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

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function out(int $status, array $data): void {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    out(405, ['ok' => false, 'error' => 'Method not allowed']);
}

// ---- config ---------------------------------------------------------------
$cfg = [];
if (is_file(__DIR__ . '/config.php')) {
    $cfg = require __DIR__ . '/config.php';
}
$apiKey = $cfg['resend_api_key'] ?? getenv('RESEND_API_KEY') ?: '';
$to     = $cfg['contact_to']     ?? (getenv('CONTACT_TO')   ?: 'info@goldenqube.com');
$from   = $cfg['contact_from']   ?? (getenv('CONTACT_FROM') ?: 'Golden Qube Website <info@goldenqube.com>');

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
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS     => $payload,
    ]);
    $res  = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);
} else {
    // hosts without the cURL extension
    $ctx = stream_context_create(['http' => [
        'method'        => 'POST',
        'header'        => "Authorization: Bearer {$apiKey}\r\nContent-Type: application/json\r\n",
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
