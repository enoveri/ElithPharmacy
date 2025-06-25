# Mock Data Documentation

This directory contains mock data and utilities for the Elith Pharmacy Management System development.

## Files Overview

- `mockData.js` - Complete mock dataset with realistic pharmacy data
- `config.js` - Environment configuration and API endpoints

## Mock Data Structure

### 🧑‍💼 Users & Staff (`mockData.users`)

Staff members with different roles and permissions:

```javascript
{
  id: string,                    // Unique identifier
  username: string,              // Login username
  email: string,                 // Email address
  fullName: string,              // Display name
  role: 'admin' | 'pharmacist' | 'cashier',
  avatar: string,                // Profile picture URL
  phone: string,                 // Contact number
  address: string,               // Physical address
  createdAt: string,             // ISO date string
  lastLogin: string,             // ISO date string
  isActive: boolean              // Account status
}
```

**Available Roles:**

- `admin` - Full system access
- `pharmacist` - Can handle prescriptions and drug management
- `cashier` - Can process sales and basic operations

### 🏷️ Product Categories (`mockData.categories`)

Product classification system:

```javascript
{
  id: string,                    // Category identifier (cat1, cat2, etc.)
  name: string,                  // Category display name
  description: string            // Category description
}
```

**Available Categories:**

- Prescription Drugs
- Over-the-Counter
- Vitamins & Supplements
- Personal Care
- First Aid
- Baby Care
- Medical Equipment

### 💊 Products & Inventory (`mockData.products`)

Complete product information with inventory tracking:

```javascript
{
  id: string,                    // Unique product ID
  name: string,                  // Product name
  genericName: string,           // Generic/scientific name
  brand: string,                 // Brand name
  category: string,              // Category ID reference
  description: string,           // Product description
  dosage: string,                // Dosage information
  form: string,                  // Form (Tablet, Capsule, Gel, etc.)
  manufacturer: string,          // Manufacturer name
  batchNumber: string,           // Batch/lot number
  barcode: string,               // Product barcode
  price: number,                 // Selling price
  costPrice: number,             // Purchase cost
  stockQuantity: number,         // Current stock level
  minStockLevel: number,         // Minimum stock threshold
  maxStockLevel: number,         // Maximum stock capacity
  expiryDate: string,            // ISO date string
  manufactureDate: string,       // ISO date string
  requiresPrescription: boolean, // Prescription requirement
  isActive: boolean,             // Product availability
  supplier: string,              // Supplier name
  location: string,              // Storage location code
  createdAt: string,             // ISO date string
  updatedAt: string              // ISO date string
}
```

### 👥 Customers (`mockData.customers`)

Customer database with medical and insurance information:

```javascript
{
  id: string,                    // Unique customer ID
  firstName: string,             // First name
  lastName: string,              // Last name
  email: string,                 // Email address
  phone: string,                 // Phone number
  dateOfBirth: string,           // ISO date string
  address: {                     // Address object
    street: string,
    city: string,
    state: string,
    zipCode: string,
    country: string
  },
  insuranceInfo: {               // Insurance details
    provider: string,
    policyNumber: string,
    groupNumber: string
  },
  allergies: string[],           // List of known allergies
  emergencyContact: {            // Emergency contact info
    name: string,
    relationship: string,
    phone: string
  },
  registrationDate: string,      // ISO date string
  lastVisit: string,             // ISO date string
  totalPurchases: number,        // Total number of purchases
  totalSpent: number,            // Total amount spent
  isActive: boolean              // Customer status
}
```

### 💰 Sales & Transactions (`mockData.sales`)

Complete transaction records with line items:

