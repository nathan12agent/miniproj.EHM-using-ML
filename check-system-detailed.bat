@echo off
echo ================================================
echo Hospital Management System - Detailed Check
echo ================================================
echo.

REM Check Node.js
echo [1/8] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo    ❌ Node.js not found
    echo    Install from: https://nodejs.org/
) else (
    for /f "tokens=*" %%i in ('node --version') do echo    ✅ Node.js: %%i
)
echo.

REM Check Python
echo [2/8] Checking Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo    ❌ Python not found
    echo    Install from: https://www.python.org/
) else (
    for /f "tokens=*" %%i in ('python --version') do echo    ✅ Python: %%i
)
echo.

REM Check MongoDB
echo [3/8] Checking MongoDB...
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo    ⚠️  MongoDB not found in PATH
    echo    Check if running via Docker: docker ps
) else (
    echo    ✅ MongoDB installed
)
echo.

REM Check Backend Dependencies
echo [4/8] Checking Backend Dependencies...
if exist "backend\node_modules" (
    echo    ✅ Backend node_modules exists
) else (
    echo    ❌ Backend dependencies not installed
    echo    Run: cd backend ^&^& npm install
)
echo.

REM Check ML Service Dependencies
echo [5/8] Checking ML Service Dependencies...
python -c "import flask, pandas, sklearn" >nul 2>&1
if %errorlevel% neq 0 (
    echo    ❌ ML dependencies not installed
    echo    Run: cd ml-service ^&^& pip install -r requirements.txt
) else (
    echo    ✅ ML dependencies installed
)
echo.

REM Check Data Files
echo [6/8] Checking Data Files...
if exist "Training.csv" (
    echo    ✅ Training.csv found
) else (
    echo    ❌ Training.csv not found
)
if exist "Testing.csv" (
    echo    ✅ Testing.csv found
) else (
    echo    ❌ Testing.csv not found
)
echo.

REM Check Backend Port
echo [7/8] Checking Backend Port (5000)...
netstat -ano | findstr ":5000" >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ Backend running on port 5000
) else (
    echo    ⚠️  Backend not running
    echo    Start: cd backend ^&^& npm start
)
echo.

REM Check ML Service Port
echo [8/8] Checking ML Service Port (5001)...
netstat -ano | findstr ":5001" >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ ML Service running on port 5001
) else (
    echo    ⚠️  ML Service not running
    echo    Start: cd ml-service ^&^& python app.py
)
echo.

echo ================================================
echo Test Endpoints
echo ================================================
echo.

REM Test Backend Health
echo Testing Backend Health...
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ Backend health check passed
) else (
    echo    ❌ Backend health check failed
)
echo.

REM Test ML Service Health
echo Testing ML Service Health...
curl -s http://localhost:5001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ ML Service health check passed
) else (
    echo    ❌ ML Service health check failed
)
echo.

echo ================================================
echo Summary
echo ================================================
echo.
echo If all checks passed, your system is ready!
echo.
echo Next steps:
echo 1. Start MongoDB (if not running)
echo 2. Start Backend: cd backend ^&^& npm start
echo 3. Start ML Service: cd ml-service ^&^& python app-optimized.py
echo 4. Start Frontend: cd frontend ^&^& npm start
echo.
echo ================================================
pause
