#!/usr/bin/env python3
"""
Pharmacy Database Sync and Initialization Tool

This script synchronizes data between local and remote Supabase instances
to ensure the pharmacy system works both online and offline. It can also
initialize the database with mock data.
"""

import os
import sys
import time
import json
import argparse
import schedule
from loguru import logger
from supabase import create_client, Client
import requests

from config import LOCAL_SUPABASE_URL, REMOTE_SUPABASE_URL, SYNC_INTERVAL_MINUTES, LOCAL_SERVICE_ROLE_KEY, REMOTE_SERVICE_ROLE_KEY

class PharmacyDatabaseSync:
    """Class to handle synchronization between local and remote Supabase instances"""
    
    def __init__(self):
        """Initialize the sync class"""

        self.PHARMACY_DB_TABLES = [
            "products",
            "categories",
            "customers",
            "sales",
            "sale_items",
            "settings",
            "admin_users",
            "notifications",
            "email_templates",
            # "email_stats", # this is a view, not a table
            "email_queue",
            "email_logs",
        ]

        # Configure logging
        logger.add("sync.log", rotation="10 MB", retention="1 week")
        
        # Initialize clients
        self.local_supabase = None
        self.remote_supabase = None
        
        # Health status
        self.last_sync_time = None
        self.is_healthy = True
        self.health_status = "Initialized"

    def connect_to_supabase(self, target="both"):
        """Establish connections to both Supabase instances"""
        if target == "local":
            try:
                self.local_supabase = create_client(LOCAL_SUPABASE_URL, LOCAL_SERVICE_ROLE_KEY)
                logger.info(f"Connected to local Supabase at {LOCAL_SUPABASE_URL}")
                self.health_status = "Connected to local Supabase"
            except Exception as e:
                logger.error(f"Failed to connect to local Supabase: {e}")
                self.local_supabase = None
                self.is_healthy = False
                self.health_status = f"Failed to connect to local Supabase: {str(e)}"
        elif target == "remote":
            try:
                self.remote_supabase = create_client(REMOTE_SUPABASE_URL, REMOTE_SERVICE_ROLE_KEY)
                logger.info(f"Connected to remote Supabase at {REMOTE_SUPABASE_URL}")
                self.health_status = "Connected to remote Supabase"
            except Exception as e:
                logger.error(f"Failed to connect to remote Supabase: {e}")
                self.remote_supabase = None
                self.is_healthy = False
                self.health_status = f"Failed to connect to remote Supabase: {str(e)}"
        elif target == "both":
            self.connect_to_supabase("local")
            self.connect_to_supabase("remote")
        else:
            logger.error(f"Invalid target: {target}")
            return False
        return True

    def get_health_status(self):
        """Return the health status of the sync service"""
        status = {
            "is_healthy": self.is_healthy,
            "status": self.health_status,
            "last_sync_time": self.last_sync_time,
            "local_connection": self.local_supabase is not None,
            "remote_connection": self.remote_supabase is not None,
        }
        return status
        
    def sync_local_to_remote(self):
        """Sync data from local to remote database"""
        if not self.local_supabase or not self.remote_supabase:
            logger.error("Cannot sync: one or both database connections are unavailable")
            self.is_healthy = False
            self.health_status = "Cannot sync: database connections unavailable"
            return
        
        logger.info("Starting sync from local to remote")
        
        for table in self.PHARMACY_DB_TABLES:
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
                self.is_healthy = False
                self.health_status = f"Error syncing {table}: {str(e)}"

    def sync_remote_to_local(self):
        """Sync data from remote to local database"""
        if not self.local_supabase or not self.remote_supabase:
            logger.error("Cannot sync: one or both database connections are unavailable")
            self.is_healthy = False
            self.health_status = "Cannot sync: database connections unavailable"
            return
        
        logger.info("Starting sync from remote to local")
        
        for table in self.PHARMACY_DB_TABLES:
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
                self.is_healthy = False
                self.health_status = f"Error syncing {table} from remote: {str(e)}"

    def run_sync(self):
        """Run a complete sync cycle"""
        self.connect_to_supabase()
        
        if self.local_supabase and self.remote_supabase:
            self.sync_local_to_remote()
            self.sync_remote_to_local()
            self.last_sync_time = time.strftime("%Y-%m-%dT%H:%M:%S")
            self.is_healthy = True
            self.health_status = f"Last successful sync at {self.last_sync_time}"
        else:
            if not self.local_supabase:
                logger.error("Cannot sync: local database connection is unavailable")
            if not self.remote_supabase:
                logger.error("Cannot sync: remote database connection is unavailable")

    def start(self):
        """Start the sync service"""
        logger.info("Starting pharmacy database sync service")
        logger.info(f"Local Supabase URL: {LOCAL_SUPABASE_URL}")
        logger.info(f"Remote Supabase URL: {REMOTE_SUPABASE_URL}")
        
        # Run immediately on startup
        self.run_sync()
        
        # Schedule regular syncs
        schedule.every(SYNC_INTERVAL_MINUTES).minutes.do(self.run_sync)
        
        # Keep the script running
        while True:
            schedule.run_pending()
            time.sleep(1)
            
    # THE FOLLOWING CODE HAS BEEN DEPRECATED.
    # IT IS NOT USED IN THE CURRENT IMPLEMENTATION.
    # IT IS KEPT HERE FOR REFERENCE.

    # def create_tables_if_not_exist(self, supabase_url, supabase_key):
    #     """Create necessary tables using the Supabase REST API"""
    #     try:
    #         headers = {
    #             "apikey": supabase_key,
    #             "Authorization": f"Bearer {supabase_key}",
    #             "Content-Type": "application/json",
    #             "Prefer": "return=representation"
    #         }
            
    #         # Define table schemas
    #         tables = {
    #             "notifications": NOTIFICATIONS_SCHEMA_SQL,
    #             "products": """
    #                 CREATE TABLE IF NOT EXISTS products (
    #                     id SERIAL PRIMARY KEY,
    #                     name TEXT NOT NULL,
    #                     category TEXT NOT NULL,
    #                     price NUMERIC(10, 2) NOT NULL,
    #                     cost_price NUMERIC(10, 2) NOT NULL,
    #                     quantity INTEGER NOT NULL,
    #                     min_stock_level INTEGER NOT NULL,
    #                     status TEXT NOT NULL,
    #                     manufacturer TEXT,
    #                     expiry_date DATE,
    #                     batch_number TEXT,
    #                     barcode TEXT,
    #                     description TEXT,
    #                     synced BOOLEAN DEFAULT FALSE,
    #                     created_at TIMESTAMPTZ DEFAULT NOW(),
    #                     updated_at TIMESTAMPTZ DEFAULT NOW()
    #                 );
    #             """,
    #             "categories": """
    #                 CREATE TABLE IF NOT EXISTS categories (
    #                     id SERIAL PRIMARY KEY,
    #                     name TEXT NOT NULL,
    #                     description TEXT,
    #                     synced BOOLEAN DEFAULT FALSE,
    #                     created_at TIMESTAMPTZ DEFAULT NOW(),
    #                     updated_at TIMESTAMPTZ DEFAULT NOW()
    #                 );
    #             """,
    #             "customers": """
    #                 CREATE TABLE IF NOT EXISTS customers (
    #                     id SERIAL PRIMARY KEY,
    #                     first_name TEXT NOT NULL,
    #                     last_name TEXT NOT NULL,
    #                     email TEXT,
    #                     phone TEXT,
    #                     address TEXT,
    #                     city TEXT,
    #                     state TEXT,
    #                     zip_code TEXT,
    #                     date_of_birth DATE,
    #                     registration_date DATE NOT NULL,
    #                     status TEXT NOT NULL,
    #                     total_purchases INTEGER DEFAULT 0,
    #                     total_spent NUMERIC(12, 2) DEFAULT 0,
    #                     last_purchase DATE,
    #                     loyalty_points INTEGER DEFAULT 0,
    #                     synced BOOLEAN DEFAULT FALSE,
    #                     created_at TIMESTAMPTZ DEFAULT NOW(),
    #                     updated_at TIMESTAMPTZ DEFAULT NOW()
    #                 );
    #             """,
    #             "sales": """
    #                 CREATE TABLE IF NOT EXISTS sales (
    #                     id SERIAL PRIMARY KEY,
    #                     transaction_number TEXT NOT NULL,
    #                     customer_id INTEGER REFERENCES customers(id),
    #                     date TIMESTAMPTZ NOT NULL,
    #                     subtotal NUMERIC(10, 2) NOT NULL,
    #                     tax NUMERIC(10, 2) NOT NULL,
    #                     discount NUMERIC(10, 2) NOT NULL,
    #                     total_amount NUMERIC(10, 2) NOT NULL,
    #                     payment_method TEXT NOT NULL,
    #                     status TEXT NOT NULL,
    #                     cashier_id INTEGER,
    #                     synced BOOLEAN DEFAULT FALSE,
    #                     created_at TIMESTAMPTZ DEFAULT NOW(),
    #                     updated_at TIMESTAMPTZ DEFAULT NOW()
    #                 );
    #             """,
    #             "sale_items": """
    #                 CREATE TABLE IF NOT EXISTS sale_items (
    #                     id SERIAL PRIMARY KEY,
    #                     sale_id INTEGER REFERENCES sales(id),
    #                     product_id INTEGER REFERENCES products(id),
    #                     quantity INTEGER NOT NULL,
    #                     price NUMERIC(10, 2) NOT NULL,
    #                     total NUMERIC(10, 2) NOT NULL,
    #                     synced BOOLEAN DEFAULT FALSE,
    #                     created_at TIMESTAMPTZ DEFAULT NOW(),
    #                     updated_at TIMESTAMPTZ DEFAULT NOW()
    #                 );
    #             """,
    #             "settings": SETTINGS_SCHEMA,
    #             "admin_users": ADMIN_USERS_SCHEMA
    #         }
            
    #         # Execute SQL for each table
    #         for table_name, sql in tables.items():
    #             logger.info(f"Creating table: {table_name}")
                
    #             # Use the SQL API endpoint
    #             response = requests.post(
    #                 f"{supabase_url}/rest/v1/rpc/execute_sql",
    #                 headers=headers,
    #                 json={"sql": sql}
    #             )
                
    #             if response.status_code >= 300:
    #                 logger.error(f"Error creating table {table_name}: {response.text}")
    #                 return False
            
    #         logger.success("Successfully created all required tables")
            
    #         # Execute functions from functions.sql file
    #         try:
    #             with open("functions.sql", "r") as f:
    #                 functions_sql = f.read()
                    
    #             logger.info("Creating functions from functions.sql")

    #             # Strip any auth schema functions, as they require elevated permissions
    #             # Split the SQL into individual function definitions
    #             functions = functions_sql.split("CREATE OR REPLACE FUNCTION")
                
    #             for func in functions:
    #                 if func.strip():
    #                     # Skip auth schema functions which we don't have permission for
    #                     if "auth." in func.lower() or "schema auth" in func.lower():
    #                         logger.info("Skipping auth schema function")
    #                         continue
                        
    #                     # Add back the CREATE OR REPLACE part for non-auth functions
    #                     func_sql = "CREATE OR REPLACE FUNCTION" + func
                        
    #                     try:
    #                         # Execute each function separately to isolate failures
    #                         response = requests.post(
    #                             f"{supabase_url}/rest/v1/rpc/execute_sql",
    #                             headers=headers,
    #                             json={"sql": func_sql}
    #                         )
                            
    #                         if response.status_code >= 300:
    #                             logger.warning(f"Error creating function: {response.text}")
    #                         else:
    #                             logger.info("Successfully created function")
    #                     except Exception as func_err:
    #                         logger.error(f"Error executing function: {func_err}")
                
    #             logger.success("Completed function creation process")
            
    #         except Exception as e:
    #             logger.error(f"Error reading or executing functions.sql: {e}")
    #             # Continue even if functions fail - tables are more important
            
    #         return True
            
    #     except Exception as e:
    #         logger.error(f"Error creating tables: {e}")
    #         return False
    
    # def load_mock_data(self):
    #     """Load mock data from JSON file"""
    #     try:
    #         with open("backend/mock_data.json", 'r') as file:
    #             mock_data = json.load(file)
    #         logger.success("Successfully loaded mock data from JSON file")
    #         return mock_data
    #     except Exception as e:
    #         logger.error(f"Error loading mock data: {e}")
    #         return None

    # def insert_mock_data(self, supabase, mock_data):
    #     """Insert the mock data into Supabase tables"""
    #     try:
    #         # Insert products
    #         for product in mock_data.get('products', []):
    #             # Convert camelCase to snake_case for DB fields
    #             db_product = {
    #                 "id": product["id"],
    #                 "name": product["name"],
    #                 "category": product["category"],
    #                 "price": product["price"],
    #                 "cost_price": product["costPrice"],
    #                 "quantity": product["quantity"],
    #                 "min_stock_level": product["minStockLevel"],
    #                 "status": product["status"],
    #                 "manufacturer": product["manufacturer"],
    #                 "expiry_date": product["expiryDate"],
    #                 "batch_number": product["batchNumber"],
    #                 "barcode": product["barcode"],
    #                 "description": product["description"],
    #                 "synced": True
    #             }
    #             supabase.table("products").upsert(db_product).execute()
            
    #         # Insert categories
    #         for category in mock_data.get('categories', []):
    #             db_category = {
    #                 "id": category["id"],
    #                 "name": category["name"],
    #                 "description": category["description"],
    #                 "synced": True
    #             }
    #             supabase.table("categories").upsert(db_category).execute()
            
    #         # Insert customers
    #         for customer in mock_data.get('customers', []):
    #             db_customer = {
    #                 "id": customer["id"],
    #                 "first_name": customer["firstName"],
    #                 "last_name": customer["lastName"],
    #                 "email": customer["email"],
    #                 "phone": customer["phone"],
    #                 "address": customer["address"],
    #                 "city": customer["city"],
    #                 "state": customer["state"],
    #                 "zip_code": customer["zipCode"],
    #                 "date_of_birth": customer["dateOfBirth"],
    #                 "registration_date": customer["registrationDate"],
    #                 "status": customer["status"],
    #                 "total_purchases": customer["totalPurchases"],
    #                 "total_spent": customer["totalSpent"],
    #                 "last_purchase": customer["lastPurchase"],
    #                 "loyalty_points": customer["loyaltyPoints"],
    #                 "synced": True
    #             }
    #             supabase.table("customers").upsert(db_customer).execute()
            
    #         # Insert sales and sale items
    #         for sale in mock_data.get('sales', []):
    #             db_sale = {
    #                 "id": sale["id"],
    #                 "transaction_number": sale["transactionNumber"],
    #                 "customer_id": sale["customerId"],
    #                 "date": sale["date"],
    #                 "subtotal": sale["subtotal"],
    #                 "tax": sale["tax"],
    #                 "discount": sale["discount"],
    #                 "total_amount": sale["totalAmount"],
    #                 "payment_method": sale["paymentMethod"],
    #                 "status": sale["status"],
    #                 "cashier_id": sale["cashierId"],
    #                 "synced": True
    #             }
    #             supabase.table("sales").upsert(db_sale).execute()
                
    #             # Insert sale items
    #             for idx, item in enumerate(sale.get("items", [])):
    #                 db_item = {
    #                     "id": sale["id"] * 100 + idx,  # Generate a unique ID
    #                     "sale_id": sale["id"],
    #                     "product_id": item["productId"],
    #                     "quantity": item["quantity"],
    #                     "price": item["price"],
    #                     "total": item["total"],
    #                     "synced": True
    #                 }
    #                 supabase.table("sale_items").upsert(db_item).execute()
            
    #         # Insert settings
    #         settings = mock_data.get('settings', {})
    #         if settings:
    #             db_settings = {
    #                 "id": 1,  # Use ID 1 for the single settings record
    #                 "store_name": settings["storeName"],
    #                 "address": settings["address"],
    #                 "phone": settings["phone"],
    #                 "email": settings["email"],
    #                 "currency": settings["currency"],
    #                 "tax_rate": settings["taxRate"],
    #                 "low_stock_threshold": settings["lowStockThreshold"],
    #                 "synced": True
    #             }
    #             supabase.table("settings").upsert(db_settings).execute()
            
    #         logger.success("Successfully inserted all mock data")
    #         return True
            
    #     except Exception as e:
    #         logger.error(f"Error inserting mock data: {e}")
    #         return False
    
    # def initialize_database(self, target="local"):
    #     """Initialize the database with mock data"""
    #     self.connect_to_supabase(target=target)
        
    #     # Select which database to initialize
    #     supabase = None
    #     supabase_url = None
    #     supabase_key = None
        
    #     if target == "local" and self.local_supabase:
    #         supabase = self.local_supabase
    #         supabase_url = LOCAL_SUPABASE_URL
    #         supabase_key = LOCAL_SERVICE_ROLE_KEY
    #         logger.info("Initializing local database")
    #     elif target == "remote" and self.remote_supabase:
    #         supabase = self.remote_supabase
    #         supabase_url = REMOTE_SUPABASE_URL
    #         supabase_key = REMOTE_SUPABASE_KEY
    #         logger.info("Initializing remote database")
    #     else:
    #         logger.error(f"Cannot initialize {target} database: connection not available")
    #         return False
        
    #     # Create tables
    #     if not self.create_tables_if_not_exist(supabase_url, supabase_key):
    #         return False
        
    #     # Load and insert mock data
    #     mock_data = self.load_mock_data()
    #     if not mock_data:
    #         return False
        
    #     success = self.insert_mock_data(supabase, mock_data)
    #     if success:
    #         logger.success(f"Successfully initialized the {target} database")
    #     return success


def main():
    """Main function to parse arguments and run the appropriate action"""
    parser = argparse.ArgumentParser(description='Pharmacy Database Sync and Initialization Tool')
    #parser.add_argument('--init', choices=['local', 'remote', 'both'], 
    #                    help='Initialize database with mock data (local, remote, or both)')
    parser.add_argument('--sync', action='store_true', help='Run the sync service')
    
    args = parser.parse_args()
    
    sync_service = PharmacyDatabaseSync()
    
    # Handle initialization if requested
    # if args.init:
    #     if args.init == 'local' or args.init == 'both':
    #         sync_service.initialize_database('local')
        
    #     if args.init == 'remote' or args.init == 'both':
    #         sync_service.initialize_database('remote')
    
    # Run sync service if requested or if no specific action was provided
    if args.sync:
        sync_service.start()
    

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.error(f"Error: {e}")
        sys.exit(1)