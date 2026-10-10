const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.post('/', (req, res) => {
  const { customer_name, phone, address, items } = req.body;

  if (!customer_name || !phone || !address || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'يرجى ملء جميع الحقول المطلوبة (الاسم، الهاتف، العنوان، والمنتجات)' });
  }

  const transaction = db.transaction(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    const finalItems = [];

    for (const item of items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
      if (!product) {
        throw new Error(`المنتج رقم ${item.product_id} غير موجود`);
      }
      
      const requestedQty = parseInt(item.quantity) || 1;
      if (requestedQty <= 0) {
        throw new Error(`الكمية غير صالحة للمنتج ${product.name}`);
      }

      if (product.stock < requestedQty) {
        throw new Error(`الكمية المتوفرة في المخزون (${product.stock}) غير كافية لطلب (${requestedQty}) من منتج: ${product.name}`);
      }

      // Deduct stock safely
      db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?').run(requestedQty, item.product_id);

      const price = parseFloat(product.price) || 0;
      const discount = (product.discount !== null && product.discount > 0) ? parseFloat(product.discount) : 0;
      
      subtotal += price * requestedQty;
      totalDiscount += discount * requestedQty;
      
      finalItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: requestedQty,
        price_at_purchase: price,
        discount_at_purchase: discount
      });
    }

    const total = Math.max(0, subtotal - totalDiscount);

    const result = db.prepare(`
      INSERT INTO orders (customer_name, phone, address, subtotal, discount, total) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(customer_name.trim(), phone.trim(), address.trim(), subtotal, totalDiscount, total);

    const orderId = result.lastInsertRowid;
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase, discount_at_purchase)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const item of finalItems) {
      insertItem.run(orderId, item.product_id, item.product_name, item.quantity, item.price_at_purchase, item.discount_at_purchase);
    }

    return orderId;
  });

  try {
    const orderId = transaction();
    const orderNumber = 'MES-' + String(orderId).padStart(4, '0');
    res.json({ success: true, order_id: orderId, order_number: orderNumber });
  } catch (err) {
    console.error('Order creation error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
