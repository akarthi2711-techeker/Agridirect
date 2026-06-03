const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadToS3 } = require('../config/s3');

// GET /api/profile
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, name, email, role, mobile, location, profile_picture, language_preference, theme_preference, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, profile: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PUT /api/profile
router.put('/', authenticate, upload.single('profile_picture'), async (req, res) => {
  try {
    const { name, mobile, location, language_preference, theme_preference } = req.body;
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });

    const user = rows[0];
    let profilePicture = user.profile_picture;

    if (req.file) {
      profilePicture = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype);
    }

    await db.execute(
      `UPDATE users SET name=?, mobile=?, location=?, profile_picture=?, language_preference=?, theme_preference=? WHERE id=?`,
      [name || user.name, mobile || user.mobile, location || user.location,
       profilePicture, language_preference || user.language_preference,
       theme_preference || user.theme_preference, req.user.id]
    );

    // Sync settings table
    await db.execute(
      'INSERT INTO settings (user_id, language, theme) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE language=?, theme=?',
      [req.user.id, language_preference || user.language_preference,
       theme_preference || user.theme_preference,
       language_preference || user.language_preference,
       theme_preference || user.theme_preference]
    );

    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
