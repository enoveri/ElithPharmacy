#!/bin/bash

# Elith Pharmacy Watchdog Service
# This script continuously monitors the Elith Pharmacy services and automatically restarts them if they stop running
# To run at startup, create a systemd service or add to crontab with @reboot

# Define application settings
APP_NAME="Elith Pharmacy"
APP_URL="http://localhost:5173"  # The URL where the app is hosted
SUPABASE_PORT=54321  # Default Supabase port
SUPABASE_STUDIO_PORT=54322  # Supabase Studio port
FRONTEND_PORT=5173  # Frontend port
REQUIRED_PORTS=($SUPABASE_PORT $SUPABASE_STUDIO_PORT $FRONTEND_PORT)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STARTUP_SCRIPT="$SCRIPT_DIR/start_pharmacy_app.sh"
LOG_FILE="$HOME/ElithPharmacy/watchdog.log"
CHECK_INTERVAL_SECONDS=300  # Check services every 5 minutes
GIT_UPDATE_INTERVAL_HOURS=6  # Check for git updates every 6 hours
GIT_CONFIG_FILE="$HOME/ElithPharmacy/git_config.json"  # File to store git configuration

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
    
    # Also output to console if not running in background
    if [ -t 1 ]; then
        if [ "$level" = "ERROR" ]; then
            echo -e "\e[31m$log_message\e[0m"  # Red
        elif [ "$level" = "WARNING" ]; then
            echo -e "\e[33m$log_message\e[0m"  # Yellow
        elif [ "$level" = "SUCCESS" ]; then
            echo -e "\e[32m$log_message\e[0m"  # Green
        else
            echo "$log_message"
        fi
    fi
}

# Function to check if a port is open
test_port_open() {
    local port=$1
    nc -z localhost $port > /dev/null 2>&1
    return $?
}

# Function to check if Docker is running
test_docker_running() {
    docker info > /dev/null 2>&1
    return $?
}

# Function to check if git is installed
test_git_installed() {
    if command -v git > /dev/null; then
        GIT_VERSION=$(git --version)
        write_log "Git is installed: $GIT_VERSION" "SUCCESS"
        return 0  # true in bash
    else
        write_log "Git is not installed" "ERROR"
        return 1  # false in bash
    fi
}

# Function to load git configuration
get_git_config() {
    if [ -f "$GIT_CONFIG_FILE" ]; then
        if command -v jq > /dev/null; then
            # Use jq if available
            REPO_URL=$(jq -r '.RepoUrl // empty' "$GIT_CONFIG_FILE")
            BRANCH=$(jq -r '.Branch // empty' "$GIT_CONFIG_FILE")
            TOKEN=$(jq -r '.Token // empty' "$GIT_CONFIG_FILE")
            WORKING_DIR=$(jq -r '.WorkingDir // empty' "$GIT_CONFIG_FILE")
            
            if [ -n "$REPO_URL" ] && [ -n "$BRANCH" ] && [ -n "$WORKING_DIR" ]; then
                return 0  # true in bash
            else
                write_log "Invalid git configuration in $GIT_CONFIG_FILE" "ERROR"
                return 1  # false in bash
            fi
        else
            # Fallback to grep/sed if jq is not available
            write_log "jq is not installed. Using basic parsing for git config." "WARNING"
            REPO_URL=$(grep -o '"RepoUrl"[[:space:]]*:[[:space:]]*"[^"]*"' "$GIT_CONFIG_FILE" | sed 's/"RepoUrl"[[:space:]]*:[[:space:]]*"\(.*\)"/\1/')
            BRANCH=$(grep -o '"Branch"[[:space:]]*:[[:space:]]*"[^"]*"' "$GIT_CONFIG_FILE" | sed 's/"Branch"[[:space:]]*:[[:space:]]*"\(.*\)"/\1/')
            TOKEN=$(grep -o '"Token"[[:space:]]*:[[:space:]]*"[^"]*"' "$GIT_CONFIG_FILE" | sed 's/"Token"[[:space:]]*:[[:space:]]*"\(.*\)"/\1/')
            WORKING_DIR=$(grep -o '"WorkingDir"[[:space:]]*:[[:space:]]*"[^"]*"' "$GIT_CONFIG_FILE" | sed 's/"WorkingDir"[[:space:]]*:[[:space:]]*"\(.*\)"/\1/')
            
            if [ -n "$REPO_URL" ] && [ -n "$BRANCH" ] && [ -n "$WORKING_DIR" ]; then
                return 0  # true in bash
            else
                write_log "Invalid git configuration in $GIT_CONFIG_FILE" "ERROR"
                return 1  # false in bash
            fi
        fi
    else
        write_log "Git configuration file not found at: $GIT_CONFIG_FILE" "WARNING"
        return 1  # false in bash
    fi
}

