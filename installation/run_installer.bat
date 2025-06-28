@echo off
echo Starting Elith Pharmacy Installer...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH.
    echo Please install Python 3.7 or higher from https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

REM Install requirements if needed
echo Installing required packages...
pip install -r requirements.txt

REM Run the installer
echo.
echo Launching installer...
python installer_app.py

echo.
if %errorlevel% neq 0 (
    echo Installation failed. Please check the logs.
    pause
) else (
    echo Installation completed.
)

exit /b 