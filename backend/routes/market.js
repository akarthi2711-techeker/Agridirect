/**
 * Market data routes — reads from DynamoDB MarketPrices + HistoricalPrices
 */

const express = require('express');
const router = express.Router();
const { DynamoDBClient, QueryCommand, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const { authenticate } = require('../middleware/auth');

const dynamo = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const nDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

// GET /api/market/prices?crop=tomato
router.get('/prices', authenticate, async (req, res) => {
  try {
    const { crop } = req.query;
    if (!crop) return res.status(400).json({ success: false, message: 'crop query param required.' });

    const result = await dynamo.send(new QueryCommand({
      TableName: 'MarketPrices',
      IndexName: 'CropNameIndex',
      KeyConditionExpression: 'cropName = :cn AND #dt >= :date',
      ExpressionAttributeNames: { '#dt': 'date' },
      ExpressionAttributeValues: marshall({ ':cn': crop.toLowerCase(), ':date': nDaysAgo(1) }),
      ScanIndexForward: false,
    }));

    const items = (result.Items || []).map(unmarshall);
    const prices = items.map(p => p.price);
    const summary = prices.length
      ? {
          average: (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2),
          min: Math.min(...prices).toFixed(2),
          max: Math.max(...prices).toFixed(2),
        }
      : null;

    res.json({ success: true, crop, markets: items, summary });
  } catch (err) {
    console.error('Market prices error:', err);
    res.status(500).json({ success: false, message: 'Error fetching market prices.' });
  }
});

// GET /api/market/trends?crop=tomato&days=30
router.get('/trends', authenticate, async (req, res) => {
  try {
    const { crop, days = 30 } = req.query;
    if (!crop) return res.status(400).json({ success: false, message: 'crop query param required.' });

    const result = await dynamo.send(new QueryCommand({
      TableName: 'HistoricalPrices',
      IndexName: 'CropNameIndex',
      KeyConditionExpression: 'cropName = :cn AND #dt >= :date',
      ExpressionAttributeNames: { '#dt': 'date' },
      ExpressionAttributeValues: marshall({ ':cn': crop.toLowerCase(), ':date': nDaysAgo(parseInt(days)) }),
      ScanIndexForward: true,
    }));

    const items = (result.Items || []).map(unmarshall);
    res.json({ success: true, crop, days: parseInt(days), history: items });
  } catch (err) {
    console.error('Market trends error:', err);
    res.status(500).json({ success: false, message: 'Error fetching price trends.' });
  }
});

// GET /api/market/nearby?crop=tomato
router.get('/nearby', authenticate, async (req, res) => {
  try {
    const { crop } = req.query;

    const scanParams = {
      TableName: 'MarketPrices',
      FilterExpression: '#dt >= :date',
      ExpressionAttributeNames: { '#dt': 'date' },
      ExpressionAttributeValues: marshall({ ':date': nDaysAgo(1) }),
    };

    if (crop) {
      scanParams.FilterExpression += ' AND cropName = :cn';
      scanParams.ExpressionAttributeValues = marshall({ ':date': nDaysAgo(1), ':cn': crop.toLowerCase() });
    }

    const result = await dynamo.send(new ScanCommand(scanParams));
    const items = (result.Items || []).map(unmarshall);
    items.sort((a, b) => b.price - a.price);

    res.json({ success: true, crop: crop || 'all', markets: items });
  } catch (err) {
    console.error('Nearby market error:', err);
    res.status(500).json({ success: false, message: 'Error fetching nearby markets.' });
  }
});

module.exports = router;
