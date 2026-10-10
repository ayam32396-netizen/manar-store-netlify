const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const auth = require('../middleware/auth');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'البريد الإلكتروني / اسم المستخدم وكلمة المرور مطلوبة' });
    }

    const cleanIdentifier = email.trim().toLowerCase();
    const admin = db.prepare('SELECT * FROM admins WHERE LOWER(TRIM(email)) = ? OR LOWER(TRIM(username)) = ?').get(cleanIdentifier, cleanIdentifier);
    if (!admin) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, username: admin.username || 'admin' },
      process.env.JWT_SECRET || 'manar-store-secret-key-2024',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      valid: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username || 'admin',
        email: admin.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم أثناء تسجيل الدخول' });
  }
});

router.get('/verify', auth, (req, res) => {
  const admin = db.prepare('SELECT id, username, email FROM admins WHERE id = ?').get(req.admin.id);
  res.json({
    success: true,
    valid: true,
    admin: admin || req.admin
  });
});

module.exports = router;
