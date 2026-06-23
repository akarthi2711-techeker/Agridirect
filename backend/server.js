const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed origins — S3 frontend URL + local dev
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/admin', require('./routes/admin'));

// AI Market Advisor
app.use('/api/ai', require('./routes/ai'));
app.use('/api/market', require('./routes/market'));
app.use('/api/crop', require('./routes/crop'));
app.use('/api/chat', require('./routes/chatHistory'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AgriDirect Lite API',
    timestamp: new Date().toISOString(),
    allowedOrigins,
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, message: err.message || 'Internal server error.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌾 AgriDirect Lite API running on port ${PORT}`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
});
