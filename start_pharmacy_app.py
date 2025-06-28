#!/usr/bin/env python3
"""
Elith Pharmacy Application Startup Script
This script implements the startup flow for the Elith Pharmacy application using Docker
"""

import os
import sys
import time
import logging
import subprocess
import platform
import socket
import webbrowser
from pathlib import Path

# Check if on Windows and run PowerShell script instead
if platform.system() == "Windows":
    try:
        print("Detected Windows system. Running PowerShell script instead...")
        subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", "./start_pharmacy_app.ps1"], check=True)
        sys.exit(0)
    except Exception as e:
        print(f"Error running PowerShell script: {e}")

try:
    import psutil
except ImportError:
    print("psutil module not found. Installing...")
    subprocess.run([sys.executable, "-m", "pip", "install", "psutil"], check=True)
    import psutil

# Define application settings
APP_NAME = "Elith Pharmacy"
APP_URL = "http://localhost:5173"  # The URL where the app is hosted
SUPABASE_PORT = 54321  # Default Supabase port

# Set up logging
home_dir = str(Path.home())
log_dir = os.path.join(home_dir, "ElithPharmacy")
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, "app_startup.log")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("ElithPharmacy")

# Color output for terminal
class Colors:
    RESET = "\033[0m"
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"

def log(message, level="INFO"):
    """Log message with color output to console"""
    if level == "ERROR":
        logger.error(message)
        print(f"{Colors.RED}[ERROR] {message}{Colors.RESET}")
    elif level == "WARNING":
        logger.warning(message)
        print(f"{Colors.YELLOW}[WARNING] {message}{Colors.RESET}")
    elif level == "SUCCESS":
        logger.info(message)  # Success is not a standard log level
        print(f"{Colors.GREEN}[SUCCESS] {message}{Colors.RESET}")
    else:
        logger.info(message)
        print(f"[INFO] {message}")

