@echo off
echo ================================================
echo  Starting Hospital Management System
echo ================================================
echo.

REM Check if MongoDB is running
echo Checking MongoDB...
netstat -ano | findstr ":27017" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] MongoDB not running on port 27017
    echo.
    echo Please start MongoDB first:
    echo   Option 1: docker-compose up -d mongodb
    echo   Option 2: Start MongoDB service locally
    echo.
    pause
    exit /b 1
)
echo [OK] MongoDB is running
echo.

REM Start Backend
echo Starting Backend...
start "Backend Server" cmd /k "cd /d %~dp0backend && node server.js"
timeout /t 3 >nul
echo [OK] Backend starting on port 5000
echo.

REM Start ML Service
echo Starting ML Service...
start "ML Service" cmd /k "cd /d %~dp0ml-service && python app-optimized.py"
timeout /t 3 >nul
echo [OK] ML Service starting on port 5001
echo.

REM Start Frontend
echo Starting Frontend...
start "Frontend" cmd /k "cd /d %~dp0frontend && npm start"
timeout /t 3 >nul
echo [OK] Frontend starting on port 3000
echo.

echo ================================================
echo  All services started!
echo ================================================
echo.
echo   Backend:    http://localhost:5000
echo   ML Service: http://localhost:5001
echo   Frontend:   http://localhost:3000
echo   API Docs:   http://localhost:5000/api-docs
echo.
echo Close the terminal windows to stop services.
echo ================================================
pause
