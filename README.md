# 🏆 Gbros Web Store

A complete e-commerce platform for trophy and promotional products, built as a monorepo with modern technologies.

## 🏗️ Repository Structure

```
📦 gbros-web-store/
├── 🛠️ backend/          ← Vendure e-commerce backend
│   ├── src/             ← TypeScript source code
│   ├── docker-compose.yml ← Database services
│   ├── package.json     ← Backend dependencies
│   └── README.md        ← Backend-specific docs
│
├── 🎨 frontend/         ← Next.js 15 storefront  
│   ├── src/            ← React components & pages
│   ├── public/         ← Static assets
│   ├── package.json    ← Frontend dependencies
│   └── README.md       ← Frontend-specific docs
│
├── 📝 README.md        ← You are here (main docs)
└── 🚀 Quick start guides below
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL (or use Docker)
- Git configured

### 1. Clone & Setup
```bash
git clone git@github.com:Dylanmurzello/Gbros-web-store.git
cd Gbros-web-store
```

### 2. Backend Setup (Vendure)
```bash
cd backend

# Dependencies already installed ✅

# Set up environment
cp env.example.txt .env
# Edit .env with your database credentials

# Start database (using Docker)
docker-compose up -d postgres_db

# Start backend server
npm run dev
# Backend runs at: http://localhost:3000
# Admin UI at: http://localhost:3000/admin
```

### 3. Frontend Setup (Next.js)
```bash
cd frontend

# Dependencies already installed ✅

# Create environment file
touch .env.local
# Add your API endpoints to .env.local

# Start frontend server
npm run dev
# Frontend runs at: http://localhost:3001
```

### 4. Full Stack Development
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend  
cd frontend && npm run dev

# Terminal 3: Database (if needed)
cd backend && docker-compose up postgres_db
```

## 🛠️ Tech Stack

### Backend (Vendure)
- **Vendure Framework** - Headless e-commerce platform
- **TypeScript** - Type-safe development  
- **PostgreSQL** - Production database
- **GraphQL** - API layer
- **Docker** - Containerized services

### Frontend (Next.js)
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React features
- **TypeScript** - Full type safety
- **Tailwind CSS v4** - Modern utility-first CSS
- **Headless UI** - Accessible component library

## 🔐 Environment Configuration

### Backend `.env` 
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vendure
DB_USERNAME=vendure
DB_PASSWORD=your_secure_password

# Admin
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=your_admin_password
COOKIE_SECRET=your_long_random_secret

# See backend/env.example.txt for full configuration
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_VENDURE_SHOP_API_URL=http://localhost:3000/shop-api
NEXT_PUBLIC_VENDURE_ADMIN_API_URL=http://localhost:3000/admin-api
```

## 📝 Development Workflow

### Daily Development
```bash
# Start both servers simultaneously
cd backend && npm run dev &
cd frontend && npm run dev &

# Or start individually:
cd backend && npm run dev    # Backend only
cd frontend && npm run dev   # Frontend only
```

### Making Changes
```bash
# Work in either folder:
cd backend/     # Backend changes
cd frontend/    # Frontend changes

# Commit from root:
git add .
git commit -m "Add new feature"
git push origin main
```

### Database Management
```bash
cd backend

# Start database
docker-compose up -d postgres_db

# Reset database (if needed)
npm run migration:reset

# View database
docker-compose exec postgres_db psql -U vendure -d vendure
```

## 🚀 Deployment

### Backend Deployment
```bash
cd backend
npm run build
npm run start:prod
```

### Frontend Deployment  
```bash
cd frontend
npm run build
npm run start
```

### Full Stack Deployment
Both frontend and backend can be deployed independently or together using Docker.

## 🏆 About Gbros

Premium trophy and promotional products business serving Carson, California. This platform powers our complete e-commerce solution for:

- 🏆 Sports Trophies & Awards
- 🏅 Custom Medals & Ribbons  
- 📋 Corporate Recognition Plaques
- 🎽 Promotional Products
- ✍️ Custom Engraving Services

## ✅ Setup Status

- **Dependencies**: ✅ Installed for both backend and frontend
- **Environment**: ⚙️  Configure .env files as shown above  
- **Database**: ⚙️  Set up PostgreSQL or use Docker
- **Development**: 🚀 Ready to run with `npm run dev`

## 🆘 Need Help?

- **Backend Issues**: Check `backend/README.md`
- **Frontend Issues**: Check `frontend/README.md` 
- **Database Issues**: Ensure PostgreSQL is running
- **Build Issues**: Clear `node_modules` and run `npm install`
- **Port Conflicts**: Backend uses :3000, Frontend uses :3001

---

**Happy coding!** 🚀 This monorepo structure keeps everything organized and makes development smooth. No more broken dependencies or missing packages!

