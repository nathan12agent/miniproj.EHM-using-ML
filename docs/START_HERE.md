# 🏥 Hospital Management System - START HERE

## 🎯 What You Have

A complete **Hospital Management System** with:
- ✅ **Backend API** (Node.js + Express + MongoDB)
- ✅ **Frontend UI** (React + Redux + Material-UI)
- ✅ **Authentication** (JWT-based login)
- ✅ **Full CRUD** for Patients, Doctors, Appointments
- ✅ **API Documentation** (Swagger)
- ✅ **Sample Data** (Seeding script included)

## ⚡ Quick Start (Super Easy!)

### Option 1: Using Batch Files (Easiest)

1. **Seed Database** (First time only)
   - Double-click `seed-database.cmd`
   - Wait for completion

2. **Start Backend**
   - Double-click `start-backend.cmd`
   - Keep this window open

3. **Start Frontend** (New window)
   - Double-click `start-frontend.cmd`
   - Browser will open automatically

4. **Login**
   - Email: **admin@hospital.com**
   - Password: **admin123**

### Option 2: Using Commands

**Terminal 1 - Backend:**
```cmd
cd backend
npm install
npm run seed
npm run dev
```
✅ Backend running at http://localhost:5000

**Terminal 2 - Frontend:**
```cmd
cd frontend
npm install
npm start
```
✅ Frontend running at http://localhost:3000

**Login:**
- Open http://localhost:3000
- Email: **admin@hospital.com**
- Password: **admin123**

## 📋 Prerequisites

Before running the commands above, you need:

### MongoDB
**Option 1 - Local (Windows):**
```cmd
Download: https://www.mongodb.com/try/download/community
Install and start: net start MongoDB
```

**Option 2 - Cloud (Easier):**
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Get connection string
3. Update `backend/.env` with your connection string

### Node.js
- Download from https://nodejs.org/ (v14 or higher)

## 🔧 Configuration

Create `backend/.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/hospital_management
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
FRONTEND_URL=http://localhost:3000
```

## ✅ Verify Everything Works

1. **Backend Health**: http://localhost:5000/health
   - Should return: `{"status":"OK",...}`

2. **API Docs**: http://localhost:5000/api-docs
   - Interactive Swagger documentation

3. **Frontend**: http://localhost:3000
   - Login page should load

4. **Login Test**: Use admin@hospital.com / admin123
   - Should redirect to dashboard

## 📁 What Was Created

### Backend Files
```
backend/
├── models/
│   ├── User.js              ✅ NEW - Authentication
│   ├── Appointment.js       ✅ NEW - Appointments
│   ├── Patient.js           (existed)
│   └── Doctor.js            (existed)
├── routes/
│   ├── auth.js              ✅ NEW - Login/Register
│   ├── appointments.js      ✅ NEW - Appointment CRUD
│   ├── doctors.js           ✅ NEW - Doctor CRUD
│   ├── patients.js          (existed)
│   ├── ml.js                ✅ NEW - ML integration
│   ├── billing.js           ✅ NEW - Placeholder
│   ├── inventory.js         ✅ NEW - Placeholder
│   └── reports.js           ✅ NEW - Placeholder
├── middleware/
│   └── auth.js              ✅ NEW - JWT middleware
├── scripts/
│   └── seed.js              ✅ NEW - Database seeding
└── server.js                (existed)
```

### Frontend Files
```
frontend/
└── src/
    ├── services/
    │   └── api.js           ✅ NEW - API integration
    └── pages/
        └── Login/
            └── Login.js     ✅ UPDATED - Real API calls
```

## 🔗 How It Works

```
┌──────────────────────────────────────────────────────┐
│  1. User enters credentials in Login page            │
└────────────────────┬─────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────┐
│  2. Frontend sends POST to /api/auth/login           │
└────────────────────┬─────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────┐
│  3. Backend validates credentials in MongoDB         │
└────────────────────┬─────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────┐
│  4. Backend returns JWT token + user data            │
└────────────────────┬─────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────┐
│  5. Frontend stores token in localStorage            │
└────────────────────┬─────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────┐
│  6. All future API calls include token in header     │
└──────────────────────────────────────────────────────┘
```

## 🎯 Available Features

### Authentication
- ✅ Login with email/password
- ✅ JWT token-based authentication
- ✅ Auto-logout on token expiration
- ✅ Protected routes

### Patient Management
- ✅ View all patients (with pagination & search)
- ✅ Add new patient
- ✅ Edit patient details
- ✅ Delete patient (soft delete)
- ✅ View patient medical history

### Doctor Management
- ✅ View all doctors
- ✅ Add new doctor
- ✅ Edit doctor details
- ✅ Filter by specialization
- ✅ View doctor schedule

### Appointment Management
- ✅ View all appointments
- ✅ Schedule new appointment
- ✅ Update appointment
- ✅ Cancel appointment
- ✅ Filter by date/doctor/patient

## 🐛 Troubleshooting

### Backend won't start
```cmd
# Check if MongoDB is running
net start MongoDB

# Reinstall dependencies
cd backend
rmdir /s /q node_modules
del package-lock.json
npm install
```

### Frontend can't connect
```cmd
# Check backend is running
curl http://localhost:5000/health

# Clear browser cache
Ctrl + Shift + Delete

# Check browser console for errors
F12 → Console tab
```

### Login fails
```cmd
# Re-seed database
cd backend
node scripts/seed.js

# Check backend logs
# Look for errors in terminal where backend is running
```

### Port already in use
```cmd
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID with actual number)
taskkill /PID <PID> /F
```

## 📚 Documentation

- **QUICKSTART.md** - Fast setup guide
- **BACKEND_SETUP.md** - Detailed backend instructions
- **FRONTEND_SETUP.md** - Detailed frontend instructions
- **IMPLEMENTATION_SUMMARY.md** - Technical details

## 🎓 Learning Resources

### API Testing
- Swagger UI: http://localhost:5000/api-docs
- Use Postman or Thunder Client to test endpoints

### Database Viewing
- MongoDB Compass: https://www.mongodb.com/products/compass
- Connect to: mongodb://localhost:27017

### Code Structure
- Backend follows MVC pattern
- Frontend uses Redux for state management
- API service layer abstracts HTTP calls

## 🚀 Next Steps

1. ✅ Get the system running (follow Quick Start above)
2. ✅ Login and explore the dashboard
3. ✅ Test creating/editing patients and doctors
4. ✅ Schedule some appointments
5. ✅ Check API documentation
6. ✅ Customize for your needs

## 💡 Pro Tips

- **Backend logs**: Watch terminal for API requests and errors
- **Frontend debugging**: Use React DevTools and Redux DevTools
- **API testing**: Use Swagger UI for quick endpoint testing
- **Database**: Use MongoDB Compass to visualize data
- **Network**: Check browser DevTools Network tab for API calls

## 🎉 You're All Set!

Your hospital management system is ready to use. The frontend and backend are fully connected and working together. Start by logging in and exploring the features!

**Need help?** Check the troubleshooting section or review the detailed setup guides.
