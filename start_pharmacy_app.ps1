# Elith Pharmacy Application Startup Script
# This script implements the startup flow for the Elith Pharmacy application using Docker

# Define application settings
$appName = "Elith Pharmacy"
$appUrl = "http://localhost:5173"  # The URL where the app is hosted
$supabasePort = "54321"  # Default Supabase port
$logFile = "$env:USERPROFILE\ElithPharmacy\app_startup.log"
$frontendPort = 5173  # Added frontendPort variable

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
                # Check for port binding error
                $errorOutput = $output -join "`n"
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

# Main script execution
Write-Log "Starting $appName application..." -level "INFO"

# Step 1: Check if app is already running
Write-Log "Step 1: Checking if application is already running..."
$appRunning = Test-AppRunning
if ($appRunning) {
    Write-Log "$appName is already running. Opening in browser..." -level "INFO"
    Open-AppInChrome
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