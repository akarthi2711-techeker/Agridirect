/**
 * AgriDirect AI Market Advisor — Lambda Handler
 * Invoked via API Gateway POST /ai/chat
 * Flow: API Gateway → Lambda → DynamoDB (market data) → Bedrock (Claude 3 Sonnet) → response
 */

const { DynamoDBClient, QueryCommand, ScanCommand, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const REGION = process.env.AWS_REGION || 'ap-south-1';
const dynamo = new DynamoDBClient({ region: REGION });
const bedrock = new BedrockRuntimeClient({ region: REGION });

const SYSTEM_PROMPT = `You are AgriDirect AI Market Advisor.
Your responsibility is to help farmers understand agricultural market information.
Rules:
1. Never invent prices.
2. Never fabricate market data.
3. Never predict future prices.
4. Never provide guaranteed profits.
5. Explain only available data provided to you.
6. Use simple farmer-friendly language.
7. Keep responses under 150 words.
8. Provide practical recommendations.
9. Focus on helping farmers make informed decisions.
10. When market data is provided, structure your response clearly with the data first, then your explanation.`;

// ─── helpers ──────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().split('T')[0];

const nDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

// ─── DynamoDB fetchers ─────────────────────────────────────────────────────────

async function getMarketPrices(cropName) {
  const result = await dynamo.send(new QueryCommand({
    TableName: 'MarketPrices',
    IndexName: 'CropNameIndex',
    KeyConditionExpression: 'cropName = :cn AND #dt >= :date',
    ExpressionAttributeNames: { '#dt': 'date' },
    ExpressionAttributeValues: marshall({
      ':cn': cropName.toLowerCase(),
      ':date': nDaysAgo(1),
    }),
    ScanIndexForward: false,
    Limit: 20,
  }));
  return (result.Items || []).map(unmarshall);
}

async function getHistoricalPrices(cropName, days = 30) {
  const result = await dynamo.send(new QueryCommand({
    TableName: 'HistoricalPrices',
    IndexName: 'CropNameIndex',
    KeyConditionExpression: 'cropName = :cn AND #dt >= :date',
    ExpressionAttributeNames: { '#dt': 'date' },
    ExpressionAttributeValues: marshall({
      ':cn': cropName.toLowerCase(),
      ':date': nDaysAgo(days),
    }),
    ScanIndexForward: false,
  }));
  return (result.Items || []).map(unmarshall);
}

async function getFarmerProfile(farmerId) {
  const result = await dynamo.send(new QueryCommand({
    TableName: 'FarmerProfile',
    KeyConditionExpression: 'farmerId = :fid',
    ExpressionAttributeValues: marshall({ ':fid': farmerId }),
    Limit: 1,
  }));
  const items = (result.Items || []).map(unmarshall);
  return items[0] || null;
}

async function saveChatHistory(farmerId, role, message) {
  await dynamo.send(new PutItemCommand({
    TableName: 'ChatHistory',
    Item: marshall({
      farmerId,
      timestamp: new Date().toISOString(),
      role,
      message,
    }),
  }));
}

// ─── Bedrock invocation ───────────────────────────────────────────────────────

async function callBedrock(userMessage, contextData) {
  const userContent = contextData
    ? `Context data:\n${JSON.stringify(contextData, null, 2)}\n\nFarmer question: ${userMessage}`
    : userMessage;

  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  };

  const cmd = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload),
  });

  const resp = await bedrock.send(cmd);
  const body = JSON.parse(Buffer.from(resp.body).toString('utf-8'));
  return body.content?.[0]?.text || 'Sorry, I could not generate a response.';
}

// ─── Intent detection ─────────────────────────────────────────────────────────

function detectCropName(message) {
  const crops = [
    'tomato', 'onion', 'potato', 'rice', 'wheat', 'cotton', 'groundnut',
    'chilli', 'brinjal', 'cabbage', 'cauliflower', 'carrot', 'millet',
    'sugarcane', 'banana', 'mango', 'coconut', 'turmeric', 'ginger',
    'garlic', 'soybean', 'maize', 'corn',
  ];
  const lower = message.toLowerCase();
  return crops.find(c => lower.includes(c)) || null;
}

// ─── Intent handlers ──────────────────────────────────────────────────────────

