/**
 * Crop recommendation route — delegates AI reasoning to Lambda
 */

const express = require('express');
const router = express.Router();
const https = require('https');
const { authenticate } = require('../middleware/auth');

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
      res.on('data', c => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { reject(new Error('Invalid JSON')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

// POST /api/crop/recommend
router.post('/recommend', authenticate, async (req, res) => {
  try {
    const { soilType, season, location } = req.body;
    if (!soilType) return res.status(400).json({ success: false, message: 'soilType is required.' });

    const message = `Recommend crops for ${soilType} soil in ${season || 'current season'} at ${location || 'Tamil Nadu'}`;
    const result = await callLambda({
      message,
      farmerId: String(req.user.id),
      intent: 'recommend',
    });

    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Crop recommend error:', err.message);
    res.status(500).json({ success: false, message: 'Recommendation service unavailable.' });
  }
});

module.exports = router;
