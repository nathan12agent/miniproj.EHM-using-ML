# 🚀 Hospital Management System - Easy Startup Guide

## 🎯 EASIEST WAY (Double-Click)

Just **double-click** this file:
```
START_ALL.bat
```

This will automatically:
- ✅ Start MongoDB
- ✅ Start Backend Server
- ✅ Start Frontend

Wait 30 seconds, then open: **http://localhost:3000**

---

## 🛑 To Stop Everything

**Double-click** this file:
```
STOP_ALL.bat
```

This will stop all services.

---

## 📝 Manual Startup (If Batch File Doesn't Work)

### Open 3 Command Prompt windows:

**Window 1 - MongoDB:**
```bash
mongod
```

**Window 2 - Backend:**
```bash
cd backend
npm run dev
```

**Window 3 - Frontend:**
```bash
cd frontend
npm start
```

---

## 🔐 Login Details

- **URL:** http://localhost:3000
- **Email:** admin@hospital.com
- **Password:** admin123

---

## 📍 Where to See the Slot Booking Feature

1. Login to the system
2. Click **"Add Appointment"** button (red button on dashboard)
3. Select a doctor and date
4. You'll see **available time slots** in a dropdown!

---

## 🎨 What You'll See

```
┌──────────────────────────────────────┐
│  Schedule New Appointment            │
├──────────────────────────────────────┤
│  Patient: [Select ▼]                 │
│  Doctor: [Select ▼]                  │
│  Date: [📅 Pick Date]                │
│  Time: [Available Slots ▼]  ← NEW!  │
│                                       │
│  📅 Monday Schedule                   │
│  Working Hours: 17:00 - 19:00        │
│  Slot Duration: 30 minutes           │
│  [4 slots available]                 │
└──────────────────────────────────────┘
```

---

## ⚠️ Troubleshooting

### "mongod is not recognized"
MongoDB is not installed or not in PATH.
- Install MongoDB from: https://www.mongodb.com/try/download/community
- Or start MongoDB service: `net start MongoDB`

### "Port 3000 already in use"
Something else is using port 3000.
- Close other applications
- Or change port in `frontend/package.json`

### "Cannot connect to MongoDB"
MongoDB is not running.
- Make sure Window 1 (mongod) is running
- Check for errors in that window

### Backend shows errors
- Make sure you're in the `backend` folder
- Try: `cd backend && npm install && npm run dev`

### Frontend shows errors
- Make sure you're in the `frontend` folder
- Try: `cd frontend && npm install && npm start`

---

## 📦 First Time Setup

If this is your **first time** running the project:

```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Install frontend dependencies
cd ../frontend
npm install

# 3. Create admin user
cd ../backend
node scripts/seed-minimal.js

# 4. Now use START_ALL.bat
```

---

## 🔄 Daily Use

After first time setup, just:
1. **Double-click** `START_ALL.bat`
2. Wait 30 seconds
3. Open http://localhost:3000
4. Login and use!

When done:
1. **Double-click** `STOP_ALL.bat`

---

## 📚 More Help

- **Full Startup Guide:** `START_PROJECT.md`
- **Feature Guide:** `HOW_TO_SEE_SLOT_BOOKING.md`
- **All Changes:** `CHANGES_SUMMARY.md`

---

## 🎉 You're All Set!

The system is ready to use. Enjoy your slot-based appointment booking feature! 🚀
