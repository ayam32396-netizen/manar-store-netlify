<?php
/**
 * seed.php — Database Seeder for Manar Elhady Store
 *
 * يزرع بيانات الأدمن والمنتجات الأولية في قاعدة البيانات.
 *
 * الاستخدام: افتح الرابط في المتصفح مع الـSecret:
 *   https://manar-store.wuaze.com/seed.php?secret=manar-seed-2024
 */
require_once __DIR__ . '/api/bootstrap.php';

// Override content-type for HTML output during seeding
header('Content-Type: text/html; charset=UTF-8');

// ─── Secret Check ─────────────────────────────────────────────
$secret = $_GET['secret'] ?? '';
if ($secret !== SEED_SECRET) {
    http_response_code(403);
    echo '<h2>❌ Forbidden — Wrong or missing secret.</h2>';
    echo '<p>Use: <code>?secret=' . htmlspecialchars(SEED_SECRET) . '</code></p>';
    exit;
}

// ─── HTML output helpers ──────────────────────────────────────
function log_ok(string $msg): void {
    echo '<p style="color:#16A34A">✅ ' . htmlspecialchars($msg) . '</p>';
    flush();
    ob_flush();
}
function log_info(string $msg): void {
    echo '<p style="color:#2563EB">ℹ️  ' . htmlspecialchars($msg) . '</p>';
    flush();
    ob_flush();
}
function log_err(string $msg): void {
    echo '<p style="color:#DC2626">❌ ' . htmlspecialchars($msg) . '</p>';
    flush();
    ob_flush();
}

