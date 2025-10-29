@echo off
REM WhatsAI2 - Quick Start Script for Windows
REM Author: Rafael Halder
REM Date: 2025-10-29

echo ========================================
echo WhatsAI2 Quick Start for Windows
echo ========================================
echo.

REM Check Node.js
echo [INFO] Checking Node.js version...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo [INFO] Download from: https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js version:
node -v

REM Check .env
echo.
echo [INFO] Checking .env configuration...
if not exist "server\.env" (
    echo [WARN] server\.env not found. Creating from example...
    copy "server\.env.example" "server\.env"
    echo [ERROR] Please edit server\.env with your credentials
    pause
    exit /b 1
)
echo [OK] .env configuration found

REM Check dependencies
echo.
echo [INFO] Checking dependencies...
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm run install:all
    echo [OK] Dependencies installed
) else (
    echo [OK] Dependencies already installed
)

REM Clean ports
echo.
echo [INFO] Cleaning ports...
call npm run kill:ports
echo [OK] Ports cleaned

REM Check ngrok
echo.
echo [INFO] Checking ngrok...
where ngrok >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] ngrok installed
    set NGROK_INSTALLED=1
) else (
    echo [WARN] ngrok not installed
    echo [INFO] Install via: choco install ngrok
    echo [INFO] Or run without ngrok: npm run dev:no-tunnel
    set NGROK_INSTALLED=0
)

REM Menu
echo.
echo ========================================
echo Ready to start!
echo ========================================
echo.
echo Choose startup mode:
echo 1) Full mode (backend + frontend + ngrok)
echo 2) Local mode (backend + frontend only)
echo 3) Backend only
echo 4) Frontend only
echo.
set /p choice="Enter choice [1-4]: "

if "%choice%"=="1" (
    if %NGROK_INSTALLED%==1 (
        echo [INFO] Starting full mode...
        call npm run dev
    ) else (
        echo [ERROR] ngrok not installed. Using local mode instead...
        call npm run dev:no-tunnel
    )
) else if "%choice%"=="2" (
    echo [INFO] Starting local mode...
    call npm run dev:no-tunnel
) else if "%choice%"=="3" (
    echo [INFO] Starting backend only...
    call npm run dev:server
) else if "%choice%"=="4" (
    echo [INFO] Starting frontend only...
    call npm run dev:client
) else (
    echo [ERROR] Invalid choice. Exiting...
    pause
    exit /b 1
)
