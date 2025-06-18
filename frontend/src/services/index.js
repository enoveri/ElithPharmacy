// Data service that handles switching between mock data and real database
import { dbHelpers } from "../lib/db";
import { mockHelpers, mockData } from "../lib/mockData";

// Configuration for data source
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === "true" || false;

// Data service that provides a unified interface
export const dataService = {
  // Configuration
  useMockData: USE_MOCK_DATA,

  // Toggle data source (useful for development/testing)
  toggleDataSource: () => {
    dataService.useMockData = !dataService.useMockData;
    console.log(
      `Data source switched to: ${dataService.useMockData ? "Mock" : "Database"}`
    );
  },

  // Products
  products: {
    getAll: async () => {
      if (dataService.useMockData) {
        return mockData.products;
      }
      const { data, error } = await dbHelpers.getProducts();
      if (error) throw error;
      return data || [];
    },

    getById: async (id) => {
      if (dataService.useMockData) {
        return mockHelpers.getProductById(id);
      }
      return await dbHelpers.getProductById(id);
    },

    getByCategory: async (category) => {
      if (dataService.useMockData) {
        return mockHelpers.getProductsByCategory(category);
      }
      return await dbHelpers.getProductsByCategory(category);
    },

    getLowStock: async () => {
      if (dataService.useMockData) {
        return mockHelpers.getLowStockProducts();
      }
      return await dbHelpers.getLowStockProducts();
    },

    getExpiring: async (days = 30) => {
      if (dataService.useMockData) {
        return mockHelpers.getExpiringProducts(days);
      }
      return await dbHelpers.getExpiringProducts(days);
    },

    getExpired: async () => {
      if (dataService.useMockData) {
        return mockHelpers.getExpiredProducts();
      }
      return await dbHelpers.getExpiredProducts();
    },

    search: async (query) => {
      if (dataService.useMockData) {
        return mockHelpers.searchProducts(query);
      }
      return await dbHelpers.searchProducts(query);
    },

    create: async (product) => {
      if (dataService.useMockData) {
        // For mock data, we'll just add to the array
        const newProduct = { ...product, id: mockData.products.length + 1 };
        mockData.products.push(newProduct);
        return newProduct;
      }
      return await dbHelpers.createProduct(product);
    },

    update: async (id, updates) => {
      if (dataService.useMockData) {
        const index = mockData.products.findIndex((p) => p.id === parseInt(id));
        if (index !== -1) {
          mockData.products[index] = {
            ...mockData.products[index],
            ...updates,
          };
          return mockData.products[index];
        }
        return null;
      }
      return await dbHelpers.updateProduct(id, updates);
    },

    delete: async (id) => {
      if (dataService.useMockData) {
        const index = mockData.products.findIndex((p) => p.id === parseInt(id));
        if (index !== -1) {
          mockData.products.splice(index, 1);
          return true;
        }
        return false;
      }
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
    getAll: async () => {
      if (dataService.useMockData) {
        return mockHelpers.getAllNotifications();
      }
      return await dbHelpers.getAllNotifications();
    },

    getStock: async () => {
      if (dataService.useMockData) {
        return mockHelpers.getStockNotifications();
      }
      return await dbHelpers.getStockNotifications();
    },

    getExpiry: async () => {
      if (dataService.useMockData) {
        return mockHelpers.getExpiryNotifications();
      }
      return await dbHelpers.getExpiryNotifications();
    },

    getSales: async () => {
      if (dataService.useMockData) {
        return mockHelpers.getSalesNotifications();
      }
      return await dbHelpers.getSalesNotifications();
    },

    getUnreadCount: async () => {
      if (dataService.useMockData) {
        return mockHelpers.getUnreadNotificationCount();
      }
      return await dbHelpers.getUnreadNotificationCount();
    },
  },

  // Settings
  settings: {
    get: async () => {
      if (dataService.useMockData) {
        return mockData.settings;
      }
      return await dbHelpers.getSettings();
    },

    update: async (settings) => {
      if (dataService.useMockData) {
        Object.assign(mockData.settings, settings);
        return mockData.settings;
      }
      return await dbHelpers.updateSettings(settings);
    },
  },

  // Dashboard stats
  dashboard: {
    getStats: async () => {
      if (dataService.useMockData) {
        return mockData.dashboardStats;
      }
      // For database, we'll calculate stats on the fly
      const [
        totalRevenue,
        recentSales,
        allProducts,
        allCustomers,
        lowStockProducts,
      ] = await Promise.all([
        dataService.sales.getTotalRevenue(),
        dataService.sales.getRecent(100), // Get more for calculations
        dataService.products.getAll(),
        dataService.customers.getAll(),
        dataService.products.getLowStock(),
      ]);

      // Calculate today's stats
      const today = new Date();
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const todaysSales = recentSales.filter(
        (sale) => new Date(sale.date) >= todayStart
      );

      // Calculate monthly stats
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthlySales = recentSales.filter(
        (sale) => new Date(sale.date) >= monthStart
      );

      const todaysSalesAmount = todaysSales.reduce(
        (sum, sale) => sum + sale.totalAmount,
        0
      );
      const monthlyRevenue = monthlySales.reduce(
        (sum, sale) => sum + sale.totalAmount,
        0
      );

      return {
        todaysSales: todaysSalesAmount,
        todaysTransactions: todaysSales.length,
        totalProducts: allProducts.length,
        totalCustomers: allCustomers.length,
        lowStockItems: lowStockProducts.length,
        monthlyRevenue: monthlyRevenue,
        monthlyGrowth: 0, // Would need historical data to calculate
      };
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
