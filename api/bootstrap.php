<?php
/**
 * bootstrap.php — Manar Elhady Store
 * Core configuration & database connection for InfinityFree (MySQL)
 */

// ============================================================
// ⚙️  DATABASE CONFIG — Fill these with your InfinityFree values
// ============================================================
define('DB_HOST',     getenv('DB_HOST')     ?: 'sql110.infinityfree.com');  // e.g. sql200.infinityfree.com
define('DB_NAME',     getenv('DB_NAME')     ?: 'if0_42849660_XXX');       // your database name
define('DB_USER',     getenv('DB_USER')     ?: 'if0_42849660');             // your database username
define('DB_PASS',     getenv('DB_PASS')     ?: 'wZIY5XamNgGiSi');         // your database password
define('DB_CHARSET',  'utf8mb4');

// ============================================================
// ⚙️  APP CONFIG
// ============================================================
define('JWT_SECRET',       getenv('JWT_SECRET')       ?: 'manar-elhady-store-super-secret-jwt-key-2024');
define('WHATSAPP_NUMBER',  getenv('WHATSAPP_NUMBER')  ?: '201234567890');
define('SEED_SECRET',      getenv('SEED_SECRET')      ?: 'manar-seed-2024');
define('ADMIN_EMAIL',      getenv('ADMIN_EMAIL')      ?: 'admin@manar-store.com');
define('ADMIN_PASSWORD',   getenv('ADMIN_PASSWORD')   ?: 'Admin@Manar2024');
define('UPLOADS_DIR',      __DIR__ . '/../uploads/');
define('ASSETS_DIR',       __DIR__ . '/../assets/');

// ============================================================
// 🌍  CORS & JSON Headers
// ============================================================
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ============================================================
// 🗄️  PDO Database Connection (singleton)
// ============================================================
function getDB(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $e) {
        jsonError('Database connection failed: ' . $e->getMessage(), 500);
    }
    return $pdo;
}

// ============================================================
// 📤  Response Helpers
// ============================================================
function jsonResponse(mixed $data, int $code = 200): never {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function jsonError(string $message, int $code = 400): never {
    http_response_code($code);
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

// ============================================================
// 🔐  JWT — Pure PHP (no external library needed)
// ============================================================
function jwtEncode(array $payload): string {
    $header  = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload['exp'] = $payload['exp'] ?? (time() + 7 * 24 * 3600); // 7 days
    $payload['iat'] = time();
    $body    = base64url_encode(json_encode($payload));
    $sig     = base64url_encode(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
    return "$header.$body.$sig";
}

function jwtDecode(string $token): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;

    [$header, $body, $sig] = $parts;
    $expected = base64url_encode(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
    if (!hash_equals($expected, $sig)) return null;

    $payload = json_decode(base64url_decode($body), true);
    if (!$payload) return null;
    if (isset($payload['exp']) && $payload['exp'] < time()) return null;

    return $payload;
}

function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', (4 - strlen($data) % 4) % 4));
}

// ============================================================
// 🔒  Auth Middleware — call this in protected endpoints
// ============================================================
function requireAuth(): array {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$authHeader && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $authHeader = $headers['Authorization'] ?? '';
    }

    $token = '';
    if (preg_match('/Bearer\s+(.+)/i', $authHeader, $m)) {
        $token = trim($m[1]);
    }

    if (!$token) jsonError('Access denied', 401);

    $payload = jwtDecode($token);
    if (!$payload) jsonError('Invalid or expired token', 403);

    return $payload;
}

// ============================================================
// 📥  Request Body Helper
// ============================================================
function getBody(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

// ============================================================
// 🔑  Password Hashing (bcrypt compatible with Node.js bcryptjs)
// ============================================================
function hashPassword(string $password): string {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
}

function verifyPassword(string $password, string $hash): bool {
    return password_verify($password, $hash);
}

// ============================================================
// 🧹  Sanitize helpers
// ============================================================
function sanitizeStr(?string $v): ?string {
    if ($v === null || trim($v) === '') return null;
    return trim($v);
}

function sanitizeFloat(?string $v): ?float {
    if ($v === null || $v === '') return null;
    $f = (float) $v;
    return $f > 0 ? $f : null;
}
