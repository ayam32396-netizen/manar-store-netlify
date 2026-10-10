<?php
/**
 * admin.php — Protected Admin API (requires JWT)
 *
 * All routes require: Authorization: Bearer <token>
 *
 * GET    ?action=stats
 * GET    ?action=orders[&status=]
 * PATCH  ?action=order_status&id=X     body: {status}
 * GET    ?action=products
 * POST   ?action=add_product            multipart/form-data
 * PUT    ?action=update_product&id=X    multipart/form-data
 * DELETE ?action=delete_product&id=X
 * GET    ?action=settings
 * PUT    ?action=update_profile         body: {username,email,current_password,...}
 * POST   ?action=update_logo            multipart/form-data (logo file)
 */
require_once __DIR__ . '/bootstrap.php';

// All admin routes are protected
$admin = requireAuth();

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// ════════════════════════════════════════════════════════════
// STATS
// ════════════════════════════════════════════════════════════
if ($action === 'stats' && $method === 'GET') {
    $total_orders  = (int) $db->query('SELECT COUNT(*) FROM orders')->fetchColumn();
    $new_orders    = (int) $db->query('SELECT COUNT(*) FROM orders WHERE status = "new"')->fetchColumn();
    $total_sales   = (float)($db->query('SELECT COALESCE(SUM(total),0) FROM orders WHERE status != "cancelled"')->fetchColumn());
    $total_products= (int) $db->query('SELECT COUNT(*) FROM products')->fetchColumn();
    $out_of_stock  = (int) $db->query('SELECT COUNT(*) FROM products WHERE stock = 0 OR stock IS NULL')->fetchColumn();

    jsonResponse(compact('total_orders','new_orders','total_sales','total_products','out_of_stock'));
}

// ════════════════════════════════════════════════════════════
// ORDERS — list
// ════════════════════════════════════════════════════════════
if ($action === 'orders' && $method === 'GET') {
    $status = $_GET['status'] ?? '';
    if ($status) {
        $stmt = $db->prepare('SELECT * FROM orders WHERE status = ? ORDER BY id DESC');
        $stmt->execute([$status]);
    } else {
        $stmt = $db->query('SELECT * FROM orders ORDER BY id DESC');
    }
    $orders = $stmt->fetchAll();

    $itemStmt = $db->prepare('SELECT * FROM order_items WHERE order_id = ?');

    $result = array_map(function($o) use ($itemStmt) {
        $o['id']           = (int) $o['id'];
        $o['order_number'] = 'MES-' . str_pad($o['id'], 4, '0', STR_PAD_LEFT);
        $o['subtotal']     = (float) $o['subtotal'];
        $o['discount']     = (float) $o['discount'];
        $o['total']        = (float) $o['total'];

        $itemStmt->execute([$o['id']]);
        $items = $itemStmt->fetchAll();
        $o['items'] = array_map(function($i) {
            $i['id']                   = (int)   $i['id'];
            $i['order_id']             = (int)   $i['order_id'];
            $i['quantity']             = (int)   $i['quantity'];
            $i['price_at_purchase']    = (float) $i['price_at_purchase'];
            $i['discount_at_purchase'] = (float) ($i['discount_at_purchase'] ?? 0);
            $i['subtotal']             = ($i['price_at_purchase'] - $i['discount_at_purchase']) * $i['quantity'];
            return $i;
        }, $items);

        return $o;
    }, $orders);

    jsonResponse(['orders' => $result]);
}

// ════════════════════════════════════════════════════════════
// ORDERS — update status
// ════════════════════════════════════════════════════════════
if ($action === 'order_status' && $method === 'PATCH') {
    $id   = (int) ($_GET['id'] ?? 0);
    $body = getBody();
    $status = $body['status'] ?? '';

    $allowed = ['new','confirmed','preparing','shipped','delivered','cancelled'];
    if (!in_array($status, $allowed)) {
        jsonError('Invalid status', 400);
    }

    $stmt = $db->prepare('UPDATE orders SET status = ? WHERE id = ?');
    $stmt->execute([$status, $id]);

    if ($stmt->rowCount() === 0) {
        jsonError('Order not found', 404);
    }

    jsonResponse(['success' => true]);
}

