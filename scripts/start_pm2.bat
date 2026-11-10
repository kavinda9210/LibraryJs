@echo off
setlocal enabledelayedexpansion

:: ============================================================================
:: Library LMS - PM2 Production Process Manager Startup (1-Click)
:: ============================================================================

echo ===========================================================================
echo       Library LMS - PM2 Production Process Manager Launcher
echo ===========================================================================
echo.

set "PROJECT_ROOT=%~dp0.."
cd /d "%PROJECT_ROOT%"

:: Check if PM2 is installed
call npx --yes pm2 -v >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [INFO] Installing PM2 process manager globally...
    call npm install -g pm2
)

echo Starting Library LMS backend and frontend services via PM2...
call npx pm2 start ecosystem.config.js

echo.
echo ===========================================================================
echo [STATUS] Current PM2 Process Status:
echo ===========================================================================
call npx pm2 status

echo.
echo Saving PM2 process list for auto-restart on reboot...
call npx pm2 save

echo.
echo [SUCCESS] Backend is running at http://localhost:5000
echo [SUCCESS] Frontend is running at http://localhost:3000
echo.
echo Useful PM2 commands:
echo   - View logs:   npx pm2 logs
echo   - Monitor:     npx pm2 monit
echo   - Stop all:    npx pm2 stop all
echo   - Restart all: npx pm2 restart all
echo.
pause
