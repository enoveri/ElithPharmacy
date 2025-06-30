"""
Configuration module for the pharmacy backend
"""

import os
import socket
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Check if running in Docker
def is_running_in_docker():
    try:
        with open('/proc/1/cgroup', 'r') as f:
            return 'docker' in f.read()
    except:
        return False

# Database Configuration
LOCAL_SUPABASE_URL = os.getenv("LOCAL_SUPABASE_URL")
# Replace localhost with host.docker.internal when running in Docker
if is_running_in_docker() and LOCAL_SUPABASE_URL and ('localhost' in LOCAL_SUPABASE_URL or '127.0.0.1' in LOCAL_SUPABASE_URL):
    LOCAL_SUPABASE_URL = LOCAL_SUPABASE_URL.replace('localhost', 'host.docker.internal').replace('127.0.0.1', 'host.docker.internal')

LOCAL_SERVICE_ROLE_KEY = os.getenv("LOCAL_SERVICE_ROLE_KEY")
LOCAL_SUPABASE_KEY = os.getenv("LOCAL_SUPABASE_KEY")
REMOTE_SUPABASE_URL = os.getenv("REMOTE_SUPABASE_URL")
REMOTE_SUPABASE_KEY = os.getenv("REMOTE_SUPABASE_KEY")
REMOTE_SERVICE_ROLE_KEY = os.getenv("REMOTE_SERVICE_ROLE_KEY")

# Sync Configuration
SYNC_INTERVAL_MINUTES = int(os.getenv("SYNC_INTERVAL_MINUTES"))
SYNC_LOG_FILE = os.getenv("SYNC_LOG_FILE", "sync.log")