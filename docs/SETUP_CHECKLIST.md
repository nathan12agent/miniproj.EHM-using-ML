# ✅ Setup Checklist

Use this checklist to ensure everything is set up correctly.

## 📋 Pre-Setup Checklist

### Prerequisites
- [ ] Node.js installed (v14 or higher)
  - Check: Open terminal and run `node --version`
  - Download: https://nodejs.org/

- [ ] MongoDB installed OR MongoDB Atlas account
  - **Option A - Local:** Download from https://www.mongodb.com/try/download/community
  - **Option B - Cloud:** Create account at https://www.mongodb.com/cloud/atlas
  - Check: Run `net start MongoDB` (Windows) or check Atlas dashboard

- [ ] Git installed (if cloning repository)
  - Check: Run `git --version`
  - Download: https://git-scm.com/

---

## 🚀 Setup Checklist

### Step 1: Database Setup
- [ ] MongoDB is running (local) OR Atlas cluster is active
- [ ] Can connect to MongoDB
  - Local: mongodb://localhost:27017
  - Atlas: Use connection string from dashboard

### Step 2: Backend Setup
- [ ] Navigated to backend folder: `cd backend`
- [ ] Installed dependencies: `npm install`
- [ ] Created `.env` file in backend folder
- [ ] Updated `.env` with MongoDB connection string
- [ ] Seeded database: `npm run seed` or double-click `seed-database.cmd`
- [ ] Saw success message: "Database seeded successfully!"
- [ ] Started backend: `npm run dev` or double-click `start-backend.cmd`
- [ ] Backend running on port 5000
- [ ] Saw message: "Server running on port 5000"
- [ ] Saw message: "Connected to MongoDB"

### Step 3: Backend Verification
- [ ] Opened http://localhost:5000/health in browser
- [ ] Saw: `{"status":"OK",...}`
- [ ] Opened http://localhost:5000/api-docs
- [ ] Saw Swagger API documentation

### Step 4: Frontend Setup
- [ ] Opened NEW terminal window
- [ ] Navigated to frontend folder: `cd frontend`
- [ ] Installed dependencies: `npm install`
- [ ] Started frontend: `npm start` or double-click `start-frontend.cmd`
- [ ] Frontend running on port 3000
- [ ] Saw message: "Compiled successfully!"
- [ ] Browser opened automatically to http://localhost:3000

### Step 5: Frontend Verification
- [ ] Login page loaded
- [ ] Saw hospital logo
- [ ] Saw email and password fields
- [ ] Saw demo credentials box

### Step 6: Login Test
- [ ] Entered email: admin@hospital.com
- [ ] Entered password: admin123
- [ ] Clicked "Access Dashboard" button
- [ ] Redirected to dashboard
- [ ] Dashboard loaded successfully

### Step 7: Feature Test
- [ ] Can see navigation menu
- [ ] Can navigate to Patients page
- [ ] Can navigate to Doctors page
- [ ] Can navigate to Appointments page
- [ ] Can see sample data (doctors and patients)

---

## 🔍 Verification Checklist

### Backend Health
- [ ] http://localhost:5000/health returns OK
- [ ] http://localhost:5000/api-docs shows Swagger UI
- [ ] Backend terminal shows no errors
- [ ] MongoDB connection successful

### Frontend Health
- [ ] http://localhost:3000 loads login page
- [ ] No errors in browser console (F12)
- [ ] Frontend terminal shows "Compiled successfully"
- [ ] Can login successfully

### Database Health
- [ ] Admin user exists (admin@hospital.com)
- [ ] Sample doctors exist (3 doctors)
- [ ] Sample patients exist (2 patients)
- [ ] Can query database (using MongoDB Compass or Atlas)

### API Health
- [ ] Can login via API (POST /api/auth/login)
- [ ] Can get patients (GET /api/patients)
- [ ] Can get doctors (GET /api/doctors)
- [ ] Can get appointments (GET /api/appointments)

---

## 🎯 Success Criteria

### All Green? You're Ready! ✅

If you checked all boxes above, your system is:
- ✅ Fully installed
- ✅ Properly configured
- ✅ Running correctly
- ✅ Ready to use

### Some Red? Troubleshoot 🔧

