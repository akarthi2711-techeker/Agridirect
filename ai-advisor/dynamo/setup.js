/**
 * DynamoDB Table Setup + Sample Data Seeder
 * Run: node ai-advisor/dynamo/setup.js
 * Requires: AWS credentials in env or ~/.aws/credentials
 */

const {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  PutItemCommand,
} = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');

require('dotenv').config({ path: './backend/.env' });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ─── Table definitions ────────────────────────────────────────────────────────

const tables = [
  {
    TableName: 'MarketPrices',
    KeySchema: [
      { AttributeName: 'cropId', KeyType: 'HASH' },
      { AttributeName: 'date', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'cropId', AttributeType: 'S' },
      { AttributeName: 'date', AttributeType: 'S' },
      { AttributeName: 'cropName', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'CropNameIndex',
        KeySchema: [
          { AttributeName: 'cropName', KeyType: 'HASH' },
          { AttributeName: 'date', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
        BillingMode: 'PAY_PER_REQUEST',
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: 'HistoricalPrices',
    KeySchema: [
      { AttributeName: 'cropId', KeyType: 'HASH' },
      { AttributeName: 'date', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'cropId', AttributeType: 'S' },
      { AttributeName: 'date', AttributeType: 'S' },
      { AttributeName: 'cropName', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'CropNameIndex',
        KeySchema: [
          { AttributeName: 'cropName', KeyType: 'HASH' },
          { AttributeName: 'date', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
        BillingMode: 'PAY_PER_REQUEST',
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: 'FarmerProfile',
    KeySchema: [
      { AttributeName: 'farmerId', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'farmerId', AttributeType: 'S' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: 'ChatHistory',
    KeySchema: [
      { AttributeName: 'farmerId', KeyType: 'HASH' },
      { AttributeName: 'timestamp', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'farmerId', AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'S' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
];

// ─── Table creator ─────────────────────────────────────────────────────────────

async function tableExists(name) {
  try {
    await client.send(new DescribeTableCommand({ TableName: name }));
    return true;
  } catch {
    return false;
  }
}

async function createTables() {
  for (const def of tables) {
    const exists = await tableExists(def.TableName);
    if (exists) {
      console.log(`  ✓ ${def.TableName} already exists — skipping`);
      continue;
    }
    await client.send(new CreateTableCommand(def));
    console.log(`  ✅ Created table: ${def.TableName}`);
  }
}

// ─── Sample data ───────────────────────────────────────────────────────────────

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

const markets = [
  { market: 'Koyambedu', district: 'Chennai', state: 'Tamil Nadu' },
  { market: 'Madurai Central', district: 'Madurai', state: 'Tamil Nadu' },
  { market: 'Dindigul', district: 'Dindigul', state: 'Tamil Nadu' },
  { market: 'Trichy', district: 'Tiruchirappalli', state: 'Tamil Nadu' },
  { market: 'Coimbatore', district: 'Coimbatore', state: 'Tamil Nadu' },
];

const crops = [
  { name: 'tomato', basePrices: [18, 20, 22, 17, 19] },
  { name: 'onion',  basePrices: [25, 28, 24, 27, 26] },
  { name: 'potato', basePrices: [30, 32, 28, 31, 29] },
  { name: 'chilli', basePrices: [80, 85, 78, 82, 79] },
  { name: 'brinjal', basePrices: [22, 24, 20, 23, 21] },
];

function randomVariation(base, pct = 0.1) {
  const delta = base * pct;
  return parseFloat((base + (Math.random() * 2 - 1) * delta).toFixed(2));
}

async function seedSampleData() {
  const items = [];

  // MarketPrices — today and yesterday
  for (const crop of crops) {
    for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
      for (let i = 0; i < markets.length; i++) {
        const mkt = markets[i];
        const price = randomVariation(crop.basePrices[i]);
        const date = daysAgo(dayOffset);
        const cropId = `${crop.name}_${mkt.market}_${date}`;
        items.push({
          table: 'MarketPrices',
          item: { cropId, cropName: crop.name, market: mkt.market, district: mkt.district, state: mkt.state, price, date },
        });
      }
    }
  }

  // HistoricalPrices — 30 days of data
  for (const crop of crops) {
    for (let day = 0; day < 30; day++) {
      const date = daysAgo(day);
      const basePrice = crop.basePrices[0];
      const price = randomVariation(basePrice, 0.15);
      const cropId = `${crop.name}_${date}`;
      items.push({
        table: 'HistoricalPrices',
        item: { cropId, cropName: crop.name, price, date },
      });
    }
  }

  // FarmerProfile sample
  items.push({
    table: 'FarmerProfile',
    item: {
      farmerId: 'sample_farmer_1',
      name: 'Rajan Kumar',
      district: 'Madurai',
      state: 'Tamil Nadu',
      soilType: 'black',
    },
  });

  console.log(`\nSeeding ${items.length} sample records...`);
  let count = 0;
  for (const { table, item } of items) {
    try {
      await client.send(new PutItemCommand({
        TableName: table,
        Item: marshall(item),
      }));
      count++;
    } catch (err) {
      console.error(`  ✗ Failed to seed ${table}:`, err.message);
    }
  }
  console.log(`  ✅ Seeded ${count}/${items.length} records`);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

(async () => {
  console.log('\n🌾 AgriDirect DynamoDB Setup\n');
  console.log('Creating tables...');
  await createTables();

  console.log('\nSeeding sample data...');
  await seedSampleData();

  console.log('\n✅ Setup complete!\n');
})();
