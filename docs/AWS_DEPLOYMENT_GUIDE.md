# AgriDirect Lite — AWS Deployment Guide
> Free Tier Friendly · EC2 t2.micro · S3 · MySQL · CloudWatch

---

## Architecture Overview

```
Internet → S3 Static Website (React)
                ↓ API calls
         EC2 t2.micro (Node.js + Express + MySQL)
                ↓ Image uploads
         S3 Bucket (product images)
                ↓ Monitoring
         CloudWatch (logs + metrics)
```

---

## Step 1: Launch EC2 Instance

1. Go to **EC2 → Launch Instance**
2. Choose **Amazon Linux 2023 AMI** (Free Tier eligible)
3. Instance type: **t2.micro** (Free Tier)
4. Create a new key pair (download `.pem` file)
5. Security Group — allow inbound:
   - SSH (22) — your IP only
   - HTTP (80)
   - Custom TCP (5000) — for API (or use Nginx reverse proxy)
6. Storage: 8 GB gp2 (Free Tier)
7. Launch instance

---

## Step 2: Connect & Setup EC2

```bash
# Connect via SSH
chmod 400 your-key.pem
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP

# Update system
sudo yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install MySQL
sudo yum install -y mysql-server
sudo systemctl start mysqld
sudo systemctl enable mysqld

# Get temporary MySQL root password
sudo grep 'temporary password' /var/log/mysqld.log

# Secure MySQL
sudo mysql_secure_installation
# Set root password, remove anonymous users, disallow remote root login

# Install Git
sudo yum install -y git

# Install PM2 (process manager)
sudo npm install -g pm2
```

---

## Step 3: Setup MySQL Database

```bash
# Login to MySQL
mysql -u root -p

# Run these SQL commands:
CREATE DATABASE agridirect_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'agridirect_user'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON agridirect_db.* TO 'agridirect_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import schema
mysql -u agridirect_user -p agridirect_db < /path/to/schema.sql
```

---

## Step 4: Deploy Backend

```bash
# Clone or upload your project
git clone https://github.com/yourusername/agridirect-lite.git
cd agridirect-lite/backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
nano .env
# Fill in all values (DB credentials, JWT secret, AWS keys)

# Start with PM2
pm2 start server.js --name agridirect-api
pm2 startup
pm2 save

# Check logs
pm2 logs agridirect-api
```

---

## Step 5: Setup Nginx (Reverse Proxy)

```bash
sudo yum install -y nginx
sudo nano /etc/nginx/conf.d/agridirect.conf
```

Paste this config:
```nginx
server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 6: Create S3 Buckets

### Bucket 1: Product Images
1. Go to **S3 → Create Bucket**
2. Name: `agridirect-product-images`
3. Region: `ap-south-1` (Mumbai)
4. Uncheck "Block all public access"
5. Add bucket policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::agridirect-product-images/*"
  }]
}
```

### Bucket 2: Frontend Static Website
1. Create bucket: `agridirect-frontend`
2. Enable **Static website hosting**
3. Index document: `index.html`
4. Error document: `index.html` (for React Router)
5. Uncheck "Block all public access"
6. Add same public read bucket policy

---

## Step 7: Deploy React Frontend

```bash
# On your local machine
cd frontend

# Create .env.production
echo "REACT_APP_API_URL=http://YOUR_EC2_PUBLIC_IP/api" > .env.production

# Build
npm run build

# Install AWS CLI
pip install awscli
aws configure  # Enter your AWS credentials

# Upload to S3
aws s3 sync build/ s3://agridirect-frontend --delete

# Get website URL from S3 bucket properties
# Format: http://agridirect-frontend.s3-website.ap-south-1.amazonaws.com
```

---

## Step 8: IAM Best Practices