If you couldn't check some boxes, see:
- [START_HERE.md](START_HERE.md) - Troubleshooting section
- [BACKEND_SETUP.md](BACKEND_SETUP.md) - Backend issues
- [FRONTEND_SETUP.md](FRONTEND_SETUP.md) - Frontend issues

---

## 🐛 Common Issues Checklist

### Backend Won't Start
- [ ] MongoDB is running
- [ ] `.env` file exists in backend folder
- [ ] `.env` has correct MongoDB URI
- [ ] Port 5000 is not in use
- [ ] All dependencies installed (`npm install`)

### Frontend Won't Start
- [ ] Backend is running first
- [ ] Port 3000 is not in use
- [ ] All dependencies installed (`npm install`)
- [ ] No errors in terminal

### Login Fails
- [ ] Database was seeded (`npm run seed`)
- [ ] Backend is running
- [ ] Using correct credentials (admin@hospital.com / admin123)
- [ ] No errors in browser console
- [ ] No errors in backend terminal

### Can't Connect to Backend
- [ ] Backend is running on port 5000
- [ ] http://localhost:5000/health returns OK
- [ ] CORS is enabled in backend
- [ ] Frontend proxy is configured (check package.json)

---

## 📊 System Status Dashboard

Use this to check your system status:

```
┌─────────────────────────────────────────┐
│  System Status                          │
├─────────────────────────────────────────┤
│  MongoDB:        [ ] Running            │
│  Backend:        [ ] Running (port 5000)│
│  Frontend:       [ ] Running (port 3000)│
│  Database:       [ ] Seeded             │
│  Login:          [ ] Working            │
│  API:            [ ] Accessible         │
└─────────────────────────────────────────┘
```

**All checked?** System is operational! 🎉

---

## 🎓 Next Steps Checklist

After successful setup:

### Explore the System
- [ ] View all patients
- [ ] View all doctors
- [ ] View all appointments
- [ ] Check dashboard statistics

### Test Features
- [ ] Add a new patient
- [ ] Add a new doctor
- [ ] Schedule an appointment
- [ ] Edit patient details
- [ ] Edit doctor details

### Learn the Code
- [ ] Read [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- [ ] Explore backend code structure
- [ ] Explore frontend code structure
- [ ] Check API documentation

### Customize
- [ ] Update branding/colors
- [ ] Add new features
- [ ] Modify existing features
- [ ] Deploy to production

---

## 📞 Help Checklist

If you need help:

### Before Asking for Help
- [ ] Checked all boxes in this checklist
- [ ] Read troubleshooting section in [START_HERE.md](START_HERE.md)
- [ ] Checked terminal logs for errors
- [ ] Checked browser console for errors
- [ ] Tried restarting backend and frontend
- [ ] Tried re-seeding database

### Information to Provide
- [ ] Operating system (Windows/Mac/Linux)
- [ ] Node.js version (`node --version`)
- [ ] MongoDB version or Atlas?
- [ ] Error messages from terminal
- [ ] Error messages from browser console
- [ ] Which step failed?

---

## 🎉 Completion Checklist

### Setup Complete When:
- [x] All prerequisites installed
- [x] Backend running without errors
- [x] Frontend running without errors
- [x] Database seeded with sample data
- [x] Can login successfully
- [x] Can navigate all pages
- [x] Can view sample data
- [x] API documentation accessible

**Congratulations! Your hospital management system is ready!** 🏥✨

---

## 📝 Quick Reference

### Commands
```cmd
# Seed database
cd backend
npm run seed

# Start backend
cd backend
npm run dev

# Start frontend
cd frontend
npm start
```

### URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API Docs: http://localhost:5000/api-docs
- Health: http://localhost:5000/health

### Credentials
- Email: admin@hospital.com
- Password: admin123

### Batch Files (Windows)
- seed-database.cmd
- start-backend.cmd
- start-frontend.cmd

---

## 🔄 Restart Checklist

If you need to restart:

### Stop Everything
- [ ] Close frontend terminal (Ctrl+C)
- [ ] Close backend terminal (Ctrl+C)
- [ ] Close browser

### Start Again
- [ ] Start backend: `start-backend.cmd`
- [ ] Wait for "Server running on port 5000"
- [ ] Start frontend: `start-frontend.cmd`
- [ ] Wait for browser to open
- [ ] Login

---

**Print this checklist and check off items as you complete them!** ✅
