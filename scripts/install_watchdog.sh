#!/bin/bash

# Elith Pharmacy Watchdog Installer
# This script detects the operating system and runs the appropriate installation script

# Define paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LINUX_INSTALLER="$SCRIPT_DIR/install_watchdog_linux.sh"
WINDOWS_INSTALLER="$SCRIPT_DIR/install_watchdog_windows.ps1"

# Function to detect operating system
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

# Main execution
OS=$(detect_os)
echo "Detected operating system: $OS"

case "$OS" in
    linux)
        echo "Running Linux installer..."
        if [ -f "$LINUX_INSTALLER" ]; then
            chmod +x "$LINUX_INSTALLER"
            exec "$LINUX_INSTALLER"
        else
            echo "Error: Linux installer script not found at $LINUX_INSTALLER"
            exit 1
        fi
        ;;
    windows)
        echo "Running Windows installer..."
        if [ -f "$WINDOWS_INSTALLER" ]; then
            # Check if we can run PowerShell
            if command -v powershell.exe &> /dev/null; then
                powershell.exe -ExecutionPolicy Bypass -File "$WINDOWS_INSTALLER"
            else
                echo "Error: PowerShell not found. Please run the Windows installer directly."
                echo "You can find it at: $WINDOWS_INSTALLER"
                exit 1
            fi
        else
            echo "Error: Windows installer script not found at $WINDOWS_INSTALLER"
            exit 1
        fi
        ;;
    macos)
        echo "macOS is not currently supported by this installer."
        echo "Please use the Linux installer as a reference to set up the watchdog on macOS."
        exit 1
        ;;
    *)
        echo "Unsupported operating system. Please install manually."
        echo "Windows installer: $WINDOWS_INSTALLER"
        echo "Linux installer: $LINUX_INSTALLER"
        exit 1
        ;;
esac 