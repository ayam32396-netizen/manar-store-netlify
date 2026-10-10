<?php
/**
 * config.php — Public store configuration
 * GET /api/config.php
 */
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Method not allowed', 405);
}

jsonResponse([
    'whatsapp_number' => WHATSAPP_NUMBER,
    'store_name'      => 'Manar Elhady Store',
    'store_name_ar'   => 'منار الهادي ستور',
]);
