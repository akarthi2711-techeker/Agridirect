/**
 * Chat history route — reads from DynamoDB ChatHistory table
 */

const express = require('express');
const router = express.Router();
const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const { authenticate } = require('../middleware/auth');

const dynamo = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// GET /api/chat/history?limit=50
router.get('/history', authenticate, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    const result = await dynamo.send(new QueryCommand({
      TableName: 'ChatHistory',
      KeyConditionExpression: 'farmerId = :fid',
      ExpressionAttributeValues: marshall({ ':fid': String(req.user.id) }),
      ScanIndexForward: false,
      Limit: limit,
    }));

    const messages = (result.Items || []).map(unmarshall).reverse();
    res.json({ success: true, messages });
  } catch (err) {
    console.error('Chat history error:', err);
    res.status(500).json({ success: false, message: 'Error fetching chat history.' });
  }
});

module.exports = router;
