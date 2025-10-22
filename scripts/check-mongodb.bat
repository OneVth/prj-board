@echo off
REM MongoDB 연결 상태 확인 스크립트

echo ====================================
echo MongoDB Connection Checker
echo ====================================
echo.

echo [1/3] Checking Docker Desktop status...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Desktop is not running
    echo.
    echo 💡 Solution: Start Docker Desktop from Windows Start Menu
    goto end
) else (
    echo ✅ Docker is available
)
echo.

echo [2/3] Checking MongoDB container status...
docker ps --filter "name=prj-board-mongodb" --format "{{.Status}}" | findstr "Up" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ MongoDB container is not running
    echo.
    echo 💡 Solution: Run "docker-compose up -d" in project directory
    goto end
) else (
    echo ✅ MongoDB container is running
)
echo.

echo [3/3] Testing MongoDB connection...
docker exec prj-board-mongodb mongosh --eval "db.runCommand({ ping: 1 })" --quiet >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Cannot connect to MongoDB
    goto end
) else (
    echo ✅ MongoDB connection successful!
)
echo.

echo ====================================
echo ✅ All checks passed! You're ready to go!
echo ====================================
goto end

:end
echo.
pause
