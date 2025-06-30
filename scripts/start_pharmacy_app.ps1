# Elith Pharmacy Application Startup Script
# This script implements the startup flow for the Elith Pharmacy application using Docker

# Define application setting
$appName = "Elith Pharmacy"
$appUrl = "http://localhost:5173"  # The URL where the app is hosted
$supabasePort = "54321"  # Default Supabase port
$logFile = "$env:USERPROFILE\ElithPharmacy\app_startup.log"
$frontendPort = 5173  # Added frontendPort variable
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

# Function to save git configuration
function Save-GitConfig {
    param (
        [string]$repoUrl,
        [string]$branch,
        [string]$token,
        [string]$workingDir
    )
    
    $config = @{
        RepoUrl = $repoUrl
        Branch = $branch
        Token = $token
        WorkingDir = $workingDir
        LastUpdated = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    }
    
    try {
        $config | ConvertTo-Json | Out-File -FilePath $gitConfigFile -Force
        Write-Log "Git configuration saved successfully" -level "SUCCESS"
        return $true
    } catch {
        Write-Log "Error saving git configuration: $_" -level "ERROR"
        return $false
    }
}

# Function to check for updates and pull from git
function Update-FromGit {
    param (
        [Parameter(Mandatory=$false)]
        [switch]$ForceUpdate
    )
    
    # Check if git is installed
    if (-not (Test-GitInstalled)) {
        Write-Log "Git is required for update functionality" -level "ERROR"
        return $false
    }
    
    # Load git configuration
    $config = Get-GitConfig
    if ($null -eq $config) {
        # If configuration doesn't exist, prompt for it
        if (-not $ForceUpdate) {
            Write-Log "Git configuration not found. Skipping update check." -level "WARNING"
            return $false  # No update performed
        }
        
        Write-Log "Git configuration not found. Please set up git configuration first." -level "ERROR"
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
            # Force update if status is unclear or if explicitly requested
            $needsUpdate = $ForceUpdate
            Write-Log "Unable to determine update status. Will proceed with update: $needsUpdate" -level "WARNING"
        }
        
        if ($needsUpdate -or $ForceUpdate) {
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

# Function to set up git configuration interactively
function Set-GitConfig {
    Write-Host "`nGit Configuration Setup" -ForegroundColor Cyan
    Write-Host "======================" -ForegroundColor Cyan
    
    # Get current directory as default working directory
    $defaultWorkingDir = Get-Location
    
    # Get configuration values from user
    $repoUrl = Read-Host "Enter the git repository URL (e.g., https://github.com/username/repo.git)"
    $branch = Read-Host "Enter the branch name to track (e.g., main)"
    $token = Read-Host "Enter your git access token (leave empty if not required)"
    $workingDir = Read-Host "Enter the working directory path (default: $defaultWorkingDir)"
    
    # Use default if working directory is empty
    if ([string]::IsNullOrEmpty($workingDir)) {
        $workingDir = $defaultWorkingDir
    }
    
    # Validate inputs
    if ([string]::IsNullOrEmpty($repoUrl) -or [string]::IsNullOrEmpty($branch)) {
        Write-Log "Repository URL and branch name are required" -level "ERROR"
        return $false
    }
    
    # Save configuration
    $saved = Save-GitConfig -repoUrl $repoUrl -branch $branch -token $token -workingDir $workingDir
    
    if ($saved) {
        Write-Host "Git configuration saved successfully" -ForegroundColor Green
        return $true
    } else {
        Write-Host "Failed to save git configuration" -ForegroundColor Red
        return $false
    }
}

# Function to check if the app is already running
function Test-AppRunning {
    # Check if the frontend port is open, indicating the app is running
    try {
        $appRunning = Test-NetConnection -ComputerName localhost -Port $frontendPort -WarningAction SilentlyContinue -InformationLevel Quiet -TimeoutSeconds 5
        
        if ($appRunning) {
            Write-Log "App is running on port $frontendPort" -level "SUCCESS"
            return $true
        }
    }
    catch {
        Write-Log "Error checking if app is running on port ${frontendPort}: $($_.Exception)" -level "WARNING"
    }
    
    # Also check if Docker containers are running
    try {
        $containers = docker ps --format "{{.Names}}" | Where-Object { $_ -like "*elithpharmacy*" -or $_ -like "*frontend*" }
        if ($null -ne $containers -and $containers.Count -gt 0) {
            Write-Log "Found running containers for $appName" -level "SUCCESS"
            return $true
        }
    }
    catch {
        # Docker might not be running, so just return false
        Write-Log "Docker not running or error checking containers" -level "WARNING"
    }
    
    return $false
}

# Function to check system resources
function Test-SystemResources {
    $minimumRamGB = 4
    $minimumDiskSpaceGB = 5
    
    # Check RAM
    $systemInfo = Get-CimInstance -ClassName Win32_ComputerSystem
    $totalRamGB = [math]::Round($systemInfo.TotalPhysicalMemory / 1GB, 2)
    
    # Check disk space
    $drive = Get-PSDrive -Name C
    $freeDiskSpaceGB = [math]::Round($drive.Free / 1GB, 2)
    
    Write-Log "System has $totalRamGB GB RAM and $freeDiskSpaceGB GB free disk space"
    
    if ($totalRamGB -lt $minimumRamGB) {
        Write-Log "Insufficient RAM. Minimum required: $minimumRamGB GB" -level "WARNING"
        return $false
    }
    
    if ($freeDiskSpaceGB -lt $minimumDiskSpaceGB) {
        Write-Log "Insufficient disk space. Minimum required: $minimumDiskSpaceGB GB" -level "WARNING"
        return $false
    }
    
    return $true
}

# Function to check if Docker is running and start it if needed
function Start-DockerService {
    # Check for Docker processes instead of just the service
    $dockerBackendProcess = Get-Process -Name "com.docker.backend" -ErrorAction SilentlyContinue
    $dockerServiceProcess = Get-Process -Name "com.docker.build" -ErrorAction SilentlyContinue
    
    if ($null -eq $dockerBackendProcess -and $null -eq $dockerServiceProcess) {
        # Fall back to checking the service if processes aren't found
        $dockerService = Get-Service -Name "Docker*" -ErrorAction SilentlyContinue
        
        if ($null -eq $dockerService) {
            Write-Log "Docker service not found. Please install Docker Desktop." -level "ERROR"
            return $false
        }
        
        if ($dockerService.Status -ne "Running") {
            Write-Log "Docker service is not running. Starting Docker..."
            Start-Service -Name $dockerService.Name
            
            # Wait for Docker to start (up to 60 seconds)
            $timeout = 60
            $timer = 0
            while ($timer -lt $timeout -and (Get-Service -Name $dockerService.Name).Status -ne "Running") {
                Start-Sleep -Seconds 1
                $timer++
            }
            
            if ((Get-Service -Name $dockerService.Name).Status -ne "Running") {
                Write-Log "Failed to start Docker service." -level "ERROR"
                return $false
            }
            
            # Give Docker a moment to fully initialize
            Start-Sleep -Seconds 5
        }
    } else {
        Write-Log "Docker processes are running" -level "SUCCESS"
    }
    
    # Check if docker command works
    try {
        docker info | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Docker is installed but not responding correctly." -level "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "Error checking Docker: $_" -level "ERROR"
        return $false
    }
    
    Write-Log "Docker service is running" -level "SUCCESS"
    return $true
}

# Function to check if Supabase is running
function Test-SupabaseRunning {
    try {
        # Check if port is responding
        $supabaseRunning = Test-NetConnection -ComputerName localhost -Port $supabasePort -WarningAction SilentlyContinue -InformationLevel Quiet
        
        if (-not $supabaseRunning) {
            Write-Log "Supabase is not running on port $supabasePort" -level "WARNING"
            return $false
        }
        
        Write-Log "Supabase is running on port $supabasePort" -level "SUCCESS"
        return $true
    }
    catch {
        Write-Log "Error checking Supabase: $_" -level "ERROR"
        return $false
    }
}

# Function to check internet connectivity
function Test-InternetConnectivity {
    try {
        $result = Test-NetConnection -ComputerName 8.8.8.8 -Port 53 -WarningAction SilentlyContinue -InformationLevel Quiet
        
        if ($result.TcpTestSucceeded) {
            Write-Log "Internet connectivity check passed" -level "SUCCESS"
            return $true
        } else {
            Write-Log "No internet connectivity detected" -level "WARNING"
            return $false
        }
    }
    catch {
        Write-Log "Error checking internet connectivity: $_" -level "WARNING"
        return $false
    }
}

# Function to find and start Supabase
function Start-Supabase {
    # Define possible locations for Elith-Supabase directory
    $possibleLocations = @(
        ".\Elith-Supabase",
        "..\Elith-Supabase",
        "$env:USERPROFILE\Documents\Elith-Supabase",
        "$env:USERPROFILE\Elith-Supabase"
    )
    
    $supabaseDir = $null
    
    # Find the Supabase directory
    foreach ($location in $possibleLocations) {
        if (Test-Path -Path $location) {
            $supabaseDir = $location
            Write-Log "Found Elith-Supabase directory at: $supabaseDir" -level "SUCCESS"
            break
        }
    }
    
    if ($null -eq $supabaseDir) {
        Write-Log "Could not find Elith-Supabase directory" -level "ERROR"
        return $false
    }
    
    # Navigate to the directory
    Push-Location $supabaseDir
    
    try {
        # Try to start Supabase with retry logic
        $maxRetries = 50
        $retryCount = 0
        $success = $false
        $portBindingErrorDetected = $false
        $denoErrorDetected = $false
        
        while (-not $success -and $retryCount -lt $maxRetries) {
            $retryCount++
            Write-Log "Attempting to start Supabase (Attempt $retryCount of $maxRetries)..." -level "INFO"
            
            # First stop any existing Supabase instance
            Write-Log "Stopping any existing Supabase instances..."
            npx supabase stop 2>&1 | Out-Null
            
            # Give it a moment to fully stop
            Start-Sleep -Seconds 3
            
            # If we detected a port binding error in a previous attempt, try to restart HNS service
            if ($portBindingErrorDetected -and $retryCount -gt 1) {
                Write-Log "Port binding error detected. Attempting to fix..." -level "WARNING"
                $hnsRestarted = Restart-HNSService
                
                if ($hnsRestarted) {
                    Write-Log "HNS service restarted successfully. Retrying Supabase start..." -level "SUCCESS"
                } else {
                    Write-Log "Could not restart HNS service. Continuing with Supabase start attempt..." -level "WARNING"
                }
            }
            
            # Start Supabase
            $output = npx supabase start 2>&1
            
            # Check if Supabase started successfully
            if ($output -match "Started supabase local development setup") {
                $success = $true
                Write-Log "Supabase started successfully" -level "SUCCESS"
            } else {
                # Check for specific deno.land error
                $errorOutput = $output -join "`n"
                if ($errorOutput -match "error sending request for url" -and $errorOutput -match "deno.land") {
                    $denoErrorDetected = $true
                    Write-Log "Detected Supabase edge runtime download error" -level "WARNING"
                    
                    # Check internet connectivity since this is likely the issue
                    if (-not (Test-InternetConnectivity)) {
                        Write-Log "Internet connectivity issue detected" -level "ERROR"
                        Write-Log "Supabase edge runtime cannot download required dependencies" -level "ERROR"
                        Write-Log "Please connect to the internet and try again" -level "ERROR"
                        return $false
                    } else {
                        Write-Log "Internet seems to be working, but Supabase still can't download dependencies" -level "WARNING"
                        Write-Log "This might be due to a temporary network issue or firewall restriction" -level "WARNING"
                    }
                }
                
                # Check for port binding error
                if ($errorOutput -match "Ports are not available" -or $errorOutput -match "bind: An attempt was made to access a socket in a way forbidden by its access permissions") {
                    $portBindingErrorDetected = $true
                    Write-Log "Port binding error detected. Will try to resolve before next attempt." -level "WARNING"
                }
                
                Write-Log "Supabase failed to start on attempt $retryCount" -level "WARNING"
                if ($retryCount -lt $maxRetries) {
                    Write-Log "Waiting 5 seconds before retry..." -level "INFO"
                    Start-Sleep -Seconds 5
                }
            }
        }
        
        if (-not $success) {
            Write-Log "Failed to start Supabase after $maxRetries attempts" -level "ERROR"
            if ($denoErrorDetected) {
                Write-Log "The error appears to be related to downloading dependencies from deno.land" -level "ERROR"
                Write-Log "Please ensure you have a stable internet connection and try again" -level "ERROR"
            }
            return $false
        }
        
        # Wait for Supabase to fully initialize
        Write-Log "Waiting for Supabase to initialize..." -level "INFO"
        Start-Sleep -Seconds 10
        
        # Verify Supabase is running
        $supabaseRunning = Test-SupabaseRunning
        return $supabaseRunning
    }
    catch {
        Write-Log "Error starting Supabase: $_" -level "ERROR"
        return $false
    }
    finally {
        # Return to original directory
        Pop-Location
    }
}

# Function to start the app using Docker Compose
function Start-DockerApp {
    try {
        Write-Log "Starting $appName using Docker Compose..."
        
        # Start the application
        docker-compose up -d
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Failed to start Docker Compose services." -level "ERROR"
            return $false
        }
        
        Write-Log "Docker Compose services started successfully" -level "SUCCESS"
        
        # Wait for services to be ready
        Write-Log "Waiting for services to be ready..."
        Start-Sleep -Seconds 10
        
        return $true
    }
    catch {
        Write-Log "Error starting Docker Compose: $_" -level "ERROR"
        return $false
    }
}

# Function to open the app in Chrome
function Open-AppInChrome {
    try {
        Write-Log "Opening $appName in Chrome..."
        Start-Process "chrome.exe" -ArgumentList "--new-window", $appUrl
        Write-Log "Application opened in Chrome" -level "SUCCESS"
        return $true
    } catch {
        try {
            # Try with default browser if Chrome fails
            Write-Log "Chrome not found, opening with default browser..."
            Start-Process $appUrl
            Write-Log "Application opened in default browser" -level "SUCCESS"
            return $true
        } catch {
            Write-Log "Error opening browser: $_" -level "ERROR"
            return $false
        }
    }
}

# Function to restart the Windows Host Network Service (HNS)
function Restart-HNSService {
    Write-Log "Attempting to restart Windows Host Network Service (HNS)..." -level "WARNING"
    
    # Check if running as administrator
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    
    if (-not $isAdmin) {
        Write-Log "Administrator privileges required to restart HNS service" -level "ERROR"
        Write-Log "Please run this script as administrator to fix port binding issues" -level "ERROR"
        return $false
    }
    
    try {
        # Stop HNS service
        Write-Log "Stopping HNS service..."
        $stopResult = net stop hns
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Failed to stop HNS service: $stopResult" -level "ERROR"
            return $false
        }
        
        # Give it a moment to fully stop
        Start-Sleep -Seconds 2
        
        # Start HNS service
        Write-Log "Starting HNS service..."
        $startResult = net start hns
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Failed to start HNS service: $startResult" -level "ERROR"
            return $false
        }
        
        Write-Log "Successfully restarted HNS service" -level "SUCCESS"
        
        # Give it a moment to fully initialize
        Start-Sleep -Seconds 3
        
        return $true
    }
    catch {
        Write-Log "Error restarting HNS service: $_" -level "ERROR"
        return $false
    }
}

