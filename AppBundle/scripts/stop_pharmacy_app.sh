#!/bin/bash

# Elith Pharmacy Application Shutdown Script
# This script gracefully stops all Elith Pharmacy application services

# Define application settings
APP_NAME="Elith Pharmacy"
LOG_FILE="$HOME/ElithPharmacy/app_shutdown.log"

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

# Function to check if Docker is running
test_docker_running() {
    if ! docker info > /dev/null 2>&1; then
        write_log "Docker is not running." "WARNING"
        return 1  # false
    fi
    return 0  # true
}

# Function to check if Supabase is running
test_supabase_running() {
    # Check if port 54321 is responding
    SUPABASE_PORT=54321
    
    if nc -z localhost $SUPABASE_PORT 2>/dev/null; then
        write_log "Supabase is running on port $SUPABASE_PORT" "INFO"
        return 0  # true
    else
        write_log "Supabase is not running on port $SUPABASE_PORT" "INFO"
        return 1  # false
    fi
}

# Function to find and stop Supabase
stop_supabase() {
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
        write_log "Could not find Elith-Supabase directory" "WARNING"
        return 1  # false
    fi
    
    # Navigate to the directory
    pushd "$SUPABASE_DIR" > /dev/null
    
    # Try to stop Supabase with retry logic
    MAX_RETRIES=3
    RETRY_COUNT=0
    SUCCESS=false
    
    while [ "$SUCCESS" = false ] && [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        ((RETRY_COUNT++))
        write_log "Attempting to stop Supabase (Attempt $RETRY_COUNT of $MAX_RETRIES)..." "INFO"
        
        # Stop Supabase
        OUTPUT=$(npx supabase stop 2>&1)
        
        # Check if Supabase stopped successfully
        if echo "$OUTPUT" | grep -q "Stopped supabase local development setup"; then
            SUCCESS=true
            write_log "Supabase stopped successfully" "SUCCESS"
        else
            write_log "Supabase failed to stop on attempt $RETRY_COUNT" "WARNING"
            if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                write_log "Waiting 5 seconds before retry..." "INFO"
                sleep 5
            fi
        fi
    done
    
    # Return to original directory
    popd > /dev/null
    
    if [ "$SUCCESS" = false ]; then
        write_log "Failed to stop Supabase after $MAX_RETRIES attempts" "WARNING"
        return 1  # false
    fi
    
    return 0  # true
}

# Function to stop Docker containers
stop_docker_containers() {
    write_log "Checking for running $APP_NAME containers..."
    
    # Check if any containers are running
    CONTAINERS=$(docker ps --format "{{.Names}}" | grep -E "elithpharmacy|frontend|backend" || true)
    
    if [ -z "$CONTAINERS" ]; then
        write_log "No running $APP_NAME containers found." "INFO"
        return 0  # true
    fi
    
    write_log "Found running containers. Stopping services with docker-compose stop..."
    
    # Stop containers using docker-compose stop (not down, to preserve containers)
    if ! docker-compose stop; then
        write_log "Failed to stop containers with docker-compose. Attempting direct container stop..." "WARNING"
        
        # Try stopping containers directly
        for container in $CONTAINERS; do
            write_log "Stopping container: $container"
            docker stop "$container"
            
            if [ $? -ne 0 ]; then
                write_log "Failed to stop container: $container" "ERROR"
            fi
        done
    fi
    
    # Check if any containers are still running
    REMAINING_CONTAINERS=$(docker ps --format "{{.Names}}" | grep -E "elithpharmacy|frontend|backend" || true)
    
    if [ -n "$REMAINING_CONTAINERS" ]; then
        write_log "Some containers are still running: $REMAINING_CONTAINERS" "WARNING"
        return 1  # false
    fi
    
    write_log "All $APP_NAME containers stopped successfully" "SUCCESS"
    write_log "Containers are preserved for faster startup next time" "INFO"
    return 0  # true
}

# Function to close browser windows (limited functionality in Linux)
close_app_browser_windows() {
    write_log "Note: Automatic browser window closing is limited in Linux" "INFO"
    write_log "Please close any browser windows running the application manually" "INFO"
    return 0  # true
}

# Main script execution
write_log "Starting shutdown of $APP_NAME application..." "INFO"

# Step 1: Check if Supabase is running and stop it if needed
write_log "Step 1: Checking if Supabase is running..."
if test_supabase_running; then
    write_log "Attempting to stop Supabase..." "INFO"
    if ! stop_supabase; then
        write_log "Warning: Failed to stop Supabase. It may still be running." "WARNING"
    fi
else
    write_log "Supabase is not running. No need to stop it." "INFO"
fi

# Step 2: Check if Docker is running
write_log "Step 2: Checking if Docker is running..."
if ! test_docker_running; then
    write_log "Docker is not running. No need to stop containers." "INFO"
else
    # Step 2b: Stop Docker containers
    write_log "Step 2b: Stopping Docker containers..."
    if ! stop_docker_containers; then
        write_log "Warning: Some containers may still be running." "WARNING"
    fi
fi

# Step 3: Close browser windows
write_log "Step 3: Closing browser windows..."
close_app_browser_windows

write_log "$APP_NAME application shutdown complete!" "SUCCESS"

# Display any remaining containers (if Docker is running)
if test_docker_running; then
    echo -e "\nRemaining Containers:"
    docker ps
    echo -e "\nStopped Containers (will be reused on next startup):"
    docker ps -a | grep -E "elithpharmacy|frontend|backend"
fi 