```javascript
{
  id: string,                    // Transaction ID
  transactionNumber: string,     // Human-readable transaction number
  customerId: string,            // Customer ID reference
  cashierId: string,             // Cashier ID reference
  pharmacistId: string | null,   // Pharmacist ID (if prescription involved)
  date: string,                  // ISO date string
  items: [                       // Array of purchased items
    {
      productId: string,         // Product ID reference
      productName: string,       // Product name snapshot
      quantity: number,          // Quantity purchased
      unitPrice: number,         // Price per unit
      totalPrice: number,        // Total for this line item
      discountAmount: number,    // Discount applied
      prescriptionNumber: string | null  // Prescription reference
    }
  ],
  subtotal: number,              // Subtotal before tax/discount
  taxAmount: number,             // Tax amount
  discountAmount: number,        // Total discount
  totalAmount: number,           // Final total
  paymentMethod: string,         // Payment method used
  paymentReference: string,      // Payment reference/confirmation
  status: string,                // Transaction status
  notes: string,                 // Additional notes
  refundAmount: number,          // Refund amount (if any)
  isRefunded: boolean            // Refund status
}
```

### 📋 Prescriptions (`mockData.prescriptions`)

Prescription management and tracking:

```javascript
{
  id: string,                    // Prescription ID
  prescriptionNumber: string,    // Prescription number
  customerId: string,            // Customer ID reference
  doctorName: string,            // Prescribing doctor
  doctorLicense: string,         // Doctor's license number
  dateIssued: string,            // ISO date string
  dateFilled: string,            // ISO date string
  status: string,                // Prescription status
  medications: [                 // Array of prescribed medications
    {
      productId: string,         // Product ID reference
      medicationName: string,    // Medication name
      dosage: string,            // Dosage information
      frequency: string,         // Frequency of use
      duration: string,          // Duration of treatment
      quantity: number,          // Quantity prescribed
      refills: number,           // Number of refills allowed
      instructions: string       // Special instructions
    }
  ],
  pharmacistId: string,          // Dispensing pharmacist
  counselingProvided: boolean,   // Counseling status
  patientSignature: boolean,     // Signature confirmation
  insuranceClaimed: boolean,     // Insurance claim status
  copay: number                  // Patient copay amount
}
```

### 🏭 Suppliers (`mockData.suppliers`)

Supplier and vendor information:

```javascript
{
  id: string,                    // Supplier ID
  name: string,                  // Company name
  contactPerson: string,         // Contact person name
  email: string,                 // Contact email
  phone: string,                 // Contact phone
  address: {                     // Address object
    street: string,
    city: string,
    state: string,
    zipCode: string,
    country: string
  },
  paymentTerms: string,          // Payment terms (Net 30, etc.)
  discountRate: number,          // Discount percentage
  isActive: boolean,             // Supplier status
  lastOrderDate: string          // ISO date string
}
```

### 📊 Reports & Analytics

#### Sales Reports (`mockData.salesReports`)

```javascript
{
  daily: {
    date: string,                // Report date
    totalSales: number,          // Total sales amount
    totalTransactions: number,   // Number of transactions
    averageTransaction: number,  // Average transaction value
    topProducts: [               // Best selling products
      {
        productName: string,
        quantity: number,
        revenue: number
      }
    ],
    hourlyBreakdown: [           // Sales by hour
      {
        hour: string,            // Time slot
        sales: number,           // Sales amount
        transactions: number     // Transaction count
      }
    ]
  },
  monthly: {
    month: string,               // Report month
    totalSales: number,          // Total monthly sales
    totalTransactions: number,   // Monthly transaction count
    averageTransaction: number,  // Average transaction value
    growth: number,              // Growth percentage
    topCategories: [             // Top performing categories
      {
        category: string,
        revenue: number,
        percentage: number
      }
    ]
  }
}
```

### ⚠️ Alerts & Notifications

#### Low Stock Alerts (`mockData.lowStockAlerts`)

```javascript
{
  productId: string,             // Product ID reference
  productName: string,           // Product name
  currentStock: number,          // Current stock level
  minStockLevel: number,         // Minimum threshold
  suggestedOrder: number,        // Suggested order quantity
  priority: 'low' | 'medium' | 'high',  // Alert priority
  daysUntilStockout: number      // Estimated days until stockout
}
```

#### Expiry Alerts (`mockData.expiryAlerts`)