async function handleMarketPrice(message, farmerId) {
  const crop = detectCropName(message);
  if (!crop) {
    return { text: 'Please mention a specific crop name to get market prices. For example: "What is the tomato price today?"', data: null };
  }

  const prices = await getMarketPrices(crop);
  if (prices.length === 0) {
    return { text: `No market price data found for ${crop} today. Please check again later.`, data: null };
  }

  const priceValues = prices.map(p => p.price);
  const avg = (priceValues.reduce((a, b) => a + b, 0) / priceValues.length).toFixed(2);
  const min = Math.min(...priceValues).toFixed(2);
  const max = Math.max(...priceValues).toFixed(2);

  const contextData = {
    crop,
    date: today(),
    markets: prices.map(p => ({ market: p.market, district: p.district, price: p.price })),
    summary: { averagePrice: avg, minPrice: min, maxPrice: max },
  };

  const aiText = await callBedrock(message, contextData);
  return { text: aiText, data: contextData };
}

async function handlePriceTrend(message, farmerId) {
  const crop = detectCropName(message);
  if (!crop) {
    return { text: 'Please mention a specific crop to see price trends. For example: "Show tomato price trend"', data: null };
  }

  const [hist7, hist30] = await Promise.all([
    getHistoricalPrices(crop, 7),
    getHistoricalPrices(crop, 30),
  ]);

  if (hist30.length === 0) {
    return { text: `No historical data found for ${crop}. Historical data becomes available after a few days of market activity.`, data: null };
  }

  const avg7 = hist7.length
    ? (hist7.reduce((a, b) => a + b.price, 0) / hist7.length).toFixed(2)
    : null;
  const avg30 = hist30.length
    ? (hist30.reduce((a, b) => a + b.price, 0) / hist30.length).toFixed(2)
    : null;
  const latest = hist30[0]?.price;
  const change30 = avg30 && latest ? (((latest - avg30) / avg30) * 100).toFixed(1) : null;

  const contextData = {
    crop,
    currentPrice: latest,
    sevenDayAverage: avg7,
    thirtyDayAverage: avg30,
    percentageChangeVs30DayAvg: change30,
    trend: change30 > 0 ? 'rising' : change30 < 0 ? 'falling' : 'stable',
    recentPrices: hist7.slice(0, 7).map(p => ({ date: p.date, price: p.price })),
  };

  const aiText = await callBedrock(message, contextData);
  return { text: aiText, data: contextData };
}

async function handleNearbyMarket(message, farmerId) {
  const crop = detectCropName(message);
  const profile = await getFarmerProfile(farmerId);

  const district = profile?.district || null;
  const state = profile?.state || null;

  const scanParams = {
    TableName: 'MarketPrices',
    FilterExpression: '#dt >= :date',
    ExpressionAttributeNames: { '#dt': 'date' },
    ExpressionAttributeValues: marshall({ ':date': nDaysAgo(1) }),
  };

  if (crop) {
    scanParams.FilterExpression += ' AND cropName = :cn';
    scanParams.ExpressionAttributeValues = marshall({
      ':date': nDaysAgo(1),
      ':cn': crop.toLowerCase(),
    });
  }

  const result = await dynamo.send(new ScanCommand(scanParams));
  const items = (result.Items || []).map(unmarshall);

  if (items.length === 0) {
    return { text: 'No nearby market data available at the moment. Please try again later.', data: null };
  }

  // Sort by price descending to show best first
  items.sort((a, b) => b.price - a.price);

  const contextData = {
    crop: crop || 'all crops',
    farmerLocation: district ? `${district}, ${state}` : 'your area',
    markets: items.slice(0, 8).map(p => ({
      market: p.market,
      district: p.district,
      crop: p.cropName,
      price: p.price,
    })),
    bestMarket: items[0],
  };

  const aiText = await callBedrock(message, contextData);
  return { text: aiText, data: contextData };
}

async function handleSellAdvice(message, farmerId) {
  const crop = detectCropName(message);
  if (!crop) {
    return { text: 'Please mention a specific crop. For example: "Should I sell tomatoes now?"', data: null };
  }

  const [current, hist7, hist30] = await Promise.all([
    getMarketPrices(crop),
    getHistoricalPrices(crop, 7),
    getHistoricalPrices(crop, 30),
  ]);

  const currentPrices = current.map(p => p.price);
  const currentAvg = currentPrices.length
    ? (currentPrices.reduce((a, b) => a + b, 0) / currentPrices.length).toFixed(2)
    : null;
  const avg7 = hist7.length
    ? (hist7.reduce((a, b) => a + b.price, 0) / hist7.length).toFixed(2)
    : null;
  const avg30 = hist30.length
    ? (hist30.reduce((a, b) => a + b.price, 0) / hist30.length).toFixed(2)
    : null;

  if (!currentAvg) {
    return { text: `No current market price data found for ${crop}. Cannot provide selling advice without price data.`, data: null };
  }

  const contextData = {
    crop,
    currentAveragePrice: currentAvg,
    sevenDayAverage: avg7,
    thirtyDayAverage: avg30,
    marketCount: currentPrices.length,
    highestMarket: current.sort((a, b) => b.price - a.price)[0],
  };

  const aiText = await callBedrock(message, contextData);
  return { text: aiText, data: contextData };
}

