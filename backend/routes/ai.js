/**
 * AI Market Advisor routes
 * All Bedrock calls flow through Lambda via API Gateway — never direct from frontend.
 */

const express = require('express');
const router = express.Router();
const https = require('https');
const { authenticate } = require('../middleware/auth');

// Simple in-memory rate limiter: 20 requests per farmer per hour
const rateLimitMap = new Map();
function checkRateLimit(userId) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxRequests = 20;
  const entry = rateLimitMap.get(userId) || { count: 0, resetAt: now + windowMs };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  rateLimitMap.set(userId, entry);
  return true;
}

// Forward request to Lambda via API Gateway
function callLambda(payload) {
  return new Promise((resolve, reject) => {
    const lambdaUrl = new URL(process.env.AI_LAMBDA_URL);
    const body = JSON.stringify(payload);

    const options = {
      hostname: lambdaUrl.hostname,
      path: lambdaUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'x-api-key': process.env.AI_API_GATEWAY_KEY || '',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          reject(new Error('Invalid JSON from Lambda'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Lambda timeout')); });
    req.write(body);
    req.end();
  });
}

// POST /api/ai/chat
router.post('/chat', authenticate, async (req, res) => {
  try {
    if (!checkRateLimit(req.user.id)) {
      return res.status(429).json({ success: false, message: 'Rate limit exceeded. Max 20 AI requests per hour.' });
    }

    const { message, intent } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }
    if (message.length > 500) {
      return res.status(400).json({ success: false, message: 'Message too long. Max 500 characters.' });
    }

    if (!process.env.AI_LAMBDA_URL) {
      return res.status(503).json({ success: false, message: 'AI service not configured.' });
    }

    const result = await callLambda({
      message: message.trim(),
      farmerId: String(req.user.id),
      intent: intent || null,
    });

    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error('AI chat error:', err.message);
    return res.status(500).json({ success: false, message: 'AI service unavailable. Please try again.' });
  }
});

module.exports = router;
