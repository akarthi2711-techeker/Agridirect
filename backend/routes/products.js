const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadToS3, deleteFromS3 } = require('../config/s3');
const { getSuggestedPrice } = require('../utils/pricing');

// GET /api/products - Public listing with search & filter
router.get('/', async (req, res) => {
  try {
    const { search, category, sort = 'latest', page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT p.*, u.name AS farmer_name, u.location AS farmer_location, u.mobile AS farmer_mobile
      FROM products p
      JOIN users u ON p.farmer_id = u.id
      WHERE p.status = 'active'
    `;
    const params = [];

    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ? OR u.name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (category && category !== 'all') {
      query += ' AND p.category = ?';
      params.push(category);
    }

    const sortMap = {
      latest: 'p.created_at DESC',
      price_asc: 'p.price ASC',
      price_desc: 'p.price DESC',
    };
    query += ` ORDER BY ${sortMap[sort] || 'p.created_at DESC'}`;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [products] = await db.execute(query, params);

    // Count total
    let countQuery = `SELECT COUNT(*) AS total FROM products p JOIN users u ON p.farmer_id = u.id WHERE p.status = 'active'`;
    const countParams = [];
    if (search) {
      countQuery += ' AND (p.name LIKE ? OR p.description LIKE ? OR u.name LIKE ?)';
      const s = `%${search}%`;
      countParams.push(s, s, s);
    }
    if (category && category !== 'all') {
      countQuery += ' AND p.category = ?';
      countParams.push(category);
    }
    const [[{ total }]] = await db.execute(countQuery, countParams);

    res.json({ success: true, products, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/products/farmer/my - Farmer's own products (MUST be before /:id)
router.get('/farmer/my', authenticate, authorize('farmer', 'admin'), async (req, res) => {
  try {
    const [products] = await db.execute(
      'SELECT * FROM products WHERE farmer_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/products/:id - Single product
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.*, u.name AS farmer_name, u.location AS farmer_location, u.mobile AS farmer_mobile, u.email AS farmer_email
       FROM products p JOIN users u ON p.farmer_id = u.id WHERE p.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, product: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/products - Farmer adds product
router.post('/', authenticate, authorize('farmer', 'admin'), upload.single('image'), async (req, res) => {
  try {
    const { name, category, quantity, price, location, description, harvest_date, shelf_life } = req.body;
    if (!name || !category || !quantity || !price) {
      return res.status(400).json({ success: false, message: 'Name, category, quantity, and price are required.' });
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype);
    }

    const suggestedPrice = getSuggestedPrice(quantity, parseFloat(price));

    const [result] = await db.execute(
      `INSERT INTO products (farmer_id, name, category, quantity, price, suggested_price, location, description, harvest_date, shelf_life, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, name, category, quantity, price, suggestedPrice, location || null, description || null,
       harvest_date || null, shelf_life || null, imageUrl]
    );

    res.status(201).json({
      success: true,
      message: 'Product added successfully.',
      productId: result.insertId,
      suggestedPrice,
    });
  } catch (err) {
    console.error('Add product error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PUT /api/products/:id - Farmer updates product
router.put('/:id', authenticate, authorize('farmer', 'admin'), upload.single('image'), async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found.' });

    const product = rows[0];
    if (product.farmer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this product.' });
    }

    const { name, category, quantity, price, location, description, harvest_date, shelf_life, status } = req.body;
    let imageUrl = product.image_url;

    if (req.file) {
      if (product.image_url) await deleteFromS3(product.image_url);
      imageUrl = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype);
    }

    const suggestedPrice = getSuggestedPrice(quantity || product.quantity, parseFloat(price || product.price));

    await db.execute(
      `UPDATE products SET name=?, category=?, quantity=?, price=?, suggested_price=?, location=?,
       description=?, harvest_date=?, shelf_life=?, image_url=?, status=? WHERE id=?`,
      [name || product.name, category || product.category, quantity || product.quantity,
       price || product.price, suggestedPrice, location || product.location,
       description || product.description, harvest_date || product.harvest_date,
       shelf_life || product.shelf_life, imageUrl, status || product.status, req.params.id]
    );

    res.json({ success: true, message: 'Product updated successfully.' });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', authenticate, authorize('farmer', 'admin'), async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found.' });

    const product = rows[0];
    if (product.farmer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this product.' });
    }

    if (product.image_url) await deleteFromS3(product.image_url);
    await db.execute('DELETE FROM products WHERE id = ?', [req.params.id]);

    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