```javascript
{
  productId: string,             // Product ID reference
  productName: string,           // Product name
  batchNumber: string,           // Batch number
  expiryDate: string,            // ISO date string
  daysUntilExpiry: number,       // Days until expiration
  currentStock: number,          // Current stock level
  priority: 'low' | 'medium' | 'high'  // Alert priority
}
```

### 📈 Dashboard Statistics (`mockData.dashboardStats`)

Key performance indicators for the dashboard:

```javascript
{
  todaysSales: number,           // Today's total sales
  todaysTransactions: number,    // Today's transaction count
  totalProducts: number,         // Total products in inventory
  lowStockItems: number,         // Number of low stock items
  expiringItems: number,         // Number of expiring items
  totalCustomers: number,        // Total registered customers
  monthlyRevenue: number,        // Current month revenue
  monthlyGrowth: number          // Monthly growth percentage
}
```

## Helper Functions (`mockHelpers`)

Utility functions for working with mock data:

### `getProductsByCategory(categoryId)`

Returns all products in a specific category.

```javascript
const prescriptionDrugs = mockHelpers.getProductsByCategory("cat1");
```

### `getCustomerById(customerId)`

Finds a customer by their ID.

```javascript
const customer = mockHelpers.getCustomerById("60c1e50f0f1b2c0015e5d1c1");
```

### `getSalesByDateRange(startDate, endDate)`

Filters sales within a date range.

```javascript
const juneSales = mockHelpers.getSalesByDateRange("2024-06-01", "2024-06-30");
```

### `getLowStockProducts()`

Returns products below minimum stock level.

```javascript
const lowStockItems = mockHelpers.getLowStockProducts();
```

### `getExpiringProducts(days = 90)`

Returns products expiring within specified days.

```javascript
const expiringIn30Days = mockHelpers.getExpiringProducts(30);
```

### `generateTransactionNumber()`

Generates a unique transaction number.

```javascript
const txnNumber = mockHelpers.generateTransactionNumber();
// Returns: "TXN-2024-123456"
```

### `calculateAge(dateOfBirth)`

Calculates age from date of birth.

```javascript
const age = mockHelpers.calculateAge("1985-05-15");
// Returns: 39
```

## Usage Examples

### Import Mock Data

```javascript
import mockData, { mockHelpers } from "../lib/mockData";

// Use in components
const products = mockData.products;
const lowStock = mockHelpers.getLowStockProducts();
```

### Component Usage

```javascript
// In a React component
function ProductList() {
  const products = mockData.products;
  const categories = mockData.categories;

  return (
    <div>
      {products.map((product) => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>Stock: {product.stockQuantity}</p>
          <p>Price: ${product.price}</p>
        </div>
      ))}
    </div>
  );
}
```

### State Management Usage

```javascript
// In Zustand store
import mockData from "../lib/mockData";

const useStore = create((set, get) => ({
  products: mockData.products,
  customers: mockData.customers,
  sales: mockData.sales,

  // Actions
  addProduct: (product) =>
    set((state) => ({
      products: [...state.products, product],
    })),

  updateStock: (productId, newStock) =>
    set((state) => ({
      products: state.products.map((product) =>
        product.id === productId
          ? { ...product, stockQuantity: newStock }
          : product
      ),
    })),
}));
```

## Data Relationships

- `products.category` → `categories.id`
- `sales.customerId` → `customers.id`
- `sales.cashierId` → `users.id`
- `sales.pharmacistId` → `users.id`
- `sales.items.productId` → `products.id`
- `prescriptions.customerId` → `customers.id`
- `prescriptions.pharmacistId` → `users.id`

## Notes

- All dates are in ISO 8601 format (`YYYY-MM-DDTHH:mm:ssZ`)
- Prices are in decimal format (e.g., 15.99)
- IDs use MongoDB ObjectId format for consistency
- Stock quantities are integers
- Phone numbers include country code format
- All mock data is realistic and representative of actual pharmacy operations

This mock data provides a comprehensive foundation for developing and testing all features of the pharmacy management system without requiring a backend database during development.
