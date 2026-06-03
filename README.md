# 🌾 AgriDirect Lite

**Empowering Farmers, Enabling Buyers** — A farmer-to-buyer marketplace for Tamil Nadu, powered by AWS Free Tier.

## Tech Stack

- **Frontend**: React 18 + Tailwind CSS → AWS S3 Static Hosting
- **Backend**: Node.js + Express → AWS EC2 t2.micro
- **Database**: MySQL → Same EC2 instance
- **Storage**: AWS S3 (product images)
- **Monitoring**: AWS CloudWatch
- **Auth**: JWT + bcrypt

## Features

- 🌿 Multilingual (Tamil, English, Malayalam, Kannada, Telugu, Hindi, Bengali)
- 🌙 Dark / Light mode with persistence
- 👨‍🌾 Farmer dashboard — add/edit/delete products, view orders, revenue
- 🛒 Buyer dashboard — browse, search, filter, order, favorites
- 💡 Smart pricing suggestions (rule-based, no AI)
- 🔔 Real-time notification center
- 📱 Fully responsive (mobile, tablet, desktop)
- 🏺 Tamil agricultural heritage section

## Quick Start

```bash
# Backend
cd backend && npm install
cp .env.example .env   # fill in your values
mysql -u root -p < database/schema.sql
npm run dev

# Frontend
cd frontend && npm install
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
npm start
```

See `docs/AWS_DEPLOYMENT_GUIDE.md` for full AWS deployment instructions.

## Demo Login
- Admin: `admin@agridirect.in` / `Admin@123`