// ════════════════════════════════════════════════════════════
// PRODUCTS — list (admin)
// ════════════════════════════════════════════════════════════
if ($action === 'products' && $method === 'GET') {
    $stmt    = $db->query('SELECT * FROM products ORDER BY id DESC');
    $products = array_map('adminFormatProduct', $stmt->fetchAll());
    jsonResponse(['products' => $products]);
}

// ════════════════════════════════════════════════════════════
// PRODUCTS — add
// ════════════════════════════════════════════════════════════
if ($action === 'add_product' && $method === 'POST') {
    $name        = sanitizeStr($_POST['name']        ?? null);
    $description = sanitizeStr($_POST['description'] ?? null);
    $price       = (float)  ($_POST['price']   ?? 0);
    $stock       = (int)    ($_POST['stock']   ?? 0);
    $category    = $_POST['category'] ?? '';
    $discountVal = $_POST['discount'] ?? '';
    $discount    = ($discountVal !== '' && (float)$discountVal > 0) ? (float)$discountVal : null;

    if (!$name || $price <= 0 || !in_array($category, ['hair','skin','body'])) {
        jsonError('يرجى ملء الحقول المطلوبة (اسم المنتج، السعر، القسم)', 400);
    }

    $imageName = handleImageUpload(true);

    $stmt = $db->prepare(
        'INSERT INTO products (name, description, price, discount, category, image, stock)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$name, $description, $price, $discount, $category, $imageName, $stock]);
    $id = (int) $db->lastInsertId();

    jsonResponse(['success' => true, 'id' => $id]);
}

// ════════════════════════════════════════════════════════════
// PRODUCTS — update
// ════════════════════════════════════════════════════════════
if ($action === 'update_product' && $method === 'PUT') {
    $id = (int) ($_GET['id'] ?? 0);

    // PHP doesn't parse multipart for PUT automatically — handle raw input
    // The JS sends FormData via PUT, we need to parse it manually
    // We use a workaround: check _METHOD override or parse multipart manually
    // Since InfinityFree supports standard PHP, we'll read $_POST (populated for multipart PUT by some servers)
    // If not populated, we parse the raw input
    if (empty($_POST)) {
        parseMultipartPut();
    }

    $name        = sanitizeStr($_POST['name']        ?? null);
    $description = sanitizeStr($_POST['description'] ?? null);
    $price       = (float) ($_POST['price']   ?? 0);
    $stock       = (int)   ($_POST['stock']   ?? 0);
    $category    = $_POST['category'] ?? '';
    $discountVal = $_POST['discount'] ?? '';
    $discount    = ($discountVal !== '' && (float)$discountVal > 0) ? (float)$discountVal : null;

    if (!$name || $price <= 0 || !in_array($category, ['hair','skin','body'])) {
        jsonError('يرجى ملء الحقول المطلوبة (اسم المنتج، السعر، القسم)', 400);
    }

    // Check product exists
    $check = $db->prepare('SELECT image FROM products WHERE id = ? LIMIT 1');
    $check->execute([$id]);
    $existing = $check->fetch();
    if (!$existing) jsonError('Product not found', 404);

    // Handle image (optional on edit)
    $imageName = handleImageUpload(false);
    if (!$imageName) {
        $imageName = $existing['image']; // keep existing
    } else {
        // delete old image file if it changed
        if ($existing['image'] && $existing['image'] !== $imageName) {
            $oldPath = UPLOADS_DIR . $existing['image'];
            if (file_exists($oldPath)) @unlink($oldPath);
        }
    }

    $stmt = $db->prepare(
        'UPDATE products
         SET name=?, description=?, price=?, discount=?, category=?, stock=?, image=?, updated_at=NOW()
         WHERE id=?'
    );
    $stmt->execute([$name, $description, $price, $discount, $category, $stock, $imageName, $id]);

    jsonResponse(['success' => true]);
}

// ════════════════════════════════════════════════════════════
// PRODUCTS — delete
// ════════════════════════════════════════════════════════════
if ($action === 'delete_product' && $method === 'DELETE') {
    $id = (int) ($_GET['id'] ?? 0);

    $stmt = $db->prepare('SELECT image FROM products WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $product = $stmt->fetch();

    if (!$product) jsonError('Product not found', 404);

    $db->prepare('DELETE FROM products WHERE id = ?')->execute([$id]);

    // Delete image file
    if ($product['image']) {
        $imgPath = UPLOADS_DIR . $product['image'];
        if (file_exists($imgPath)) @unlink($imgPath);
    }

    jsonResponse(['success' => true]);
}

// ════════════════════════════════════════════════════════════
// SETTINGS — get
// ════════════════════════════════════════════════════════════
if ($action === 'settings' && $method === 'GET') {
    $stmt = $db->prepare('SELECT id, username, email FROM admins WHERE id = ? LIMIT 1');
    $stmt->execute([$admin['id']]);
    $row = $stmt->fetch();

    if (!$row) jsonError('Admin not found', 404);

    jsonResponse([
        'admin' => [
            'id'       => (int) $row['id'],
            'username' => $row['username'] ?? 'admin',
            'email'    => $row['email'],
        ],
        'logo_url' => '/assets/logo.jpg',
    ]);
}

// ════════════════════════════════════════════════════════════
// SETTINGS — update profile
// ════════════════════════════════════════════════════════════
if ($action === 'update_profile' && $method === 'PUT') {
    $body = getBody();

    $username         = sanitizeStr($body['username']         ?? null) ?? 'admin';
    $email            = strtolower(trim($body['email']        ?? ''));
    $current_password = $body['current_password'] ?? '';
    $new_password     = $body['new_password']     ?? '';
    $confirm_password = $body['confirm_password'] ?? '';

    if (!$current_password) {
        jsonError('يرجى إدخال كلمة المرور الحالية لتأكيد التغييرات', 400);
    }

    $stmt = $db->prepare('SELECT * FROM admins WHERE id = ? LIMIT 1');
    $stmt->execute([$admin['id']]);
    $row = $stmt->fetch();
    if (!$row) jsonError('Admin not found', 404);

    if (!verifyPassword($current_password, $row['password_hash'])) {
        jsonError('كلمة المرور الحالية غير صحيحة', 400);
    }

    // Check email uniqueness
    if ($email && $email !== $row['email']) {
        $dup = $db->prepare('SELECT id FROM admins WHERE LOWER(TRIM(email)) = ? AND id != ? LIMIT 1');
        $dup->execute([$email, $admin['id']]);
        if ($dup->fetch()) jsonError('البريد الإلكتروني مستخدم بالفعل', 400);
    }

    $finalEmail = $email ?: $row['email'];
    $finalHash  = $row['password_hash'];

    if ($new_password) {
        if (strlen($new_password) < 6) {
            jsonError('يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل', 400);
        }
        if ($new_password !== $confirm_password) {
            jsonError('تأكيد كلمة المرور الجديدة غير متطابق', 400);
        }
        $finalHash = hashPassword($new_password);
    }

    $db->prepare('UPDATE admins SET username=?, email=?, password_hash=? WHERE id=?')
       ->execute([$username, $finalEmail, $finalHash, $admin['id']]);

    $token = jwtEncode([
        'id'       => (int) $row['id'],
        'email'    => $finalEmail,
        'username' => $username,
    ]);

    jsonResponse([
        'success' => true,
        'token'   => $token,
        'admin'   => [
            'id'       => (int) $row['id'],
            'username' => $username,
            'email'    => $finalEmail,
        ],
    ]);
}

// ════════════════════════════════════════════════════════════
// SETTINGS — update logo
// ════════════════════════════════════════════════════════════
if ($action === 'update_logo' && $method === 'POST') {
    if (empty($_FILES['logo'])) {
        jsonError('يرجى اختيار ملف الشعار', 400);
    }

    $file = $_FILES['logo'];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        jsonError('خطأ في رفع الملف', 400);
    }

    $mime = mime_content_type($file['tmp_name']);
    if (!str_starts_with($mime, 'image/')) {
        jsonError('يجب أن يكون الملف صورة', 400);
    }

    $targetPath = ASSETS_DIR . 'logo.jpg';
    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        jsonError('فشل في حفظ الصورة', 500);
    }

    jsonResponse([
        'success'  => true,
        'logo_url' => '/assets/logo.jpg?v=' . time(),
    ]);
}