1. Go to **IAM → Users → Create User**
2. Name: `agridirect-app-user`
3. Attach policy: Create custom policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::agridirect-product-images/*"
    }
  ]
}
```
4. Create access keys for this user
5. Use these keys in your backend `.env` (NOT root account keys)

---

## Step 9: CloudWatch Monitoring

```bash
# Install CloudWatch agent on EC2
sudo yum install -y amazon-cloudwatch-agent

# Create config
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard

# Start agent
sudo systemctl start amazon-cloudwatch-agent
sudo systemctl enable amazon-cloudwatch-agent
```

Set up alarms in CloudWatch console:
- CPU Utilization > 80%
- Memory usage (via custom metric)
- API error rate

---

## Environment Variables Reference

### Backend `.env`
```
PORT=5000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_USER=agridirect_user
DB_PASSWORD=YourStrongPassword123!
DB_NAME=agridirect_db
JWT_SECRET=minimum_32_character_random_string_here
JWT_EXPIRES_IN=7d
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
AWS_S3_BUCKET=agridirect-product-images
FRONTEND_URL=http://agridirect-frontend.s3-website.ap-south-1.amazonaws.com
```

### Frontend `.env.production`
```
REACT_APP_API_URL=http://YOUR_EC2_IP/api
```

---

## Free Tier Limits to Watch

| Service | Free Tier Limit |
|---------|----------------|
| EC2 t2.micro | 750 hours/month |
| S3 Storage | 5 GB |
| S3 Requests | 20,000 GET, 2,000 PUT |
| Data Transfer | 15 GB out/month |
| CloudWatch | 10 metrics, 10 alarms |

---

## Folder Structure

```
agridirect-lite/
├── backend/
│   ├── config/
│   │   ├── db.js              # MySQL connection pool
│   │   └── s3.js              # AWS S3 config
│   ├── database/
│   │   └── schema.sql         # Database schema + seed
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   └── upload.js          # Multer file upload
│   ├── routes/
│   │   ├── auth.js            # POST /register, /login
│   │   ├── products.js        # CRUD /products
│   │   ├── orders.js          # POST/GET /orders
│   │   ├── profile.js         # GET/PUT /profile
│   │   ├── notifications.js   # GET /notifications
│   │   ├── favorites.js       # GET/POST/DELETE /favorites
│   │   └── dashboard.js       # GET /dashboard
│   ├── utils/
│   │   ├── pricing.js         # Smart pricing logic
│   │   └── notifications.js   # Notification helper
│   ├── server.js              # Express app entry
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.js
│   │   │   │   └── Footer.js
│   │   │   └── ui/
│   │   │       ├── ProductCard.js
│   │   │       ├── SkeletonCard.js
│   │   │       ├── StatCard.js
│   │   │       └── OrderStatusBadge.js
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   │   └── ThemeContext.js
│   │   ├── i18n/
│   │   │   ├── index.js
│   │   │   └── locales/       # en, ta, ml, kn, te, hi, bn
│   │   ├── pages/
│   │   │   ├── HomePage.js
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── MarketplacePage.js
│   │   │   ├── ProductDetailPage.js
│   │   │   ├── DashboardPage.js
│   │   │   ├── AddProductPage.js
│   │   │   ├── EditProductPage.js
│   │   │   ├── OrdersPage.js
│   │   │   ├── ProfilePage.js
│   │   │   ├── FavoritesPage.js
│   │   │   └── NotFoundPage.js
│   │   ├── services/
│   │   │   └── api.js         # Axios instance
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── tailwind.config.js
│   └── package.json
│
└── docs/
    └── AWS_DEPLOYMENT_GUIDE.md
```

---

## Quick Start (Local Development)

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your local MySQL credentials
mysql -u root -p < database/schema.sql
npm run dev

# Frontend (new terminal)
cd frontend
npm install
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
npm start
```

---

## API Documentation

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | No | Register user |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/me | Yes | Get current user |
| POST | /api/auth/change-password | Yes | Change password |
| GET | /api/products | No | List products (search/filter) |
| GET | /api/products/:id | No | Get product |
| POST | /api/products | Farmer | Add product |
| PUT | /api/products/:id | Farmer | Update product |
| DELETE | /api/products/:id | Farmer | Delete product |
| GET | /api/products/farmer/my | Farmer | My products |
| POST | /api/orders | Buyer | Place order |
| GET | /api/orders | Yes | Get orders |
| PUT | /api/orders/:id/status | Yes | Update order status |
| GET | /api/dashboard | Yes | Dashboard stats |
| GET | /api/notifications | Yes | Get notifications |
| PUT | /api/notifications/read-all | Yes | Mark all read |
| GET | /api/profile | Yes | Get profile |
| PUT | /api/profile | Yes | Update profile |
| GET | /api/favorites | Buyer | Get favorites |
| POST | /api/favorites/:id | Buyer | Add favorite |
| DELETE | /api/favorites/:id | Buyer | Remove favorite |
