# Elith Pharmacy Watchdog Installation Script for Windows
# This script installs the Elith Pharmacy watchdog service to run at system startup

# Ensure we're running with administrator privileges
function Test-Administrator {
    $currentUser = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Administrator)) {
    Write-Host "This script requires administrator privileges. Please run as administrator." -ForegroundColor Red
    Write-Host "Right-click the PowerShell icon and select 'Run as administrator', then run this script again."
    exit 1
}

# Define paths
$scriptPath = $PSScriptRoot
$watchdogScript = Join-Path -Path $scriptPath -ChildPath "watchdog.ps1"
$logFile = "$env:USERPROFILE\ElithPharmacy\watchdog_install.log"

# Create log directory if it doesn't exist
$logDir = Split-Path -Parent $logFile
if (-not (Test-Path -Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

# Function to write to log file
function Write-Log {
    param (
        [string]$message,
        [string]$level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$level] $message"
    Add-Content -Path $logFile -Value $logMessage
    
    # Also output to console
    if ($level -eq "ERROR") {
        Write-Host $logMessage -ForegroundColor Red
    } elseif ($level -eq "WARNING") {
        Write-Host $logMessage -ForegroundColor Yellow
    } elseif ($level -eq "SUCCESS") {
        Write-Host $logMessage -ForegroundColor Green
    } else {
        Write-Host $logMessage
    }
}

# Check if watchdog script exists
if (-not (Test-Path -Path $watchdogScript)) {
    Write-Log "Watchdog script not found at: $watchdogScript" -level "ERROR"
    exit 1
}

# Function to create a scheduled task to run the watchdog at startup
function Register-WatchdogTask {
    try {
        $taskName = "ElithPharmacyWatchdog"
        
        # Check if task already exists
        $existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
        
        if ($existingTask) {
            Write-Log "Watchdog task already exists. Removing old task..." -level "INFO"
            Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        }
        
        # Create the task
        $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$watchdogScript`""
        $trigger = New-ScheduledTaskTrigger -AtLogon
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable
        $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest
        
        Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Elith Pharmacy Watchdog Service"
        
        Write-Log "Watchdog task registered successfully" -level "SUCCESS"
        return $true
    }
    catch {
        Write-Log "Error registering watchdog task: $_" -level "ERROR"
        return $false
    }
}

# Function to create a desktop shortcut to manually start the watchdog
function Create-WatchdogShortcut {
    try {
        $desktopPath = [Environment]::GetFolderPath("Desktop")
        $shortcutPath = Join-Path -Path $desktopPath -ChildPath "Start Elith Pharmacy Watchdog.lnk"
        
        $WshShell = New-Object -ComObject WScript.Shell
        $shortcut = $WshShell.CreateShortcut($shortcutPath)
        $shortcut.TargetPath = "powershell.exe"
        $shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$watchdogScript`""
        $shortcut.WorkingDirectory = $scriptPath
        $shortcut.Description = "Start Elith Pharmacy Watchdog"
        $shortcut.Save()
        
        Write-Log "Desktop shortcut created successfully" -level "SUCCESS"
        return $true
    }
    catch {
        Write-Log "Error creating desktop shortcut: $_" -level "ERROR"
        return $false
    }
}

# Main installation process
Write-Log "Starting Elith Pharmacy Watchdog installation for Windows" -level "INFO"

# Register the watchdog as a startup task
Write-Log "Registering watchdog as a startup task..."
$taskRegistered = Register-WatchdogTask

if ($taskRegistered) {
    Write-Log "Watchdog service has been successfully installed to run at system startup" -level "SUCCESS"
    
    # Create desktop shortcut
    Write-Log "Creating desktop shortcut for manual startup..."
    Create-WatchdogShortcut
    
    # Start the watchdog immediately
    $startNow = Read-Host "Do you want to start the watchdog service now? (Y/N)"
    if ($startNow -eq "Y" -or $startNow -eq "y") {
        Write-Log "Starting watchdog service..."
        Start-Process -FilePath "powershell.exe" -ArgumentList "-ExecutionPolicy Bypass -File `"$watchdogScript`"" -WindowStyle Minimized
        Write-Log "Watchdog service started" -level "SUCCESS"
    }
    
    Write-Log "Installation completed successfully" -level "SUCCESS"
    Write-Host "Installation log saved to: $logFile"
} else {
    Write-Log "Failed to install watchdog service" -level "ERROR"
    exit 1
} 