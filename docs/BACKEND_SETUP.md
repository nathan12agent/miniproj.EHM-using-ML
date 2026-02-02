# Backend Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)

## Installation Steps

### 1. Install MongoDB
**Windows:**
- Download from https://www.mongodb.com/try/download/community
- Install and start MongoDB service
- Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

### 2. Setup Backend

```cmd
cd backend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend` folder:

```env
MONGODB_URI=mongodb://localhost:27017/hospital_management
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
ML_SERVICE_URL=http://localhost:5001
```

### 4. Seed the Database

```cmd
node scripts/seed.js
```

This will create:
- Admin user (email: admin@hospital.com, password: admin123)
- Sample doctors
- Sample patients

### 5. Start the Backend Server

```cmd
npm run dev
```

The backend will run on http://localhost:5000

### 6. Verify Backend is Running

Open http://localhost:5000/health in your browser. You should see:
```json
{
  "status": "OK",
  "timestamp": "...",
  "uptime": ...
}
```

### 7. View API Documentation

Open http://localhost:5000/api-docs to see Swagger API documentation

## Available API Endpoints

- **Auth**: `/api/auth/login`, `/api/auth/register`, `/api/auth/me`
- **Patients**: `/api/patients` (GET, POST, PUT, DELETE)
- **Doctors**: `/api/doctors` (GET, POST, PUT, DELETE)
- **Appointments**: `/api/appointments` (GET, POST, PUT, DELETE)
- **ML**: `/api/ml/predict/risk`
- **Reports**: `/api/reports`
- **Inventory**: `/api/inventory`
- **Billing**: `/api/billing`

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running: `net start MongoDB` (Windows)
- Check if MongoDB is listening on port 27017
- Or use MongoDB Atlas connection string

### Port Already in Use
- Change PORT in `.env` file
- Kill process using port 5000: `netstat -ano | findstr :5000`

### Module Not Found
- Run `npm install` in backend folder
- Delete `node_modules` and `package-lock.json`, then run `npm install` again
