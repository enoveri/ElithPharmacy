// Data service that provides a unified interface to the database
import { dbHelpers } from "../lib/db";
import { notificationService } from "./notificationService";
import { NotificationTriggers } from "./notificationIntegration";

// Enhanced data service with integrated notifications
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
      const result = await dbHelpers.createProduct(product);

      // Trigger notification check for new product
      if (result) {
        await NotificationTriggers.productChanged(result, "create");
      }

      return result;
    },

    update: async (id, updates) => {
      const result = await dbHelpers.updateProduct(id, updates);

      // Trigger notification check for updated product
      if (result) {
        await NotificationTriggers.productChanged(result, "update");
      }

      return result;
    },

    delete: async (id, options = {}) => {
      // Default to cascade delete for better UX
      const deleteOptions = { cascadeDelete: true, ...options };
      const result = await dbHelpers.deleteProduct(id, deleteOptions);
      return result.success ? result.data : null;
    },

    archive: async (id, options = {}) => {
      // Default to archiving related sales
      const archiveOptions = { archiveRelatedSales: true, ...options };
      const result = await dbHelpers.archiveProduct(id, archiveOptions);
      return result.success ? result.data : null;
    },

    bulkDelete: async (productIds, options = {}) => {
      const result = await dbHelpers.bulkDeleteProducts(productIds, options);
      return result;
    },

    getRelations: async (id) => {
      const result = await dbHelpers.getProductRelations(id);
      return result.success ? result.data : null;
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
      const result = await dbHelpers.createCustomer(customer);

      // Trigger notification for new customer
      if (result) {
        await NotificationTriggers.customerCreated(result);
      }

      return result;
    },

    update: async (id, updates) => {
      return await dbHelpers.updateCustomer(id, updates);
    },

    delete: async (id, options = {}) => {
      const result = await dbHelpers.deleteCustomer(id, options);
      return result.success ? result.data : null;
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
      const result = await dbHelpers.createSale(sale);

      // Trigger notification for completed sale
      if (result) {
        await NotificationTriggers.saleCompleted(result);
      }

      return result;
    },

    update: async (id, updates) => {
      return await dbHelpers.updateSale(id, updates);
    },

    delete: async (id, options = {}) => {
      const result = await dbHelpers.deleteSale(id, options);
      return result.success ? result.data : null;
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
      const result = await dbHelpers.getCategories();
      if (!result.success) throw result.error;
      return result.data || [];
    },

    getById: async (id) => {
      const result = await dbHelpers.getCategoryById(id);
      if (!result.success) throw result.error;
      return result.data;
    },

    create: async (category) => {
      const result = await dbHelpers.createCategory(category);
      if (!result.success) throw result.error;
      return result.data;
    },

    update: async (id, updates) => {
      const result = await dbHelpers.updateCategory(id, updates);
      if (!result.success) throw result.error;
      return result.data;
    },

    delete: async (id) => {
      const result = await dbHelpers.deleteCategory(id);
      if (!result.success) throw result.error;
      return result.data;
    },
  }, // Enhanced Notifications with comprehensive service
  notifications: {
    // Basic CRUD operations
    getAll: async () => {
      console.log("🔄 [Service] notifications.getAll called");
      const { data, error } = await dbHelpers.getNotifications();
      console.log("🔍 [Service] getNotifications result:", { data, error });
      if (error) {
        console.error("❌ [Service] Error in getNotifications:", error);
        throw error;
      }
      console.log("✅ [Service] Returning notifications:", data);
      return data || [];
    },

    getById: async (id) => {
      return await dbHelpers.getNotificationById(id);
    },

    getUnread: async () => {
      return await dbHelpers.getUnreadNotifications();
    },

    create: async (notification) => {
      console.log("🔄 [Service] Creating notification:", notification);
      const result = await dbHelpers.createNotification(notification);
      console.log("🔍 [Service] Create notification result:", result);
      return result;
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

    // Enhanced notification methods using the comprehensive service
    runComprehensiveCheck: async () => {
      return await notificationService.runComprehensiveCheck();
    },

    checkInventoryNotifications: async () => {
      return await notificationService.checkInventoryNotifications();
    },

    // Specific notification creators
    createLowStockAlert: async (product) => {
      return await notificationService.createNotification(
        notificationService.notificationTypes.LOW_STOCK,
        "Low Stock Alert",
        `${product.name} is running low (${product.quantity || 0} left, minimum: ${product.min_stock_level || product.minStockLevel || 0})`,
        {
          priority: notificationService.priorities.HIGH,
          data: { productId: product.id, currentStock: product.quantity },
          actionUrl: `/inventory/${product.id}`,
          category: "inventory",
        }
      );
    },

    createSaleAlert: async (sale) => {
      return await notificationService.notifySaleCompleted(sale);
    },

    createExpiryAlert: async (product) => {
      const expiryDate = new Date(product.expiry_date || product.expiryDate);
      const daysUntilExpiry = Math.ceil(
        (expiryDate - new Date()) / (1000 * 60 * 60 * 24)
      );

      const notificationType =
        daysUntilExpiry <= 0
          ? notificationService.notificationTypes.EXPIRED
          : notificationService.notificationTypes.EXPIRING_SOON;

      const title =
        daysUntilExpiry <= 0 ? "Product Expired" : "Product Expiring Soon";
      const message =
        daysUntilExpiry <= 0
          ? `${product.name} has expired on ${expiryDate.toLocaleDateString()}`
          : `${product.name} expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"} (${expiryDate.toLocaleDateString()})`;

      return await notificationService.createNotification(
        notificationType,
        title,
        message,
        {
          priority:
            daysUntilExpiry <= 7
              ? notificationService.priorities.HIGH
              : notificationService.priorities.MEDIUM,
          data: {
            productId: product.id,
            expiryDate: expiryDate.toISOString(),
            daysUntilExpiry,
          },
          actionUrl: `/inventory/${product.id}`,
          category: "inventory",
        }
      );
    }, // Legacy method for backward compatibility
    checkAutoNotifications: async () => {
      console.log(
        "🔄 [Service] Running legacy checkAutoNotifications (redirecting to comprehensive check)..."
      );
      return await notificationService.runComprehensiveCheck();
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

  // Dashboard (alias for analytics for backward compatibility)
  dashboard: {
    getStats: async () => {
      return await dbHelpers.getDashboardStats();
    },
  },

  // Debug utilities
  debug: {
    salesData: async () => {
      return await dbHelpers.debugSalesData();
    },
  },
};

export default dataService;
export { stockAuditService } from "./stockAuditService.js";
