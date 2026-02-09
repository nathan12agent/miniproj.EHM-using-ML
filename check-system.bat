@echo off
echo ========================================
echo System Status Check
echo ========================================
echo.

echo Checking MongoDB...
mongosh --eval "db.version()" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] MongoDB is running
) else (
    echo [X] MongoDB is NOT running
    echo     Start it with: docker-compose up -d mongodb
)
echo.

echo Checking Backend (port 5000)...
curl -s http://localhost:5000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend is running
) else (
    echo [X] Backend is NOT running
    echo     Start it with: cd backend ^&^& npm start
)
echo.

echo Checking ML Service (port 5001)...
curl -s http://localhost:5001 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] ML Service is running
) else (
    echo [X] ML Service is NOT running
    echo     Start it with: cd ml-service ^&^& python app.py
)
echo.

echo Checking Frontend (port 3000)...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend is running
) else (
    echo [X] Frontend is NOT running
    echo     Start it with: cd frontend ^&^& npm start
)
echo.

echo ========================================
echo Next Steps:
echo ========================================
echo 1. Start any missing services above
echo 2. Run seed-database.bat to add doctors/nurses/beds
echo 3. Open http://localhost:3000 in browser
echo 4. Login: admin@hospital.com / admin123
echo ========================================
echo.

pause
