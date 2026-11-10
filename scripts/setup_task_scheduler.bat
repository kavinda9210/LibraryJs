@echo off
setlocal enabledelayedexpansion

:: ============================================================================
:: Library LMS - Windows Task Scheduler Setup (1-Click Installer)
:: Creates a daily scheduled task to backup SQLite database at 02:00 AM
:: ============================================================================

echo ===========================================================================
echo       Library LMS - Automatic Windows Task Scheduler Setup
echo ===========================================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "BAT_FILE=%SCRIPT_DIR%backup_job.bat"
set "TASK_NAME=LibraryLMS_Daily_Backup"
set "SCHEDULE_TIME=02:00"

if not exist "%BAT_FILE%" (
    echo [ERROR] Target backup script not found: %BAT_FILE%
    pause
    exit /b 1
)

echo Registering Windows Scheduled Task:
echo   - Task Name: %TASK_NAME%
echo   - Script:    %BAT_FILE%
echo   - Schedule:  Daily at %SCHEDULE_TIME%
echo.

:: Register task using schtasks
schtasks /create /tn "%TASK_NAME%" /tr "\"%BAT_FILE%\"" /sc daily /st %SCHEDULE_TIME% /f

if %ERRORLEVEL% equ 0 (
    echo.
    echo ===========================================================================
    echo [SUCCESS] Windows Task "%TASK_NAME%" has been created successfully!
    echo ===========================================================================
    echo.
    echo The database will automatically backup every day at %SCHEDULE_TIME%.
    echo Backups are saved in: backend\backups\
    echo.
    set /p RUN_NOW="Would you like to run a test backup right now? (Y/N): "
    if /i "!RUN_NOW!"=="Y" (
        echo Running test backup now...
        schtasks /run /tn "%TASK_NAME%"
        timeout /t 3 >nul
        echo Check the logs in backend\backups\task_scheduler.log
    )
) else (
    echo.
    echo [ERROR] Failed to register scheduled task.
    echo Please make sure you run this script as Administrator (Right click -> Run as administrator).
)

echo.
pause
