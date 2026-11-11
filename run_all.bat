@echo off
title Smart Rail QR - Master Launcher
echo =======================================================
echo   Smart Rail QR - Intelligent Railway System Launcher
echo =======================================================
echo 1. Launching FastAPI Backend on http://localhost:8000
start "SmartRail Backend" cmd /c "%~dp0run_backend.bat"

timeout /t 3 /nobreak >nul

echo 2. Launching React Frontend on http://localhost:5173
start "SmartRail Frontend" cmd /c "%~dp0run_frontend.bat"

echo.
echo Application stack launched successfully!
echo Backend API Docs: http://localhost:8000/docs
echo Frontend Portal:  http://localhost:5173
echo.
pause