# Check for command line arguments
if ($args.Contains("-config")) {
    # Run git configuration setup
    Set-GitConfig
    exit
}

if ($args.Contains("-update")) {
    # Force update from git repository
    Update-FromGit -ForceUpdate
    exit
}

# Main script execution
Write-Log "Starting $appName application..." -level "INFO"

# Step 0: Check for updates from git repository
Write-Log "Step 0: Checking for updates from git repository..."
$updatePerformed = Update-FromGit
if ($updatePerformed -eq $true) {
    # Check if we need to rebuild Docker containers
    $config = Get-GitConfig
    if ($null -ne $config -and (Test-Path -Path "$($config.WorkingDir)\docker-compose.yml")) {
        Write-Log "Rebuilding Docker containers after update..." -level "INFO"
        Rebuild-DockerContainers
    }
}

# Step 1: Check if app is already running
Write-Log "Step 1: Checking if application is already running..."
$appRunning = Test-AppRunning
if ($appRunning) {
    Write-Log "$appName is already running. Opening in browser..." -level "INFO"
    # Open-AppInChrome
    exit 0
}

# Step 2: Check system resources
Write-Log "Step 2: Checking system resources..."
$resourcesOk = Test-SystemResources
if (-not $resourcesOk) {
    Write-Log "Insufficient system resources to run $appName" -level "ERROR"
    exit 1
}

