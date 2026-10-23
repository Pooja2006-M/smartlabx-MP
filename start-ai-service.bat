@echo off
title SmartLabX AI Proctoring Service
setlocal
cd /d "%~dp0SmartLabX\ai-service"

set "PY=%~dp0.venv\Scripts\python.exe"
if not exist "%PY%" (
  echo [ERROR] Python venv not found at "%PY%".
  echo         Create it and install requirements, then run this script again.
  pause
  exit /b 1
)

echo ================================================================
echo   SmartLabX AI Proctoring Service  (port 8000)
echo   Keep this window OPEN while the exam / viva is running.
echo   It auto-restarts if the service ever stops.
echo ================================================================
echo.

:loop
echo [%date% %time%] Starting AI service...
"%PY%" main.py
set "EXITCODE=%errorlevel%"
echo.
echo [%date% %time%] AI service stopped (exit code %EXITCODE%).
echo Restarting automatically in 3 seconds...  (Press Ctrl+C to quit)
timeout /t 3 /nobreak >nul
goto loop
