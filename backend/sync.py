#!/usr/bin/env python3
"""
Pharmacy Database Sync Tool

This script synchronizes data between local and remote Supabase instances
to ensure the pharmacy system works both online and offline.
"""

import os
import time
import schedule
from loguru import logger
from supabase import create_client, Client
_
from config import LOCAL_SUPABASE_KEY, LOCAL_SUPABASE_URL, REMOTE_SUPABASE_KEY,\
    REMOTE_SUPABASE_URL, SYNC_INTERVAL_MINUTES


class PharmacyDatabaseSync:
    """Class to handle synchronization between local and remote Supabase instances"""
    
    def __init__(self):
        """Initialize the sync class"""
        # Configure logging
        logger.add("sync.log", rotation="10 MB", retention="1 week")
        
        # Initialize clients
        self.local_supabase = None
        self.remote_supabase = None
    
    def get_tables(self, supabase: Client):
        """Get all tables from a Supabase instance"""
        try:
            response = supabase.table("pg_catalog.pg_tables").select("tablename").execute()
            return [row["tablename"] for row in response.data]
        except Exception as e:
            logger.error(f"Error getting tables: {e}")
            return []

    def connect_to_supabase(self):
        """Establish connections to both Supabase instances"""
        try:
            self.local_supabase = create_client(LOCAL_SUPABA_SE_URL, LOCAL_SUPABASE_KEY)
            logger.info("Connected to local Supabase")
        except Exception as e:
            logger.error(f"Failed to connect to local Supabase: {e}")
            self.local_supabase = None
        
        try:
            self.remote_supabase = create_client(REMOTE_SUPABASE_URL, REMOTE_SUPABASE_KEY)
            logger.info("Connected to remote Supabase")
        except Exception as e:
            logger.error(f"Failed to connect to remote Supabase: {e}")
            self.remote_supabase = None

    def sync_local_to_remote(self):
        """Sync data from local to remote database"""
        if not self.local_supabase or not self.remote_supabase:
            logger.error("Cannot sync: one or both database connections are unavailable")
            return
        
        logger.info("Starting sync from local to remote")
        
        tables = self.get_tables(self.local_supabase)
        for table in tables:
            try:
                # Get local records with sync flag
                response = self.local_supabase.table(table).select("*").eq("synced", False).execute()
                local_records = response.data
                
                if not local_records:
                    logger.info(f"No new records to sync in {table}")
                    continue
                
                logger.info(f"Syncing {len(local_records)} records from {table}")
                
                # Insert or update records in remote db
                for record in local_records:
                    record_id = record.get("id")
                    # Remove sync flag for remote insertion
                    record_copy = {k: v for k, v in record.items() if k != "synced"}
                    
                    # Upsert the record to remote
                    self.remote_supabase.table(table).upsert(record_copy).execute()
                    
                    # Mark as synced in local db
                    self.local_supabase.table(table).update({"synced": True}).eq("id", record_id).execute()
                
                logger.success(f"Successfully synced {len(local_records)} records from {table}")
            
            except Exception as e:
                logger.error(f"Error syncing {table}: {e}")

    def sync_remote_to_local(self):
        """Sync data from remote to local database"""
        if not self.local_supabase or not self.remote_supabase:
            logger.error("Cannot sync: one or both database connections are unavailable")
            return
        
        logger.info("Starting sync from remote to local")
        
        tables = self.get_tables(self.remote_supabase)
        for table in tables:
            try:
                # Get last sync timestamp for this table
                last_sync_file = f"last_sync_{table}.txt"
                last_sync = "1970-01-01T00:00:00"
                
                if os.path.exists(last_sync_file):
                    with open(last_sync_file, "r") as f:
                        last_sync = f.read().strip()
                
                # Get remote records updated since last sync
                response = self.remote_supabase.table(table).select("*").gt("updated_at", last_sync).execute()
                remote_records = response.data
                
                if not remote_records:
                    logger.info(f"No new updates in remote {table}")
                    continue
                
                logger.info(f"Syncing {len(remote_records)} records to {table}")
                
                # Insert or update records in local db
                for record in remote_records:
                    record_copy = dict(record)
                    record_copy["synced"] = True  # Mark as synced
                    self.local_supabase.table(table).upsert(record_copy).execute()
                
                # Update last sync timestamp
                current_time = time.strftime("%Y-%m-%dT%H:%M:%S")
                with open(last_sync_file, "w") as f:
                    f.write(current_time)
                
                logger.success(f"Successfully synced {len(remote_records)} records to {table}")
            
            except Exception as e:
                logger.error(f"Error syncing {table} from remote: {e}")

    def run_sync(self):
        """Run a complete sync cycle"""
        self.connect_to_supabase()
        
        if self.local_supabase and self.remote_supabase:
            self.sync_local_to_remote()
            self.sync_remote_to_local()
        else:
            logger.warning("Skipping sync due to connection issues")

    def start(self):
        """Start the sync service"""
        logger.info("Starting pharmacy database sync service")
        
        # Run immediately on startup
        self.run_sync()
        
        # Schedule regular syncs
        schedule.every(SYNC_INTERVAL_MINUTES).minutes.do(self.run_sync)
        
        # Keep the script running
        while True:
            schedule.run_pending()
            time.sleep(1)


def main():
    """Main function to instantiate and run the sync process"""
    sync_service = PharmacyDatabaseSync()
    sync_service.start()


if __name__ == "__main__":
    main() 