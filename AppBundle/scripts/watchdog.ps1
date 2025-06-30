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
$gitUpdateIntervalHours = 6  # Check for git updates every 6 hours
$gitConfigFile = "$env:USERPROFILE\ElithPharmacy\git_config.json"  # File to store git configuration

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

# Function to check if git is installed
function Test-GitInstalled {
    try {
        $gitVersion = git --version
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Git is installed: $gitVersion" -level "SUCCESS"
            return $true
        } else {
            Write-Log "Git command failed with exit code: $LASTEXITCODE" -level "ERROR"
            return $false
        }
    } catch {
        Write-Log "Git is not installed or not in PATH" -level "ERROR"
        return $false
    }
}

# Function to load git configuration
function Get-GitConfig {
    if (Test-Path -Path $gitConfigFile) {
        try {
            $config = Get-Content -Path $gitConfigFile -Raw | ConvertFrom-Json
            return $config
        } catch {
            Write-Log "Error reading git configuration file: $_" -level "ERROR"
            return $null
        }
    } else {
        Write-Log "Git configuration file not found at: $gitConfigFile" -level "WARNING"
        return $null
    }
}

# Function to check for updates and pull from git
function Update-FromGit {
    # Check if git is installed
    if (-not (Test-GitInstalled)) {
        Write-Log "Git is required for update functionality" -level "ERROR"
        return $false
    }
    
    # Load git configuration
    $config = Get-GitConfig
    if ($null -eq $config) {
        Write-Log "Git configuration not found. Skipping update check." -level "WARNING"
        return $false
    }
    
    # Extract configuration values
    $repoUrl = $config.RepoUrl
    $branch = $config.Branch
    $token = $config.Token
    $workingDir = $config.WorkingDir
    
    # Validate configuration
    if ([string]::IsNullOrEmpty($repoUrl) -or [string]::IsNullOrEmpty($branch) -or [string]::IsNullOrEmpty($workingDir)) {
        Write-Log "Invalid git configuration. Missing required values." -level "ERROR"
        return $false
    }
    
    # Check if working directory exists
    if (-not (Test-Path -Path $workingDir)) {
        Write-Log "Working directory does not exist: $workingDir" -level "ERROR"
        return $false
    }
    
    # Navigate to working directory
    Push-Location $workingDir
    
    try {
        Write-Log "Checking for updates in repository: $repoUrl (branch: $branch)" -level "INFO"
        
        # Check if this is a git repository
        $isGitRepo = git rev-parse --is-inside-work-tree 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Log "The directory is not a git repository: $workingDir" -level "ERROR"
            return $false
        }
        
        # Construct the remote URL with token
        $repoUrlWithToken = $repoUrl
        if (-not [string]::IsNullOrEmpty($token)) {
            # Extract protocol, domain, and path from URL
            if ($repoUrl -match "^(https?://)([^/]+)(.*)$") {
                $protocol = $matches[1]
                $domain = $matches[2]
                $path = $matches[3]
                $repoUrlWithToken = "${protocol}oauth2:${token}@${domain}${path}"
            } else {
                Write-Log "Invalid repository URL format" -level "ERROR"
                return $false
            }
        }
        
        # Fetch the latest changes
        Write-Log "Fetching latest changes..." -level "INFO"
        $fetchOutput = git fetch origin $branch 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Failed to fetch from remote repository: $fetchOutput" -level "ERROR"
            return $false
        }
        
        # Check if we're behind the remote
        $status = git status -uno 2>&1
        $behindPattern = "Your branch is behind 'origin/$branch' by (\d+) commit"
        $needsUpdate = $false
        
        if ($status -match $behindPattern) {
            $commitsBehind = $matches[1]
            Write-Log "Repository is behind by $commitsBehind commits" -level "WARNING"
            $needsUpdate = $true
        } elseif ($status -match "Your branch is up to date") {
            Write-Log "Repository is up to date with origin/$branch" -level "SUCCESS"
            return $false  # No update needed
        } else {
            Write-Log "Unable to determine update status. Skipping update." -level "WARNING"
            return $false
        }
        
        if ($needsUpdate) {
            # Stash any local changes
            Write-Log "Stashing local changes..." -level "INFO"
            git stash 2>&1 | Out-Null
            
            # Pull the latest changes
            Write-Log "Pulling latest changes from origin/$branch..." -level "INFO"
            $pullOutput = git pull origin $branch 2>&1
            if ($LASTEXITCODE -ne 0) {
                Write-Log "Failed to pull latest changes: $pullOutput" -level "ERROR"
                
                # Try to recover by resetting to origin
                Write-Log "Attempting to recover by hard reset..." -level "WARNING"
                git reset --hard origin/$branch 2>&1 | Out-Null
                
                if ($LASTEXITCODE -ne 0) {
                    Write-Log "Failed to reset to origin/$branch" -level "ERROR"
                    return $false
                } else {
                    Write-Log "Successfully reset to origin/$branch" -level "SUCCESS"
                }
            } else {
                Write-Log "Successfully pulled latest changes" -level "SUCCESS"
            }
            
            # Update last updated timestamp
            $config.LastUpdated = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            $config | ConvertTo-Json | Out-File -FilePath $gitConfigFile -Force
            
            # Return true to indicate that an update was performed
            return $true
        }
        
        return $false  # No update performed
    } catch {
        Write-Log "Error during git update: $_" -level "ERROR"
        return $false
    } finally {
        # Return to original directory
        Pop-Location
    }
}