async function handleCropRecommendation(message, farmerId) {
  const profile = await getFarmerProfile(farmerId);
  const lower = message.toLowerCase();

  // Try to extract soil and season from message or profile
  const soilTypes = ['black', 'red', 'sandy', 'loamy', 'clay', 'alluvial', 'laterite'];
  const seasons = ['summer', 'monsoon', 'winter', 'kharif', 'rabi', 'zaid'];

  const soilFromMsg = soilTypes.find(s => lower.includes(s));
  const seasonFromMsg = seasons.find(s => lower.includes(s));

  const contextData = {
    soilType: soilFromMsg || profile?.soilType || 'unknown',
    season: seasonFromMsg || getCurrentSeason(),
    location: profile ? `${profile.district}, ${profile.state}` : 'Tamil Nadu',
    farmerProfile: profile ? {
      district: profile.district,
      state: profile.state,
      soilType: profile.soilType,
    } : null,
  };

  const aiText = await callBedrock(message, contextData);
  return { text: aiText, data: contextData };
}

async function handleSeasonalAdvice(message, farmerId) {
  const profile = await getFarmerProfile(farmerId);
  const contextData = {
    currentSeason: getCurrentSeason(),
    currentMonth: new Date().toLocaleString('en', { month: 'long' }),
    location: profile ? `${profile.district}, ${profile.state}` : 'Tamil Nadu',
    soilType: profile?.soilType || 'unknown',
  };

  const aiText = await callBedrock(message, contextData);
  return { text: aiText, data: contextData };
}

function getCurrentSeason() {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 6 && month <= 9) return 'Monsoon (Kharif)';
  if (month >= 10 && month <= 11) return 'Post-Monsoon (Rabi sowing)';
  if (month >= 12 || month <= 2) return 'Winter (Rabi)';
  return 'Summer (Zaid)';
}

// ─── Intent router ────────────────────────────────────────────────────────────

function detectIntent(message) {
  const lower = message.toLowerCase();
  if (lower.includes('trend') || lower.includes('historical') || lower.includes('last week') || lower.includes('last month')) return 'trend';
  if (lower.includes('nearby') || lower.includes('near me') || lower.includes('best market') || lower.includes('which market')) return 'nearby';
  if (lower.includes('sell') || lower.includes('should i') || lower.includes('selling advice') || lower.includes('good time')) return 'sell';
  if (lower.includes('recommend') || lower.includes('which crop') || lower.includes('what crop') || lower.includes('suitable crop')) return 'recommend';
  if (lower.includes('season') || lower.includes('seasonal') || lower.includes('monsoon') || lower.includes('summer crop') || lower.includes('winter crop')) return 'seasonal';
  if (lower.includes('price') || lower.includes('rate') || lower.includes('cost') || lower.includes('market price')) return 'price';
  return 'general';
}

// ─── Main handler ─────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { message, farmerId, intent: explicitIntent } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Message is required.' }),
      };
    }

    if (message.length > 500) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Message too long. Max 500 characters.' }),
      };
    }

    const intent = explicitIntent || detectIntent(message);
    let result;

    switch (intent) {
      case 'price':     result = await handleMarketPrice(message, farmerId); break;
      case 'trend':     result = await handlePriceTrend(message, farmerId); break;
      case 'nearby':    result = await handleNearbyMarket(message, farmerId); break;
      case 'sell':      result = await handleSellAdvice(message, farmerId); break;
      case 'recommend': result = await handleCropRecommendation(message, farmerId); break;
      case 'seasonal':  result = await handleSeasonalAdvice(message, farmerId); break;
      default:          result = { text: await callBedrock(message, null), data: null };
    }

    // Persist chat history asynchronously (don't block response)
    if (farmerId) {
      Promise.all([
        saveChatHistory(farmerId, 'user', message),
        saveChatHistory(farmerId, 'assistant', result.text),
      ]).catch(err => console.error('Chat history save error:', err));
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        response: result.text,
        data: result.data,
        intent,
      }),
    };
  } catch (err) {
    console.error('Lambda error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'AI service error. Please try again.' }),
    };
  }
};
