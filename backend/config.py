"""
Configuration module for the pharmacy backend
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database Configuration
LOCAL_SUPABASE_URL = os.getenv("LOCAL_SUPABASE_URL")
LOCAL_SERVICE_ROLE_KEY = os.getenv("LOCAL_SERVICE_ROLE_KEY")
LOCAL_SUPABASE_KEY = os.getenv("LOCAL_SUPABASE_KEY")
REMOTE_SUPABASE_URL = os.getenv("REMOTE_SUPABASE_URL")
REMOTE_SUPABASE_KEY = os.getenv("REMOTE_SUPABASE_KEY")

# Sync Configuration
SYNC_INTERVAL_MINUTES = int(os.getenv("SYNC_INTERVAL_MINUTES"))
SYNC_LOG_FILE = os.getenv("SYNC_LOG_FILE", "sync.log")