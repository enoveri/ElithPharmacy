@echo off
REM Elith Pharmacy Watchdog Installer for Windows
REM This batch file runs the PowerShell installer with proper permissions

echo Elith Pharmacy Watchdog Installer
echo ================================

REM Check for administrative privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running with administrator privileges...
) else (
    echo This installer requires administrator privileges.
    echo Please right-click this file and select "Run as administrator".
    pause
    exit /b 1
)

REM Get the directory of this batch file
set "SCRIPT_DIR=%~dp0"
set "PS_INSTALLER=%SCRIPT_DIR%install_watchdog_windows.ps1"

REM Check if the PowerShell script exists
if not exist "%PS_INSTALLER%" (
    echo Error: PowerShell installer script not found at:
    echo %PS_INSTALLER%
    pause
    exit /b 1
)

echo Running installer script...
powershell.exe -ExecutionPolicy Bypass -File "%PS_INSTALLER%"

REM Check if the PowerShell script executed successfully
if %errorLevel% == 0 (
    echo Installation completed successfully.
) else (
    echo Installation failed with error code: %errorLevel%
)

pause 