// Data service that provides a unified interface to the database
import { dbHelpers } from "../lib/db";

// Data service that provides a unified interface
export const dataService = {
  // Products
  products: {
    getAll: async () => {
      const { data, error } = await dbHelpers.getProducts();
      if (error) throw error;
      return data || [];
    },

    getById: async (id) => {
      return await dbHelpers.getProductById(id);
    },

    getByCategory: async (category) => {
      return await dbHelpers.getProductsByCategory(category);
    },

    getLowStock: async () => {
      return await dbHelpers.getLowStockProducts();
    },

    getExpiring: async (days = 30) => {
      return await dbHelpers.getExpiringProducts(days);
    },

    getExpired: async () => {
      return await dbHelpers.getExpiredProducts();
    },

    search: async (query) => {
      return await dbHelpers.searchProducts(query);
    },

    create: async (product) => {
      return await dbHelpers.createProduct(product);
    },

    update: async (id, updates) => {
      return await dbHelpers.updateProduct(id, updates);
    },

    delete: async (id) => {
      return await dbHelpers.deleteProduct(id);
    },
  },

  // Customers
  customers: {
    getAll: async () => {
      if (dataService.useMockData) {
        return mockData.customers;
      }
      const { data, error } = await dbHelpers.getCustomers();
      if (error) throw error;
      return data || [];
    },

    getById: async (id) => {
      if (dataService.useMockData) {
        return mockHelpers.getCustomerById(id);
      }
      return await dbHelpers.getCustomerById(id);
    },

    getTop: async (limit = 5) => {
      if (dataService.useMockData) {
        return mockHelpers.getTopCustomers(limit);
      }
      return await dbHelpers.getTopCustomers(limit);
    },

    search: async (query) => {
      if (dataService.useMockData) {
        return mockHelpers.searchCustomers(query);
      }
      return await dbHelpers.searchCustomers(query);
    },

    create: async (customer) => {
      if (dataService.useMockData) {
        const newCustomer = { ...customer, id: mockData.customers.length + 1 };
        mockData.customers.push(newCustomer);
        return newCustomer;
      }
      return await dbHelpers.createCustomer(customer);
    },

    update: async (id, updates) => {
      if (dataService.useMockData) {
        const index = mockData.customers.findIndex(
          (c) => c.id === parseInt(id)
        );
        if (index !== -1) {
          mockData.customers[index] = {
            ...mockData.customers[index],
            ...updates,
          };
          return mockData.customers[index];
        }
        return null;
      }
      return await dbHelpers.updateCustomer(id, updates);
    },

    delete: async (id) => {
      if (dataService.useMockData) {
        const index = mockData.customers.findIndex(
          (c) => c.id === parseInt(id)
        );
        if (index !== -1) {
          mockData.customers.splice(index, 1);
          return true;
        }
        return false;
      }
      return await dbHelpers.deleteCustomer(id);
    },
  },

  // Sales
  sales: {
    getAll: async () => {
      if (dataService.useMockData) {
        return mockData.sales;
      }
      const { data, error } = await dbHelpers.getSales();
      if (error) throw error;
      return data || [];
    },

    getById: async (id) => {
      if (dataService.useMockData) {
        return mockData.sales.find((s) => s.id === parseInt(id));
      }
      return await dbHelpers.getSaleById(id);
    },

    getRecent: async (limit = 10) => {
      if (dataService.useMockData) {
        return mockHelpers.getRecentSales(limit);
      }
      return await dbHelpers.getRecentSales(limit);
    },

    getByCustomer: async (customerId) => {
      if (dataService.useMockData) {
        return mockHelpers.getSalesByCustomer(customerId);
      }
      return await dbHelpers.getSalesByCustomer(customerId);
    },

    create: async (sale) => {
      if (dataService.useMockData) {
        const newSale = {
          ...sale,
          id: mockData.sales.length + 1,
          transactionNumber: mockHelpers.generateTransactionNumber(),
        };
        mockData.sales.push(newSale);
        return newSale;
      }
      return await dbHelpers.createSale(sale);
    },

    getTotalRevenue: async () => {
      if (dataService.useMockData) {
        return mockHelpers.getTotalRevenue();
      }
      return await dbHelpers.getTotalRevenue();
    },
  },

  // Categories
  categories: {
    getAll: async () => {
      if (dataService.useMockData) {
        return mockData.categories;
      }
      const { data, error } = await dbHelpers.getCategories();
      if (error) throw error;
      return data || [];
    },
  },

  // Notifications
  notifications: {
    getAll: async (userId = null) => {
      if (dataService.useMockData) {
        // Return mock notifications
        return [
          {
            id: 1,
            type: 'success',
            title: 'Sale Completed',
            message: 'Transaction TXN-001 completed successfully',
            is_read: false,
            created_at: new Date().toISOString(),
            priority: 'normal',
          },
          {
            id: 2,
            type: 'warning',
            title: 'Low Stock Alert',
            message: 'Paracetamol 500mg is running low',
            is_read: false,
            created_at: new Date().toISOString(),
            priority: 'high',
          },
        ];
      }
      const { data, error } = await dbHelpers.getNotifications(userId);
      if (error) throw error;
      return data || [];
    },

    create: async (notificationData) => {
      if (dataService.useMockData) {
        return { success: true, data: { ...notificationData, id: Date.now() } };
      }
      return await dbHelpers.createNotification(notificationData);
    },

    markAsRead: async (notificationId) => {
      if (dataService.useMockData) {
        return { success: true };
      }
      return await dbHelpers.markNotificationAsRead(notificationId);
    },

    markAllAsRead: async (userId = null) => {
      if (dataService.useMockData) {
        return { success: true };
      }
      return await dbHelpers.markAllNotificationsAsRead(userId);
    },

    delete: async (notificationId) => {
      if (dataService.useMockData) {
        return { success: true };
      }
      return await dbHelpers.deleteNotification(notificationId);
    },

    deleteAll: async (userId = null) => {
      if (dataService.useMockData) {
        return { success: true };
      }
      return await dbHelpers.deleteAllNotifications(userId);
    },

    // Auto-notification creators
    createLowStockAlert: async (product) => {
      if (dataService.useMockData) {
        return { success: true };
      }
      return await dbHelpers.createLowStockNotification(product);
    },

    createSaleAlert: async (sale) => {
      if (dataService.useMockData) {
        return { success: true };
      }
      return await dbHelpers.createSaleNotification(sale);
    },

    createExpiryAlert: async (product) => {
      if (dataService.useMockData) {
        return { success: true };
      }
      return await dbHelpers.createExpiryNotification(product);
    },

    checkAutoNotifications: async () => {
      if (dataService.useMockData) {
        return { success: true };
      }
      return await dbHelpers.checkAndCreateAutoNotifications();
    },
  },

  // Purchases
  purchases: {
    getAll: async () => {
      if (dataService.useMockData) {
        // Return mock purchases for now
        return [];
      }
      const { data, error } = await dbHelpers.getPurchases();
      if (error) throw error;
      return data || [];
    },

    getById: async (id) => {
      if (dataService.useMockData) {
        return null;
      }
      return await dbHelpers.getPurchaseById(id);
    },

    create: async (purchaseData) => {
      if (dataService.useMockData) {
        // Mock implementation
        return { success: true, data: purchaseData };
      }
      return await dbHelpers.createPurchase(purchaseData);
    },

    update: async (id, updates) => {
      if (dataService.useMockData) {
        return { success: true };
      }
      return await dbHelpers.updatePurchase(id, updates);
    },

    delete: async (id) => {
      if (dataService.useMockData) {
        return { success: true };
      }
      return await dbHelpers.deletePurchase(id);
    },
  },

  // Suppliers
  suppliers: {
    getAll: async () => {
      if (dataService.useMockData) {
        return [];
      }
      const { data, error } = await dbHelpers.getSuppliers();
      if (error) throw error;
      return data || [];
    },

    create: async (supplierData) => {
      if (dataService.useMockData) {
        return { success: true, data: supplierData };
      }
      return await dbHelpers.createSupplier(supplierData);
    },
  },

  // Reports
  reports: {
    getSalesReport: async (startDate, endDate) => {
      if (dataService.useMockData) {
        // Return mock report data
        return {
          totalSales: 45750.5,
          totalTransactions: 234,
          averageOrderValue: 195.73,
          topProducts: [],
          salesByCategory: [],
          dailySales: [],
        };
      }

      try {
        const sales = await dataService.sales.getAll();
        const filteredSales = sales.filter((sale) => {
          const saleDate = new Date(sale.date);
          return (
            saleDate >= new Date(startDate) && saleDate <= new Date(endDate)
          );
        });

        const totalSales = filteredSales.reduce(
          (sum, sale) => sum + (sale.totalAmount || 0),
          0
        );
        const totalTransactions = filteredSales.length;
        const averageOrderValue =
          totalTransactions > 0 ? totalSales / totalTransactions : 0;

        // Group sales by date
        const dailySales = filteredSales.reduce((acc, sale) => {
          const date = new Date(sale.date).toISOString().split("T")[0];
          if (!acc[date]) {
            acc[date] = { date, amount: 0, transactions: 0 };
          }
          acc[date].amount += sale.totalAmount || 0;
          acc[date].transactions += 1;
          return acc;
        }, {});

        return {
          totalSales,
          totalTransactions,
          averageOrderValue,
          dailySales: Object.values(dailySales),
          topProducts: [], // Would need to implement product aggregation
          salesByCategory: [], // Would need category data
        };
      } catch (error) {
        console.error("Error generating sales report:", error);
        throw error;
      }
    },

    getInventoryReport: async () => {
      if (dataService.useMockData) {
        return {
          stockStatus: {
            inStock: 156,
            lowStock: 23,
            outOfStock: 8,
            totalProducts: 187,
          },
          topMovingProducts: [],
          expiringProducts: [],
        };
      }

      try {
        const products = await dataService.products.getAll();
        const lowStockProducts = await dataService.products.getLowStock();

        const stockStatus = {
          totalProducts: products.length,
          lowStock: lowStockProducts.length,
          inStock: products.filter(
            (p) => (p.quantity || 0) > (p.minStockLevel || 0)
          ).length,
          outOfStock: products.filter((p) => (p.quantity || 0) === 0).length,
        };

        // Get expiring products (within 3 months)
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

        const expiringProducts = products
          .filter((product) => {
            if (!product.expiryDate) return false;
            return new Date(product.expiryDate) <= threeMonthsFromNow;
          })
          .map((product) => ({
            name: product.name,
            expiryDate: product.expiryDate,
            quantity: product.quantity || 0,
          }));

        return {
          stockStatus,
          topMovingProducts: [], // Would need sales data to calculate
          expiringProducts,
        };
      } catch (error) {
        console.error("Error generating inventory report:", error);
        throw error;
      }
    },

    getCustomerReport: async () => {
      if (dataService.useMockData) {
        return {
          customerMetrics: {
            totalCustomers: 89,
            newCustomers: 15,
            activeCustomers: 67,
            customerRetention: 75.3,
          },
          topCustomers: [],
        };
      }

      try {
        const customers = await dataService.customers.getAll();
        const sales = await dataService.sales.getAll();

        // Calculate new customers this month
        const monthStart = new Date();
        monthStart.setDate(1);
        const newCustomers = customers.filter(
          (c) => new Date(c.createdAt || c.created_at) >= monthStart
        ).length;

        // Calculate customer spending
        const customerSpending = customers.map((customer) => {
          const customerSales = sales.filter(
            (sale) => sale.customerId === customer.id
          );
          const totalSpent = customerSales.reduce(
            (sum, sale) => sum + (sale.totalAmount || 0),
            0
          );
          return {
            ...customer,
            totalSpent,
            visits: customerSales.length,
          };
        });

        const topCustomers = customerSpending
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, 10)
          .map((customer) => ({
            name: `${customer.firstName || customer.first_name || ""} ${customer.lastName || customer.last_name || ""}`.trim(),
            totalSpent: customer.totalSpent,
            visits: customer.visits,
          }));

        return {
          customerMetrics: {
            totalCustomers: customers.length,
            newCustomers,
            activeCustomers: customers.length, // Would need to define "active"
            customerRetention: 75.3, // Would need historical data
          },
          topCustomers,
        };
      } catch (error) {
        console.error("Error generating customer report:", error);
        throw error;
      }
    },
  },

  // Utility functions
  utils: {
    generateTransactionNumber: async () => {
      if (dataService.useMockData) {
        return mockHelpers.generateTransactionNumber();
      }
      return await dbHelpers.generateTransactionNumber();
    },

    calculateAge: (dateOfBirth) => {
      return mockHelpers.calculateAge(dateOfBirth);
    },
  },
};

export default dataService;
