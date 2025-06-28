# Elith Pharmacy Application Shutdown Script
# This script gracefully stops all Elith Pharmacy application services

# Define application settings
$appName = "Elith Pharmacy"
$logFile = "$env:USERPROFILE\ElithPharmacy\app_shutdown.log"

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

# Function to check if Docker is running
function Test-DockerRunning {
    try {
        docker info | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Docker is not running." -level "WARNING"
            return $false
        }
        return $true
    }
    catch {
        Write-Log "Docker is not available: $_" -level "WARNING"
        return $false
    }
}

# Function to check if Supabase is running
function Test-SupabaseRunning {
    try {
        # Check if port 54321 is responding
        $supabasePort = 54321
        $supabaseRunning = Test-NetConnection -ComputerName localhost -Port $supabasePort -WarningAction SilentlyContinue -InformationLevel Quiet
        
        if (-not $supabaseRunning) {
            Write-Log "Supabase is not running on port $supabasePort" -level "INFO"
            return $false
        }
        
        Write-Log "Supabase is running on port $supabasePort" -level "INFO"
        return $true
    }
    catch {
        Write-Log "Error checking Supabase: $_" -level "ERROR"
        return $false
    }
}

# Function to find and stop Supabase
function Stop-Supabase {
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
        Write-Log "Could not find Elith-Supabase directory" -level "WARNING"
        return $false
    }
    
    # Navigate to the directory
    Push-Location $supabaseDir
    
    try {
        # Try to stop Supabase with retry logic
        $maxRetries = 3
        $retryCount = 0
        $success = $false
        
        while (-not $success -and $retryCount -lt $maxRetries) {
            $retryCount++
            Write-Log "Attempting to stop Supabase (Attempt $retryCount of $maxRetries)..." -level "INFO"
            
            # Stop Supabase
            $output = npx supabase stop 2>&1
            
            # Check if Supabase stopped successfully
            if ($output -match "Stopped supabase local development setup") {
                $success = $true
                Write-Log "Supabase stopped successfully" -level "SUCCESS"
            } else {
                Write-Log "Supabase failed to stop on attempt $retryCount" -level "WARNING"
                if ($retryCount -lt $maxRetries) {
                    Write-Log "Waiting 5 seconds before retry..." -level "INFO"
                    Start-Sleep -Seconds 5
                }
            }
        }
        
        if (-not $success) {
            Write-Log "Failed to stop Supabase after $maxRetries attempts" -level "WARNING"
            return $false
        }
        
        return $true
    }
    catch {
        Write-Log "Error stopping Supabase: $_" -level "ERROR"
        return $false
    }
    finally {
        # Return to original directory
        Pop-Location
    }
}

# Function to stop Docker containers
function Stop-DockerContainers {
    try {
        Write-Log "Checking for running $appName containers..."
        
        # Check if any containers are running
        $containers = docker ps --format "{{.Names}}" | Where-Object { $_ -like "*elithpharmacy*" -or $_ -like "*frontend*" -or $_ -like "*backend*" }
        
        if ($null -eq $containers -or $containers.Count -eq 0) {
            Write-Log "No running $appName containers found." -level "INFO"
            return $true
        }
        
        Write-Log "Found running containers. Stopping services with docker-compose stop..."
        
        # Stop containers using docker-compose stop (not down, to preserve containers)
        docker-compose stop
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Failed to stop containers with docker-compose. Attempting direct container stop..." -level "WARNING"
            
            # Try stopping containers directly
            foreach ($container in $containers) {
                Write-Log "Stopping container: $container"
                docker stop $container
                
                if ($LASTEXITCODE -ne 0) {
                    Write-Log "Failed to stop container: $container" -level "ERROR"
                }
            }
        }
        
        # Check if any containers are still running
        $remainingContainers = docker ps --format "{{.Names}}" | Where-Object { $_ -like "*elithpharmacy*" -or $_ -like "*frontend*" -or $_ -like "*backend*" }
        
        if ($null -ne $remainingContainers -and $remainingContainers.Count -gt 0) {
            Write-Log "Some containers are still running: $($remainingContainers -join ', ')" -level "WARNING"
            return $false
        }
        
        Write-Log "All $appName containers stopped successfully" -level "SUCCESS"
        Write-Log "Containers are preserved for faster startup next time" -level "INFO"
        return $true
    }
    catch {
        Write-Log "Error stopping Docker containers: $_" -level "ERROR"
        return $false
    }
}

# Function to close browser windows
function Close-AppBrowserWindows {
    try {
        Write-Log "Closing any browser windows running the application..."
        
        # Find Chrome processes with our app in the title
        $chromeProcesses = Get-Process -Name "chrome" -ErrorAction SilentlyContinue | Where-Object {
            $_.MainWindowTitle -like "*$appName*" -or $_.MainWindowTitle -like "*localhost:5173*"
        }
        
        if ($null -ne $chromeProcesses -and $chromeProcesses.Count -gt 0) {
            foreach ($process in $chromeProcesses) {
                $process.CloseMainWindow() | Out-Null
            }
            Write-Log "Closed browser windows running the application" -level "SUCCESS"
        } else {
            Write-Log "No browser windows found running the application" -level "INFO"
        }
        
        return $true
    }
    catch {
        Write-Log "Error closing browser windows: $_" -level "WARNING"
        # Not critical if this fails
        return $true
    }
}

# Main script execution
Write-Log "Starting shutdown of $appName application..." -level "INFO"

# Step 1: Check if Supabase is running and stop it if needed
Write-Log "Step 1: Checking if Supabase is running..."
$supabaseRunning = Test-SupabaseRunning
if ($supabaseRunning) {
    Write-Log "Attempting to stop Supabase..." -level "INFO"
    $supabaseOk = Stop-Supabase
    if (-not $supabaseOk) {
        Write-Log "Warning: Failed to stop Supabase. It may still be running." -level "WARNING"
    }
} else {
    Write-Log "Supabase is not running. No need to stop it." -level "INFO"
}

# Step 2: Check if Docker is running
Write-Log "Step 2: Checking if Docker is running..."
$dockerRunning = Test-DockerRunning
if (-not $dockerRunning) {
    Write-Log "Docker is not running. No need to stop containers." -level "INFO"
} else {
    # Step 2: Stop Docker containers
    Write-Log "Step 2: Stopping Docker containers..."
    $containersOk = Stop-DockerContainers
    if (-not $containersOk) {
        Write-Log "Warning: Some containers may still be running." -level "WARNING"
    }
}

# Step 3: Close browser windows
Write-Log "Step 3: Closing browser windows..."
Close-AppBrowserWindows

Write-Log "$appName application shutdown complete!" -level "SUCCESS"

# Display any remaining containers (if Docker is running)
if ($dockerRunning) {
    Write-Host "`nRemaining Containers:" -ForegroundColor Cyan
    docker ps
    Write-Host "`nStopped Containers (will be reused on next startup):" -ForegroundColor Cyan
    docker ps -a | Select-String -Pattern "elithpharmacy|frontend|backend"
} 