@echo off
setlocal enabledelayedexpansion

:: ============================================================================
:: Library LMS - Windows Task Scheduler Database Backup Job
:: ============================================================================

set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."
set "BACKEND_DIR=%PROJECT_ROOT%\backend"
set "CLI_SCRIPT=%BACKEND_DIR%\scripts\backup-cli.js"
set "LOG_DIR=%BACKEND_DIR%\backups"
set "LOG_FILE=%LOG_DIR%\task_scheduler.log"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo ========================================================= >> "%LOG_FILE%"
echo [!DATE! !TIME!] Triggering Windows Task Scheduler Backup Job >> "%LOG_FILE%"

:: Locate Node.js executable
where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    set "NODE_CMD=node"
) else if exist "C:\Program Files\nodejs\node.exe" (
    set "NODE_CMD=C:\Program Files\nodejs\node.exe"
) else if exist "C:\Program Files (x86)\nodejs\node.exe" (
    set "NODE_CMD=C:\Program Files (x86)\nodejs\node.exe"
) else (
    echo [!DATE! !TIME!] ERROR: Node.js executable not found in PATH! >> "%LOG_FILE%"
    exit /b 1
)

:: Run backup CLI
"%NODE_CMD%" "%CLI_SCRIPT%" --type auto --note "Windows Task Scheduler Daily Backup" >> "%LOG_FILE%" 2>&1
set "EXIT_CODE=%ERRORLEVEL%"

if %EXIT_CODE% equ 0 (
    echo [!DATE! !TIME!] Task Scheduler Backup completed successfully. >> "%LOG_FILE%"
) else (
    echo [!DATE! !TIME!] ERROR: Task Scheduler Backup failed with exit code %EXIT_CODE%. >> "%LOG_FILE%"
)

exit /b %EXIT_CODE%
