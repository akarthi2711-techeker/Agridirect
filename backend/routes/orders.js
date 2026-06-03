const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { createNotification } = require('../utils/notifications');

// POST /api/orders - Buyer places order
router.post('/', authenticate, authorize('buyer', 'admin'), async (req, res) => {
  try {
    const { product_id, quantity, delivery_address, notes } = req.body;
    if (!product_id || !quantity) {
      return res.status(400).json({ success: false, message: 'Product ID and quantity are required.' });
    }

    const [products] = await db.execute(
      'SELECT * FROM products WHERE id = ? AND status = "active"',
      [product_id]
    );
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found or unavailable.' });
    }

    const product = products[0];
    if (parseFloat(quantity) > parseFloat(product.quantity)) {
      return res.status(400).json({ success: false, message: `Only ${product.quantity} ${product.unit} available.` });
    }

    const totalPrice = (parseFloat(quantity) * parseFloat(product.price)).toFixed(2);

    const [result] = await db.execute(
      `INSERT INTO orders (buyer_id, farmer_id, product_id, quantity, unit_price, total_price, delivery_address, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, product.farmer_id, product_id, quantity, product.price, totalPrice,
       delivery_address || null, notes || null]
    );

    // Notify farmer
    await createNotification(
      product.farmer_id,
      'New Order Received',
      `You have a new order for ${product.name} - ${quantity} ${product.unit} from a buyer.`,
      'order'
    );

    // Notify buyer
    await createNotification(
      req.user.id,
      'Order Confirmed',
      `Your order for ${product.name} (${quantity} ${product.unit}) has been placed successfully.`,
      'order'
    );

    res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      orderId: result.insertId,
      totalPrice,
    });
  } catch (err) {
    console.error('Place order error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/orders - Get orders (role-based)
router.get('/', authenticate, async (req, res) => {
  try {
    let query, params;

    if (req.user.role === 'buyer') {
      query = `
        SELECT o.*, p.name AS product_name, p.image_url, p.unit,
               u.name AS farmer_name, u.mobile AS farmer_mobile
        FROM orders o
        JOIN products p ON o.product_id = p.id
        JOIN users u ON o.farmer_id = u.id
        WHERE o.buyer_id = ? ORDER BY o.created_at DESC
      `;
      params = [req.user.id];
    } else if (req.user.role === 'farmer') {
      query = `
        SELECT o.*, p.name AS product_name, p.image_url, p.unit,
               u.name AS buyer_name, u.mobile AS buyer_mobile
        FROM orders o
        JOIN products p ON o.product_id = p.id
        JOIN users u ON o.buyer_id = u.id
        WHERE o.farmer_id = ? ORDER BY o.created_at DESC
      `;
      params = [req.user.id];
    } else {
      // Admin sees all
      query = `
        SELECT o.*, p.name AS product_name, p.unit,
               b.name AS buyer_name, f.name AS farmer_name
        FROM orders o
        JOIN products p ON o.product_id = p.id
        JOIN users b ON o.buyer_id = b.id
        JOIN users f ON o.farmer_id = f.id
        ORDER BY o.created_at DESC
      `;
      params = [];
    }

    const [orders] = await db.execute(query, params);
    res.json({ success: true, orders });
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const [rows] = await db.execute(
      'SELECT o.*, p.name AS product_name FROM orders o JOIN products p ON o.product_id = p.id WHERE o.id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Order not found.' });

    const order = rows[0];
    const isFarmer = req.user.role === 'farmer' && order.farmer_id === req.user.id;
    const isBuyer = req.user.role === 'buyer' && order.buyer_id === req.user.id && status === 'cancelled';
    const isAdmin = req.user.role === 'admin';

    if (!isFarmer && !isBuyer && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    await db.execute('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);

    // Notify buyer on status change
    const statusMessages = {
      confirmed: `Your order for ${order.product_name} has been confirmed by the farmer.`,
      shipped: `Your order for ${order.product_name} has been shipped.`,
      delivered: `Your order for ${order.product_name} has been delivered.`,
      cancelled: `Your order for ${order.product_name} has been cancelled.`,
    };

    await createNotification(order.buyer_id, `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`, statusMessages[status], 'order');

    if (status === 'delivered') {
      await createNotification(order.farmer_id, 'Order Completed', `Order for ${order.product_name} has been delivered successfully.`, 'order');
    }

    res.json({ success: true, message: `Order status updated to ${status}.` });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
