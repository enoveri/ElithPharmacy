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
    write_log "Press Ctrl+C to stop the watchdog"
    
    consecutive_failures=0
    max_consecutive_failures=3
    last_restart_time=0
    
    while true; do
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
        else
            consecutive_failures=$((consecutive_failures + 1))
            current_time=$(date +%s)
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

# Start the watchdog
start_watchdog 