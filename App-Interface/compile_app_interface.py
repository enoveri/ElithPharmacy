#!/usr/bin/env python3
"""
Elith Pharmacy App Interface - Compilation Script
This script compiles the App-Interface into a standalone executable
"""

import os
import sys
import subprocess
import shutil
import platform

def check_requirements():
    """Check if all required packages are installed"""
    print("Checking requirements...")
    
    # Check if PyInstaller is installed
    try:
        import PyInstaller
        print("PyInstaller is already installed.")
    except ImportError:
        print("PyInstaller not found. Installing...")
        subprocess.run([sys.executable, "-m", "pip", "install", "PyInstaller"], check=True)
    
    # Check if required packages are installed
    required_packages = ["qtpy", "PyQt6", "PyQt6-WebEngine"]
    for package in required_packages:
        try:
            __import__(package.replace("-", "_").split("==")[0])
            print(f"{package} is already installed.")
        except ImportError:
            print(f"{package} not found. Installing...")
            subprocess.run([sys.executable, "-m", "pip", "install", package], check=True)

def compile_application():
    """Compile the application using PyInstaller"""
    print("\nCompiling Elith Pharmacy App Interface...")
    
    # Get current directory (should be App-Interface)
    current_dir = os.path.abspath(os.getcwd())
    
    # Fix path for Windows - replace backslashes with forward slashes
    current_dir_fixed = current_dir.replace("\\", "/")
    
    # Create the spec file content
    spec_content = f"""# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['main.py'],
    pathex=[r'{current_dir_fixed}'],
    binaries=[],
    datas=[],
    hiddenimports=['PyQt6', 'PyQt6.QtWebEngineWidgets', 'PyQt6.QtWebEngineCore'],
    hookspath=[],
    hooksconfig={{}},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='ElithPharmacy',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='ElithPharmacy',
)
"""
    
    # Write the spec file
    spec_file = os.path.join(current_dir, "ElithPharmacy.spec")
    with open(spec_file, "w") as f:
        f.write(spec_content)
    
    # Run PyInstaller
    pyinstaller_cmd = [
        "pyinstaller",
        "--noconfirm",
        "--clean",
        "ElithPharmacy.spec"
    ]
    
    print(f"Running: {' '.join(pyinstaller_cmd)}")
    result = subprocess.run(pyinstaller_cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print("Error during compilation:")
        print(result.stderr)
        return False
    
    print("Compilation successful!")
    
    # Clean up spec file
    if os.path.exists(spec_file):
        os.remove(spec_file)
    
    print(f"\nExecutable created at: {os.path.abspath(os.path.join('dist', 'ElithPharmacy'))}")
    return True

def main():
    """Main entry point"""
    print("=" * 60)
    print("Elith Pharmacy App Interface - Compilation Script")
    print("=" * 60)
    
    # Check if we're in the right directory
    if not os.path.exists("main.py") or not os.path.exists("pharmacy_app_launcher.py"):
        print("Error: This script must be run from the App-Interface directory.")
        print("Current directory:", os.getcwd())
        print("Please navigate to the App-Interface directory.")
        return 1
    
    # Check requirements
    try:
        check_requirements()
    except subprocess.CalledProcessError as e:
        print(f"Error installing requirements: {e}")
        return 1
    
    # Compile the application
    if not compile_application():
        return 1
    
    print("\nCompilation completed successfully!")
    print("=" * 60)
    return 0

if __name__ == "__main__":
    sys.exit(main()) 