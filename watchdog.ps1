# Elith Pharmacy Watchdog Service
# This script continuously monitors the Elith Pharmacy services and automatically restarts them if they stop running
# To run at startup, create a scheduled task that runs this script with the -WindowStyle Hidden parameter

# Define application settings
$appName = "Elith Pharmacy"
$appUrl = "http://localhost:5173"  # The URL where the app is hosted
$supabasePort = 54321  # Default Supabase port
$supabaseStudioPort = 54322  # Supabase Studio port
$frontendPort = 5173  # Frontend port
$requiredPorts = @($supabasePort, $supabaseStudioPort, $frontendPort)
$startupScript = "$PSScriptRoot\start_pharmacy_app.ps1"
$logFile = "$env:USERPROFILE\ElithPharmacy\watchdog.log"
$checkIntervalSeconds = 300  # Check services every 5 minutes

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
    
    # Also output to console if not running hidden
    if ($Host.UI.RawUI.WindowTitle -ne "Hidden") {
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
}

# Function to check if a port is open
function Test-PortOpen {
    param (
        [int]$port
    )
    
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue -InformationLevel Quiet -TimeoutSeconds 15
        return $connection
    }
    catch {
        return $false
    }
}

# Function to check if Docker is running
function Test-DockerRunning {
    try {
        $dockerInfo = docker info 2>&1
        if ($LASTEXITCODE -eq 0) {
            return $true
        }
        return $false
    }
    catch {
        return $false
    }
}

# Function to check if Supabase is running
function Test-SupabaseRunning {
    return (Test-PortOpen -port $supabasePort)
}

# Function to check if Frontend is running
function Test-FrontendRunning {
    return (Test-PortOpen -port $frontendPort)
}

# Function to check all required services
function Test-AllServices {
    $dockerRunning = Test-DockerRunning
    $supabaseRunning = Test-SupabaseRunning
    $frontendRunning = Test-FrontendRunning
    
    $allRunning = $dockerRunning -and $supabaseRunning -and $frontendRunning
    
    $status = @{
        AllRunning = $allRunning
        Docker = $dockerRunning
        Supabase = $supabaseRunning
        Frontend = $frontendRunning
    }
    
    return $status
}

