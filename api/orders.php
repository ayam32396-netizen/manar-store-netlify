<?php
/**
 * orders.php — Public orders API
 *
 * POST /api/orders.php  → create a new order (with stock deduction)
 */
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed', 405);
}

$body = getBody();

$customer_name = sanitizeStr($body['customer_name'] ?? null);
$phone         = sanitizeStr($body['phone']         ?? null);
$address       = sanitizeStr($body['address']       ?? null);
$items         = $body['items'] ?? [];

if (!$customer_name || !$phone || !$address || !is_array($items) || count($items) === 0) {
    jsonError('يرجى ملء جميع الحقول المطلوبة (الاسم، الهاتف، العنوان، والمنتجات)', 400);
}

$db = getDB();

try {
    $db->beginTransaction();

    $subtotal      = 0;
    $totalDiscount = 0;
    $finalItems    = [];

    foreach ($items as $item) {
        $productId = (int) ($item['product_id'] ?? 0);
        $qty       = max(1, (int) ($item['quantity'] ?? 1));

        // Fetch product with FOR UPDATE lock
        $stmt = $db->prepare('SELECT * FROM products WHERE id = ? LIMIT 1');
        $stmt->execute([$productId]);
        $product = $stmt->fetch();

        if (!$product) {
            throw new Exception("المنتج رقم {$productId} غير موجود");
        }

        if ((int) $product['stock'] < $qty) {
            throw new Exception(
                "الكمية المتوفرة في المخزون ({$product['stock']}) غير كافية لطلب ({$qty}) من منتج: {$product['name']}"
            );
        }

        // Deduct stock
        $db->prepare('UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?')
           ->execute([$qty, $productId]);

        $price    = (float) $product['price'];
        $discount = ($product['discount'] !== null && (float)$product['discount'] > 0)
                    ? (float) $product['discount'] : 0;

        $subtotal      += $price    * $qty;
        $totalDiscount += $discount * $qty;

        $finalItems[] = [
            'product_id'          => $productId,
            'product_name'        => $product['name'],
            'quantity'            => $qty,
            'price_at_purchase'   => $price,
            'discount_at_purchase'=> $discount,
        ];
    }

    $total = max(0, $subtotal - $totalDiscount);

    // Insert order
    $stmt = $db->prepare(
        'INSERT INTO orders (customer_name, phone, address, subtotal, discount, total)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$customer_name, $phone, $address, $subtotal, $totalDiscount, $total]);
    $orderId = (int) $db->lastInsertId();

    // Insert order items
    $itemStmt = $db->prepare(
        'INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase, discount_at_purchase)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    foreach ($finalItems as $fi) {
        $itemStmt->execute([
            $orderId,
            $fi['product_id'],
            $fi['product_name'],
            $fi['quantity'],
            $fi['price_at_purchase'],
            $fi['discount_at_purchase'],
        ]);
    }

    $db->commit();

    $orderNumber = 'MES-' . str_pad($orderId, 4, '0', STR_PAD_LEFT);
    jsonResponse([
        'success'      => true,
        'order_id'     => $orderId,
        'order_number' => $orderNumber,
    ]);

} catch (Exception $e) {
    $db->rollBack();
    jsonError($e->getMessage(), 400);
}