# Function to save git configuration
save_git_config() {
    local repo_url="$1"
    local branch="$2"
    local token="$3"
    local working_dir="$4"
    
    # Create JSON content
    local last_updated=$(date "+%Y-%m-%d %H:%M:%S")
    local json_content="{
  \"RepoUrl\": \"$repo_url\",
  \"Branch\": \"$branch\",
  \"Token\": \"$token\",
  \"WorkingDir\": \"$working_dir\",
  \"LastUpdated\": \"$last_updated\"
}"
    
    # Save to file
    echo "$json_content" > "$GIT_CONFIG_FILE"
    
    if [ $? -eq 0 ]; then
        write_log "Git configuration saved successfully" "SUCCESS"
        return 0  # true in bash
    else
        write_log "Error saving git configuration" "ERROR"
        return 1  # false in bash
    fi
}

# Function to check for updates and pull from git
update_from_git() {
    # Check if git is installed
    if ! test_git_installed; then
        write_log "Git is required for update functionality" "ERROR"
        return 1  # false in bash
    fi
    
    # Load git configuration
    if ! get_git_config; then
        write_log "Git configuration not found. Skipping update check." "WARNING"
        return 1  # false in bash
    fi
    
    # Check if working directory exists
    if [ ! -d "$WORKING_DIR" ]; then
        write_log "Working directory does not exist: $WORKING_DIR" "ERROR"
        return 1  # false in bash
    fi
    
    # Navigate to working directory
    pushd "$WORKING_DIR" > /dev/null
    
    # Check if this is a git repository
    if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
        write_log "The directory is not a git repository: $WORKING_DIR" "ERROR"
        popd > /dev/null
        return 1  # false in bash
    fi
    
    write_log "Checking for updates in repository: $REPO_URL (branch: $BRANCH)" "INFO"
    
    # Construct the remote URL with token
    REPO_URL_WITH_TOKEN="$REPO_URL"
    if [ -n "$TOKEN" ]; then
        # Extract protocol, domain, and path from URL
        if [[ "$REPO_URL" =~ ^(https?://)([^/]+)(.*) ]]; then
            PROTOCOL="${BASH_REMATCH[1]}"
            DOMAIN="${BASH_REMATCH[2]}"
            PATH_PART="${BASH_REMATCH[3]}"
            REPO_URL_WITH_TOKEN="${PROTOCOL}oauth2:${TOKEN}@${DOMAIN}${PATH_PART}"
        else
            write_log "Invalid repository URL format" "ERROR"
            popd > /dev/null
            return 1  # false in bash
        fi
    fi
    
    # Update the remote URL if using token
    if [ -n "$TOKEN" ]; then
        git remote set-url origin "$REPO_URL_WITH_TOKEN" > /dev/null 2>&1
    fi
    
    # Fetch the latest changes
    write_log "Fetching latest changes..." "INFO"
    if ! git fetch origin "$BRANCH" > /dev/null 2>&1; then
        write_log "Failed to fetch from remote repository" "ERROR"
        popd > /dev/null
        return 1  # false in bash
    fi
    
    # Check if we're behind the remote
    STATUS=$(git status -uno)
    NEEDS_UPDATE=false
    
    if echo "$STATUS" | grep -q "Your branch is behind"; then
        # Extract number of commits behind using regex
        if [[ "$STATUS" =~ Your\ branch\ is\ behind\ \'origin/$BRANCH\'\ by\ ([0-9]+)\ commit ]]; then
            COMMITS_BEHIND="${BASH_REMATCH[1]}"
            write_log "Repository is behind by $COMMITS_BEHIND commits" "WARNING"
            NEEDS_UPDATE=true
        fi
    elif echo "$STATUS" | grep -q "Your branch is up to date"; then
        write_log "Repository is up to date with origin/$BRANCH" "SUCCESS"
        popd > /dev/null
        return 1  # false in bash, no update needed
    else
        write_log "Unable to determine update status. Skipping update." "WARNING"
        popd > /dev/null
        return 1  # false in bash
    fi
    
    if [ "$NEEDS_UPDATE" = true ]; then
        # Stash any local changes
        write_log "Stashing local changes..." "INFO"
        git stash > /dev/null 2>&1
        
        # Pull the latest changes
        write_log "Pulling latest changes from origin/$BRANCH..." "INFO"
        if ! git pull origin "$BRANCH" > /dev/null 2>&1; then
            write_log "Failed to pull latest changes" "ERROR"
            
            # Try to recover by resetting to origin
            write_log "Attempting to recover by hard reset..." "WARNING"
            if ! git reset --hard "origin/$BRANCH" > /dev/null 2>&1; then
                write_log "Failed to reset to origin/$BRANCH" "ERROR"
                popd > /dev/null
                return 1  # false in bash
            else
                write_log "Successfully reset to origin/$BRANCH" "SUCCESS"
            fi
        else
            write_log "Successfully pulled latest changes" "SUCCESS"
        fi
        
        # Update last updated timestamp
        save_git_config "$REPO_URL" "$BRANCH" "$TOKEN" "$WORKING_DIR"
        
        # Return to original directory
        popd > /dev/null
        
        # Return true to indicate that an update was performed
        return 0  # true in bash
    fi
    
    # Return to original directory
    popd > /dev/null
    
    return 1  # false in bash, no update performed
}

# Function to rebuild Docker containers after update
rebuild_docker_containers() {
    write_log "Rebuilding Docker containers..." "INFO"
    
    # Stop existing containers
    docker-compose down
    
    if [ $? -ne 0 ]; then
        write_log "Warning: Failed to stop existing containers" "WARNING"
        # Continue anyway as this might be the first run
    fi
    
    # Rebuild and start containers
    docker-compose up -d --build
    
    if [ $? -ne 0 ]; then
        write_log "Failed to rebuild Docker containers" "ERROR"
        return 1  # false in bash
    fi
    
    write_log "Docker containers rebuilt successfully" "SUCCESS"
    return 0  # true in bash
}

# Function to start Docker if it's not running
start_docker_if_needed() {
    if ! test_docker_running; then
        write_log "Docker is not running. Attempting to start Docker..." "WARNING"
        
        # Try to start Docker service
        if command -v systemctl > /dev/null; then
            write_log "Starting Docker using systemctl..."
            sudo systemctl start docker
        elif command -v service > /dev/null; then
            write_log "Starting Docker using service command..."
            sudo service docker start
        else
            write_log "Could not find a way to start Docker service" "ERROR"
            return 1
        fi
        
        # Wait for Docker to start (up to 60 seconds)
        write_log "Waiting for Docker to start..."
        timeout=60
        timer=0
        while [ $timer -lt $timeout ] && ! test_docker_running; do
            sleep 1
            ((timer++))
        done
        
        if test_docker_running; then
            write_log "Docker started successfully" "SUCCESS"
            return 0
        else
            write_log "Docker failed to start after waiting $timeout seconds" "ERROR"
            return 1
        fi
    fi
    
    return 0
}

# Function to check if Supabase is running
test_supabase_running() {
    test_port_open $SUPABASE_PORT
    return $?
}

# Function to check if Frontend is running
test_frontend_running() {
    test_port_open $FRONTEND_PORT
    return $?
}

# Function to check all required services
test_all_services() {
    local docker_running=false
    local supabase_running=false
    local frontend_running=false
    local all_running=false
    
    if test_docker_running; then
        docker_running=true
    fi
    
    if test_supabase_running; then
        supabase_running=true
    fi
    
    if test_frontend_running; then
        frontend_running=true
    fi
    
    if $docker_running && $supabase_running && $frontend_running; then
        all_running=true
    fi
    
    echo "docker_running=$docker_running"
    echo "supabase_running=$supabase_running"
    echo "frontend_running=$frontend_running"
    echo "all_running=$all_running"
}

# Function to start services using the startup script
start_pharmacy_services() {
    write_log "Starting Elith Pharmacy services..." "WARNING"
    
    # Check if the startup script exists
    if [ ! -f "$STARTUP_SCRIPT" ]; then
        write_log "Startup script not found at: $STARTUP_SCRIPT" "ERROR"
        return 1
    fi
    
    # Run the startup script
    write_log "Executing startup script: $STARTUP_SCRIPT"
    bash "$STARTUP_SCRIPT"
    exit_code=$?
    
    if [ $exit_code -ne 0 ]; then
        write_log "Startup script failed with exit code: $exit_code" "ERROR"
        return 1
    fi
    
    write_log "Startup script executed successfully" "SUCCESS"
    
    # Wait a bit for services to start
    write_log "Waiting for services to initialize..."
    sleep 30
    
    # Verify services are running
    local service_status=$(test_all_services)
    local all_running=$(echo "$service_status" | grep "all_running=true")
    
    if [ -n "$all_running" ]; then
        write_log "All services are now running" "SUCCESS"
        return 0
    else
        write_log "Some services failed to start:" "ERROR"
        
        if ! echo "$service_status" | grep -q "docker_running=true"; then
            write_log "- Docker is not running" "ERROR"
        fi
        
        if ! echo "$service_status" | grep -q "supabase_running=true"; then
            write_log "- Supabase is not running" "ERROR"
        fi
        
        if ! echo "$service_status" | grep -q "frontend_running=true"; then
            write_log "- Frontend is not running" "ERROR"
        fi
        
        return 1
    fi
}

# Function to send a notification
send_notification() {
    local title="$1"
    local message="$2"
    
    # Try different notification methods
    if command -v notify-send > /dev/null; then
        notify-send "$title" "$message"
    elif command -v zenity > /dev/null; then
        echo "$message" | zenity --text-info --title="$title" --width=300 --height=200 &
    else
        write_log "Desktop notification system not available" "WARNING"
    fi
}

# Function to create a systemd service for the watchdog
create_systemd_service() {
    local service_file="$HOME/.config/systemd/user/elith-pharmacy-watchdog.service"
    local service_dir=$(dirname "$service_file")
    
    # Create directory if it doesn't exist
    mkdir -p "$service_dir"
    
    # Create service file
    cat > "$service_file" << EOF
[Unit]
Description=Elith Pharmacy Watchdog Service
After=network.target

[Service]
ExecStart=/bin/bash $SCRIPT_DIR/watchdog.sh
Restart=on-failure
RestartSec=60

[Install]
WantedBy=default.target
EOF
    
    # Enable and start the service
    systemctl --user daemon-reload
    systemctl --user enable elith-pharmacy-watchdog.service
    systemctl --user start elith-pharmacy-watchdog.service
    
    write_log "Systemd service created and enabled" "SUCCESS"
    echo "Watchdog service has been installed as a systemd user service."
    echo "You can check its status with: systemctl --user status elith-pharmacy-watchdog.service"
}

# Main watchdog loop
start_watchdog() {
    write_log "$APP_NAME Watchdog Service Started" "SUCCESS"
    write_log "Monitoring services every $CHECK_INTERVAL_SECONDS seconds"
    write_log "Checking for git updates every $GIT_UPDATE_INTERVAL_HOURS hours"
    write_log "Press Ctrl+C to stop the watchdog"
    
    consecutive_failures=0
    max_consecutive_failures=3
    last_restart_time=0
    last_git_update_check=0
    
    while true; do
        current_time=$(date +%s)
        
        # Check if services are running
        service_status=$(test_all_services)
        all_running=$(echo "$service_status" | grep "all_running=true")
        
        if [ -n "$all_running" ]; then
            if [ $consecutive_failures -gt 0 ]; then
                write_log "All services are running again after previous failures" "SUCCESS"
                # send_notification "$APP_NAME Watchdog" "Services are now running properly"
                consecutive_failures=0
            else
                write_log "All services are running properly" "INFO"
            fi
            
            # Check for git updates periodically
            time_since_last_git_check=$((current_time - last_git_update_check))
            if [ $time_since_last_git_check -ge $((GIT_UPDATE_INTERVAL_HOURS * 3600)) ]; then
                write_log "Checking for git updates..." "INFO"
                update_from_git
                update_performed=$?
                last_git_update_check=$(date +%s)
                
                if [ $update_performed -eq 0 ]; then
                    write_log "Git updates found and applied. Rebuilding Docker containers..." "WARNING"
                    # send_notification "$APP_NAME Watchdog" "Updates found. Rebuilding application..."
                    
                    # Get git configuration to find docker-compose.yml
                    if get_git_config && [ -f "$WORKING_DIR/docker-compose.yml" ]; then
                        # Navigate to working directory
                        pushd "$WORKING_DIR" > /dev/null
                        
                        # Rebuild Docker containers
                        if rebuild_docker_containers; then
                            write_log "Docker containers rebuilt successfully after update" "SUCCESS"
                            # send_notification "$APP_NAME Watchdog" "Application updated and rebuilt successfully"
                        else
                            write_log "Failed to rebuild Docker containers after update" "ERROR"
                            # send_notification "$APP_NAME Watchdog" "Failed to rebuild application after update"
                        fi
                        
                        # Return to original directory
                        popd > /dev/null
                    else
                        write_log "Docker compose file not found. Skipping rebuild." "WARNING"
                    fi
                else
                    write_log "Repository is already up to date. No rebuild needed." "SUCCESS"
                fi
            fi
        else
            consecutive_failures=$((consecutive_failures + 1))
            time_since_last_restart=$((current_time - last_restart_time))
            
            # Log which services are down
            write_log "Service check failed ($consecutive_failures of $max_consecutive_failures):" "WARNING"
            
            # Check if Docker is down and try to start it
            if ! echo "$service_status" | grep -q "docker_running=true"; then
                write_log "- Docker is not running" "WARNING"
                # Try to start Docker automatically
                if start_docker_if_needed; then
                    write_log "Docker was started successfully" "SUCCESS"
                    # Recheck services after Docker starts
                    continue
                fi
            fi
            
            if ! echo "$service_status" | grep -q "supabase_running=true"; then
                write_log "- Supabase is not running" "WARNING"
            fi
            
            if ! echo "$service_status" | grep -q "frontend_running=true"; then
                write_log "- Frontend is not running" "WARNING"
            fi
            
            # Only attempt restart if we've had multiple failures and it's been at least 10 minutes since last restart
            if [ $consecutive_failures -ge $max_consecutive_failures ] && [ $time_since_last_restart -ge 600 ]; then
                write_log "Multiple service failures detected. Attempting to restart services..." "WARNING"
                # send_notification "$APP_NAME Watchdog" "Services are down. Attempting to restart..."
                
                start_pharmacy_services
                restart_success=$?
                last_restart_time=$(date +%s)
                
                if [ $restart_success -eq 0 ]; then
                    consecutive_failures=0
                    write_log "Services successfully restarted" "SUCCESS"
                    # send_notification "$APP_NAME Watchdog" "Services have been successfully restarted"
                else
                    write_log "Failed to restart services" "ERROR"
                    # send_notification "$APP_NAME Watchdog" "Failed to restart services. Manual intervention may be required."
                fi
            elif [ $time_since_last_restart -lt 600 ]; then
                write_log "Waiting before attempting another restart (minimum 10 minutes between restarts)" "INFO"
            fi
        fi
        
        # Wait for the next check interval
        sleep $CHECK_INTERVAL_SECONDS
    done
}

# Check for command line arguments
if [ "$1" = "-install" ]; then
    # Create systemd service for the watchdog
    create_systemd_service
    exit 0
fi

if [ "$1" = "-update" ]; then
    # Force check for git updates
    write_log "Manually checking for git updates..." "INFO"
    if update_from_git; then
        write_log "Updates found and applied. Rebuilding Docker containers..." "WARNING"
        
        # Get git configuration to find docker-compose.yml
        if get_git_config && [ -f "$WORKING_DIR/docker-compose.yml" ]; then
            # Navigate to working directory
            pushd "$WORKING_DIR" > /dev/null
            
            # Rebuild Docker containers
            if rebuild_docker_containers; then
                write_log "Docker containers rebuilt successfully after update" "SUCCESS"
            else
                write_log "Failed to rebuild Docker containers after update" "ERROR"
            fi
            
            # Return to original directory
            popd > /dev/null
        else
            write_log "Docker compose file not found. Skipping rebuild." "WARNING"
        fi
    else
        write_log "No updates found or unable to update" "INFO"
    fi
    exit 0
fi

# Start the watchdog
start_watchdog 