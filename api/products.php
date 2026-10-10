<?php
/**
 * products.php — Public products API
 *
 * GET /api/products.php             → all products
 * GET /api/products.php?category=X  → filter by category (hair|skin|body)
 * GET /api/products.php?id=X        → single product
 */
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Method not allowed', 405);
}

$db = getDB();

// ─── Single product ───────────────────────────────────────────
if (!empty($_GET['id'])) {
    $id = (int) $_GET['id'];
    $stmt = $db->prepare('SELECT * FROM products WHERE id = ?');
    $stmt->execute([$id]);
    $product = $stmt->fetch();

    if (!$product) {
        jsonError('Product not found', 404);
    }

    $product = addFinalPrice($product);
    jsonResponse($product);
}

// ─── All / filtered products ──────────────────────────────────
$allowed = ['hair', 'skin', 'body'];
$category = $_GET['category'] ?? '';

if ($category && in_array($category, $allowed)) {
    $stmt = $db->prepare('SELECT * FROM products WHERE category = ? ORDER BY id DESC');
    $stmt->execute([$category]);
} else {
    $stmt = $db->query('SELECT * FROM products ORDER BY id DESC');
}

$products = $stmt->fetchAll();
$products = array_map('addFinalPrice', $products);

jsonResponse($products);

// ─── Helper ───────────────────────────────────────────────────
function addFinalPrice(array $p): array {
    $discount = (float) ($p['discount'] ?? 0);
    $price    = (float) ($p['price']    ?? 0);
    $p['final_price'] = ($discount > 0) ? max(0, $price - $discount) : $price;
    // Cast numeric fields for JS compatibility
    $p['id']       = (int)   $p['id'];
    $p['price']    = (float) $p['price'];
    $p['discount'] = $discount > 0 ? $discount : null;
    $p['stock']    = (int)   $p['stock'];
    return $p;
}
