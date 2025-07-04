# Stock Import Functionality Guide

## Overview
The Receive Stock page now includes powerful import functionality that allows you to bulk import inventory data from CSV or Excel files. This feature automatically updates existing products, creates new products, and manages categories dynamically.

## Features

### 🔄 Automatic Processing
- **Product Matching**: Automatically matches products by name (case-insensitive)
- **Category Management**: Creates new categories automatically when they don't exist
- **Smart Updates**: Updates existing products with new stock quantities and information
- **New Product Creation**: Creates new products for items not found in the database

### 📊 Supported File Formats
- CSV (.csv)
- Excel (.xlsx, .xls)

### 🛡️ Data Validation
- Product name validation (required field)
- Numeric value parsing for prices and quantities
- Date format parsing for expiry dates
- Error handling with detailed feedback

## How to Use

### Step 1: Download Template
1. Click on the "Bulk Import" button on the Receive Stock page
2. Click "Download Template" to get the correct CSV format
3. The template includes sample data to guide you

### Step 2: Prepare Your Data
Fill in your data using these columns:

| Column Name | Description | Required | Example |
|-------------|-------------|----------|---------|
| Product_Name | Name of the product | ✅ Yes | "Panadol 500mg" |
| Category | Product category | ❌ No | "Pain Relief" |
| Volume | Product volume/strength | ❌ No | "500mg" |
| Retail_Price | Selling price | ❌ No | "1000" |
| Cost_Price | Purchase/cost price | ❌ No | "750" |
| Quantity_Received | Stock quantity to add | ❌ No | "100" |
| Batch_Number | Batch identifier | ❌ No | "BATCH001" |
| Expiry_Date | Expiry date | ❌ No | "2025-12-31" |
| Manufacturer | Manufacturer name | ❌ No | "GSK" |

### Step 3: Import Process
1. Choose your prepared CSV/Excel file
2. Click "Import Data"
3. Monitor the progress bar
4. Review the import results

## Import Results

After import completion, you'll see:

- **Processed**: Total number of rows processed
- **Updated**: Existing products that had their stock updated
- **Created**: New products that were added to the database
- **Categories**: New categories that were automatically created
- **Errors**: Any rows that failed to process (with detailed error messages)

## Supported Date Formats

The system can parse multiple date formats:
- ISO format: `2025-12-31`
- US format: `12/31/2025`
- European format: `31/12/2025`
- Text format: `Dec 31 2025`
- Full timestamp: `Tue Dec 31 2025 03:00:00 GMT+0300`

## Data Processing Rules

### Product Updates
- **Existing Products**: Stock quantities are **added** to current stock (not replaced)
- **Price Updates**: Prices are updated only if new values are provided and greater than 0
- **Category Updates**: Categories are updated if provided
- **Additional Info**: Manufacturer, batch number, and expiry date are updated if provided

### Important Note About Facility_Name
The `Facility_Name` column in supplier CSV files typically contains your pharmacy's name (as the customer) from the supplier's perspective. This field is **automatically ignored** during import since it doesn't represent supplier information but rather identifies you as the buyer.

### New Products
- Created with all provided information
- Default category is "General" if none specified
- Initial stock is set to the quantity_received value

### Category Management
- New categories are automatically created with "Auto-created from import" description
- Category names are normalized (e.g., "pain relief" becomes "Pain Relief")
- Common category variations are mapped to standard names

## Using Your Supplier's CSV Format

Based on your `costOfInventory.csv` example, the system can handle various column name formats:

| Your CSV Column | Maps To | Notes |
|-----------------|---------|-------|
| Facility_Name | **IGNORED** | Represents your pharmacy (customer), not supplier |
| Product | Product_Name | Main product identifier |
| Tags | Category | Automatically normalized |
| Volume | Volume | Product strength/volume |
| Retail_Price | Retail_Price | Selling price |
| Cost_Price | Cost_Price | Purchase price |
| In_Stock | Quantity_Received | Stock to add |
| Earliest_Expiry | Expiry_Date | Supports multiple formats |

## Error Handling

Common import errors and solutions:

### Missing Product Name
- **Error**: "Product name is required"
- **Solution**: Ensure the Product_Name column has values for all rows

### Invalid Numbers
- **Error**: Invalid price or quantity values
- **Solution**: Use numeric values only (e.g., "1000" not "1,000 UGX")

### Date Parsing Issues
- **Error**: Cannot parse date
- **Solution**: Use standard date formats (YYYY-MM-DD recommended)

### Duplicate Products
- Not an error - existing products will have stock quantities added

## Database Scripts

Two database scripts are provided to ensure your database supports all import features:

### 1. `import_functionality_database_script.sql`
- Creates/updates the categories table
- Adds necessary columns to products table (volume, manufacturer, batch_number, expiry_date, last_restock_date)
- Sets up proper indexes for performance
- Creates RLS policies for security
- Includes a robust import function

### 2. `enhanced_import_script.sql`
- Advanced date parsing functions
- Enhanced data validation
- Category name normalization
- Error handling improvements

## Best Practices

### Data Preparation
1. **Clean Your Data**: Remove extra spaces and ensure consistent formatting
2. **Validate Numbers**: Ensure prices and quantities are numeric
3. **Standardize Dates**: Use YYYY-MM-DD format when possible
4. **Check Product Names**: Ensure product names are consistent with existing inventory

### Import Process
1. **Start Small**: Test with a few products first
2. **Review Template**: Always use the downloaded template format
3. **Backup Data**: Backup your database before large imports
4. **Monitor Results**: Review import results for any errors
5. **Verify Stock**: Check a few products manually after import

### Performance Tips
- For large imports (>1000 products), consider breaking into smaller batches
- Import during low-usage periods for better performance
- Ensure stable internet connection for the entire import process

## Troubleshooting

### Import Fails to Start
- Check file format (CSV/Excel only)
- Ensure file is not corrupted
- Verify file has proper headers

### Slow Import Performance
- Reduce batch size
- Check internet connection
- Try during off-peak hours

### Category Issues
- Categories are auto-created, but review for duplicates
- Merge similar categories manually if needed
- Update category descriptions after import

### Stock Discrepancies
- Remember: import **adds** to existing stock
- Check if products were imported multiple times
- Verify quantity calculations

## Support

If you encounter issues:
1. Check the error messages in the import results
2. Verify your data format matches the template
3. Ensure database scripts have been run
4. Review this guide for common solutions

## Example Import Workflow

1. **Export from Supplier**: Get CSV/Excel from your supplier
2. **Download Template**: Get the correct format from the system
3. **Map Data**: Copy supplier data to template format
4. **Clean Data**: Remove extra characters, validate numbers
5. **Test Import**: Import a few rows first
6. **Full Import**: Import complete dataset
7. **Verify Results**: Check products and categories
8. **Stock Audit**: Verify stock levels are correct

This import functionality streamlines receiving stock from suppliers while maintaining data integrity and providing comprehensive error handling. 