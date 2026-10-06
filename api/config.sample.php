<?php
/**
 * Copy this file to api/config.php on the server and fill in your Resend key.
 * api/config.php is git-ignored, so the key never lands in the repository.
 */
return [
    // From https://resend.com/api-keys  (starts with "re_")
    'resend_api_key' => 'PASTE_YOUR_RESEND_API_KEY_HERE',

    // Where enquiries are delivered
    'contact_to'     => 'info@goldenqube.com',

    // Sender. The domain here must be verified in Resend.
    // Before goldenqube.com is verified you can test with: 'Golden Qube <onboarding@resend.dev>'
    'contact_from'   => 'Golden Qube Website <info@goldenqube.com>',
];
