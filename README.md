# KhaddoKotha - Smart Food Management & Sustainability Platform 🍽️♻️

**KhaddoKotha** is a comprehensive, AI-powered food management and sustainability platform designed to combat food waste, optimize meal planning, promote healthy eating, and foster community food sharing. The platform combines cutting-edge AI technology with practical tools to help users manage their food inventory, track consumption patterns, plan budget-friendly meals, and connect with their community.

[![Next.js](https://img.shields.io/badge/Next.js-16.0.3-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.0-green)](https://expressjs.com/)
[![Neon](https://img.shields.io/badge/Database-Neon_Postgres-teal)](https://neon.tech/)
[![Gemini AI](https://img.shields.io/badge/AI-Google_Gemini-orange)](https://ai.google.dev/)

---

## 📖 Table of Contents

- [Project Purpose](#-project-purpose)
- [Key Features](#-key-features)
- [Technology Stack](#️-technology-stack)
- [Prerequisites](#-prerequisites)
- [Installation Guide](#-installation-guide)
- [Running on Different PCs](#-running-on-different-pcs)
- [Project Structure](#️-project-structure)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Project Purpose

KhaddoKotha addresses critical global challenges in food waste and sustainability:

### Problems We Solve:
- **Food Waste Crisis**: ~1.3 billion tons of food wasted globally each year
- **Budget Management**: Help families reduce food costs by 20-30%
- **Nutritional Balance**: Ensure balanced diet through smart tracking
- **Community Isolation**: Connect neighbors for food sharing
- **Lack of Awareness**: Educate users on food preservation and sustainability

### Our Solutions:
1. **Smart Inventory Management**: Track food items with expiration dates to minimize waste
2. **AI-Powered Analytics**: Identify consumption patterns and detect over/under-consumption
3. **Intelligent Diet Planning**: Generate personalized, budget-friendly meal plans
4. **Daily Food Tracking**: Monitor consumption with detailed analytics
5. **Community Food Sharing**: Connect with neighbors to donate/request food
6. **OCR Receipt Scanning**: Extract items from receipts using Tesseract.js
7. **Sustainability Scoring**: Gamified points system to encourage waste reduction
8. **AI Chatbot Assistant**: Get personalized advice on food management
9. **Waste Estimation**: Predict and prevent food waste before it happens
10. **Educational Resources**: Access expert tips on food preservation and waste reduction

---

## ✨ Key Features

### 🏠 **Smart Inventory Management**
- Add, edit, and delete food items with ease
- Track quantities, purchase dates, and expiration dates
- Visual indicators for items expiring soon
- Category-based organization (Fruit, Vegetable, Dairy, Protein, Grain, etc.)
- Image upload support for items
- Automatic duplicate detection and quantity merging
- OCR receipt scanning to auto-extract items

### 📊 **Advanced Analytics Dashboard** ⭐ NEW
- **Weekly Trend Analysis**: 
  - Track consumption over 4 weeks
  - Visualize patterns with interactive charts
  - Category breakdown per week
  
- **Consumption Pattern Detection**:
  - Identify over-consumption in specific categories
  - Detect under-consumption and nutritional gaps
  - Trend indicators (increasing/decreasing/stable)
  - Category-specific thresholds
  
- **Actionable Insights**:
  - Color-coded alerts (success/info/warning/error)
  - Specific recommendations for each pattern
  - Shopping list optimization tips
  - Waste prevention strategies

- **Heatmap Visualization**:
  - Category × Week consumption matrix
  - Identify consumption hotspots
  - Spot imbalanced patterns

### 🤖 **AI-Powered Diet Planner**
- Generate personalized meal plans based on:
  - Daily/Weekly duration
  - Budget constraints
  - Dietary preferences (Veg/Non-Veg/Balanced)
  - Available inventory items (prioritizes home items)
  - Expiring items (reduces waste)
  
- **Advanced Features**:
  - Nutritional analysis (Calories, Protein, Carbs, Fats, Fiber)
  - Cost breakdown (Home vs Store items)
  - Sustainability impact assessment
  - Priority badges (essential/substitutable/optional)
  - Alternative meal suggestions
  - Daily motivational comments
  - Meal prep tips and notes

### 📝 **Daily Food Tracker**
- Log daily food consumption with multiple input methods:
  - Manual entry
  - Select from inventory
  - CSV bulk upload
  - OCR receipt scanning
  
- **Tracking Features**:
  - Category-based tracking
  - Quantity monitoring
  - Date-based filtering
  - Image attachments
  - Usage statistics and trends

### 🌍 **Community Hub**
- Share surplus food with neighbors
- Request food items you need
- Location-based posts with map integration
- Comment and engage with community
- Real-time updates
- Filter by donation/request type
- User profiles with avatars

### 🎮 **Sustainability Points System** ⭐ NEW
- Earn points for sustainable actions:
  - **Nutrition Points**: Balanced diet consumption
  - **Sustainability Points**: Using items before expiration
  - **Budget Points**: Staying within budget
  
- **Gamification**:
  - Daily score tracking
  - 7-day score history
  - Badge system (NutriNinja, Waste Warrior, Budget Boss)
  - Leaderboard comparisons
  - Progress visualization

### 🤖 **AI Chatbot Assistant** ⭐ NEW
- Personalized food management advice
- Context-aware responses using:
  - User's inventory
  - Consumption patterns
  - Budget preferences
  - Dietary needs
  
- **Capabilities**:
  - Food waste reduction strategies
  - Nutrition balancing advice
  - Budget meal planning
  - Creative leftover ideas
  - Local food sharing guidance
  - Environmental impact explanations

### 📸 **OCR Receipt Scanning** ⭐ NEW
- Extract text from receipt images using Tesseract.js
- Automatic item detection
- Quantity and date extraction
- AI-powered parsing with Gemini
- Support for JPG and PNG formats
- Free and open-source (no API costs)

### 🗑️ **Waste Estimation & Prediction** ⭐ NEW
- Real-time waste risk assessment
- Weekly and monthly projections
- Historical waste statistics
- Pattern analysis
- Community comparison
- AI-generated reduction insights

### 🎯 **Smart Alerts & Notifications**
- Expiration warnings
- Over-consumption alerts
- Budget overspending notifications
- Waste risk predictions
- Dismissible alert system

### 📚 **Educational Resources**
- Food preservation tips
- Storage best practices
- Waste-to-asset conversion ideas
- Composting guides
- Nutrition information
- Category-specific advice

---

## 🛠️ Technology Stack

### **Frontend**
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.3 | React framework with App Router |
| **React** | 19 | UI library |
| **TypeScript** | 5 | Type-safe JavaScript |
| **Tailwind CSS** | 4 | Utility-first CSS framework |
| **Framer Motion** | Latest | Smooth animations |
| **Google OAuth** | Latest | Social authentication |
| **Google Gemini AI** | Latest | AI chatbot integration |
| **React Compiler** | Latest | Performance optimization |

### **Backend**
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **Express** | 5 | Web framework |
| **TypeScript** | 5 | Type-safe JavaScript |
| **Neon Postgres** | Latest | Serverless database |
| **JWT** | Latest | Authentication tokens |
| **bcryptjs** | Latest | Password hashing |
| **Google Gemini AI** | Latest | AI features (diet planner, chatbot, OCR parsing) |
| **Tesseract.js** | Latest | Free OCR (receipt scanning) |
| **Multer** | Latest | File upload handling |
| **Zod** | Latest | Schema validation |
| **CORS** | Latest | Cross-origin security |

### **Database Schema**

#### Core Tables:
- **users**: User accounts and profiles
- **user_inventory**: Personal food inventory
- **food_usage_logs**: Daily consumption tracking
- **food_inventory**: Global food database
- **resources**: Educational content

#### Community Tables:
- **community_posts**: Food sharing posts
- **post_comments**: Community engagement

#### Analytics Tables ⭐ NEW:
- **user_scores**: Daily sustainability points
- **user_badges**: Achievement tracking
- **expiration_risk_scores**: Waste prediction
- **waste_records**: Actual waste tracking
- **user_alerts**: Smart notifications

---

## 📋 Prerequisites

Before setting up KhaddoKotha, ensure you have:

### Required Software:
- **Node.js** 18.17+ or 20+ ([Download](https://nodejs.org/))
- **npm** 9+ or **yarn** 1.22+ (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

### Required Accounts:
- **Neon Database** (Free tier available) - [Sign up](https://neon.tech/)
- **Google Cloud Console** (For OAuth and Gemini AI) - [Sign up](https://console.cloud.google.com/)

### Optional:
- **Code Editor**: VS Code, WebStorm, or similar
- **Postman/Thunder Client**: For API testing

---

## 🚀 Installation Guide

### Step 1: Clone the Repository

```bash
git clone https://github.com/MdSium003/KhaddoKotha.git
cd KhaddoKotha
```

### Step 2: Database Setup

1. **Create Neon Account**:
   - Visit [Neon.tech](https://neon.tech/)
   - Sign up for a free account
   - Create a new project

2. **Create Database**:
   - Click "Create Database"
   - Choose a region close to you
   - Copy the connection string (format: `postgresql://user:password@host/database`)

3. **Save Connection String**:
   - Keep this for the next step
   - Example: `postgresql://alex:AbC123dEf@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb`

### Step 3: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install
```

**Create `.env` file** in the `backend` directory:

```env
# Database Configuration
DATABASE_URL=postgresql://your_user:your_password@your_host/your_database

# Server Configuration
PORT=4000

# CORS Configuration (Frontend URL)
ALLOWED_ORIGINS=http://localhost:3000

# JWT Secret (Generate a random string - use: openssl rand -base64 32)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long

# Google Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here
```

**Getting Gemini API Key**:
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key to your `.env` file

**Run Database Migrations**:

```bash
# Create all database tables
npm run migrate

# (Optional) Seed with sample food resources
npm run reseed-resources
```

**Start Backend Server**:

```bash
npm run dev
```

You should see:
```
API ready on http://localhost:4000
Gemini API Key configured: true
Tesseract OCR configured: Ready (No API key required - Free & Open Source)
```

### Step 4: Frontend Setup

Open a **new terminal window**:

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install
```

**Create `.env.local` file** in the `frontend` directory:

```env
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000

# Google OAuth Client ID
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here

# Google Gemini AI API Key (same as backend)
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

**Setting up Google OAuth**:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"
4. Create OAuth Credentials:
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - If prompted, configure OAuth consent screen first
   - Application type: **Web application**
   - Name: "KhaddoKotha"
   - Authorized JavaScript origins:
     - `http://localhost:3000`
   - Authorized redirect URIs:
     - `http://localhost:3000`
   - Click "Create"
5. Copy the **Client ID** to your `.env.local` file

For detailed OAuth setup, see `frontend/GOOGLE_OAUTH_SETUP.md`

**Start Frontend Server**:

```bash
npm run dev
```

You should see:
```
▲ Next.js 16.0.3
- Local:        http://localhost:3000
- Ready in 2.5s
```

### Step 5: Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

**First Time Setup**:
1. Click "Sign Up" to create an account
2. Or use "Sign in with Google"
3. Complete your profile
4. Start adding food items to your inventory!

---

## 💻 Running on Different PCs

### For Team Members / Other Developers:

#### Prerequisites Check:
```bash
# Check Node.js version (should be 18+)
node --version

# Check npm version
npm --version

# Check Git
git --version
```

#### Setup Steps:

1. **Clone the Repository**:
```bash
git clone https://github.com/MdSium003/KhaddoKotha.git
cd KhaddoKotha
```

2. **Get Environment Variables**:
   - Ask the project owner for:
     - Neon database connection string
     - Gemini API key
     - Google OAuth Client ID
     - JWT Secret
   
   OR create your own (see Installation Guide above)

3. **Backend Setup**:
```bash
cd backend
npm install

# Create .env file with provided credentials
# (See Step 3 in Installation Guide)

npm run migrate    # Setup database
npm run dev        # Start backend
```

4. **Frontend Setup** (in new terminal):
```bash
cd frontend
npm install

# Create .env.local file with provided credentials
# (See Step 4 in Installation Guide)

npm run dev        # Start frontend
```

5. **Verify Setup**:
   - Backend: http://localhost:4000/api/health
   - Frontend: http://localhost:3000

### Common Issues & Solutions:

#### Issue: "Port already in use"
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:4000 | xargs kill -9
```

#### Issue: "Database connection failed"
- Verify `DATABASE_URL` in `.env` is correct
- Check Neon dashboard for database status
- Ensure your IP is allowed (Neon allows all by default)

#### Issue: "Module not found"
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Issue: "CORS error"
- Verify `ALLOWED_ORIGINS` in backend `.env` matches frontend URL
- Check `NEXT_PUBLIC_BACKEND_URL` in frontend `.env.local`

---

## 🏗️ Project Structure

```
KhaddoKotha/
│
├── frontend/                      # Next.js Frontend Application
│   ├── src/
│   │   ├── app/                  # Next.js App Router Pages
│   │   │   ├── (auth)/          # Authentication pages
│   │   │   │   ├── login/
│   │   │   │   └── signup/
│   │   │   ├── inventory/        # Inventory management
│   │   │   ├── diet-planner/     # AI meal planning
│   │   │   ├── daily-tracker/    # Food usage tracking
│   │   │   ├── profile/          # User profile & analytics ⭐
│   │   │   ├── community/        # Community sharing
│   │   │   ├── food-preservative/# Preservation tips
│   │   │   ├── waste-to-asset/   # Waste conversion
│   │   │   ├── chatbot/          # AI assistant ⭐
│   │   │   └── layout.tsx        # Root layout
│   │   │
│   │   ├── components/           # Reusable React Components
│   │   │   ├── header.tsx        # Navigation header
│   │   │   ├── footer.tsx        # Site footer
│   │   │   └── ...
│   │   │
│   │   ├── contexts/             # React Context Providers
│   │   │   └── auth-context.tsx  # Authentication state
│   │   │
│   │   └── lib/                  # Utilities & Helpers
│   │       └── api.ts            # API client functions
│   │
│   ├── public/                   # Static Assets
│   │   └── images/
│   │
│   ├── .env.local.example        # Environment template
│   ├── next.config.ts            # Next.js configuration
│   ├── tailwind.config.ts        # Tailwind CSS config
│   ├── tsconfig.json             # TypeScript config
│   └── package.json              # Dependencies
│
├── backend/                       # Express Backend API
│   ├── src/
│   │   ├── db/                   # Database Management
│   │   │   ├── schema.sql        # Database schema
│   │   │   ├── migrate.ts        # Migration script
│   │   │   ├── create-resources.ts
│   │   │   └── reseed-resources.ts
│   │   │
│   │   ├── ai/                   # AI Services ⭐ NEW
│   │   │   ├── risk-predictor.ts # Waste prediction
│   │   │   ├── ranking-service.ts# Item prioritization
│   │   │   ├── alert-manager.ts  # Smart alerts
│   │   │   ├── waste-estimator.ts# Waste estimation
│   │   │   └── community-comparator.ts
│   │   │
│   │   ├── auth.ts               # Authentication logic
│   │   └── server.ts             # Express app & routes
│   │
│   ├── uploads/                  # Uploaded images ⭐
│   ├── .env.example              # Environment template
│   ├── tsconfig.json             # TypeScript config
│   └── package.json              # Dependencies
│
├── ANALYTICS_FEATURE.md          # Analytics documentation ⭐
├── README.md                     # This file
└── .gitignore                    # Git ignore rules
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:4000/api
```

### Authentication Endpoints

#### POST `/auth/signup`
Create a new user account
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### POST `/auth/login`
Login with email and password
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### POST `/auth/google`
Login with Google OAuth
```json
{
  "googleId": "...",
  "email": "john@example.com",
  "name": "John Doe",
  "avatarUrl": "https://..."
}
```

#### GET `/auth/me`
Get current user profile (requires auth token)

### Inventory Endpoints

#### GET `/user-inventory`
Get user's inventory items

#### POST `/user-inventory`
Add item to inventory
```json
{
  "itemName": "Apple",
  "quantity": 5,
  "category": "Fruit",
  "expirationDate": "2025-12-01",
  "purchaseDate": "2025-11-20",
  "notes": "Organic",
  "imageUrl": "/uploads/image-123.jpg"
}
```

#### PUT `/user-inventory/:id`
Update inventory item

#### DELETE `/user-inventory/:id`
Delete inventory item

### Food Usage Endpoints

#### POST `/food-usage`
Log food consumption
```json
{
  "itemName": "Apple",
  "quantity": 2,
  "category": "Fruit",
  "usageDate": "2025-11-21",
  "imageUrl": "/uploads/image-123.jpg"
}
```

#### GET `/food-usage?date=2025-11-21`
Get usage logs for a specific date

#### GET `/food-usage/analytics` ⭐ NEW
Get weekly trends and consumption patterns
```json
{
  "weeklyTrends": [...],
  "consumptionPatterns": {...},
  "insights": [...],
  "imbalancedPatterns": [...],
  "heatmapData": {...}
}
```

### AI Features ⭐ NEW

#### POST `/upload`
Upload image (receipt, food item)

#### POST `/ocr/extract`
Extract text from image using Tesseract OCR

#### POST `/diet-planner/generate`
Generate AI meal plan
```json
{
  "budget": 20,
  "preference": "Balanced",
  "duration": "weekly"
}
```

#### POST `/chatbot`
Chat with AI assistant
```json
{
  "message": "How can I reduce food waste?",
  "conversationHistory": [...]
}
```

### Sustainability Endpoints ⭐ NEW

#### POST `/sustainability/calculate`
Calculate daily sustainability scores

#### GET `/sustainability/scores`
Get user's scores and badges

### Waste Management ⭐ NEW

#### GET `/risk/inventory/:userId`
Get expiration risk scores

#### POST `/risk/calculate/:userId`
Calculate waste risk predictions

#### GET `/waste/estimate/:userId`
Get current waste estimate

#### GET `/waste/projections/:userId`
Get weekly/monthly waste projections

#### POST `/waste/record`
Record actual waste

### Community Endpoints

#### GET `/community/posts`
Get all community posts

#### POST `/community/posts`
Create a new post
```json
{
  "postType": "donate",
  "foodName": "Rice",
  "quantity": 5,
  "unit": "kg",
  "targetDate": "2025-11-25",
  "details": "Extra rice from party",
  "latitude": 23.8103,
  "longitude": 90.4125,
  "address": "Dhaka, Bangladesh"
}
```

#### POST `/community/posts/:id/comments`
Add comment to post

For complete API documentation, see the source code in `backend/src/server.ts`

---

## 🌐 Deployment

### Frontend Deployment (Vercel)

1. **Push to GitHub**:
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Deploy on Vercel**:
   - Go to [Vercel](https://vercel.com/)
   - Click "Import Project"
   - Select your GitHub repository
   - Configure:
     - Framework: Next.js
     - Root Directory: `frontend`
     - Build Command: `npm run build`
     - Output Directory: `.next`
   
3. **Add Environment Variables**:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
   NEXT_PUBLIC_GEMINI_API_KEY=your_api_key
   ```

4. **Deploy**: Click "Deploy"

### Backend Deployment (Render/Railway)

#### Option 1: Render

1. **Create Web Service**:
   - Go to [Render](https://render.com/)
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   
2. **Configure**:
   - Name: `khaddokotha-backend`
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   
3. **Environment Variables**:
   ```
   DATABASE_URL=your_neon_connection_string
   PORT=4000
   ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_gemini_key
   ```

4. **Deploy**: Click "Create Web Service"

#### Option 2: Railway

1. **Create New Project**:
   - Go to [Railway](https://railway.app/)
   - Click "New Project" → "Deploy from GitHub"
   
2. **Configure**:
   - Select repository
   - Root Directory: `backend`
   - Add environment variables (same as above)
   
3. **Deploy**: Railway auto-deploys

### Post-Deployment

1. **Update Frontend URL**:
   - Copy your deployed backend URL
   - Update `NEXT_PUBLIC_BACKEND_URL` in Vercel
   - Redeploy frontend

2. **Update OAuth**:
   - Add production URL to Google OAuth authorized origins
   - Add production URL to authorized redirect URIs

3. **Test**:
   - Visit your deployed frontend
   - Test login, inventory, and all features

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Google OAuth login
- [ ] Add/Edit/Delete inventory items
- [ ] OCR receipt scanning
- [ ] Log food usage
- [ ] View analytics dashboard
- [ ] Generate diet plan
- [ ] Chat with AI assistant
- [ ] Create community post
- [ ] Check sustainability scores
- [ ] View waste predictions

### API Testing with Postman

Import the collection (create one from API documentation above) and test all endpoints.

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork the Repository**
2. **Create Feature Branch**:
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Make Changes**:
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed
   
4. **Commit Changes**:
   ```bash
   git commit -m "Add: Amazing new feature"
   ```
   
5. **Push to Branch**:
   ```bash
   git push origin feature/AmazingFeature
   ```
   
6. **Open Pull Request**:
   - Describe your changes
   - Link related issues
   - Request review

### Coding Standards

- **TypeScript**: Use strict typing
- **React**: Use functional components and hooks
- **Naming**: camelCase for variables, PascalCase for components
- **Comments**: Explain "why", not "what"
- **Commits**: Use conventional commits (feat:, fix:, docs:, etc.)

---

## 📄 License

This project is licensed under the **ISC License**.

---

## 👥 Authors

- **Md Sium** - *Lead Developer* - [GitHub](https://github.com/MdSium003)

---

## 🙏 Acknowledgments

- [Neon](https://neon.tech/) - Serverless Postgres database
- [Google Gemini AI](https://ai.google.dev/) - AI capabilities
- [Tesseract.js](https://tesseract.projectnaptha.com/) - Free OCR engine
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Express](https://expressjs.com/) - Web framework
- [Vercel](https://vercel.com/) - Frontend hosting
- [Render](https://render.com/) - Backend hosting

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/MdSium003/KhaddoKotha/issues)
- **Email**: mdsium003@gmail.com
- **Documentation**: See `ANALYTICS_FEATURE.md` for analytics details

---

## 🗺️ Roadmap

### Upcoming Features:
- [ ] Mobile app (React Native)
- [ ] Barcode scanning
- [ ] Recipe recommendations
- [ ] Meal prep calendar
- [ ] Shopping list generator
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Email notifications
- [ ] Social sharing
- [ ] Export data (PDF/CSV)

---

## 📊 Project Statistics

- **Total Lines of Code**: ~15,000+
- **Components**: 50+
- **API Endpoints**: 60+
- **Database Tables**: 15+
- **AI Features**: 8+
- **Supported Categories**: 10+

---

## 🌟 Star History

If you find this project useful, please consider giving it a ⭐ on GitHub!

---

**Made with ❤️ for a sustainable future | Reducing food waste, one meal at a time**

---

## 📸 Screenshots

### Dashboard
![Dashboard](./screenshots/dashboard.png)

### Analytics
![Analytics](./screenshots/analytics.png)

### Diet Planner
![Diet Planner](./screenshots/diet-planner.png)

### Community
![Community](./screenshots/community.png)

---

*Last Updated: November 21, 2025*
