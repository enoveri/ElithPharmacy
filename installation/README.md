# Elith Pharmacy Installer

This is a Qt-based GUI installer for Elith Pharmacy that simplifies the installation process.

## Features

- User-friendly installation wizard
- Automatic system requirements checking
- Docker installation assistance
- Supabase setup automation
- Automatic configuration of startup services
- Support for both easy and advanced installation modes

## Prerequisites

- Python 3.7 or higher
- Internet connection
- Administrative privileges (for Docker installation and service configuration)

## Getting Started

1. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Run the installer:
   ```
   python installer_app.py
   ```

## Building a Standalone Executable

You can build a standalone executable using PyInstaller:

1. Install PyInstaller:
   ```
   pip install pyinstaller
   ```

2. Build the executable:
   ```
   pyinstaller --onefile --windowed installer_app.py
   ```

3. The executable will be created in the `dist` directory.

## Installation Modes

### Easy Installation (Recommended)

- Downloads pre-built Docker containers
- Automatically configures all components
- Minimal user intervention required

### Advanced Installation

- Builds Docker containers from source
- Allows for more customization
- Requires more technical knowledge

## Post-Installation

After installation, the Elith Pharmacy application can be launched from:
- The App-Interface directory
- The startup menu (if configured during installation)
- The desktop shortcut (if created during installation)

## Troubleshooting

If you encounter issues during installation:

1. Check the installation logs in `%USERPROFILE%\ElithPharmacy\installer.log`
2. Ensure Docker Desktop is running properly
3. Verify that all ports required by the application are available
4. Check system requirements (RAM, disk space) 