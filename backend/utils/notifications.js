const db = require('../config/db');

const createNotification = async (userId, title, message, type = 'system') => {
  try {
    await db.execute(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [userId, title, message, type]
    );
  } catch (err) {
    console.error('Notification creation error:', err.message);
  }
};

module.exports = { createNotification };