?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>Manar Store — Database Seeder</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; padding: 20px; }
  h1   { color: #2d5016; }
  hr   { border-color: #ddd; }
</style>
</head>
<body>
<h1>🌿 Seeding database for Manar Elhady Store…</h1>
<hr>
<?php

$db = getDB();

// ════════════════════════════════════════════════════════════
// 1. Create Tables if not exist
// ════════════════════════════════════════════════════════════
log_info('Checking / creating tables…');

try {
    $db->exec("
        CREATE TABLE IF NOT EXISTS admins (
            id            INT AUTO_INCREMENT PRIMARY KEY,
            username      VARCHAR(100) DEFAULT 'admin',
            email         VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    $db->exec("
        CREATE TABLE IF NOT EXISTS products (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            name        VARCHAR(255) NOT NULL,
            description TEXT,
            price       DECIMAL(10,2) NOT NULL,
            discount    DECIMAL(10,2) DEFAULT NULL,
            category    ENUM('hair','skin','body') NOT NULL,
            image       VARCHAR(255) NOT NULL,
            stock       INT NOT NULL DEFAULT 0,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    $db->exec("
        CREATE TABLE IF NOT EXISTS orders (
            id            INT AUTO_INCREMENT PRIMARY KEY,
            customer_name VARCHAR(255) NOT NULL,
            phone         VARCHAR(50)  NOT NULL,
            address       TEXT         NOT NULL,
            subtotal      DECIMAL(10,2) NOT NULL,
            discount      DECIMAL(10,2) DEFAULT 0,
            total         DECIMAL(10,2) NOT NULL,
            status        ENUM('new','confirmed','preparing','shipped','delivered','cancelled') DEFAULT 'new',
            created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    $db->exec("
        CREATE TABLE IF NOT EXISTS order_items (
            id                   INT AUTO_INCREMENT PRIMARY KEY,
            order_id             INT NOT NULL,
            product_id           INT,
            product_name         VARCHAR(255) NOT NULL,
            quantity             INT NOT NULL,
            price_at_purchase    DECIMAL(10,2) NOT NULL,
            discount_at_purchase DECIMAL(10,2) DEFAULT 0,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    $db->exec("
        CREATE TABLE IF NOT EXISTS settings (
            `key`   VARCHAR(100) PRIMARY KEY,
            `value` TEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // Add username column if missing (migration safety)
    try {
        $db->exec("ALTER TABLE admins ADD COLUMN username VARCHAR(100) DEFAULT 'admin'");
    } catch (PDOException $e) {
        // Column already exists — ignore
    }

    log_ok('All tables OK.');
} catch (PDOException $e) {
    log_err('Table creation error: ' . $e->getMessage());
    exit;
}

// ════════════════════════════════════════════════════════════
// 2. Seed Admin
// ════════════════════════════════════════════════════════════
log_info('Checking admin user…');

$adminEmail    = ADMIN_EMAIL;
$adminPassword = ADMIN_PASSWORD;

$check = $db->prepare('SELECT id FROM admins WHERE email = ? LIMIT 1');
$check->execute([$adminEmail]);

if (!$check->fetch()) {
    $hash = hashPassword($adminPassword);
    $db->prepare("INSERT INTO admins (username, email, password_hash) VALUES ('admin', ?, ?)")
       ->execute([$adminEmail, $hash]);
    log_ok("Admin created: {$adminEmail} / Password: {$adminPassword}");
} else {
    log_info("Admin already exists ({$adminEmail}). Skipping.");
}

// ════════════════════════════════════════════════════════════
// 3. Seed Products
// ════════════════════════════════════════════════════════════
log_info('Checking products…');

$count = (int) $db->query('SELECT COUNT(*) FROM products')->fetchColumn();

if ($count === 0) {
    $products = [
        // 💆 HAIR
        ['زيت بنت المغرب',       'يعمل على كثافة الشعر',                     250, null, 'hair', 'zit_bint_almaghrib.jpg',   20],
        ['زيت بنت مطيل',         'يعمل على إطالة الشعر',                      300, null, 'hair', 'zit_bint_mutil.jpg',       20],
        ['زيت الحشيش',           'يعمل على إطالة الشعر',                      250, null, 'hair', 'zit_alhashish.jpg',        20],
        // 🌿 SKIN
        ['صابونة النيلة الزرقاء', 'لتفتيح البشرة، مناسبة لجميع أنواع البشرة', 125, null, 'skin', 'sabonet_alnila.jpg',       20],
        ['مجموعة لبان الذكر',    'للبشرة الدهنية',                             440, null, 'skin', 'majmouat_loban.jpg',       15],
        ['صابونة الشاي الأخضر',  null,                                          100, null, 'skin', 'sabonet_shay.jpg',         25],
        ['غسول العكر الفاسي',    'غني عن التعريف',                             150, null, 'skin', 'ghassoul_oker.jpg',        20],
        // 🛁 BODY
        ['ليفة مغربية',          'ليفة كسال الخلود درجة أولى لإزالة الجلد الميت', 110, null, 'body', 'leefa_maghribiya.jpg',   30],
        ['صابون مغربي',          'بزيت الزيتون درجة أولى',                    100, null, 'body', 'saboon_maghribi.jpg',      25],
        ['الدلكة السودانية',     null,                                          150, null, 'body', 'dilka_sudaniya.jpg',       20],
        ['طمي الشرفاء الأصيل',   null,                                          125, null, 'body', 'tami_ashrafa.jpg',         20],
        ['التبريمة المغربية',    '21 عشبة طبيعية',                             125, null, 'body', 'tabriima_maghribiya.jpg',  20],
        ['النيلة الزرقاء',       null,                                          150, null, 'body', 'nila_zarqa.jpg',           25],
    ];

    $stmt = $db->prepare(
        'INSERT INTO products (name, description, price, discount, category, image, stock)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    foreach ($products as $p) {
        $stmt->execute($p);
    }

    log_ok('Seeded ' . count($products) . ' products successfully.');
} else {
    log_info("Products already exist ({$count} found). Skipping.");
}

echo '<hr>';
echo '<h2 style="color:#16A34A">🎉 Seeding complete!</h2>';
echo '<p>يمكنك الآن:</p>';
echo '<ul>';
echo '<li><a href="/">فتح المتجر</a></li>';
echo '<li><a href="/admin.html">الدخول للوحة التحكم</a> بـ: <code>' . htmlspecialchars(ADMIN_EMAIL) . '</code> / <code>' . htmlspecialchars(ADMIN_PASSWORD) . '</code></li>';
echo '</ul>';
echo '<p style="color:#DC2626;font-weight:bold;">⚠️ احذف أو أعد تسمية هذا الملف بعد تشغيله لحماية موقعك!</p>';
?>
</body>
</html>
