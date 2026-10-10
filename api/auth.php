<?php
/**
 * auth.php — Authentication API
 *
 * POST /api/auth.php?action=login   → login, returns JWT token
 * GET  /api/auth.php?action=verify  → verify token, returns admin info
 */
require_once __DIR__ . '/bootstrap.php';

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// ─── Login ────────────────────────────────────────────────────
if ($action === 'login' && $method === 'POST') {
    $body = getBody();
    $identifier = strtolower(trim($body['email'] ?? ''));
    $password   = $body['password'] ?? '';

    if (!$identifier || !$password) {
        jsonError('البريد الإلكتروني / اسم المستخدم وكلمة المرور مطلوبة', 400);
    }

    $db   = getDB();
    $stmt = $db->prepare(
        'SELECT * FROM admins WHERE LOWER(TRIM(email)) = ? OR LOWER(TRIM(username)) = ? LIMIT 1'
    );
    $stmt->execute([$identifier, $identifier]);
    $admin = $stmt->fetch();

    if (!$admin) {
        jsonError('بيانات الدخول غير صحيحة', 401);
    }

    if (!verifyPassword($password, $admin['password_hash'])) {
        jsonError('بيانات الدخول غير صحيحة', 401);
    }

    $token = jwtEncode([
        'id'       => (int) $admin['id'],
        'email'    => $admin['email'],
        'username' => $admin['username'] ?? 'admin',
    ]);

    jsonResponse([
        'success' => true,
        'valid'   => true,
        'token'   => $token,
        'admin'   => [
            'id'       => (int) $admin['id'],
            'username' => $admin['username'] ?? 'admin',
            'email'    => $admin['email'],
        ],
    ]);
}

// ─── Verify Token ─────────────────────────────────────────────
if ($action === 'verify' && $method === 'GET') {
    $payload = requireAuth();

    $db   = getDB();
    $stmt = $db->prepare('SELECT id, username, email FROM admins WHERE id = ? LIMIT 1');
    $stmt->execute([$payload['id']]);
    $admin = $stmt->fetch();

    if (!$admin) {
        jsonError('Admin not found', 404);
    }

    jsonResponse([
        'success' => true,
        'valid'   => true,
        'admin'   => [
            'id'       => (int) $admin['id'],
            'username' => $admin['username'] ?? 'admin',
            'email'    => $admin['email'],
        ],
    ]);
}

jsonError('Invalid action or method', 400);
