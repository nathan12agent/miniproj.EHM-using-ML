# Login Troubleshooting Guide

## Default Credentials

**Email**: `admin@hospital.com`  
**Password**: `admin123`

## Quick Fix

If you're getting "Invalid credentials" error, follow these steps:

### Step 1: Re-seed the Database
```cmd
seed-database.cmd
```

This will:
- Clear all existing data
- Create a fresh admin user
- Set password to `admin123`

### Step 2: Test Login Credentials
```cmd
test-login.cmd
```

This will verify if the credentials are correct in the database.

### Step 3: Try Logging In
1. Go to http://localhost:3000
2. Enter:
   - Email: `admin@hospital.com`
   - Password: `admin123`
3. Click "Access Dashboard"

## Common Issues & Solutions

### Issue 1: "Invalid credentials" Error

**Cause**: Password in database doesn't match

**Solution**:
```cmd
# Re-seed the database
seed-database.cmd

# Test the credentials
test-login.cmd
```

### Issue 2: User Not Found

**Cause**: Database is empty or admin user wasn't created

**Solution**:
```cmd
# Seed the database
seed-database.cmd
```

### Issue 3: Backend Not Running

**Cause**: Backend server is not started

**Solution**:
```cmd
# Start the backend
start-backend.cmd
```

Check if backend is running at: http://localhost:5000/health

### Issue 4: MongoDB Not Running

**Cause**: MongoDB service is not started

**Solution**:
```cmd
# Start MongoDB service
net start MongoDB
```

### Issue 5: Wrong Port

**Cause**: Backend running on different port

**Solution**:
Check backend console output for the port number.
Default is: http://localhost:5000

## Verification Steps

### 1. Check MongoDB is Running
```cmd
net start MongoDB
```

Expected output: "The MongoDB service is starting..." or "The requested service has already been started."

### 2. Check Backend is Running
Open browser: http://localhost:5000/health

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-11-11T...",
  "uptime": 123.456
}
```

### 3. Check Database Has Admin User
```cmd
test-login.cmd
```

Expected output:
```
✅ User found in database
Name: Dr. Admin
Email: admin@hospital.com
Role: Administrator

✅ Password is correct!

You can login with:
Email: admin@hospital.com
Password: admin123
```

### 4. Check Frontend is Running
Open browser: http://localhost:3000

You should see the login page.

## Manual Database Check

### Using MongoDB Compass:

1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. Select database: `hospital_management`
4. Select collection: `users`
5. Find document with email: `admin@hospital.com`
6. Verify the document exists

### Using MongoDB Shell:

```javascript
// Connect to database
use hospital_management

// Find admin user
db.users.findOne({ email: "admin@hospital.com" })

// Should return:
{
  _id: ObjectId("..."),
  name: "Dr. Admin",
  email: "admin@hospital.com",
  password: "$2a$10$...", // Hashed password
  role: "Administrator",
  phone: "+1234567890",
  department: "Administration",
  isActive: true
}
```

## Password Reset (If Needed)

If you need to manually reset the password:

### Option 1: Re-seed Database (Recommended)
```cmd
seed-database.cmd
```

### Option 2: Manual Update (Advanced)

Create a file `backend/scripts/reset-password.js`:

```javascript
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const resetPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management');
    
    const user = await User.findOne({ email: 'admin@hospital.com' });
    if (!user) {
      console.log('User not found!');
      process.exit(1);
    }
    
    user.password = 'admin123';
    await user.save();
    
    console.log('✅ Password reset to: admin123');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

resetPassword();
```

Run it:
```cmd
cd backend
node scripts/reset-password.js
```

## Testing API Directly

### Using curl:

```cmd
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@hospital.com\",\"password\":\"admin123\"}"
```

Expected response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Dr. Admin",
    "email": "admin@hospital.com",
    "role": "Administrator"
  }
}
```

### Using Postman:

1. Create new POST request
2. URL: `http://localhost:5000/api/auth/login`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "email": "admin@hospital.com",
  "password": "admin123"
}
```
5. Send request
6. Should receive token and user info

## Environment Variables

Check your `.env` file in the backend folder:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hospital_management
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

## Common Mistakes

### ❌ Wrong Email Format
- Wrong: `admin`
- Wrong: `admin@hospital`
- Correct: `admin@hospital.com`

### ❌ Wrong Password
- Wrong: `Admin123` (capital A)
- Wrong: `admin 123` (space)
- Wrong: `admin1234` (extra 4)
- Correct: `admin123`

### ❌ Extra Spaces
- Wrong: ` admin@hospital.com` (space before)
- Wrong: `admin@hospital.com ` (space after)
- Correct: `admin@hospital.com`

## Debug Mode

To see detailed login errors, check the backend console output when you try to login. It will show:
- User lookup results
- Password comparison results
- Any errors that occur

## Still Having Issues?

### Checklist:
- [ ] MongoDB is running (`net start MongoDB`)
- [ ] Backend is running (`start-backend.cmd`)
- [ ] Frontend is running (`start-frontend.cmd`)
- [ ] Database is seeded (`seed-database.cmd`)
- [ ] Credentials are correct (`test-login.cmd`)
- [ ] No typos in email or password
- [ ] No extra spaces in credentials
- [ ] Using correct port (3000 for frontend, 5000 for backend)

### Last Resort:
1. Stop all services
2. Delete database:
   ```cmd
   # In MongoDB Compass, drop the hospital_management database
   ```
3. Re-seed:
   ```cmd
   seed-database.cmd
   ```
4. Restart backend:
   ```cmd
   start-backend.cmd
   ```
5. Restart frontend:
   ```cmd
   start-frontend.cmd
   ```
6. Try login again

## Success Indicators

### ✅ Login Successful:
- You see "Login successful" message
- You're redirected to the dashboard
- You see the admin panel with sidebar
- Token is stored in browser localStorage

### ❌ Login Failed:
- You see "Invalid credentials" error
- You stay on the login page
- No token is stored
- Check backend console for errors

## Quick Commands Reference

```cmd
# Test login credentials
test-login.cmd

# Re-seed database
seed-database.cmd

# Start backend
start-backend.cmd

# Start frontend
start-frontend.cmd

# Check backend health
curl http://localhost:5000/health

# Start MongoDB
net start MongoDB
```

## Summary

**Default Credentials:**
- Email: `admin@hospital.com`
- Password: `admin123`

**Quick Fix:**
1. Run `seed-database.cmd`
2. Run `test-login.cmd` to verify
3. Try logging in

**If still not working:**
- Check all services are running
- Check for typos
- Check backend console for errors
- Try the manual database check

The credentials are hardcoded in the seed script and should work after re-seeding the database!
