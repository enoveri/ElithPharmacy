# Elith Pharmacy Backend

This directory contains the backend code for Elith Pharmacy, including database synchronization and initialization tools.

## Sync Tool

The `sync.py` script handles synchronization between local and remote Supabase instances, ensuring the pharmacy system works both online and offline. It can also initialize the database with mock data.

### Features

- Bidirectional synchronization between local and remote Supabase instances
- Database initialization with mock data
- Automatic table creation via REST API
- Configurable sync intervals

### Usage

```bash
# Run the sync service (default behavior)
python sync.py

# Initialize local database with mock data
python sync.py --init local

# Initialize remote database with mock data
python sync.py --init remote

# Initialize both databases with mock data
python sync.py --init both

# Initialize database and then run sync service
python sync.py --init local --sync
```

### Configuration

Edit the `config.py` file to set your Supabase URLs and API keys:

```python
LOCAL_SUPABASE_URL = "http://localhost:54321"
LOCAL_SUPABASE_KEY = "your-local-supabase-key"
LOCAL_SERVICE_ROLE_KEY = "your-local-service-role-key"  # Needed for table creation
REMOTE_SUPABASE_URL = "https://your-project.supabase.co"
REMOTE_SUPABASE_KEY = "your-remote-supabase-key"
SYNC_INTERVAL_MINUTES = 5  # Sync every 5 minutes
```

## Database Schema

The sync tool creates the following tables if they don't exist:

- `products`: Store inventory items
- `categories`: Product categories
- `customers`: Customer information
- `sales`: Sales transactions
- `sale_items`: Individual items in a sale
- `settings`: System settings

Each table includes a `synced` flag to track synchronization status between local and remote databases.

## Mock Data

The initialization process uses the mock data defined in `backend/mock_data.json`. This JSON file contains sample data for all tables in the database, ensuring consistency between frontend development and backend database structure. 