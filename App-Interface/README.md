# Elith Pharmacy App Interface

A Qt-based graphical user interface for managing the Elith Pharmacy application services.

## Features

- Integrated browser to access the Elith Pharmacy application
- One-click start/stop of all required services
- Automatic Supabase management
- Visual progress indicators and loading overlays
- Cross-platform support (Windows, macOS, Linux)

## Requirements

- Python 3.6 or higher
- Docker Desktop
- Qt dependencies (automatically installed if missing)

## Installation

1. Make sure you have Python 3.6+ installed
2. Navigate to the App-Interface directory
3. Run the main script:

```bash
python main.py
```

The script will automatically check for and install any missing dependencies.

## Usage

### Starting the Application

1. Launch the interface by running `python main.py`
2. Click the "Start Services" button
3. Wait for the services to initialize (Docker containers and Supabase)
4. The application will automatically load in the embedded browser

### Stopping the Application

1. Click the "Stop Services" button
2. Wait for all services to shut down properly
3. Close the launcher window

## Troubleshooting

### Docker Issues

- Ensure Docker Desktop is running before starting the application
- Check Docker logs if containers fail to start

### Supabase Issues

- If Supabase fails to start, try running `npx supabase start` manually in the Elith-Supabase directory
- Check that ports 54321 and 54322 are not in use by other applications

### Browser Issues

- Use the "Refresh" button if the application doesn't load properly
- Clear browser cache if you experience login or display issues

## Development

The App-Interface consists of the following components:

- `main.py` - Entry point script
- `pharmacy_app_launcher.py` - Main application window with embedded browser
- `loading_overlay.py` - Animated loading overlay for visual feedback

To modify the interface, edit these files and restart the application. 