def run_command(command, shell=True):
    """Run a shell command and return the result"""
    try:
        result = subprocess.run(
            command,
            shell=shell,
            check=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        return result
    except Exception as e:
        log(f"Error running command '{command}': {e}", "ERROR")
        return None

def is_app_running():
    """Check if the app is already running"""
    # Check if app is running in browser (simplified approach)
    # This is a basic check and might not be as reliable as the PowerShell version
    
    # Check if Docker containers are running
    try:
        result = run_command("docker ps --format '{{.Names}}'")
        if result and result.returncode == 0:
            containers = result.stdout.splitlines()
            for container in containers:
                if "elithpharmacy" in container.lower() or "frontend" in container.lower():
                    return True
    except Exception:
        # Docker might not be running
        pass
    
    return False

def check_system_resources():
    """Check if system has enough resources"""
    minimum_ram_gb = 4
    minimum_disk_space_gb = 5
    
    # Check RAM
    total_ram_gb = psutil.virtual_memory().total / (1024 ** 3)
    
    # Check disk space
    disk_usage = psutil.disk_usage('/')
    free_disk_space_gb = disk_usage.free / (1024 ** 3)
    
    log(f"System has {total_ram_gb:.2f} GB RAM and {free_disk_space_gb:.2f} GB free disk space")
    
    if total_ram_gb < minimum_ram_gb:
        log(f"Insufficient RAM. Minimum required: {minimum_ram_gb} GB", "WARNING")
        return False
    
    if free_disk_space_gb < minimum_disk_space_gb:
        log(f"Insufficient disk space. Minimum required: {minimum_disk_space_gb} GB", "WARNING")
        return False
    
    return True

def start_docker_service():
    """Check if Docker is running and start it if needed"""
    # Check if Docker daemon is running
    docker_running = False
    
    # First check with docker info
    result = run_command("docker info")
    if result and result.returncode == 0:
        docker_running = True
    else:
        # On Linux, check if docker daemon is running
        if platform.system() == "Linux":
            result = run_command("systemctl is-active docker")
            if result and "active" in result.stdout:
                docker_running = True
                
        # On macOS, check for Docker Desktop process
        elif platform.system() == "Darwin":
            for proc in psutil.process_iter(['name']):
                if "Docker" in proc.info['name']:
                    docker_running = True
                    break
        
        # Try starting Docker if it's not running
        if not docker_running:
            log("Docker is not running. Attempting to start Docker...")
            
            if platform.system() == "Linux":
                log("Attempting to start Docker service...")
                run_command("sudo systemctl start docker")
                time.sleep(5)  # Give Docker time to start
            elif platform.system() == "Darwin":
                log("Please start Docker Desktop manually on macOS")
                return False
            else:
                log("Unable to start Docker automatically. Please start Docker manually.", "ERROR")
                return False
            
            # Check again if Docker is running
            result = run_command("docker info")
            if result and result.returncode == 0:
                docker_running = True
            else:
                log("Failed to start Docker service.", "ERROR")
                return False
    
    if docker_running:
        log("Docker service is running", "SUCCESS")
        return True
    else:
        log("Docker is not running and could not be started", "ERROR")
        return False

def is_supabase_running():
    """Check if Supabase is running"""
    try:
        # Check if port is open
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex(('127.0.0.1', SUPABASE_PORT))
        sock.close()
        
        if result == 0:
            log(f"Supabase is running on port {SUPABASE_PORT}", "SUCCESS")
            return True
        else:
            log(f"Supabase is not running on port {SUPABASE_PORT}", "WARNING")
            return False
    except Exception as e:
        log(f"Error checking Supabase: {e}", "ERROR")
        return False

def start_supabase():
    """Find and start Supabase"""
    # Define possible locations for Elith-Supabase directory
    possible_locations = [
        "./Elith-Supabase",
        "../Elith-Supabase",
        os.path.join(str(Path.home()), "Documents", "Elith-Supabase"),
        os.path.join(str(Path.home()), "Elith-Supabase")
    ]
    
    supabase_dir = None
    
    # Find the Supabase directory
    for location in possible_locations:
        if os.path.exists(location):
            supabase_dir = location
            log(f"Found Elith-Supabase directory at: {supabase_dir}", "SUCCESS")
            break
    
    if supabase_dir is None:
        log("Could not find Elith-Supabase directory", "ERROR")
        return False
    
    # Save current directory to return to later
    current_dir = os.getcwd()
    
    try:
        # Navigate to the directory
        os.chdir(supabase_dir)
        
        # Try to start Supabase with retry logic
        max_retries = 3
        retry_count = 0
        success = False
        
        while not success and retry_count < max_retries:
            retry_count += 1
            log(f"Attempting to start Supabase (Attempt {retry_count} of {max_retries})...")
            
            # Start Supabase
            result = subprocess.run(
                "npx supabase start",
                shell=True,
                check=False,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Check if Supabase started successfully
            if "Started supabase local development setup" in result.stdout or "Started supabase local development setup" in result.stderr:
                success = True
                log("Supabase started successfully", "SUCCESS")
            else:
                log(f"Supabase failed to start on attempt {retry_count}", "WARNING")
                if retry_count < max_retries:
                    log("Waiting 5 seconds before retry...", "INFO")
                    time.sleep(5)
        
        if not success:
            log(f"Failed to start Supabase after {max_retries} attempts", "ERROR")
            return False
        
        # Wait for Supabase to fully initialize
        log("Waiting for Supabase to initialize...")
        time.sleep(10)
        
        # Verify Supabase is running
        return is_supabase_running()
    
    except Exception as e:
        log(f"Error starting Supabase: {e}", "ERROR")
        return False
    
    finally:
        # Return to original directory
        os.chdir(current_dir)

def start_docker_app():
    """Start the app using Docker Compose"""
    try:
        log(f"Starting {APP_NAME} using Docker Compose...")
        
        # Start the application
        result = run_command("docker-compose up -d")
        
        if result and result.returncode != 0:
            log("Failed to start Docker Compose services.", "ERROR")
            return False
        
        log("Docker Compose services started successfully", "SUCCESS")
        
        # Wait for services to be ready
        log("Waiting for services to be ready...")
        time.sleep(10)
        
        return True
    except Exception as e:
        log(f"Error starting Docker Compose: {e}", "ERROR")
        return False

def open_app_in_browser():
    """Open the app in the default browser"""
    try:
        log(f"Opening {APP_NAME} in browser...")
        webbrowser.open(APP_URL)
        log("Application opened in browser", "SUCCESS")
        return True
    except Exception as e:
        log(f"Error opening browser: {e}", "ERROR")
        return False

def main():
    """Main function to start the application"""
    log(f"Starting {APP_NAME} application...")
    
    # Step 1: Check if app is already running
    log("Step 1: Checking if application is already running...")
    app_running = is_app_running()
    if app_running:
        log(f"{APP_NAME} is already running. Opening in browser...")
        open_app_in_browser()
        return 0
    
    # Step 2: Check system resources
    log("Step 2: Checking system resources...")
    resources_ok = check_system_resources()
    if not resources_ok:
        log(f"Insufficient system resources to run {APP_NAME}", "ERROR")
        return 1
    
    # Step 3: Start Docker
    log("Step 3: Ensuring Docker is running...")
    docker_ok = start_docker_service()
    if not docker_ok:
        log("Failed to start Docker. Cannot continue.", "ERROR")
        return 1
    
    # Step 4: Check if Supabase is running and start it if needed
    log("Step 4: Checking if Supabase is running...")
    supabase_ok = is_supabase_running()
    if not supabase_ok:
        log("Attempting to start Supabase automatically...", "INFO")
        supabase_ok = start_supabase()
        if not supabase_ok:
            log("Failed to automatically start Supabase. Please start it manually.", "ERROR")
            log("You can start Supabase using the Supabase CLI or Docker Desktop.", "INFO")
            return 1
    
    # Step 5: Start the application using Docker Compose
    log("Step 5: Starting application services...")
    app_ok = start_docker_app()
    if not app_ok:
        log("Failed to start application services. Cannot continue.", "ERROR")
        return 1
    
    # Step 6: Open app in browser
    # log("Step 6: Opening application in browser...")
    # open_app_in_browser()
    
    log(f"{APP_NAME} started successfully!", "SUCCESS")
    log(f"You can access the application at {APP_URL}")
    log("Supabase Studio is available at http://localhost:54322")
    
    # Display container status
    print("\nContainer Status:")
    run_command("docker-compose ps")
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 