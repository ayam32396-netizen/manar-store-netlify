const express = require('express');
const router = express.Router();
const db = require('../database/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, Date.now() + '-' + sanitized);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed'));
  }
});

// STATS
router.get('/stats', (req, res) => {
  try {
    const total_orders = db.prepare('SELECT COUNT(*) as c FROM orders').get().c || 0;
    const new_orders = db.prepare('SELECT COUNT(*) as c FROM orders WHERE status = "new"').get().c || 0;
    const total_sales = db.prepare('SELECT SUM(total) as s FROM orders WHERE status != "cancelled"').get().s || 0;
    const total_products = db.prepare('SELECT COUNT(*) as c FROM products').get().c || 0;
    const out_of_stock = db.prepare('SELECT COUNT(*) as c FROM products WHERE stock = 0 OR stock IS NULL').get().c || 0;

    res.json({ total_orders, new_orders, total_sales, total_products, out_of_stock });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to retrieve stats' });
  }
});

// ORDERS
router.get('/orders', (req, res) => {
  try {
    const status = req.query.status;
    let ordersQuery = 'SELECT * FROM orders';
    let ordersArgs = [];
    if (status) {
      ordersQuery += ' WHERE status = ?';
      ordersArgs.push(status);
    }
    ordersQuery += ' ORDER BY id DESC';

    const orders = db.prepare(ordersQuery).all(...ordersArgs);
    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    
    const result = orders.map(o => {
      o.order_number = 'MES-' + String(o.id).padStart(4, '0');
      const items = getItems.all(o.id);
      o.items = items.map(i => {
        i.subtotal = (i.price_at_purchase - (i.discount_at_purchase || 0)) * i.quantity;
        return i;
      });
      return o;
    });

    res.json({ orders: result });
  } catch (err) {
    console.error('Orders error:', err);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

router.get('/orders/:id', (req, res) => {
  try {
    const id = req.params.id;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.order_number = 'MES-' + String(order.id).padStart(4, '0');
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
    order.items = items.map(i => {
      i.subtotal = (i.price_at_purchase - (i.discount_at_purchase || 0)) * i.quantity;
      return i;
    });

    res.json(order);
  } catch (err) {
    console.error('Order detail error:', err);
    res.status(500).json({ error: 'Failed to retrieve order details' });
  }
});

router.patch('/orders/:id/status', (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    if (!['new', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
    if (result.changes === 0) return res.status(404).json({ error: 'Order not found' });
    
    res.json({ success: true });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// PRODUCTS
router.get('/products', (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products ORDER BY id DESC').all().map(p => {
      p.final_price = (p.discount !== null && p.discount > 0) ? p.price - p.discount : p.price;
      return p;
    });
    res.json({ products });
  } catch (err) {
    console.error('Products error:', err);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

router.post('/products', upload.single('image'), (req, res) => {
  try {
    const { name, description, price, discount, category, stock } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!name || price === undefined || price === '' || !category) {
      return res.status(400).json({ error: 'يرجى ملء الحقول المطلوبة (اسم المنتج، السعر، القسم)' });
    }

    if (!image) {
      return res.status(400).json({ error: 'يرجى رفع صورة للمنتج' });
    }

    const numPrice = parseFloat(price);
    const numStock = parseInt(stock) || 0;
    const numDiscount = (discount !== undefined && discount !== '' && discount !== null && !isNaN(parseFloat(discount)) && parseFloat(discount) > 0) ? parseFloat(discount) : null;
    const desc = (description && description.trim()) ? description.trim() : null;

    const result = db.prepare(`
      INSERT INTO products (name, description, price, discount, category, image, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name.trim(), desc, numPrice, numDiscount, category, image, numStock);

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error('Add product error:', err);
    res.status(500).json({ error: err.message || 'Failed to add product' });
  }
});

router.put('/products/:id', upload.single('image'), (req, res) => {
  try {
    const id = req.params.id;
    const { name, description, price, discount, category, stock } = req.body;
    const image = req.file ? req.file.filename : null;
    
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (!name || price === undefined || price === '' || !category) {
      return res.status(400).json({ error: 'يرجى ملء الحقول المطلوبة (اسم المنتج، السعر، القسم)' });
    }

    const numPrice = parseFloat(price);
    const numStock = parseInt(stock) || 0;
    const numDiscount = (discount !== undefined && discount !== '' && discount !== null && !isNaN(parseFloat(discount)) && parseFloat(discount) > 0) ? parseFloat(discount) : null;
    const desc = (description && description.trim()) ? description.trim() : null;

    let updateQuery = 'UPDATE products SET name=?, description=?, price=?, discount=?, category=?, stock=?, updated_at=CURRENT_TIMESTAMP';
    let updateArgs = [name.trim(), desc, numPrice, numDiscount, category, numStock];

    if (image) {
      updateQuery += ', image=? WHERE id=?';
      updateArgs.push(image, id);
      if (product.image && product.image !== image) {
        try { fs.unlinkSync(path.join('./uploads', product.image)); } catch(e) {}
      }
    } else {
      updateQuery += ' WHERE id=?';
      updateArgs.push(id);
    }

    db.prepare(updateQuery).run(...updateArgs);
    res.json({ success: true });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: err.message || 'Failed to update product' });
  }
});

router.delete('/products/:id', (req, res) => {
  try {
    const id = req.params.id;
    const product = db.prepare('SELECT image FROM products WHERE id = ?').get(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    if (product.image) {
      try { fs.unlinkSync(path.join('./uploads', product.image)); } catch(e) {}
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// SETTINGS (Login credentials & Logo)
router.get('/settings', (req, res) => {
  try {
    const adminId = req.admin.id;
    const admin = db.prepare('SELECT id, username, email FROM admins WHERE id = ?').get(adminId);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    res.json({
      admin: {
        id: admin.id,
        username: admin.username || 'admin',
        email: admin.email
      },
      logo_url: '/assets/logo.jpg'
    });
  } catch (err) {
    console.error('Fetch settings error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/settings/profile', async (req, res) => {
  try {
    const adminId = req.admin.id;
    const { username, email, current_password, new_password, confirm_password } = req.body;

    const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(adminId);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    if (!current_password) {
      return res.status(400).json({ error: 'يرجى إدخال كلمة المرور الحالية لتأكيد التغييرات' });
    }

    const isMatch = await bcrypt.compare(current_password, admin.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
    }

    let updatedUsername = (username && username.trim()) ? username.trim() : (admin.username || 'admin');
    let updatedEmail = (email && email.trim()) ? email.trim().toLowerCase() : admin.email;
    let updatedHash = admin.password_hash;

    // Check if email already used by another admin
    if (updatedEmail !== admin.email) {
      const existing = db.prepare('SELECT id FROM admins WHERE LOWER(TRIM(email)) = ? AND id != ?').get(updatedEmail, adminId);
      if (existing) {
        return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
      }
    }

    // Change password if provided
    if (new_password) {
      if (new_password.length < 6) {
        return res.status(400).json({ error: 'يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل' });
      }
      if (new_password !== confirm_password) {
        return res.status(400).json({ error: 'تأكيد كلمة المرور الجديدة غير متطابق' });
      }
      updatedHash = await bcrypt.hash(new_password, 12);
    }

    db.prepare('UPDATE admins SET username = ?, email = ?, password_hash = ? WHERE id = ?')
      .run(updatedUsername, updatedEmail, updatedHash, adminId);

    const token = jwt.sign(
      { id: admin.id, email: updatedEmail, username: updatedUsername },
      process.env.JWT_SECRET || 'manar-store-secret-key-2024',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: updatedUsername,
        email: updatedEmail
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: err.message || 'Failed to update credentials' });
  }
});

router.post('/settings/logo', upload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'يرجى اختيار ملف الشعار' });
    }

    const uploadedPath = path.join('./uploads', req.file.filename);
    const targetPath = path.join('./public/assets/logo.jpg');
    
    // Copy uploaded logo to public/assets/logo.jpg
    fs.copyFileSync(uploadedPath, targetPath);

    res.json({
      success: true,
      logo_url: '/assets/logo.jpg?v=' + Date.now()
    });
  } catch (err) {
    console.error('Update logo error:', err);
    res.status(500).json({ error: 'Failed to update logo' });
  }
});

module.exports = router;
