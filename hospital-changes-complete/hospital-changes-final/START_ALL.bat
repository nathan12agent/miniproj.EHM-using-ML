@echo off
echo ========================================
echo Hospital Management System - Startup
echo ========================================
echo.

echo Starting MongoDB...
start "MongoDB" cmd /k "mongod"
timeout /t 3 /nobreak >nul

echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul

echo Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo All services are starting!
echo ========================================
echo.
echo You should see 3 new windows:
echo   1. MongoDB (database)
echo   2. Backend Server (port 5000)
echo   3. Frontend (port 3000)
echo.
echo Wait for all to start, then open:
echo   http://localhost:3000
echo.
echo Login: admin@hospital.com / admin123
echo.
echo Press any key to close this window...
pause >nul