// ════════════════════════════════════════════════════════════
// Fallback
// ════════════════════════════════════════════════════════════
jsonError('Invalid action or method', 400);

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function adminFormatProduct(array $p): array {
    $p['id']       = (int)   $p['id'];
    $p['price']    = (float) $p['price'];
    $p['stock']    = (int)   $p['stock'];
    $discount      = (float) ($p['discount'] ?? 0);
    $p['discount'] = $discount > 0 ? $discount : null;
    $p['final_price'] = ($discount > 0) ? max(0, (float)$p['price'] - $discount) : (float)$p['price'];
    return $p;
}

function handleImageUpload(bool $required): ?string {
    if (empty($_FILES['image'])) {
        if ($required) jsonError('يرجى رفع صورة للمنتج', 400);
        return null;
    }

    $file = $_FILES['image'];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        jsonError('خطأ في رفع الملف', 400);
    }

    $mime = mime_content_type($file['tmp_name']);
    if (!str_starts_with($mime, 'image/')) {
        jsonError('Only images are allowed', 400);
    }

    // Max 10MB
    if ($file['size'] > 10 * 1024 * 1024) {
        jsonError('حجم الصورة يتجاوز الحد المسموح (10MB)', 400);
    }

    if (!is_dir(UPLOADS_DIR)) {
        mkdir(UPLOADS_DIR, 0755, true);
    }

    $ext      = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION)) ?: 'jpg';
    $safeName = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $file['name']);
    $dest     = UPLOADS_DIR . $safeName;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        jsonError('فشل في حفظ الصورة', 500);
    }

    return $safeName;
}

