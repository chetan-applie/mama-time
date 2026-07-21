@echo off
setlocal
cd /d "%~dp0"
where docker >nul 2>nul || (echo Docker Desktop with Compose is required for the one-command start.& pause & exit /b 1)
where node >nul 2>nul || (echo Node.js is required to generate the environment file.& pause & exit /b 1)
if not exist .env call npm run setup -- --docker=1
call docker compose up -d --build
call docker compose ps
echo.
echo Landing page: http://localhost:3000/
echo Backoffice:    http://localhost:3000/admin
echo.
pause
