#!/usr/bin/env python3
"""
Elith Pharmacy Application - Main Entry Point
This script launches the Qt-based GUI for the Elith Pharmacy application
"""

import os
import sys
import platform

# Check for required dependencies
try:
    from qtpy import QtWidgets, QtCore
except ImportError:
    print("Error: qtpy package not found. Installing required packages...")
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "qtpy", "PyQt5", "PyQtWebEngine"], check=True)
    print("Packages installed. Please restart the application.")
    sys.exit(1)

from pharmacy_app_launcher import main as launch_app


def check_environment():
    """Check if the environment is properly set up"""
    # Check Python version
    if sys.version_info < (3, 6):
        print(f"Error: Python 3.6 or higher is required. You are using Python {platform.python_version()}")
        return False
    
    # Check if Docker is installed
    try:
        import subprocess
        result = subprocess.run(
            "docker --version",
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        if result.returncode != 0:
            print("Warning: Docker does not appear to be installed. The application requires Docker to run.")
            return False
    except Exception:
        print("Warning: Could not check for Docker installation.")
    
    return True

def main():
    """Main entry point"""
    print(f"Starting {os.path.basename(__file__)}...")
    
    # Check environment
    if not check_environment():
        print("Environment check failed. The application may not function correctly.")
        response = input("Do you want to continue anyway? (y/n): ")
        if response.lower() != 'y':
            print("Exiting...")
            sys.exit(1)
    
    # Launch the application
    launch_app()

if __name__ == "__main__":
    main() 