#!/bin/bash

# Elith Pharmacy Application Startup Script
# This script implements the startup flow for the Elith Pharmacy application using Docker

# Define application settings
APP_NAME="Elith Pharmacy"
APP_URL="http://localhost:5173"  # The URL where the app is hosted
SUPABASE_PORT="54321"  # Default Supabase port
LOG_FILE="$HOME/ElithPharmacy/app_startup.log"
FRONTEND_PORT=5173

# Create log directory if it doesn't exist
LOG_DIR=$(dirname "$LOG_FILE")
mkdir -p "$LOG_DIR"

# Function to write to log file
write_log() {
    local message="$1"
    local level="${2:-INFO}"
    
    timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    log_message="[$timestamp] [$level] $message"
    echo "$log_message" >> "$LOG_FILE"
    
    # Also output to console
    if [ "$level" = "ERROR" ]; then
        echo -e "\e[31m$log_message\e[0m"  # Red
    elif [ "$level" = "WARNING" ]; then
        echo -e "\e[33m$log_message\e[0m"  # Yellow
    elif [ "$level" = "SUCCESS" ]; then
        echo -e "\e[32m$log_message\e[0m"  # Green
    else
        echo "$log_message"
    fi
}

# Function to check if the app is already running
test_app_running() {
    # Check if the frontend port is open, indicating the app is running
    if nc -z localhost $FRONTEND_PORT 2>/dev/null; then
        write_log "App is running on port $FRONTEND_PORT" "SUCCESS"
        return 0  # true in bash
    fi
    
    # Also check if Docker containers are running
    if docker ps --format "{{.Names}}" | grep -E "elithpharmacy|frontend" > /dev/null; then
        write_log "Found running containers for $APP_NAME" "SUCCESS"
        return 0  # true in bash
    fi
    
    return 1  # false in bash
}

# Function to check system resources
test_system_resources() {
    MINIMUM_RAM_GB=4
    MINIMUM_DISK_SPACE_GB=5
    
    # Check RAM (in GB)
    TOTAL_RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    TOTAL_RAM_GB=$(echo "scale=2; $TOTAL_RAM_KB / 1024 / 1024" | bc)
    
    # Check disk space
    FREE_DISK_SPACE_KB=$(df -k . | tail -1 | awk '{print $4}')
    FREE_DISK_SPACE_GB=$(echo "scale=2; $FREE_DISK_SPACE_KB / 1024 / 1024" | bc)
    
    write_log "System has $TOTAL_RAM_GB GB RAM and $FREE_DISK_SPACE_GB GB free disk space"
    
    if (( $(echo "$TOTAL_RAM_GB < $MINIMUM_RAM_GB" | bc -l) )); then
        write_log "Insufficient RAM. Minimum required: $MINIMUM_RAM_GB GB" "WARNING"
        return 1  # false
    fi
    
    if (( $(echo "$FREE_DISK_SPACE_GB < $MINIMUM_DISK_SPACE_GB" | bc -l) )); then
        write_log "Insufficient disk space. Minimum required: $MINIMUM_DISK_SPACE_GB GB" "WARNING"
        return 1  # false
    fi
    
    return 0  # true
}

# Function to check if Docker is running and start it if needed
start_docker_service() {
    # Check if Docker daemon is running
    if ! docker info > /dev/null 2>&1; then
        write_log "Docker service is not running. Starting Docker..."
        
        # Try to start Docker service using different methods
        if command -v systemctl > /dev/null; then
            write_log "Starting Docker using systemctl..."
            if ! sudo systemctl start docker; then
                write_log "Failed to start Docker service with systemctl." "ERROR"
                return 1  # false
            fi
        elif command -v service > /dev/null; then
            write_log "Starting Docker using service command..."
            if ! sudo service docker start; then
                write_log "Failed to start Docker service with service command." "ERROR"
                return 1  # false
            fi
        else
            write_log "Could not find a way to start Docker service" "ERROR"
            return 1  # false
        fi
        
        # Wait for Docker to start (up to 60 seconds)
        timeout=60
        timer=0
        write_log "Waiting for Docker to initialize..."
        while [ $timer -lt $timeout ]; do
            if docker info > /dev/null 2>&1; then
                break
            fi
            sleep 1
            ((timer++))
        done
        
        if [ $timer -ge $timeout ]; then
            write_log "Failed to start Docker service after $timeout seconds." "ERROR"
            return 1  # false
        fi
        
        # Give Docker a moment to fully initialize
        sleep 5
    fi
    
    # Final check if docker command works
    if ! docker info > /dev/null 2>&1; then
        write_log "Docker is installed but not responding correctly." "ERROR"
        return 1  # false
    fi
    
    write_log "Docker service is running" "SUCCESS"
    return 0  # true
}

