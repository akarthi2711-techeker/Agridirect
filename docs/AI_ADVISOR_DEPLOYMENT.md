# AgriDirect AI Market Advisor — Deployment Guide

## Architecture

```
Browser (Vercel)
    │
    ▼
Backend Express API  (EC2 / existing)
    │  POST /api/ai/chat
    ▼
API Gateway (HTTP API)
    │
    ▼
AWS Lambda (handler.js)
    │          │
    ▼          ▼
DynamoDB   Amazon Bedrock
            (Claude 3 Sonnet)
```

---

## 1. DynamoDB Tables

Run the setup script once:

```bash
# From project root — ensure AWS credentials are in .env or environment
cd ai-advisor && npm install
node dynamo/setup.js
```

Tables created:
- `MarketPrices` — today/yesterday prices per market
- `HistoricalPrices` — 30-day price history per crop
- `FarmerProfile` — farmer location + soil type
- `ChatHistory` — per-farmer conversation log

---

## 2. Lambda Function

### Package and deploy

```bash
cd ai-advisor/lambda
npm install
zip -r lambda.zip .
```

### Create Lambda in AWS Console

1. Runtime: **Node.js 20.x**
2. Handler: `handler.handler`
3. Memory: 256 MB · Timeout: 30s
4. Upload `lambda.zip`

### Environment variables (Lambda)

| Key | Value |
|-----|-------|
| `AWS_REGION` | `ap-south-1` |
| `FRONTEND_URL` | Your Vercel URL e.g. `https://agridirect.vercel.app` |

> Lambda running inside AWS automatically uses its execution role — no key/secret needed inside Lambda.

---

## 3. IAM Role for Lambda

Create a role `agridirect-ai-lambda-role` with these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:PutItem",
        "dynamodb:GetItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:ap-south-1:*:table/MarketPrices",
        "arn:aws:dynamodb:ap-south-1:*:table/MarketPrices/index/*",
        "arn:aws:dynamodb:ap-south-1:*:table/HistoricalPrices",
        "arn:aws:dynamodb:ap-south-1:*:table/HistoricalPrices/index/*",
        "arn:aws:dynamodb:ap-south-1:*:table/FarmerProfile",
        "arn:aws:dynamodb:ap-south-1:*:table/ChatHistory"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:ap-south-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

---

## 4. API Gateway

1. Create **HTTP API** in API Gateway
2. Add route: `POST /ai/chat` → Lambda integration
3. Enable CORS: allow origin = your Vercel URL
4. (Optional) Add API key for `x-api-key` header auth
5. Deploy to stage `prod`
6. Copy the invoke URL: `https://xxxxxxxx.execute-api.ap-south-1.amazonaws.com/prod/ai/chat`

---

## 5. Backend .env

Add to your EC2 backend `.env`:

```env
AI_LAMBDA_URL=https://xxxxxxxx.execute-api.ap-south-1.amazonaws.com/prod/ai/chat
AI_API_GATEWAY_KEY=your_api_gateway_key   # optional
```

Your EC2 instance profile (or IAM user) needs DynamoDB read access for the `/api/market/*` and `/api/chat/history` routes.

---

## 6. Amazon Bedrock

1. Go to **Amazon Bedrock → Model access** in `ap-south-1`
2. Request access to **Anthropic Claude 3 Sonnet**
3. Wait for approval (usually instant for Claude 3 Sonnet)

---

## 7. Frontend (Vercel)

No extra env vars needed — the frontend talks to your existing EC2 backend URL (`REACT_APP_API_URL`), which proxies to Lambda.

```bash
cd frontend
npm run build
# Push to GitHub → Vercel auto-deploys
```

---

## 8. Install backend dependencies

```bash
cd backend
npm install
```

New packages added: `@aws-sdk/client-dynamodb`, `@aws-sdk/util-dynamodb`

---

## Quick Checklist

- [ ] DynamoDB tables created (`node ai-advisor/dynamo/setup.js`)
- [ ] Lambda deployed with correct IAM role
- [ ] Bedrock model access approved (Claude 3 Sonnet)
- [ ] API Gateway route created and deployed
- [ ] `AI_LAMBDA_URL` added to EC2 backend `.env`
- [ ] `npm install` run in `backend/`
- [ ] Frontend redeployed on Vercel
