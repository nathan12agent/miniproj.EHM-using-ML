# Hospital Management System - Quick Start Guide

## 🚀 Complete Setup in 5 Steps

### Step 1: Install MongoDB

**Option A - Local MongoDB (Windows):**
```cmd
Download and install from: https://www.mongodb.com/try/download/community
Start MongoDB service: net start MongoDB
```

**Option B - MongoDB Atlas (Cloud - Recommended for quick start):**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account and cluster
3. Get connection string
4. Use it in backend `.env` file

### Step 2: Setup Backend

```cmd
cd backend
npm install
```

Create `backend/.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/hospital_management
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
FRONTEND_URL=http://localhost:3000
```

Seed database:
```cmd
node scripts/seed.js
```

Start backend:
```cmd
npm run dev
```

✅ Backend should be running on http://localhost:5000

### Step 3: Setup Frontend

Open a NEW terminal window:

```cmd
cd frontend
npm install
npm start
```

✅ Frontend should open automatically at http://localhost:3000

### Step 4: Login

Use these credentials:
- **Email**: admin@hospital.com
- **Password**: admin123

### Step 5: Verify Everything Works

1. ✅ Backend health check: http://localhost:5000/health
2. ✅ API docs: http://localhost:5000/api-docs
3. ✅ Frontend: http://localhost:3000
4. ✅ Login and access dashboard

## 📁 Project Structure

```
hospital-management/
├── backend/              # Node.js + Express API
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── scripts/         # Database seeding
│   └── server.js        # Entry point
├── frontend/            # React application
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── services/   # API services
│   │   └── store/      # Redux store
│   └── package.json
├── ml-service/          # Python ML service (optional)
└── docker-compose.yml   # Docker setup (optional)
```

## 🔧 Common Issues

### Backend won't start
- Check if MongoDB is running
- Verify `.env` file exists in backend folder
- Run `npm install` in backend folder

### Frontend can't connect to backend
- Make sure backend is running on port 5000
- Check http://localhost:5000/health
- Clear browser cache and reload

### Login fails
- Make sure you ran `node scripts/seed.js`
- Check backend console for errors
- Verify MongoDB connection

## 🎯 What's Included

### Backend Features
- ✅ User authentication (JWT)
- ✅ Patient management
- ✅ Doctor management
- ✅ Appointment scheduling
- ✅ API documentation (Swagger)
- ✅ Security (Helmet, CORS, Rate limiting)

### Frontend Features
- ✅ Modern React UI with Material-UI
- ✅ Redux state management
- ✅ Responsive design
- ✅ Dashboard with statistics
- ✅ Patient/Doctor/Appointment management

### Database Models
- ✅ User (authentication)
- ✅ Patient (with medical history)
- ✅ Doctor (with specializations)
- ✅ Appointment (scheduling)

## 📚 Next Steps

1. Explore the API documentation: http://localhost:5000/api-docs
2. Check out the frontend pages (Dashboard, Patients, Doctors, Appointments)
3. Review the code structure
4. Customize for your needs

## 🐳 Docker Setup (Alternative)

If you prefer Docker:

```cmd
docker-compose up
```

This will start:
- MongoDB on port 27017
- Backend on port 5000
- Frontend on port 3000

## 📞 Need Help?

- Backend setup: See `BACKEND_SETUP.md`
- Frontend setup: See `FRONTEND_SETUP.md`
- Check console logs for errors
- Verify all services are running

## 🎉 You're Ready!

Your hospital management system is now running. Start by exploring the dashboard and managing patients, doctors, and appointments.
