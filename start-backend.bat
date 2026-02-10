@echo off
echo ========================================
echo Starting Backend Server
echo ========================================
echo.

REM Kill any existing node processes on port 5000
echo Checking for existing processes on port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    echo Killing process %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Starting backend server...
cd backend
node server.js

pause
