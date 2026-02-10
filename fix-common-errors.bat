@echo off
echo ================================================
echo Hospital Management System - Error Fixer
echo ================================================
echo.

:menu
echo Select an issue to fix:
echo.
echo 1. MongoDB not connecting
echo 2. Backend dependencies missing
echo 3. ML Service dependencies missing
echo 4. Port already in use (5000)
echo 5. Port already in use (5001)
echo 6. Missing uploads directory
echo 7. Missing .env file
echo 8. Clear all caches and restart
echo 9. Run full system check
echo 0. Exit
echo.
set /p choice="Enter your choice (0-9): "

if "%choice%"=="1" goto fix_mongodb
if "%choice%"=="2" goto fix_backend_deps
if "%choice%"=="3" goto fix_ml_deps
if "%choice%"=="4" goto fix_port_5000
if "%choice%"=="5" goto fix_port_5001
if "%choice%"=="6" goto fix_uploads
if "%choice%"=="7" goto fix_env
if "%choice%"=="8" goto clear_all
if "%choice%"=="9" goto system_check
if "%choice%"=="0" goto end
goto menu

:fix_mongodb
echo.
echo Fixing MongoDB connection...
echo.
echo Checking if MongoDB is running...
netstat -ano | findstr ":27017" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ MongoDB is running on port 27017
) else (
    echo ❌ MongoDB is not running
    echo.
    echo Options to start MongoDB:
    echo   1. Docker: docker-compose up -d mongodb
    echo   2. Local: net start MongoDB
    echo   3. Manual: mongod --dbpath C:\data\db
)
echo.
pause
goto menu

:fix_backend_deps
echo.
echo Installing Backend dependencies...
cd backend
npm install
if %errorlevel% equ 0 (
    echo ✅ Backend dependencies installed successfully
) else (
    echo ❌ Failed to install dependencies
)
cd ..
echo.
pause
goto menu

:fix_ml_deps
echo.
echo Installing ML Service dependencies...
cd ml-service
pip install -r requirements.txt
if %errorlevel% equ 0 (
    echo ✅ ML dependencies installed successfully
) else (
    echo ❌ Failed to install dependencies
)
cd ..
echo.
pause
goto menu

:fix_port_5000
echo.
echo Killing process on port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000"') do (
    echo Killing process %%a
    taskkill /F /PID %%a >nul 2>&1
)
echo ✅ Port 5000 is now free
echo.
pause
goto menu

:fix_port_5001
echo.
echo Killing process on port 5001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5001"') do (
    echo Killing process %%a
    taskkill /F /PID %%a >nul 2>&1
)
echo ✅ Port 5001 is now free
echo.
pause
goto menu

:fix_uploads
echo.
echo Creating uploads directory...
if not exist "backend\uploads" (
    mkdir backend\uploads
    echo ✅ Created backend\uploads directory
) else (
    echo ✅ backend\uploads already exists
)
echo.
pause
goto menu

:fix_env
echo.
echo Checking .env file...
if not exist "backend\.env" (
    echo ❌ .env file not found
    echo Creating from .env.example...
    copy backend\.env.example backend\.env
    echo ✅ Created backend\.env
    echo.
    echo ⚠️  IMPORTANT: Edit backend\.env and set:
    echo    - JWT_SECRET (change from default)
    echo    - MONGODB_URI (if not using default)
    echo    - EMAIL credentials (if using email features)
) else (
    echo ✅ .env file exists
)
echo.
pause
goto menu

:clear_all
echo.
echo Clearing all caches and temporary files...
echo.

REM Clear npm cache
echo Clearing npm cache...
cd backend
call npm cache clean --force >nul 2>&1
cd ..
echo ✅ npm cache cleared

REM Clear Python cache
echo Clearing Python cache...
cd ml-service
for /d /r %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"
del /s /q *.pyc >nul 2>&1
cd ..
echo ✅ Python cache cleared

REM Clear node_modules (optional)
echo.
set /p clear_modules="Clear node_modules? (y/n): "
if /i "%clear_modules%"=="y" (
    echo Removing node_modules...
    rd /s /q backend\node_modules >nul 2>&1
    rd /s /q frontend\node_modules >nul 2>&1
    echo ✅ node_modules removed
    echo.
    echo Run fix option 2 to reinstall backend dependencies
)

echo.
echo ✅ All caches cleared
echo.
pause
goto menu

:system_check
echo.
call check-system-detailed.bat
goto menu

:end
echo.
echo Goodbye!
exit /b 0
