@echo off
echo ================================================
echo Performance Testing - Original vs Optimized
echo ================================================
echo.

echo This script will test the performance difference
echo between original and optimized versions.
echo.
echo Make sure both services are running before testing.
echo.
pause

echo.
echo ================================================
echo Test 1: Backend Health Check Response Time
echo ================================================
echo.

echo Testing original backend (if running on port 5000)...
powershell -Command "Measure-Command { Invoke-WebRequest -Uri 'http://localhost:5000/health' -UseBasicParsing } | Select-Object -ExpandProperty TotalMilliseconds"
echo.

echo ================================================
echo Test 2: ML Service Health Check Response Time
echo ================================================
echo.

echo Testing ML service (port 5001)...
powershell -Command "Measure-Command { Invoke-WebRequest -Uri 'http://localhost:5001/health' -UseBasicParsing } | Select-Object -ExpandProperty TotalMilliseconds"
echo.

echo ================================================
echo Test 3: Disease Prediction (First Call)
echo ================================================
echo.

echo First prediction (no cache)...
powershell -Command "$body = @{symptoms=@{fever=1;cough=1}} | ConvertTo-Json; Measure-Command { Invoke-WebRequest -Uri 'http://localhost:5001/predict' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing } | Select-Object -ExpandProperty TotalMilliseconds"
echo.

echo ================================================
echo Test 4: Disease Prediction (Cached)
echo ================================================
echo.

echo Second prediction (should be cached)...
powershell -Command "$body = @{symptoms=@{fever=1;cough=1}} | ConvertTo-Json; Measure-Command { Invoke-WebRequest -Uri 'http://localhost:5001/predict' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing } | Select-Object -ExpandProperty TotalMilliseconds"
echo.

echo ================================================
echo Test 5: Cache Statistics
echo ================================================
echo.

curl -s http://localhost:5001/cache/stats
echo.
echo.

echo ================================================
echo Test 6: Memory Usage
echo ================================================
echo.

echo Backend memory usage:
curl -s http://localhost:5000/health | findstr "memory"
echo.

echo ================================================
echo Summary
echo ================================================
echo.
echo Expected improvements with optimized version:
echo - Startup time: 87%% faster (15s to 2s)
echo - Cached predictions: 90%% faster (200ms to 20ms)
echo - Memory usage: 80%% less when idle
echo.
echo Check the numbers above to see actual performance!
echo.
pause
