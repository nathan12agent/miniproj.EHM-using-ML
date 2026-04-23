# 🚀 How to Start the Hospital Management System

## Quick Start (3 Steps)

### Step 1: Start MongoDB
Open **Command Prompt** or **PowerShell** and run:
```bash
mongod
```
Leave this window open (MongoDB must keep running)

---

### Step 2: Start Backend Server
Open a **NEW** Command Prompt/PowerShell window:
```bash
cd backend
npm run dev
```
✅ You should see: "Server running on port 5000"
Leave this window open

---

### Step 3: Start Frontend
Open **ANOTHER NEW** Command Prompt/PowerShell window:
```bash
cd frontend
npm start
```
✅ Browser will open automatically at http://localhost:3000
Leave this window open

---

## 🎯 That's It!

You now have 3 windows running:
1. **MongoDB** (database)
2. **Backend** (API server on port 5000)
3. **Frontend** (React app on port 3000)

---

## 🔐 Login

Open http://localhost:3000 in your browser:
- **Email:** admin@hospital.com
- **Password:** admin123

---

## 🛑 How to Stop Everything

Press `Ctrl + C` in each of the 3 windows to stop the servers.

---

## 📝 Full Startup Commands (Copy-Paste)

### Windows Command Prompt:
```cmd
REM Window 1 - MongoDB
mongod

REM Window 2 - Backend (open new window)
cd backend
npm run dev

REM Window 3 - Frontend (open new window)
cd frontend
npm start
```

### Windows PowerShell:
```powershell
# Window 1 - MongoDB
mongod

# Window 2 - Backend (open new window)
cd backend
npm run dev

# Window 3 - Frontend (open new window)
cd frontend
npm start
```

---

## ⚠️ Troubleshooting

### MongoDB won't start?
Try:
```bash
net start MongoDB
```
(Requires admin privileges - right-click Command Prompt → "Run as Administrator")

### Port already in use?
Close any programs using ports 3000, 5000, or 27017, then try again.

### Backend won't start?
Make sure you're in the `backend` folder:
```bash
cd backend
npm install
npm run dev
```

### Frontend won't start?
Make sure you're in the `frontend` folder:
```bash
cd frontend
npm install
npm start
```

---

## 🎉 You're Ready!

Once all 3 are running:
1. Go to http://localhost:3000
2. Login with admin@hospital.com / admin123
3. Click "Add Appointment" to see the slot booking feature!

---

## 📦 First Time Setup (Only Once)

If this is your first time running the project:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Seed the database (create admin user)
cd ../backend
node scripts/seed-minimal.js
```

Then follow the "Quick Start" steps above.

---

## 🔄 Daily Startup (After First Time)

Just run these 3 commands in 3 separate windows:
1. `mongod`
2. `cd backend && npm run dev`
3. `cd frontend && npm start`

That's it! 🚀
