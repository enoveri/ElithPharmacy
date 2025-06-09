#!/usr/bin/env python3
"""
Supabase Local Test Script

This script tests the schema and functionality of local and remote Supabase instances
to ensure database integrity and proper configuration.
"""

import os
import sys
import json
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv
from loguru import logger
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Configure logging
logger.remove()
logger.add(sys.stdout, format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {file}:{line} | {message}")
logger.add("supabase_test.log", rotation="10 MB", retention="1 week", format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {file}:{line} | {message}")

# Supabase configuration
LOCAL_SUPABASE_URL = os.getenv("LOCAL_SUPABASE_URL")
LOCAL_SUPABASE_KEY = os.getenv("LOCAL_SUPABASE_KEY")
REMOTE_SUPABASE_URL = os.getenv("REMOTE_SUPABASE_URL")
REMOTE_SUPABASE_KEY = os.getenv("REMOTE_SUPABASE_KEY")

# Initialize clients
local_supabase: Optional[Client] = None
remote_supabase: Optional[Client] = None

def connect_to_supabase() -> bool:
    """Establish connections to both Supabase instances"""
    global local_supabase, remote_supabase
    success = True
    
    try:
        local_supabase = create_client(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_KEY)
        # test connection
        if not local_supabase.table("pg_catalog.pg_tables").select("tablename").eq("schemaname", "public").execute():
            logger.error("Failed to connect to local Supabase")
            return False
        logger.success("Connected to local Supabase")
    except Exception as e:
        logger.error(f"Failed to connect to local Supabase: {e}")
        success = False
    
    try:
        remote_supabase = create_client(REMOTE_SUPABASE_URL, REMOTE_SUPABASE_KEY)
        logger.success("Connected to remote Supabase")
    except Exception as e:
        logger.error(f"Failed to connect to remote Supabase: {e}")
        success = False
    
    return success

def get_tables(supabase: Client) -> List[str]:
    """Get all tables from a Supabase instance"""
    try:
        response = supabase.table("pg_catalog.pg_tables").select("tablename").eq("schemaname", "public").execute()
        tables = [row["tablename"] for row in response.data]
        logger.info(f"Found {len(tables)} tables: {', '.join(tables)}")
        return tables
    except Exception as e:
        logger.error(f"Error getting tables: {e}")
        return []

def get_table_schema(supabase: Client, table_name: str) -> List[Dict[str, Any]]:
    """Get schema information for a specific table"""
    try:
        # Query information_schema.columns for table structure
        response = supabase.table("information_schema.columns") \
            .select("column_name, data_type, is_nullable, column_default") \
            .eq("table_name", table_name) \
            .eq("table_schema", "public") \
            .execute()
        
        logger.info(f"Schema for {table_name}: {len(response.data)} columns")
        for col in response.data:
            logger.info(f"  - {col['column_name']}: {col['data_type']} (nullable: {col['is_nullable']})")
        
        return response.data
    except Exception as e:
        logger.error(f"Error getting schema for {table_name}: {e}")
        return []

def get_table_constraints(supabase: Client, table_name: str) -> List[Dict[str, Any]]:
    """Get constraints for a specific table"""
    try:
        # Query for primary keys, foreign keys, and unique constraints
        query = """
        SELECT 
            tc.constraint_name, 
            tc.constraint_type, 
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM 
            information_schema.table_constraints tc
        JOIN 
            information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        LEFT JOIN 
            information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
        WHERE 
            tc.table_name = '{table}'
            AND tc.table_schema = 'public'
        """.format(table=table_name)
        
        response = supabase.rpc("exec_sql", {"sql": query}).execute()
        
        logger.info(f"Constraints for {table_name}: {len(response.data)} found")
        for constraint in response.data:
            if constraint['constraint_type'] == 'PRIMARY KEY':
                logger.info(f"  - Primary Key: {constraint['column_name']}")
            elif constraint['constraint_type'] == 'FOREIGN KEY':
                logger.info(f"  - Foreign Key: {constraint['column_name']} references {constraint['foreign_table_name']}.{constraint['foreign_column_name']}")
            elif constraint['constraint_type'] == 'UNIQUE':
                logger.info(f"  - Unique: {constraint['column_name']}")
        
        return response.data
    except Exception as e:
        logger.error(f"Error getting constraints for {table_name}: {e}")
        return []

def get_table_indexes(supabase: Client, table_name: str) -> List[Dict[str, Any]]:
    """Get indexes for a specific table"""
    try:
        query = """
        SELECT
            i.relname as index_name,
            a.attname as column_name,
            ix.indisunique as is_unique
        FROM
            pg_class t,
            pg_class i,
            pg_index ix,
            pg_attribute a
        WHERE
            t.oid = ix.indrelid
            and i.oid = ix.indexrelid
            and a.attrelid = t.oid
            and a.attnum = ANY(ix.indkey)
            and t.relkind = 'r'
            and t.relname = '{table}'
        ORDER BY
            t.relname, i.relname
        """.format(table=table_name)
        
        response = supabase.rpc("exec_sql", {"sql": query}).execute()
        
        logger.info(f"Indexes for {table_name}: {len(response.data)} found")
        for idx in response.data:
            unique_str = "unique" if idx['is_unique'] else "non-unique"
            logger.info(f"  - {idx['index_name']}: {unique_str} index on {idx['column_name']}")
        
        return response.data
    except Exception as e:
        logger.error(f"Error getting indexes for {table_name}: {e}")
        return []

def test_table_data(supabase: Client, table_name: str) -> Dict[str, Any]:
    """Test data in a table - count rows and sample data"""
    try:
        # Count rows
        count_response = supabase.table(table_name).select("*", count="exact").execute()
        row_count = count_response.count
        
        # Get sample data (first 5 rows)
        sample_response = supabase.table(table_name).select("*").limit(5).execute()
        sample_data = sample_response.data
        
        logger.info(f"Data in {table_name}: {row_count} rows")
        if sample_data:
            logger.info(f"Sample data from {table_name} (first {len(sample_data)} rows):")
            for i, row in enumerate(sample_data):
                logger.info(f"  Row {i+1}: {json.dumps(row, default=str)[:100]}...")
        
        return {
            "row_count": row_count,
            "sample_data": sample_data
        }
    except Exception as e:
        logger.error(f"Error testing data for {table_name}: {e}")
        return {"row_count": 0, "sample_data": []}

def test_table_crud(supabase: Client, table_name: str) -> bool:
    """Test CRUD operations on a table"""
    test_id = f"test_{int(time.time())}"
    success = True
    
    try:
        # Create a test record
        test_data = {
            "id": test_id,
            "name": f"Test Record {test_id}",
            "created_at": datetime.now().isoformat(),
            "synced": False
        }
        
        # Try to adapt the data based on schema
        schema = get_table_schema(supabase, table_name)
        if schema:
            # Only keep fields that exist in the schema
            schema_columns = [col["column_name"] for col in schema]
            test_data = {k: v for k, v in test_data.items() if k in schema_columns}
            
            # Make sure we have required fields
            if not test_data:
                logger.warning(f"Could not create test data for {table_name} - no matching columns")
                return False
        
        logger.info(f"Testing CRUD operations on {table_name}")
        logger.info(f"Creating test record: {test_data}")
        
        # Create
        create_response = supabase.table(table_name).insert(test_data).execute()
        if create_response.data:
            logger.success(f"Successfully created test record in {table_name}")
        else:
            logger.error(f"Failed to create test record in {table_name}")
            success = False
        
        # Read
        read_response = supabase.table(table_name).select("*").eq("id", test_id).execute()
        if read_response.data:
            logger.success(f"Successfully read test record from {table_name}")
        else:
            logger.error(f"Failed to read test record from {table_name}")
            success = False
        
        # Update
        update_data = {"name": f"Updated Test Record {test_id}"}
        update_response = supabase.table(table_name).update(update_data).eq("id", test_id).execute()
        if update_response.data:
            logger.success(f"Successfully updated test record in {table_name}")
        else:
            logger.error(f"Failed to update test record in {table_name}")
            success = False
        
        # Delete
        delete_response = supabase.table(table_name).delete().eq("id", test_id).execute()
        if delete_response.data:
            logger.success(f"Successfully deleted test record from {table_name}")
        else:
            logger.error(f"Failed to delete test record from {table_name}")
            success = False
        
        return success
    except Exception as e:
        logger.error(f"Error during CRUD test for {table_name}: {e}")
        # Try to clean up the test record
        try:
            supabase.table(table_name).delete().eq("id", test_id).execute()
        except:
            pass
        return False

def compare_schemas(local_schema: List[Dict[str, Any]], remote_schema: List[Dict[str, Any]]) -> bool:
    """Compare schemas between local and remote databases"""
    if not local_schema or not remote_schema:
        logger.error("Cannot compare schemas - one or both are empty")
        return False
    
    # Create dictionaries for easier comparison
    local_cols = {col["column_name"]: col for col in local_schema}
    remote_cols = {col["column_name"]: col for col in remote_schema}
    
    # Check for missing columns
    local_missing = set(remote_cols.keys()) - set(local_cols.keys())
    remote_missing = set(local_cols.keys()) - set(remote_cols.keys())
    
    if local_missing:
        logger.warning(f"Columns in remote but missing in local: {', '.join(local_missing)}")
    
    if remote_missing:
        logger.warning(f"Columns in local but missing in remote: {', '.join(remote_missing)}")
    
    # Check for type mismatches
    mismatches = []
    for col_name in set(local_cols.keys()) & set(remote_cols.keys()):
        local_type = local_cols[col_name]["data_type"]
        remote_type = remote_cols[col_name]["data_type"]
        if local_type != remote_type:
            mismatches.append(f"{col_name}: local={local_type}, remote={remote_type}")
    
    if mismatches:
        logger.warning(f"Type mismatches between local and remote: {', '.join(mismatches)}")
    
    return not (local_missing or remote_missing or mismatches)

def test_all_tables():
    """Test all tables in both local and remote databases"""
    if not connect_to_supabase():
        logger.error("Failed to connect to one or both Supabase instances")
        return
    
    logger.info("=== Starting Comprehensive Schema Tests ===")
    
    # Get tables from both databases
    local_tables = get_tables(local_supabase)
    remote_tables = get_tables(remote_supabase)
    
    # Check for missing tables
    missing_in_local = set(remote_tables) - set(local_tables)
    missing_in_remote = set(local_tables) - set(remote_tables)
    
    if missing_in_local:
        logger.warning(f"Tables in remote but missing in local: {', '.join(missing_in_local)}")
    
    if missing_in_remote:
        logger.warning(f"Tables in local but missing in remote: {', '.join(missing_in_remote)}")
    
    # Test common tables
    common_tables = set(local_tables) & set(remote_tables)
    logger.info(f"Testing {len(common_tables)} common tables")
    
    results = {
        "matching_schemas": 0,
        "mismatched_schemas": 0,
        "successful_crud_tests": 0,
        "failed_crud_tests": 0
    }
    
    for table in common_tables:
        logger.info(f"\n=== Testing table: {table} ===")
        
        # Get and compare schemas
        local_schema = get_table_schema(local_supabase, table)
        remote_schema = get_table_schema(remote_supabase, table)
        
        if compare_schemas(local_schema, remote_schema):
            logger.success(f"Schemas match for {table}")
            results["matching_schemas"] += 1
        else:
            logger.warning(f"Schema mismatch for {table}")
            results["mismatched_schemas"] += 1
        
        # Get constraints and indexes
        get_table_constraints(local_supabase, table)
        get_table_indexes(local_supabase, table)
        
        # Test data
        test_table_data(local_supabase, table)
        
        # Test CRUD operations
        if test_table_crud(local_supabase, table):
            results["successful_crud_tests"] += 1
        else:
            results["failed_crud_tests"] += 1
    
    # Summary
    logger.info("\n=== Test Summary ===")
    logger.info(f"Total tables tested: {len(common_tables)}")
    logger.info(f"Matching schemas: {results['matching_schemas']}")
    logger.info(f"Mismatched schemas: {results['mismatched_schemas']}")
    logger.info(f"Successful CRUD tests: {results['successful_crud_tests']}")
    logger.info(f"Failed CRUD tests: {results['failed_crud_tests']}")

def test_single_instance(url: str, key: str, instance_name: str = "Supabase"):
    """Test a single Supabase instance thoroughly
    
    Args:
        url: The Supabase URL
        key: The Supabase API key
        instance_name: Name to identify this instance in logs (e.g., "Local" or "Remote")
    """
    logger.info(f"=== Testing {instance_name} Supabase Instance ===")
    
    try:
        # Connect to the instance
        supabase = create_client(url, key)
        logger.success(f"Connected to {instance_name} Supabase")
        
        # Get tables
        tables = get_tables(supabase)
        if not tables:
            logger.error(f"No tables found in {instance_name} instance")
            return
        
        logger.info(f"Found {len(tables)} tables in {instance_name} instance")
        
        results = {
            "tables_tested": 0,
            "successful_schema_tests": 0,
            "successful_crud_tests": 0,
            "failed_crud_tests": 0
        }
        
        for table in tables:
            logger.info(f"\n=== Testing table: {table} ===")
            
            # Get schema
            schema = get_table_schema(supabase, table)
            if schema:
                results["successful_schema_tests"] += 1
            
            # Get constraints and indexes
            get_table_constraints(supabase, table)
            get_table_indexes(supabase, table)
            
            # Test data
            test_table_data(supabase, table)
            
            # Test CRUD operations
            if test_table_crud(supabase, table):
                results["successful_crud_tests"] += 1
            else:
                results["failed_crud_tests"] += 1
                
            results["tables_tested"] += 1
        
        # Summary
        logger.info(f"\n=== {instance_name} Instance Test Summary ===")
        logger.info(f"Total tables tested: {results['tables_tested']}")
        logger.info(f"Successful schema tests: {results['successful_schema_tests']}")
        logger.info(f"Successful CRUD tests: {results['successful_crud_tests']}")
        logger.info(f"Failed CRUD tests: {results['failed_crud_tests']}")
        
        return results
        
    except Exception as e:
        logger.error(f"Error testing {instance_name} instance: {e}")
        return None

def main():
    """Main function to run tests"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test Supabase database schemas and functionality")
    parser.add_argument("--mode", choices=["local", "remote", "both"], default="both",
                      help="Which Supabase instance to test")
    
    args = parser.parse_args()
    
    if args.mode == "local":
        logger.info("Testing local Supabase instance only")
        test_single_instance(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_KEY, "Local")
    elif args.mode == "remote":
        logger.info("Testing remote Supabase instance only")
        test_single_instance(REMOTE_SUPABASE_URL, REMOTE_SUPABASE_KEY, "Remote")
    else:
        logger.info("Testing both Supabase instances and comparing schemas")
        test_all_tables()

if __name__ == "__main__":
    main()