# Function to check if Supabase is running
test_supabase_running() {
    # Check if port is responding
    if nc -z localhost $SUPABASE_PORT 2>/dev/null; then
        write_log "Supabase is running on port $SUPABASE_PORT" "SUCCESS"
        return 0  # true
    else
        write_log "Supabase is not running on port $SUPABASE_PORT" "WARNING"
        return 1  # false
    fi
}

# Function to check internet connectivity
check_internet_connectivity() {
    # Try to connect to Google's DNS server
    if ping -c 1 -W 3 8.8.8.8 > /dev/null 2>&1; then
        write_log "Internet connectivity check passed" "SUCCESS"
        return 0  # true in bash
    else
        write_log "No internet connectivity detected" "WARNING"
        return 1  # false in bash
    fi
}

# Function to find and start Supabase
start_supabase() {
    # Define possible locations for Elith-Supabase directory
    POSSIBLE_LOCATIONS=(
        "./Elith-Supabase"
        "../Elith-Supabase"
        "$HOME/Documents/Elith-Supabase"
        "$HOME/Elith-Supabase"
    )
    
    SUPABASE_DIR=""
    
    # Find the Supabase directory
    for location in "${POSSIBLE_LOCATIONS[@]}"; do
        if [ -d "$location" ]; then
            SUPABASE_DIR="$location"
            write_log "Found Elith-Supabase directory at: $SUPABASE_DIR" "SUCCESS"
            break
        fi
    done
    
    if [ -z "$SUPABASE_DIR" ]; then
        write_log "Could not find Elith-Supabase directory" "ERROR"
        return 1  # false
    fi
    
    # Navigate to the directory
    pushd "$SUPABASE_DIR" > /dev/null
    
    # Try to start Supabase with retry logic
    MAX_RETRIES=50
    RETRY_COUNT=0
    SUCCESS=false
    PORT_BINDING_ERROR_DETECTED=false
    DENO_ERROR_DETECTED=false
    
    while [ "$SUCCESS" = false ] && [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        ((RETRY_COUNT++))
        write_log "Attempting to start Supabase (Attempt $RETRY_COUNT of $MAX_RETRIES)..." "INFO"
        
        # First stop any existing Supabase instance
        write_log "Stopping any existing Supabase instances..."
        npx supabase stop > /dev/null 2>&1
        
        # Give it a moment to fully stop
        sleep 3
        
        # Start Supabase
        OUTPUT=$(npx supabase start 2>&1)
        
        # Check if Supabase started successfully
        if echo "$OUTPUT" | grep -q "Started supabase local development setup"; then
            SUCCESS=true
            write_log "Supabase started successfully" "SUCCESS"
        else
            # Check for specific deno.land error
            if echo "$OUTPUT" | grep -q "error sending request for url" && echo "$OUTPUT" | grep -q "deno.land"; then
                DENO_ERROR_DETECTED=true
                write_log "Detected Supabase edge runtime download error" "WARNING"
                
                # Check internet connectivity since this is likely the issue
                if ! check_internet_connectivity; then
                    write_log "Internet connectivity issue detected" "ERROR"
                    write_log "Supabase edge runtime cannot download required dependencies" "ERROR"
                    write_log "Please connect to the internet and try again" "ERROR"
                    popd > /dev/null
                    return 1  # false
                else
                    write_log "Internet seems to be working, but Supabase still can't download dependencies" "WARNING"
                    write_log "This might be due to a temporary network issue or firewall restriction" "WARNING"
                fi
            fi
            
            # Check for port binding error
            if echo "$OUTPUT" | grep -q -E "Ports are not available|bind: address already in use"; then
                PORT_BINDING_ERROR_DETECTED=true
                write_log "Port binding error detected. Will try again." "WARNING"
            fi
            
            write_log "Supabase failed to start on attempt $RETRY_COUNT" "WARNING"
            if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                write_log "Waiting 5 seconds before retry..." "INFO"
                sleep 5
            fi
        fi
    done
    
    # Return to original directory
    popd > /dev/null
    
    if [ "$SUCCESS" = false ]; then
        write_log "Failed to start Supabase after $MAX_RETRIES attempts" "ERROR"
        if [ "$DENO_ERROR_DETECTED" = true ]; then
            write_log "The error appears to be related to downloading dependencies from deno.land" "ERROR"
            write_log "Please ensure you have a stable internet connection and try again" "ERROR"
        fi
        return 1  # false
    fi
    
    # Wait for Supabase to fully initialize
    write_log "Waiting for Supabase to initialize..." "INFO"
    sleep 10
    
    # Verify Supabase is running
    test_supabase_running
    return $?
}

# Function to start the app using Docker Compose
start_docker_app() {
    write_log "Starting $APP_NAME using Docker Compose..."
    
    # Start the application
    if ! docker-compose up -d; then
        write_log "Failed to start Docker Compose services." "ERROR"
        return 1  # false
    fi
    
    write_log "Docker Compose services started successfully" "SUCCESS"
    
    # Wait for services to be ready
    write_log "Waiting for services to be ready..."
    sleep 10
    
    return 0  # true
}

# Function to open the app in browser
open_app_in_browser() {
    write_log "Opening $APP_NAME in browser..."
    
    # Try to detect the desktop environment and open the browser accordingly
    if command -v xdg-open > /dev/null; then
        xdg-open "$APP_URL" > /dev/null 2>&1 &
    elif command -v gnome-open > /dev/null; then
        gnome-open "$APP_URL" > /dev/null 2>&1 &
    elif command -v gio > /dev/null; then
        gio open "$APP_URL" > /dev/null 2>&1 &
    else
        write_log "Could not detect a way to open the browser. Please open $APP_URL manually." "WARNING"
        return 1  # false
    fi
    
    write_log "Application opened in browser" "SUCCESS"
    return 0  # true
}

# Main script execution
write_log "Starting $APP_NAME application..." "INFO"

# Step 1: Check if app is already running
write_log "Step 1: Checking if application is already running..."
if test_app_running; then
    write_log "$APP_NAME is already running. Opening in browser..." "INFO"
    open_app_in_browser
    exit 0
fi

# Step 2: Check system resources
write_log "Step 2: Checking system resources..."
if ! test_system_resources; then
    write_log "Insufficient system resources to run $APP_NAME" "ERROR"
    exit 1
fi

# Step 3: Start Docker
write_log "Step 3: Ensuring Docker is running..."
if ! start_docker_service; then
    write_log "Failed to start Docker. Cannot continue." "ERROR"
    exit 1
fi

# Step 4: Check if Supabase is running and start it if needed
write_log "Step 4: Checking if Supabase is running..."
if ! test_supabase_running; then
    write_log "Attempting to start Supabase automatically..." "INFO"
    if ! start_supabase; then
        write_log "Failed to automatically start Supabase. Please start it manually." "ERROR"
        write_log "You can start Supabase using the Supabase CLI or Docker Desktop." "INFO"
        exit 1
    fi
fi

# Step 5: Start the application using Docker Compose
write_log "Step 5: Starting application services..."
if ! start_docker_app; then
    write_log "Failed to start application services. Cannot continue." "ERROR"
    exit 1
fi

# Step 6: Open app in browser (commented out like in the PowerShell script)
# write_log "Step 6: Opening application in browser..."
# open_app_in_browser

write_log "$APP_NAME started successfully!" "SUCCESS"
write_log "You can access the application at $APP_URL" "INFO"
write_log "Supabase Studio is available at http://localhost:54323" "INFO"

# Display container status
echo -e "\nContainer Status:"
docker-compose ps 