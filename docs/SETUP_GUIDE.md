# Hospital Management System - Setup & Run Guide

## Prerequisites

Before running the system, ensure you have the following installed:

### Required Software
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download here](https://python.org/)
- **MongoDB** (v5.0 or higher) - [Download here](https://mongodb.com/try/download/community)
- **Git** - [Download here](https://git-scm.com/)

### Optional (for Docker deployment)
- **Docker** - [Download here](https://docker.com/get-started)
- **Docker Compose** - Usually included with Docker Desktop

## Quick Start (Recommended)

### Option 1: Using npm scripts (Easiest)

1. **Install all dependencies**
```bash
npm run install:all
```

2. **Set up environment variables**
```bash
# Copy environment file
cp backend/.env.example backend/.env
```

3. **Start MongoDB** (if not using Docker)
```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
```

4. **Run all services**
```bash
npm run dev
```

This will start:
- Backend API on http://localhost:5000
- Frontend on http://localhost:3000
- ML Service on http://localhost:5001

## Manual Setup (Step by Step)

### Step 1: Clone and Setup

```bash
# If you haven't already, navigate to your project directory
cd hospital-management-ml

# Install root dependencies
npm install
```

### Step 2: Backend Setup

```bash
# Navigate to backend
cd backend

# Install backend dependencies
npm install

# Copy and configure environment
cp .env.example .env

# Edit .env file with your settings (optional for development)
# Default settings should work for local development

# Go back to root
cd ..
```

### Step 3: Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install frontend dependencies
npm install

# Go back to root
cd ..
```

### Step 4: ML Service Setup

```bash
# Navigate to ML service
cd ml-service

# Install Python dependencies
pip install -r requirements.txt

# Go back to root
cd ..
```

### Step 5: Database Setup

**Option A: Local MongoDB**
```bash
# Start MongoDB service
# Windows (if installed as service)
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**Option B: MongoDB in Docker**
```bash
docker run -d -p 27017:27017 --name hospital-mongo mongo:6.0
```

### Step 6: Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

**Terminal 3 - ML Service:**
```bash
cd ml-service
python app.py
```

## Docker Deployment (Alternative)

If you prefer using Docker:

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

## Accessing the Application

Once all services are running:

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs
- **ML Service**: http://localhost:5001
- **ML Health Check**: http://localhost:5001/health

## Default Login Credentials

The system will create a default admin user:
- **Email**: admin@hospital.com
- **Password**: admin123

## Troubleshooting

### Common Issues

**1. Port Already in Use**
```bash
# Check what's using the port
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # macOS/Linux

# Kill the process or change port in package.json
```

**2. MongoDB Connection Error**
```bash
# Check if MongoDB is running
# Windows
sc query MongoDB

# macOS/Linux
sudo systemctl status mongod

# Start MongoDB if not running
```

**3. Python Dependencies Error**
```bash
# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r ml-service/requirements.txt
```

**4. Node.js Version Issues**
```bash
# Check Node.js version
node --version

# Should be v16 or higher
# Update Node.js if needed
```

### Environment Variables

Edit `backend/.env` if needed:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/hospital_management

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# ML Service
ML_SERVICE_URL=http://localhost:5001
```

## Development Workflow

### Making Changes

1. **Backend Changes**: Server auto-restarts with nodemon
2. **Frontend Changes**: Browser auto-refreshes with React hot reload
3. **ML Service Changes**: Restart Python service manually

### Testing

```bash
# Test backend
cd backend && npm test

# Test frontend
cd frontend && npm test

# Test ML service
cd ml-service && pytest
```

### Building for Production

```bash
# Build frontend
cd frontend && npm run build

# The built files will be in frontend/build/
```

## Next Steps

1. **Explore the Application**: Navigate through different modules
2. **Add Sample Data**: Use the API or frontend to add patients, doctors
3. **Test ML Features**: Try disease prediction and risk assessment
4. **Customize**: Modify according to your project requirements

## Getting Help

- Check the API documentation at http://localhost:5000/api-docs
- Review the project structure in README.md
- Check the development timeline in docs/PROJECT_TIMELINE.md

Happy coding! 🚀