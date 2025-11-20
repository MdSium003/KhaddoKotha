# KhaddoKotha - Smart Food Management Platform 🍽️

**KhaddoKotha** is a comprehensive food management and sustainability platform designed to reduce food waste, optimize meal planning, and foster community food sharing. The platform combines AI-powered features with practical tools to help users manage their food inventory, track consumption, plan meals within budget, and connect with their community.

## 🎯 Project Purpose

KhaddoKotha addresses critical food waste and sustainability challenges by providing:

- **Smart Inventory Management**: Track food items, expiration dates, and quantities to minimize waste
- **AI-Powered Diet Planning**: Generate personalized meal plans based on budget, preferences, and available inventory
- **Daily Food Tracking**: Monitor daily food consumption and maintain detailed usage logs
- **Community Food Sharing**: Connect with neighbors to donate surplus food or request items in need
- **Food Preservation Tips**: Access expert advice on extending food shelf life
- **Waste-to-Asset Conversion**: Learn creative ways to repurpose food waste

The platform promotes sustainable living by helping users make informed decisions about food consumption, reduce waste, and build stronger community connections around food sharing.

## 🛠️ Technology Stack

### Frontend
- **Framework**: [Next.js 16.0.3](https://nextjs.org/) (App Router, React 19)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Libraries**: 
  - Framer Motion (animations)
  - React OAuth Google (authentication)
- **AI Integration**: Google Generative AI (Gemini)
- **Video Calls**: Daily.co SDK
- **Build Tools**: 
  - React Compiler (Babel plugin)
  - ESLint (code quality)

### Backend
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript 5
- **Database**: [Neon Postgres](https://neon.tech/) (Serverless)
- **Database Driver**: @neondatabase/serverless
- **Authentication**: 
  - JWT (JSON Web Tokens)
  - bcryptjs (password hashing)
- **AI Integration**: Google Generative AI (Gemini)
- **Validation**: Zod
- **Security**: CORS
- **Development**: tsx (TypeScript execution)

### Database Schema
- Users (authentication & profiles)
- Food Inventory (items, quantities, expiration dates)
- Food Usage Logs (daily tracking)
- Community Posts (food sharing)
- Comments (community engagement)
- Food Resources (preservation tips, waste conversion guides)

## 📋 Prerequisites

Before running this project, ensure you have:

- **Node.js** 18.17+ or 20+ (recommended for best Next.js experience)
- **npm** or **yarn** package manager
- **Neon Postgres Database** account and connection string ([Sign up here](https://neon.tech/))
- **Google Cloud Console** account for OAuth and Gemini AI API
- **Git** for version control

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/KhaddoKotha.git
cd KhaddoKotha
```

### 2. Database Setup

1. Create a free account at [Neon](https://neon.tech/)
2. Create a new Postgres database
3. Copy the connection string (it looks like: `postgresql://user:password@host/database`)
4. Keep this connection string handy for the next step

### 3. Backend Configuration

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Update the `.env` file with your credentials:

```env
# Database
DATABASE_URL=your_neon_connection_string_here

# Server
PORT=4000

# CORS (add your frontend URL)
ALLOWED_ORIGINS=http://localhost:3000

# JWT Secret (generate a random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Google Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here
```

**Getting API Keys:**
- **Gemini API Key**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey) to get your free API key

Run database migrations:

```bash
npm run migrate
```

(Optional) Seed the database with sample food resources:

```bash
npm run reseed-resources
```

### 4. Frontend Configuration

```bash
cd ../frontend
npm install
```

Create a `.env.local` file in the `frontend` directory:

```bash
cp .env.local.example .env.local
```

Update the `.env.local` file:

```env
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000

# Google OAuth Client ID (for Google Sign-In)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here

# Google Gemini AI API Key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

**Setting up Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set application type to "Web application"
6. Add authorized JavaScript origins: `http://localhost:3000`
7. Add authorized redirect URIs: `http://localhost:3000`
8. Copy the Client ID to your `.env.local` file

For detailed Google OAuth setup, see `frontend/GOOGLE_OAUTH_SETUP.md`

### 5. Running the Application

You need to run both frontend and backend simultaneously. Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend will start on `http://localhost:4000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will start on `http://localhost:3000`

### 6. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## 📱 Features

### 1. **Food Inventory Management**
- Add, edit, and delete food items
- Track quantities and expiration dates
- Visual indicators for expiring items
- Category-based organization

### 2. **AI Diet Planner**
- Generate personalized meal plans based on:
  - Daily budget
  - Dietary preferences (Veg/Non-Veg/Balanced)
  - Available inventory items
- Nutritional analysis
- Cost breakdown
- Sustainability impact assessment

### 3. **Daily Food Tracker**
- Log daily food consumption
- Multiple input methods:
  - Manual entry
  - Select from inventory
  - CSV bulk upload
- View statistics and trends
- Category-based tracking

### 4. **Community Hub**
- Share surplus food with neighbors
- Request food items you need
- Comment and engage with posts
- Real-time updates
- Filter by donation/request type

### 5. **Food Preservation Tips**
- Expert advice on food storage
- Shelf-life extension techniques
- Category-specific tips

### 6. **Waste to Asset**
- Creative ways to repurpose food waste
- Composting guides
- Upcycling ideas

## 🏗️ Project Structure

```
KhaddoKotha/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   │   ├── inventory/   # Inventory management
│   │   │   ├── diet-planner/# AI meal planning
│   │   │   ├── daily-tracker/# Food usage tracking
│   │   │   ├── community/   # Community sharing
│   │   │   ├── food-preservative/
│   │   │   └── waste-to-asset/
│   │   ├── components/      # Reusable React components
│   │   ├── contexts/        # React Context (Auth)
│   │   └── lib/            # API helpers and utilities
│   ├── public/             # Static assets
│   └── package.json
│
├── backend/                 # Express backend API
│   ├── src/
│   │   ├── db/             # Database migrations & seeds
│   │   ├── routes/         # API route handlers
│   │   ├── middleware/     # Auth & validation
│   │   └── server.ts       # Express app entry point
│   └── package.json
│
└── README.md
```

## 🔧 Available Scripts

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Backend
```bash
npm run dev              # Start development server with hot reload
npm run build            # Compile TypeScript to JavaScript
npm run start            # Start production server
npm run lint             # Type check with TypeScript
npm run migrate          # Run database migrations
npm run reseed-resources # Reseed food resources
```

## 🌐 Deployment

### Frontend Deployment (Vercel - Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com/)
3. Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_BACKEND_URL` (your deployed backend URL)
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - `NEXT_PUBLIC_GEMINI_API_KEY`
5. Deploy

### Backend Deployment (Render/Railway/Fly.io)

1. Push your code to GitHub
2. Create a new Web Service on your platform
3. Connect your repository
4. Set build command: `npm run build`
5. Set start command: `npm run start`
6. Add environment variables:
   - `DATABASE_URL` (Neon connection string)
   - `PORT` (usually auto-set)
   - `ALLOWED_ORIGINS` (your frontend URL)
   - `JWT_SECRET`
   - `GEMINI_API_KEY`
7. Deploy

**Important**: Update `NEXT_PUBLIC_BACKEND_URL` in your frontend with the deployed backend URL and redeploy.

## 🔐 Security Notes

- Never commit `.env` or `.env.local` files to version control
- Use strong, randomly generated JWT secrets
- Keep API keys secure and rotate them regularly
- Enable CORS only for trusted origins in production
- Use HTTPS in production environments

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- **Your Name** - Initial work

## 🙏 Acknowledgments

- [Neon](https://neon.tech/) for serverless Postgres
- [Google Gemini AI](https://ai.google.dev/) for AI capabilities
- [Next.js](https://nextjs.org/) for the amazing React framework
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling

## 📞 Support

For support, email your-email@example.com or open an issue in the repository.

---

**Made with ❤️ for a sustainable future**
