#!/usr/bin/env python3
"""
Build script for Elith Pharmacy Installer
This script creates a standalone executable for the installer using PyInstaller
"""

import os
import sys
import subprocess
import shutil
import platform

def main():
    print("Building Elith Pharmacy Installer...")
    
    # Check if PyInstaller is installed
    try:
        import PyInstaller
    except ImportError:
        print("PyInstaller not found. Installing...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller"], check=True)
    
    # Create build directory if it doesn't exist
    if not os.path.exists("build"):
        os.makedirs("build")
    
    # Clean previous build artifacts
    if os.path.exists("dist"):
        shutil.rmtree("dist")
    
    # Build the executable
    print("Building executable...")
    
    # Determine icon path based on platform
    icon_param = []
    if platform.system() == "Windows":
        icon_file = "installer_icon.ico"
        if os.path.exists(icon_file):
            icon_param = ["--icon", icon_file]
    elif platform.system() == "Darwin":  # macOS
        icon_file = "installer_icon.icns"
        if os.path.exists(icon_file):
            icon_param = ["--icon", icon_file]
    
    # Build command
    cmd = [
        "pyinstaller",
        "--onefile",
        "--windowed",
        "--name", "ElithPharmacyInstaller",
        "--add-data", "requirements.txt:.",
    ] + icon_param + ["installer.py"]
    
    # Run PyInstaller
    subprocess.run(cmd, check=True)
    
    print("Build complete!")
    print(f"Executable created at: {os.path.abspath(os.path.join('dist', 'ElithPharmacyInstaller'))}")
    
    # Copy additional files to dist directory
    print("Copying additional files...")
    
    # Example: Copy README
    if os.path.exists("README.md"):
        shutil.copy("README.md", os.path.join("dist", "README.md"))
    
    print("Done!")

if __name__ == "__main__":
    main() 