# Function to start services using the startup script
function Start-PharmacyServices {
    Write-Log "Starting Elith Pharmacy services..." -level "WARNING"
    
    try {
        # Check if the startup script exists
        if (-not (Test-Path -Path $startupScript)) {
            Write-Log "Startup script not found at: $startupScript" -level "ERROR"
            return $false
        }
        
        # Run the startup script
        Write-Log "Executing startup script: $startupScript"
        $startProcess = Start-Process -FilePath "powershell.exe" -ArgumentList "-ExecutionPolicy Bypass -File `"$startupScript`"" -Wait -PassThru
        
        if ($startProcess.ExitCode -ne 0) {
            Write-Log "Startup script failed with exit code: $($startProcess.ExitCode)" -level "ERROR"
            return $false
        }
        
        Write-Log "Startup script executed successfully" -level "SUCCESS"
        
        # Wait a bit for services to start
        Write-Log "Waiting for services to initialize..."
        Start-Sleep -Seconds 30
        
        # Verify services are running
        $serviceStatus = Test-AllServices
        
        if ($serviceStatus.AllRunning) {
            Write-Log "All services are now running" -level "SUCCESS"
            return $true
        } else {
            Write-Log "Some services failed to start:" -level "ERROR"
            if (-not $serviceStatus.Docker) { Write-Log "- Docker is not running" -level "ERROR" }
            if (-not $serviceStatus.Supabase) { Write-Log "- Supabase is not running" -level "ERROR" }
            if (-not $serviceStatus.Frontend) { Write-Log "- Frontend is not running" -level "ERROR" }
            return $false
        }
    }
    catch {
        Write-Log "Error starting services: $_" -level "ERROR"
        return $false
    }
}

# Function to send a notification (if on Windows 10/11)
function Send-Notification {
    param (
        [string]$title,
        [string]$message
    )
    
    try {
        # Check if running on Windows 10/11
        $osVersion = [System.Environment]::OSVersion.Version
        if ($osVersion.Major -ge 10) {
            # Use BurntToast module if available
            if (Get-Module -ListAvailable -Name BurntToast) {
                Import-Module BurntToast
                New-BurntToastNotification -Text $title, $message
            } else {
                # Fallback to Windows notification script
                $notification = New-Object -ComObject WScript.Shell
                $notification.Popup($message, 0, $title, 0x1)
            }
        }
    }
    catch {
        Write-Log "Failed to send notification: $_" -level "WARNING"
    }
}

# Main watchdog loop
function Start-Watchdog {
    Write-Log "$appName Watchdog Service Started" -level "SUCCESS"
    Write-Log "Monitoring services every $checkIntervalSeconds seconds"
    Write-Log "Press Ctrl+C to stop the watchdog"
    
    $consecutiveFailures = 0
    $maxConsecutiveFailures = 3
    $lastRestartTime = [DateTime]::MinValue
    
    while ($true) {
        try {
            $serviceStatus = Test-AllServices
            
            if ($serviceStatus.AllRunning) {
                if ($consecutiveFailures -gt 0) {
                    Write-Log "All services are running again after previous failures" -level "SUCCESS"
                    # Send-Notification -title "$appName Watchdog" -message "Services are now running properly"
                    $consecutiveFailures = 0
                } else {
                    Write-Log "All services are running properly" -level "INFO"
                }
            } else {
                $consecutiveFailures++
                $currentTime = Get-Date
                $timeSinceLastRestart = $currentTime - $lastRestartTime
                
                # Log which services are down
                Write-Log "Service check failed ($consecutiveFailures of $maxConsecutiveFailures):" -level "WARNING"
                if (-not $serviceStatus.Docker) { Write-Log "- Docker is not running" -level "WARNING" }
                if (-not $serviceStatus.Supabase) { Write-Log "- Supabase is not running" -level "WARNING" }
                if (-not $serviceStatus.Frontend) { Write-Log "- Frontend is not running" -level "WARNING" }
                
                # Only attempt restart if we've had multiple failures and it's been at least 10 minutes since last restart
                if ($consecutiveFailures -ge $maxConsecutiveFailures -and $timeSinceLastRestart.TotalMinutes -ge 10) {
                    Write-Log "Multiple service failures detected. Attempting to restart services..." -level "WARNING"
                    # Send-Notification -title "$appName Watchdog" -message "Services are down. Attempting to restart..."
                    
                    $restartSuccess = Start-PharmacyServices
                    $lastRestartTime = Get-Date
                    
                    if ($restartSuccess) {
                        $consecutiveFailures = 0
                        Write-Log "Services successfully restarted" -level "SUCCESS"
                        # Send-Notification -title "$appName Watchdog" -message "Services have been successfully restarted"
                    } else {
                        Write-Log "Failed to restart services" -level "ERROR"
                        # Send-Notification -title "$appName Watchdog" -message "Failed to restart services. Manual intervention may be required."
                    }
                } elseif ($timeSinceLastRestart.TotalMinutes -lt 10) {
                    Write-Log "Waiting before attempting another restart (minimum 10 minutes between restarts)" -level "INFO"
                }
            }
            
            # Wait for the next check interval
            Start-Sleep -Seconds $checkIntervalSeconds
        }
        catch {
            Write-Log "Error in watchdog loop: $_" -level "ERROR"
            Start-Sleep -Seconds 60  # Shorter interval if there was an error
        }
    }
}

# Check if running as administrator
function Test-Administrator {
    $currentUser = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Function to create a scheduled task to run this script at startup
function Register-StartupTask {
    if (-not (Test-Administrator)) {
        Write-Log "Administrator privileges required to register startup task" -level "ERROR"
        return $false
    }
    
    try {
        $taskName = "ElithPharmacyWatchdog"
        $scriptPath = $MyInvocation.MyCommand.Path
        
        # Check if task already exists
        $existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
        
        if ($existingTask) {
            Write-Log "Startup task already exists. Removing old task..." -level "INFO"
            Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        }
        
        # Create the task
        $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""
        $trigger = New-ScheduledTaskTrigger -AtLogon
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable
        $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest
        
        Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "$appName Watchdog Service"
        
        Write-Log "Startup task registered successfully" -level "SUCCESS"
        return $true
    }
    catch {
        Write-Log "Error registering startup task: $_" -level "ERROR"
        return $false
    }
}

# Check for command line arguments
if ($args.Contains("-register")) {
    # Register the watchdog as a startup task
    Register-StartupTask
    exit
}

# Start the watchdog
Start-Watchdog 