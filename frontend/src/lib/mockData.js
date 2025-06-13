// Central mock data store for the entire application folder
export const mockData = {
  // Dashboard Statistics
  dashboardStats: {
    todaysSales: 2450.75,
    todaysTransactions: 18,
    totalProducts: 187,
    totalCustomers: 89,
    lowStockItems: 7,
    monthlyRevenue: 67347.25,
    monthlyGrowth: 12.4,
  },

  // Products Data
  products: [
    {
      id: 1,
      name: "Paracetamol 500mg",
      category: "Pain Relief",
      price: 25.5,
      costPrice: 18.0,
      quantity: 150,
      minStockLevel: 20,
      status: "active",
      manufacturer: "PharmaCorp Ltd",
      expiryDate: "2025-12-31",
      batchNumber: "PC2024001",
      barcode: "1234567890123",
      description: "Effective pain relief and fever reducer",
    },
    {
      id: 2,
      name: "Amoxicillin 250mg",
      category: "Antibiotics",
      price: 45.0,
      costPrice: 32.0,
      quantity: 8,
      minStockLevel: 15,
      status: "active",
      manufacturer: "MediPharm",
      expiryDate: "2024-06-30",
      batchNumber: "MP2023045",
      barcode: "2345678901234",
      description: "Broad-spectrum antibiotic",
    },
    {
      id: 3,
      name: "Vitamin C 1000mg",
      category: "Vitamins & Supplements",
      price: 35.75,
      costPrice: 25.0,
      quantity: 200,
      minStockLevel: 30,
      status: "active",
      manufacturer: "HealthPlus",
      expiryDate: "2025-03-15",
      batchNumber: "HP2024012",
      barcode: "3456789012345",
      description: "Immune system support",
    },
    {
      id: 4,
      name: "Cough Syrup 100ml",
      category: "Cold & Flu",
      price: 28.0,
      costPrice: 20.0,
      quantity: 0,
      minStockLevel: 10,
      status: "active",
      manufacturer: "CureMed",
      expiryDate: "2024-08-20",
      batchNumber: "CM2023078",
      barcode: "4567890123456",
      description: "Cough suppressant syrup",
    },
    {
      id: 5,
      name: "Ibuprofen 400mg",
      category: "Pain Relief",
      price: 32.25,
      costPrice: 22.5,
      quantity: 75,
      minStockLevel: 25,
      status: "active",
      manufacturer: "PharmaCorp Ltd",
      expiryDate: "2025-01-10",
      batchNumber: "PC2024015",
      barcode: "5678901234567",
      description: "Anti-inflammatory pain reliever",
    },
  ],

  // Categories
  categories: [
    { id: 1, name: "Pain Relief", description: "Pain and fever management" },
    {
      id: 2,
      name: "Antibiotics",
      description: "Bacterial infection treatment",
    },
    {
      id: 3,
      name: "Vitamins & Supplements",
      description: "Nutritional supplements",
    },
    { id: 4, name: "Cold & Flu", description: "Cold and flu remedies" },
    {
      id: 5,
      name: "Digestive Health",
      description: "Digestive system support",
    },
    {
      id: 6,
      name: "Heart & Blood Pressure",
      description: "Cardiovascular health",
    },
    { id: 7, name: "Diabetes Care", description: "Diabetes management" },
    { id: 8, name: "Skin Care", description: "Dermatological products" },
    { id: 9, name: "Eye Care", description: "Ophthalmic products" },
    { id: 10, name: "Other", description: "Miscellaneous medications" },
  ],

  // Customers Data
  customers: [
    {
      id: 1,
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@email.com",
      phone: "+234 801 234 5678",
      address: "123 Lagos Street",
      city: "Lagos",
      state: "Lagos State",
      zipCode: "100001",
      dateOfBirth: "1985-06-15",
      registrationDate: "2024-01-15",
      status: "active",
      totalPurchases: 12,
      totalSpent: 45750.5,
      lastPurchase: "2024-01-20",
      loyaltyPoints: 450,
    },
    {
      id: 2,
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@email.com",
      phone: "+234 802 345 6789",
      address: "456 Abuja Road",
      city: "Abuja",
      state: "FCT",
      zipCode: "900001",
      dateOfBirth: "1992-03-22",
      registrationDate: "2024-01-10",
      status: "active",
      totalPurchases: 8,
      totalSpent: 32100.25,
      lastPurchase: "2024-01-18",
      loyaltyPoints: 320,
    },
    {
      id: 3,
      firstName: "Michael",
      lastName: "Brown",
      email: "michael.brown@email.com",
      phone: "+234 803 456 7890",
      address: "789 Port Harcourt Ave",
      city: "Port Harcourt",
      state: "Rivers State",
      zipCode: "500001",
      dateOfBirth: "1978-11-08",
      registrationDate: "2023-12-05",
      status: "active",
      totalPurchases: 25,
      totalSpent: 78900.75,
      lastPurchase: "2024-01-19",
      loyaltyPoints: 789,
    },
  ],

  // Sales/Transactions Data
  sales: [
    {
      id: 1,
      transactionNumber: "TXN-2024-000001",
      customerId: 1,
      date: "2024-01-20T10:30:00Z",
      items: [
        { productId: 1, quantity: 2, price: 25.5, total: 51.0 },
        { productId: 3, quantity: 1, price: 35.75, total: 35.75 },
      ],
      subtotal: 86.75,
      tax: 8.68,
      discount: 0,
      totalAmount: 95.43,
      paymentMethod: "cash",
      status: "completed",
      cashierId: 1,
    },
    {
      id: 2,
      transactionNumber: "TXN-2024-000002",
      customerId: 2,
      date: "2024-01-19T14:15:00Z",
      items: [
        { productId: 2, quantity: 1, price: 45.0, total: 45.0 },
        { productId: 5, quantity: 2, price: 32.25, total: 64.5 },
      ],
      subtotal: 109.5,
      tax: 10.95,
      discount: 5.0,
      totalAmount: 115.45,
      paymentMethod: "card",
      status: "completed",
      cashierId: 1,
    },
  ],

  // Low Stock Alerts
  lowStockAlerts: [
    {
      productId: 2,
      productName: "Amoxicillin 250mg",
      currentStock: 8,
      minStockLevel: 15,
      urgency: "high",
      daysUntilStockout: 3,
    },
    {
      productId: 4,
      productName: "Cough Syrup 100ml",
      currentStock: 0,
      minStockLevel: 10,
      urgency: "critical",
      daysUntilStockout: 0,
    },
  ],

  // System Settings
  settings: {
    storeName: "Elith Pharmacy",
    address: "123 Main Street, Lagos",
    phone: "+234 800 123 4567",
    email: "info@elithpharmacy.com",
    currency: "NGN",
    taxRate: 0.1,
    lowStockThreshold: 10,
  },
};

