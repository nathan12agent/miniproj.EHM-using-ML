@echo off
echo ================================================
echo Starting Hospital Management System (Optimized)
echo ================================================
echo.

REM Check if MongoDB is running
echo Checking MongoDB...
netstat -ano | findstr ":27017" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ MongoDB not running on port 27017
    echo.
    echo Please start MongoDB first:
    echo   Option 1: docker-compose up -d mongodb
    echo   Option 2: Start MongoDB service locally
    echo.
    pause
    exit /b 1
)
echo ✅ MongoDB is running
echo.

REM Start Backend (Optimized)
echo Starting Backend (Optimized)...
start "Backend Server" cmd /k "cd backend && node server-optimized.js"
timeout /t 3 >nul
echo ✅ Backend starting...
echo.

REM Start ML Service (Optimized)
echo Starting ML Service (Optimized)...
start "ML Service" cmd /k "cd ml-service && python app-optimized.py"
timeout /t 3 >nul
echo ✅ ML Service starting...
echo.

REM Wait for services to initialize
echo Waiting for services to initialize...
timeout /t 5 >nul
echo.

REM Test Backend
echo Testing Backend...
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is healthy
) else (
    echo ⚠️  Backend health check failed (may still be starting)
)
echo.

REM Test ML Service
echo Testing ML Service...
curl -s http://localhost:5001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ ML Service is healthy
) else (
    echo ⚠️  ML Service health check failed (may still be starting)
)
echo.

echo ================================================
echo Services Started!
echo ================================================
echo.
echo Backend:     http://localhost:5000
echo ML Service:  http://localhost:5001
echo API Docs:    http://localhost:5000/api-docs
echo.
echo To start Frontend:
echo   cd frontend ^&^& npm start
echo.
echo To stop services:
echo   Close the terminal windows
echo.
echo ================================================
pause