# Function to rebuild Docker containers after update
function Rebuild-DockerContainers {
    try {
        Write-Log "Rebuilding Docker containers..." -level "INFO"
        
        # Stop existing containers
        docker-compose down
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Warning: Failed to stop existing containers" -level "WARNING"
            # Continue anyway as this might be the first run
        }
        
        # Rebuild and start containers
        docker-compose up -d --build
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Failed to rebuild Docker containers" -level "ERROR"
            return $false
        }
        
        Write-Log "Docker containers rebuilt successfully" -level "SUCCESS"
        return $true
    } catch {
        Write-Log "Error rebuilding Docker containers: $_" -level "ERROR"
        return $false
    }
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
    Write-Log "Checking for git updates every $gitUpdateIntervalHours hours"
    Write-Log "Press Ctrl+C to stop the watchdog"
    
    $consecutiveFailures = 0
    $maxConsecutiveFailures = 3
    $lastRestartTime = [DateTime]::MinValue
    $lastGitUpdateCheck = [DateTime]::MinValue
    
    while ($true) {
        try {
            $currentTime = Get-Date
            
            # Check if services are running
            $serviceStatus = Test-AllServices
            
            if ($serviceStatus.AllRunning) {
                if ($consecutiveFailures -gt 0) {
                    Write-Log "All services are running again after previous failures" -level "SUCCESS"
                    # Send-Notification -title "$appName Watchdog" -message "Services are now running properly"
                    $consecutiveFailures = 0
                } else {
                    Write-Log "All services are running properly" -level "INFO"
                }
                
                # Check for git updates periodically
                $timeSinceLastGitCheck = $currentTime - $lastGitUpdateCheck
                if ($timeSinceLastGitCheck.TotalHours -ge $gitUpdateIntervalHours) {
                    Write-Log "Checking for git updates..." -level "INFO"
                    $updatePerformed = Update-FromGit
                    $lastGitUpdateCheck = $currentTime
                    
                    if ($updatePerformed -eq $true) {
                        Write-Log "Git updates found and applied. Rebuilding Docker containers..." -level "WARNING"
                        # Send-Notification -title "$appName Watchdog" -message "Updates found. Rebuilding application..."
                        
                        # Get git configuration to find docker-compose.yml
                        $config = Get-GitConfig
                        if ($null -ne $config -and (Test-Path -Path "$($config.WorkingDir)\docker-compose.yml")) {
                            # Navigate to working directory
                            Push-Location $config.WorkingDir
                            
                            try {
                                # Rebuild Docker containers
                                $rebuildSuccess = Rebuild-DockerContainers
                                
                                if ($rebuildSuccess) {
                                    Write-Log "Docker containers rebuilt successfully after update" -level "SUCCESS"
                                    # Send-Notification -title "$appName Watchdog" -message "Application updated and rebuilt successfully"
                                } else {
                                    Write-Log "Failed to rebuild Docker containers after update" -level "ERROR"
                                    # Send-Notification -title "$appName Watchdog" -message "Failed to rebuild application after update"
                                }
                            } finally {
                                # Return to original directory
                                Pop-Location
                            }
                        } else {
                            Write-Log "Docker compose file not found. Skipping rebuild." -level "WARNING"
                        }
                    } else {
                        Write-Log "Repository is already up to date. No rebuild needed." -level "SUCCESS"
                    }
                }
            } else {
                $consecutiveFailures++
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
                    $lastRestartTime = $currentTime
                    
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

if ($args.Contains("-update")) {
    # Force check for git updates
    Write-Log "Manually checking for git updates..." -level "INFO"
    $updatePerformed = Update-FromGit
    
    if ($updatePerformed) {
        Write-Log "Updates found and applied. Rebuilding Docker containers..." -level "WARNING"
        
        # Get git configuration to find docker-compose.yml
        $config = Get-GitConfig
        if ($null -ne $config -and (Test-Path -Path "$($config.WorkingDir)\docker-compose.yml")) {
            # Navigate to working directory
            Push-Location $config.WorkingDir
            
            try {
                # Rebuild Docker containers
                $rebuildSuccess = Rebuild-DockerContainers
                
                if ($rebuildSuccess) {
                    Write-Log "Docker containers rebuilt successfully after update" -level "SUCCESS"
                } else {
                    Write-Log "Failed to rebuild Docker containers after update" -level "ERROR"
                }
            } finally {
                # Return to original directory
                Pop-Location
            }
        } else {
            Write-Log "Docker compose file not found. Skipping rebuild." -level "WARNING"
        }
    } else {
        Write-Log "No updates found or unable to update" -level "INFO"
    }
    
    exit
}

# Start the watchdog
Start-Watchdog 