// Helper functions to work with mock data
export const mockHelpers = {
  // Get product by ID
  getProductById: (id) => mockData.products.find((p) => p.id === parseInt(id)),

  // Get customer by ID
  getCustomerById: (id) =>
    mockData.customers.find((c) => c.id === parseInt(id)),

  // Get products by category
  getProductsByCategory: (categoryName) =>
    mockData.products.filter((p) => p.category === categoryName),

  // Get low stock products
  getLowStockProducts: () =>
    mockData.products.filter((p) => p.quantity <= p.minStockLevel),

  // Get sales by customer
  getSalesByCustomer: (customerId) =>
    mockData.sales.filter((s) => s.customerId === parseInt(customerId)),

  // Get recent sales
  getRecentSales: (limit = 10) =>
    mockData.sales
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit),

  // Get top customers by spending
  getTopCustomers: (limit = 5) =>
    mockData.customers
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit),

  // Search products
  searchProducts: (query) =>
    mockData.products.filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase()) ||
        p.manufacturer.toLowerCase().includes(query.toLowerCase())
    ),

  // Search customers
  searchCustomers: (query) =>
    mockData.customers.filter(
      (c) =>
        c.firstName.toLowerCase().includes(query.toLowerCase()) ||
        c.lastName.toLowerCase().includes(query.toLowerCase()) ||
        c.email.toLowerCase().includes(query.toLowerCase())
    ),

  // Generate unique transaction number
  generateTransactionNumber: () => {
    const lastTxn = mockData.sales[mockData.sales.length - 1];
    const lastNumber = lastTxn
      ? parseInt(lastTxn.transactionNumber.split("-").pop())
      : 0;
    return `TXN-2024-${(lastNumber + 1).toString().padStart(6, "0")}`;
  },

  // Get total revenue
  getTotalRevenue: () =>
    mockData.sales.reduce((total, sale) => total + sale.totalAmount, 0),

  // Get products needing reorder
  getProductsToReorder: () =>
    mockData.products.filter((p) => p.quantity <= p.minStockLevel * 1.5),

  // Calculate age from date of birth
  calculateAge: (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  },

  // Get products expiring soon
  getExpiringProducts: (daysThreshold = 30) => {
    const today = new Date();
    const thresholdDate = new Date(
      today.getTime() + daysThreshold * 24 * 60 * 60 * 1000
    );

    return mockData.products
      .filter((product) => {
        const expiryDate = new Date(product.expiryDate);
        return expiryDate <= thresholdDate && expiryDate > today;
      })
      .map((product) => ({
        ...product,
        daysUntilExpiry: Math.ceil(
          (new Date(product.expiryDate) - today) / (1000 * 60 * 60 * 24)
        ),
      }));
  },

  // Get expired products
  getExpiredProducts: () => {
    const today = new Date();
    return mockData.products.filter((product) => {
      const expiryDate = new Date(product.expiryDate);
      return expiryDate <= today;
    });
  },

  // Notification helpers
  getSystemNotifications: () => [
    {
      id: "sys-1",
      type: "info",
      title: "System Backup Complete",
      message: "Daily system backup completed successfully",
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      read: false,
    },
    {
      id: "sys-2",
      type: "warning",
      title: "License Renewal",
      message: "Your software license expires in 30 days",
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      read: true,
    },
  ],

  getStockNotifications: () => {
    const lowStockProducts = mockHelpers.getLowStockProducts();
    return lowStockProducts.map((product) => ({
      id: `stock-${product.id}`,
      type: product.quantity === 0 ? "critical" : "warning",
      title: product.quantity === 0 ? "Out of Stock" : "Low Stock Alert",
      message: `${
        product.name
      } ${product.quantity === 0 ? "is out of stock" : `has only ${product.quantity} units remaining`}`,
      timestamp: new Date(Date.now() - Math.random() * 3600000),
      read: false,
      productId: product.id,
    }));
  },

  getSalesNotifications: () => {
    const recentSales = mockHelpers.getRecentSales(5);
    return recentSales.map((sale) => ({
      id: `sale-${sale.id}`,
      type: "success",
      title: "Sale Completed",
      message: `Transaction ${sale.transactionNumber} - ₦${sale.totalAmount.toFixed(
        2
      )}`,
      timestamp: new Date(sale.date),
      read: Math.random() > 0.3,
      saleId: sale.id,
    }));
  },

  // Enhanced notification helpers
  getExpiryNotifications: () => {
    const expiringProducts = mockHelpers.getExpiringProducts(30);
    const expiredProducts = mockHelpers.getExpiredProducts();

    const expiringNotifications = expiringProducts.map((product) => ({
      id: `expiry-${product.id}`,
      type: product.daysUntilExpiry <= 7 ? "critical" : "warning",
      title:
        product.daysUntilExpiry <= 7
          ? "Product Expiring Soon"
          : "Product Expiry Warning",
      message: `${product.name} expires in ${product.daysUntilExpiry} day${
        product.daysUntilExpiry === 1 ? "" : "s"
      }`,
      timestamp: new Date(Date.now() - Math.random() * 3600000),
      read: false,
      productId: product.id,
      expiryDate: product.expiryDate,
      daysUntilExpiry: product.daysUntilExpiry,
    }));

    const expiredNotifications = expiredProducts.map((product) => ({
      id: `expired-${product.id}`,
      type: "critical",
      title: "Product Expired",
      message: `${product.name} has expired on ${new Date(
        product.expiryDate
      ).toLocaleDateString()}`,
      timestamp: new Date(product.expiryDate),
      read: false,
      productId: product.id,
      expiryDate: product.expiryDate,
    }));

    return [...expiringNotifications, ...expiredNotifications];
  },

  getAllNotifications: () => {
    const systemNotifications = mockHelpers.getSystemNotifications();
    const stockNotifications = mockHelpers.getStockNotifications();
    const salesNotifications = mockHelpers.getSalesNotifications();
    const expiryNotifications = mockHelpers.getExpiryNotifications();

    return [
      ...systemNotifications,
      ...stockNotifications,
      ...salesNotifications,
      ...expiryNotifications,
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  getUnreadNotificationCount: () => {
    const allNotifications = mockHelpers.getAllNotifications();
    return allNotifications.filter((n) => !n.read).length;
  },
};

// API simulation functions
export const mockAPI = {
  // Simulate async data fetching
  delay: (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms)),

  // Simulate API calls
  getProducts: async () => {
    await mockAPI.delay();
    return { data: mockData.products, success: true };
  },

  getCustomers: async () => {
    await mockAPI.delay();
    return { data: mockData.customers, success: true };
  },

  getSales: async () => {
    await mockAPI.delay();
    return { data: mockData.sales, success: true };
  },

  // Add new product
  addProduct: async (product) => {
    await mockAPI.delay();
    const newProduct = { ...product, id: mockData.products.length + 1 };
    mockData.products.push(newProduct);
    return { data: newProduct, success: true };
  },

  // Update product
  updateProduct: async (id, updates) => {
    await mockAPI.delay();
    const index = mockData.products.findIndex((p) => p.id === id);
    if (index !== -1) {
      mockData.products[index] = { ...mockData.products[index], ...updates };
      return { data: mockData.products[index], success: true };
    }
    return { error: "Product not found", success: false };
  },

  // Delete product
  deleteProduct: async (id) => {
    await mockAPI.delay();
    const index = mockData.products.findIndex((p) => p.id === id);
    if (index !== -1) {
      mockData.products.splice(index, 1);
      return { success: true };
    }
    return { error: "Product not found", success: false };
  },
};

export default mockData;