/**
 * PHP doesn't parse multipart/form-data for PUT requests natively.
 * This function manually parses the raw body and populates $_POST and $_FILES.
 */
function parseMultipartPut(): void {
    $rawInput   = file_get_contents('php://input');
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (!preg_match('/boundary=(.+)/', $contentType, $matches)) {
        return;
    }

    $boundary = '--' . $matches[1];
    $parts    = explode($boundary, $rawInput);
    array_shift($parts); // Remove preamble
    array_pop($parts);   // Remove epilogue

    foreach ($parts as $part) {
        if (strpos($part, 'Content-Disposition') === false) continue;

        [$headers, $body] = explode("\r\n\r\n", ltrim($part), 2);
        $body = rtrim($body, "\r\n");

        preg_match('/name="([^"]+)"/', $headers, $nameMatch);
        $name = $nameMatch[1] ?? '';

        if (preg_match('/filename="([^"]*)"/', $headers, $fileMatch)) {
            // File field
            $filename = $fileMatch[1];
            $tmpFile  = tempnam(sys_get_temp_dir(), 'php');
            file_put_contents($tmpFile, $body);

            $_FILES[$name] = [
                'name'     => $filename,
                'tmp_name' => $tmpFile,
                'size'     => strlen($body),
                'error'    => UPLOAD_ERR_OK,
                'type'     => mime_content_type($tmpFile),
            ];
        } else {
            // Regular field
            $_POST[$name] = $body;
        }
    }
}