# Step 3: Start Docker
Write-Log "Step 3: Ensuring Docker is running..."
$dockerOk = Start-DockerService
if (-not $dockerOk) {
    Write-Log "Failed to start Docker. Cannot continue." -level "ERROR"
    exit 1
}

# Step 4: Check if Supabase is running and start it if needed
Write-Log "Step 4: Checking if Supabase is running..."
$supabaseOk = Test-SupabaseRunning
if (-not $supabaseOk) {
    Write-Log "Attempting to start Supabase automatically..." -level "INFO"
    $supabaseOk = Start-Supabase
    if (-not $supabaseOk) {
        Write-Log "Failed to automatically start Supabase. Please start it manually." -level "ERROR"
        Write-Log "You can start Supabase using the Supabase CLI or Docker Desktop." -level "INFO"
        exit 1
    }
}

# Step 5: Start the application using Docker Compose
Write-Log "Step 5: Starting application services..."
$appOk = Start-DockerApp
if (-not $appOk) {
    Write-Log "Failed to start application services. Cannot continue." -level "ERROR"
    exit 1
}

# Step 6: Open app in Chrome
# Write-Log "Step 6: Opening application in Chrome..."
# Open-AppInChrome

Write-Log "$appName started successfully!" -level "SUCCESS"
Write-Log "You can access the application at $appUrl" -level "INFO"
Write-Log "Supabase Studio is available at http://localhost:54322" -level "INFO"

# Display container status
Write-Host "`nContainer Status:" -ForegroundColor Cyan
docker-compose ps