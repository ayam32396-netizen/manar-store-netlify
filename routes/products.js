const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', (req, res) => {
  try {
    const category = req.query.category;
    let products;
    if (category && ['hair', 'skin', 'body'].includes(category)) {
      products = db.prepare('SELECT * FROM products WHERE category = ? ORDER BY id DESC').all(category);
    } else {
      products = db.prepare('SELECT * FROM products ORDER BY id DESC').all();
    }

    products = products.map(p => {
      p.final_price = (p.discount !== null && p.discount > 0) ? Math.max(0, p.price - p.discount) : p.price;
      return p;
    });

    res.json(products);
  } catch (err) {
    console.error('Fetch public products error:', err);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const id = req.params.id;
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    product.final_price = (product.discount !== null && product.discount > 0) ? Math.max(0, product.price - product.discount) : product.price;
    res.json(product);
  } catch (err) {
    console.error('Fetch product by id error:', err);
    res.status(500).json({ error: 'Failed to retrieve product details' });
  }
});

module.exports = router;
