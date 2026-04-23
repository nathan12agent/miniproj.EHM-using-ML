@echo off
echo ========================================
echo Stopping All Services...
echo ========================================
echo.

echo Stopping Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

echo Stopping MongoDB...
taskkill /F /IM mongod.exe >nul 2>&1

echo.
echo ========================================
echo All services stopped!
echo ========================================
echo.
echo Press any key to exit...
pause >nul
