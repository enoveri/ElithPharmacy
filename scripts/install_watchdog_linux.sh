#!/bin/bash

# Elith Pharmacy Watchdog Installation Script for Linux
# This script installs the Elith Pharmacy watchdog service to run at system startup

# Define paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WATCHDOG_SCRIPT="$SCRIPT_DIR/watchdog.sh"
LOG_FILE="$HOME/ElithPharmacy/watchdog_install.log"

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

# Check if watchdog script exists
if [ ! -f "$WATCHDOG_SCRIPT" ]; then
    write_log "Watchdog script not found at: $WATCHDOG_SCRIPT" "ERROR"
    exit 1
fi

# Make sure the watchdog script is executable
chmod +x "$WATCHDOG_SCRIPT"

# Function to install as systemd user service
install_systemd_user_service() {
    local service_dir="$HOME/.config/systemd/user"
    local service_file="$service_dir/elith-pharmacy-watchdog.service"
    
    # Create directory if it doesn't exist
    mkdir -p "$service_dir"
    
    # Create service file
    cat > "$service_file" << EOF
[Unit]
Description=Elith Pharmacy Watchdog Service
After=network.target

[Service]
ExecStart=/bin/bash $WATCHDOG_SCRIPT
Restart=on-failure
RestartSec=60

[Install]
WantedBy=default.target
EOF
    
    # Enable lingering to allow user services to run after logout
    loginctl enable-linger "$USER"
    
    # Enable and start the service
    systemctl --user daemon-reload
    systemctl --user enable elith-pharmacy-watchdog.service
    systemctl --user start elith-pharmacy-watchdog.service
    
    write_log "Systemd user service installed and started" "SUCCESS"
    return 0
}

# Function to install as cron job
install_cron_job() {
    # Check if crontab is available
    if ! command -v crontab &> /dev/null; then
        write_log "crontab command not found" "ERROR"
        return 1
    fi
    
    # Create a temporary file
    local temp_file=$(mktemp)
    
    # Export current crontab
    crontab -l > "$temp_file" 2>/dev/null || echo "" > "$temp_file"
    
    # Check if entry already exists
    if grep -q "$WATCHDOG_SCRIPT" "$temp_file"; then
        write_log "Cron job already exists. Removing old entry..." "INFO"
        grep -v "$WATCHDOG_SCRIPT" "$temp_file" > "${temp_file}.new"
        mv "${temp_file}.new" "$temp_file"
    fi
    
    # Add new cron job for reboot
    echo "@reboot /bin/bash $WATCHDOG_SCRIPT > $LOG_DIR/watchdog_cron.log 2>&1 &" >> "$temp_file"
    
    # Install new crontab
    crontab "$temp_file"
    rm "$temp_file"
    
    write_log "Cron job installed to run at system startup" "SUCCESS"
    return 0
}

# Function to create a desktop shortcut
create_desktop_shortcut() {
    local desktop_dir="$HOME/Desktop"
    local desktop_file="$desktop_dir/elith-pharmacy-watchdog.desktop"
    
    # Create desktop directory if it doesn't exist
    mkdir -p "$desktop_dir"
    
    # Create desktop file
    cat > "$desktop_file" << EOF
[Desktop Entry]
Type=Application
Name=Start Elith Pharmacy Watchdog
Comment=Start the Elith Pharmacy watchdog service
Exec=/bin/bash $WATCHDOG_SCRIPT
Terminal=true
Categories=Utility;
EOF
    
    # Make it executable
    chmod +x "$desktop_file"
    
    write_log "Desktop shortcut created" "SUCCESS"
    return 0
}

# Main installation process
write_log "Starting Elith Pharmacy Watchdog installation for Linux" "INFO"

# Determine the best installation method
if command -v systemctl &> /dev/null && systemctl --user status &> /dev/null; then
    write_log "Installing as systemd user service..." "INFO"
    if install_systemd_user_service; then
        write_log "Watchdog service installed as systemd user service" "SUCCESS"
        installation_method="systemd"
    else
        write_log "Failed to install as systemd user service, falling back to cron job" "WARNING"
        if install_cron_job; then
            write_log "Watchdog service installed as cron job" "SUCCESS"
            installation_method="cron"
        else
            write_log "Failed to install watchdog service" "ERROR"
            exit 1
        fi
    fi
else
    write_log "Systemd user service not available, installing as cron job" "INFO"
    if install_cron_job; then
        write_log "Watchdog service installed as cron job" "SUCCESS"
        installation_method="cron"
    else
        write_log "Failed to install watchdog service" "ERROR"
        exit 1
    fi
fi

# Create desktop shortcut
write_log "Creating desktop shortcut for manual startup..." "INFO"
create_desktop_shortcut

# Ask if user wants to start the watchdog now
read -p "Do you want to start the watchdog service now? (Y/N): " start_now
if [[ "$start_now" =~ ^[Yy]$ ]]; then
    write_log "Starting watchdog service..." "INFO"
    
    if [ "$installation_method" = "systemd" ]; then
        systemctl --user start elith-pharmacy-watchdog.service
        if systemctl --user is-active elith-pharmacy-watchdog.service &> /dev/null; then
            write_log "Watchdog service started successfully" "SUCCESS"
        else
            write_log "Failed to start watchdog service" "ERROR"
        fi
    else
        # Start directly
        /bin/bash "$WATCHDOG_SCRIPT" &
        write_log "Watchdog service started" "SUCCESS"
    fi
fi

write_log "Installation completed successfully" "SUCCESS"
echo "Installation log saved to: $LOG_FILE"

# Show instructions
echo ""
echo "Elith Pharmacy Watchdog has been installed to run at system startup."
if [ "$installation_method" = "systemd" ]; then
    echo "You can manage the service with these commands:"
    echo "  systemctl --user status elith-pharmacy-watchdog.service  # Check status"
    echo "  systemctl --user stop elith-pharmacy-watchdog.service    # Stop service"
    echo "  systemctl --user start elith-pharmacy-watchdog.service   # Start service"
    echo "  systemctl --user disable elith-pharmacy-watchdog.service # Disable autostart"
else
    echo "The watchdog will start automatically on system boot via cron."
    echo "To manually start the watchdog, use the desktop shortcut or run:"
    echo "  /bin/bash $WATCHDOG_SCRIPT &"
fi 