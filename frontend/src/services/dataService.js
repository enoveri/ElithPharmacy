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
      const { data, error } = await dbHelpers.getCustomers();
      if (error) throw error;
      return data || [];
    },

    getById: async (id) => {
      return await dbHelpers.getCustomerById(id);
    },

    getTop: async (limit = 5) => {
      return await dbHelpers.getTopCustomers(limit);
    },

    search: async (query) => {
      return await dbHelpers.searchCustomers(query);
    },

    create: async (customer) => {
      return await dbHelpers.createCustomer(customer);
    },

    update: async (id, updates) => {
      return await dbHelpers.updateCustomer(id, updates);
    },

    delete: async (id) => {
      return await dbHelpers.deleteCustomer(id);
    },
  },

  // Sales
  sales: {
    getAll: async () => {
      const { data, error } = await dbHelpers.getSales();
      if (error) throw error;
      return data || [];
    },

    getById: async (id) => {
      return await dbHelpers.getSaleById(id);
    },

    getRecent: async (limit = 10) => {
      return await dbHelpers.getRecentSales(limit);
    },

    getByCustomer: async (customerId) => {
      return await dbHelpers.getSalesByCustomer(customerId);
    },

    getByDateRange: async (startDate, endDate) => {
      return await dbHelpers.getSalesByDateRange(startDate, endDate);
    },

    getToday: async () => {
      return await dbHelpers.getTodaysSales();
    },

    create: async (sale) => {
      return await dbHelpers.createSale(sale);
    },

    update: async (id, updates) => {
      return await dbHelpers.updateSale(id, updates);
    },

    delete: async (id) => {
      return await dbHelpers.deleteSale(id);
    },
  },

  // Refunds
  refunds: {
    getAll: async () => {
      const { data, error } = await dbHelpers.getRefunds();
      if (error) throw error;
      return data || [];
    },

    getById: async (id) => {
      return await dbHelpers.getRefundById(id);
    },

    create: async (refund) => {
      return await dbHelpers.createRefund(refund);
    },

    update: async (id, updates) => {
      return await dbHelpers.updateRefund(id, updates);
    },

    delete: async (id) => {
      return await dbHelpers.deleteRefund(id);
    },
  },

  // Suppliers
  suppliers: {
    getAll: async () => {
      const { data, error } = await dbHelpers.getSuppliers();
      if (error) throw error;
      return data || [];
    },

    getById: async (id) => {
      return await dbHelpers.getSupplierById(id);
    },

    create: async (supplier) => {
      return await dbHelpers.createSupplier(supplier);
    },

    update: async (id, updates) => {
      return await dbHelpers.updateSupplier(id, updates);
    },

    delete: async (id) => {
      return await dbHelpers.deleteSupplier(id);
    },
  },

  // Purchases
  purchases: {
    getAll: async () => {
      const { data, error } = await dbHelpers.getPurchases();
      if (error) throw error;
      return data || [];
    },

    getById: async (id) => {
      return await dbHelpers.getPurchaseById(id);
    },

    create: async (purchase) => {
      return await dbHelpers.createPurchase(purchase);
    },

    update: async (id, updates) => {
      return await dbHelpers.updatePurchase(id, updates);
    },

    delete: async (id) => {
      return await dbHelpers.deletePurchase(id);
    },
  },

  // Categories
  categories: {
    getAll: async () => {
      const { data, error } = await dbHelpers.getCategories();
      if (error) throw error;
      return data || [];
    },

    getById: async (id) => {
      return await dbHelpers.getCategoryById(id);
    },

    create: async (category) => {
      return await dbHelpers.createCategory(category);
    },

    update: async (id, updates) => {
      return await dbHelpers.updateCategory(id, updates);
    },

    delete: async (id) => {
      return await dbHelpers.deleteCategory(id);
    },
  },

  // Notifications
  notifications: {
    getAll: async () => {
      const { data, error } = await dbHelpers.getNotifications();
      if (error) throw error;
      return data || [];
    },

    getById: async (id) => {
      return await dbHelpers.getNotificationById(id);
    },

    getUnread: async () => {
      return await dbHelpers.getUnreadNotifications();
    },

    create: async (notification) => {
      return await dbHelpers.createNotification(notification);
    },

    markAsRead: async (id) => {
      return await dbHelpers.markNotificationAsRead(id);
    },

    markAllAsRead: async () => {
      return await dbHelpers.markAllNotificationsAsRead();
    },

    delete: async (id) => {
      return await dbHelpers.deleteNotification(id);
    },

    deleteAll: async () => {
      return await dbHelpers.deleteAllNotifications();
    },
  },

  // Analytics & Reports
  analytics: {
    getDashboardStats: async () => {
      return await dbHelpers.getDashboardStats();
    },

    getSalesReport: async (startDate, endDate) => {
      return await dbHelpers.getSalesReport(startDate, endDate);
    },

    getInventoryReport: async () => {
      return await dbHelpers.getInventoryReport();
    },

    getCustomerReport: async () => {
      return await dbHelpers.getCustomerReport();
    },

    getProductPerformance: async (startDate, endDate) => {
      return await dbHelpers.getProductPerformance(startDate, endDate);
    },
  },
};

export default dataService;
