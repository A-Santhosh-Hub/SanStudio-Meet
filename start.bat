@echo off
title SanStudio Meet
color 0B
echo.
echo  ======================================================
echo    SanStudio Meet - Starting (HTTPS Mode)
echo  ======================================================
echo.

echo  [0/3] Clearing old processes on ports 3001 and 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001 " ^| findstr "LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173 " ^| findstr "LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

echo  [1/3] Starting Signaling Server on port 3001...
start "SanStudio Meet - Server" cmd /k "cd /d d:\My_Software\ZOOM\server && node server.js"
timeout /t 2 /nobreak >nul

echo  [2/3] Starting React Client (HTTPS + LAN mode)...
start "SanStudio Meet - Client" cmd /k "cd /d d:\My_Software\ZOOM\client && npm run dev"
timeout /t 5 /nobreak >nul

echo.
echo  ======================================================
echo    Local:    https://localhost:5173
echo    Network:  https://192.168.7.16:5173
echo  ======================================================
echo.
echo  NOTE: Browser will show "Your connection is not private"
echo  Click "Advanced" then "Proceed to localhost (unsafe)" to continue.
echo  This is normal for self-signed dev certificates.
echo.

start https://localhost:5173
