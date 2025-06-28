"""
Elith Pharmacy Application Shutdown Script
This script gracefully stops all Elith Pharmacy application services
"""

import os
import sys
import time
import logging
import subprocess
import platform
import socket
from pathlib import Path

# Check if on Windows and run PowerShell script instead
if platform.system() == "Windows":
    try:
        print("Detected Windows system. Running PowerShell script instead...")
        subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", "./stop_pharmacy_app.ps1"], check=True)
        sys.exit(0)
    except Exception as e:
        print(f"Error running PowerShell script: {e}")
        print("Continuing with Python implementation...")

try:
    import psutil
except ImportError:
    print("psutil module not found. Installing...")
    subprocess.run([sys.executable, "-m", "pip", "install", "psutil"], check=True)
    import psutil

# Define application settings
APP_NAME = "Elith Pharmacy"
APP_URL = "http://localhost:5173"

# Set up logging
home_dir = str(Path.home())
log_dir = os.path.join(home_dir, "ElithPharmacy")
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, "app_shutdown.log")

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

def is_docker_running():
    """Check if Docker is running"""
    try:
        result = run_command("docker info")
        if result and result.returncode == 0:
            return True
        else:
            log("Docker is not running.", "WARNING")
            return False
    except Exception as e:
        log(f"Docker is not available: {e}", "WARNING")
        return False

def is_supabase_running():
    """Check if Supabase is running"""
    try:
        # Check if port is open
        supabase_port = 54321
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex(('127.0.0.1', supabase_port))
        sock.close()
        
        if result == 0:
            log(f"Supabase is running on port {supabase_port}", "INFO")
            return True
        else:
            log(f"Supabase is not running on port {supabase_port}", "INFO")
            return False
    except Exception as e:
        log(f"Error checking Supabase: {e}", "ERROR")
        return False

def stop_supabase():
    """Find and stop Supabase"""
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
        log("Could not find Elith-Supabase directory", "WARNING")
        return False
    
    # Save current directory to return to later
    current_dir = os.getcwd()
    
    try:
        # Navigate to the directory
        os.chdir(supabase_dir)
        
        # Try to stop Supabase with retry logic
        max_retries = 3
        retry_count = 0
        success = False
        
        while not success and retry_count < max_retries:
            retry_count += 1
            log(f"Attempting to stop Supabase (Attempt {retry_count} of {max_retries})...")
            
            # Stop Supabase
            result = subprocess.run(
                "npx supabase stop",
                shell=True,
                check=False,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Check if Supabase stopped successfully
            if "Stopped supabase local development setup" in result.stdout or "Stopped supabase local development setup" in result.stderr:
                success = True
                log("Supabase stopped successfully", "SUCCESS")
            else:
                log(f"Supabase failed to stop on attempt {retry_count}", "WARNING")
                if retry_count < max_retries:
                    log("Waiting 5 seconds before retry...", "INFO")
                    time.sleep(5)
        
        if not success:
            log(f"Failed to stop Supabase after {max_retries} attempts", "WARNING")
            return False
        
        return True
    
    except Exception as e:
        log(f"Error stopping Supabase: {e}", "ERROR")
        return False
    
    finally:
        # Return to original directory
        os.chdir(current_dir)

def stop_docker_containers():
    """Stop Docker containers related to the application"""
    try:
        log(f"Checking for running {APP_NAME} containers...")
        
        # Check if any containers are running
        result = run_command("docker ps --format '{{.Names}}'")
        if not result or result.returncode != 0:
            log("Failed to check running containers.", "ERROR")
            return False
            
        containers = [c for c in result.stdout.splitlines() if any(x in c.lower() for x in ["elithpharmacy", "frontend", "backend"])]
        
        if not containers:
            log(f"No running {APP_NAME} containers found.", "INFO")
            return True
        
        log(f"Found running containers: {', '.join(containers)}")
        log("Stopping services with docker-compose...")
        
        # Stop containers using docker-compose
        result = run_command("docker-compose stop")
        
        if not result or result.returncode != 0:
            log("Failed to stop containers with docker-compose. Attempting direct container stop...", "WARNING")
            
            # Try stopping containers directly
            for container in containers:
                log(f"Stopping container: {container}")
                stop_result = run_command(f"docker stop {container}")
                
                if not stop_result or stop_result.returncode != 0:
                    log(f"Failed to stop container: {container}", "ERROR")
        
        # Check if any containers are still running
        result = run_command("docker ps --format '{{.Names}}'")
        if result and result.returncode == 0:
            remaining = [c for c in result.stdout.splitlines() if any(x in c.lower() for x in ["elithpharmacy", "frontend", "backend"])]
            
            if remaining:
                log(f"Some containers are still running: {', '.join(remaining)}", "WARNING")
                return False
        
        log(f"All {APP_NAME} containers stopped successfully", "SUCCESS")
        return True
    except Exception as e:
        log(f"Error stopping Docker containers: {e}", "ERROR")
        return False

def close_app_browser_windows():
    """Close browser windows running the application"""
    try:
        log("Closing any browser windows running the application...")
        
        # This is platform-specific and more complex in Python
        # For simplicity, we'll just provide instructions
        log("Please manually close any browser windows running the application", "INFO")
        
        # On Linux/macOS, we could potentially use more advanced techniques
        # but for cross-platform compatibility, we'll keep it simple
        
        return True
    except Exception as e:
        log(f"Error closing browser windows: {e}", "WARNING")
        # Not critical if this fails
        return True

def main():
    """Main function to stop the application"""
    log(f"Starting shutdown of {APP_NAME} application...", "INFO")
    
    # Step 1: Check if Docker is running
    log("Step 1: Checking if Docker is running...")
    docker_running = is_docker_running()
    if not docker_running:
        log("Docker is not running. No need to stop containers.", "INFO")
    else:
        # Step 2: Stop Docker containers
        log("Step 2: Stopping Docker containers...")
        containers_ok = stop_docker_containers()
        if not containers_ok:
            log("Warning: Some containers may still be running.", "WARNING")
    
    # Step 3: Check if Supabase is running and stop it if needed
    log("Step 3: Checking if Supabase is running...")
    supabase_running = is_supabase_running()
    if supabase_running:
        log("Attempting to stop Supabase...", "INFO")
        supabase_ok = stop_supabase()
        if not supabase_ok:
            log("Warning: Failed to stop Supabase. It may still be running.", "WARNING")
    else:
        log("Supabase is not running. No need to stop it.", "INFO")
    
    # Step 4: Close browser windows
    log("Step 4: Closing browser windows...")
    close_app_browser_windows()
    
    log(f"{APP_NAME} application shutdown complete!", "SUCCESS")
    
    # Display any remaining containers (if Docker is running)
    if docker_running:
        print("\nRemaining Containers:")
        run_command("docker ps")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())