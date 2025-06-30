# Git Update Functionality for Elith Pharmacy

This document explains how to use the git update functionality that has been added to the Elith Pharmacy application. This feature allows the application to automatically check for updates from a git repository and apply them when available.

## Features

- Automatic checking for updates during application startup
- Periodic checking for updates by the watchdog service
- Automatic rebuilding of Docker containers after updates (only when actual changes are applied)
- Support for private repositories using access tokens
- Resilient update mechanism with error recovery
- Works on both Windows and Linux systems

## Setup Instructions

### Windows

1. Open PowerShell and navigate to the Elith Pharmacy directory
2. Run the following command to set up git configuration:

```powershell
.\scripts\start_pharmacy_app.ps1 -config
```

3. Follow the prompts to enter:
   - Git repository URL (e.g., https://github.com/username/ElithPharmacy.git)
   - Branch name to track (e.g., main, master, develop)
   - Git access token (if using a private repository)
   - Working directory path (leave empty to use current directory)

### Linux

1. Open a terminal and navigate to the Elith Pharmacy directory
2. Run the following command to set up git configuration:

```bash
bash ./scripts/start_pharmacy_app.sh -config
```

3. Follow the prompts to enter the same information as in the Windows instructions

## Usage

### Automatic Updates

Once configured, the application will:

- Check for updates every time it starts
- The watchdog service will check for updates every 6 hours
- If updates are found, they will be automatically applied
- Docker containers will be rebuilt only when actual changes are pulled from the repository
- If the repository is already up to date, no rebuilding occurs

### Manual Updates

#### Windows

To manually check for updates and apply them:

```powershell
.\scripts\start_pharmacy_app.ps1 -update
```

or

```powershell
.\scripts\watchdog.ps1 -update
```

#### Linux

To manually check for updates and apply them:

```bash
bash ./scripts/start_pharmacy_app.sh -update
```

or

```bash
bash ./scripts/watchdog.sh -update
```

## Configuration File

The git configuration is stored in a JSON file at:

- Windows: `%USERPROFILE%\ElithPharmacy\git_config.json`
- Linux: `$HOME/ElithPharmacy/git_config.json`

The file contains the following information:

```json
{
  "RepoUrl": "https://github.com/username/ElithPharmacy.git",
  "Branch": "main",
  "Token": "your_access_token",
  "WorkingDir": "/path/to/ElithPharmacy",
  "LastUpdated": "2023-06-15 12:34:56"
}
```

## Troubleshooting

### Update Failures

If updates fail to apply, check the following:

1. Verify internet connectivity
2. Ensure the git access token is valid and has appropriate permissions
3. Check if the repository URL and branch name are correct
4. Examine the log files for more detailed error information:
   - Windows: `%USERPROFILE%\ElithPharmacy\app_startup.log` or `%USERPROFILE%\ElithPharmacy\watchdog.log`
   - Linux: `$HOME/ElithPharmacy/app_startup.log` or `$HOME/ElithPharmacy/watchdog.log`

### Manual Reset

If the local repository becomes corrupted or has conflicts that prevent updates:

1. Navigate to the working directory
2. Run the following git commands:

```bash
git fetch origin
git reset --hard origin/your-branch-name
```

Replace `your-branch-name` with the branch you're tracking (e.g., main, master).

## Security Notes

- The git access token is stored in plain text in the configuration file
- Ensure the configuration file has appropriate permissions to restrict access
- Consider using a token with limited scope, only allowing read access to the repository
- For production environments, consider implementing more secure token storage

## Logs

Update operations are logged to:

- Windows:
  - `%USERPROFILE%\ElithPharmacy\app_startup.log` (for updates during startup)
  - `%USERPROFILE%\ElithPharmacy\watchdog.log` (for periodic updates by the watchdog)

- Linux:
  - `$HOME/ElithPharmacy/app_startup.log` (for updates during startup)
  - `$HOME/ElithPharmacy/watchdog.log` (for periodic updates by the watchdog) 