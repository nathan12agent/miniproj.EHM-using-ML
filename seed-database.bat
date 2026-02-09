@echo off
echo ========================================
echo Hospital Management System - Database Seeding
echo ========================================
echo.

echo Step 1: Checking MongoDB...
echo.

REM Check if MongoDB is running
mongosh --eval "db.version()" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] MongoDB is not running!
    echo.
    echo Please start MongoDB first:
    echo   Option 1: Start Docker Desktop, then run: docker-compose up -d mongodb
    echo   Option 2: Install MongoDB from https://www.mongodb.com/try/download/community
    echo.
    pause
    exit /b 1
)

echo [OK] MongoDB is running!
echo.

echo Step 2: Seeding database with doctors, nurses, and beds...
echo.

cd backend
node scripts/seed-comprehensive-hospital-data.js

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo [SUCCESS] Database seeded successfully!
    echo ========================================
    echo.
    echo You can now:
    echo   1. Start backend: cd backend ^&^& npm start
    echo   2. Start ML service: cd ml-service ^&^& python app.py
    echo   3. Start frontend: cd frontend ^&^& npm start
    echo.
    echo Login with: admin@hospital.com / admin123
    echo.
) else (
    echo.
    echo [ERROR] Seeding failed!
    echo.
)

pause
