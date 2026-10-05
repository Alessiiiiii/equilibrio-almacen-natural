@echo off
title Sincronizar Catalogo desde Google Drive - Equilibrio Distribuciones
echo ========================================================
echo   Equilibrio Distribuciones - Almacen Natural
echo   Sincronizando catalogo con Google Drive...
echo ========================================================
node scripts/sync_drive.js
echo.
echo ========================================================
echo Proceso finalizado. Presiona cualquier tecla para salir.
echo ========================================================
pause >nul
