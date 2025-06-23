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
      console.log('🔄 [Service] notifications.getAll called');
      const { data, error } = await dbHelpers.getNotifications();
      console.log('🔍 [Service] getNotifications result:', { data, error });
      if (error) {
        console.error('❌ [Service] Error in getNotifications:', error);
        throw error;
      }
      console.log('✅ [Service] Returning notifications:', data);
      return data || [];
    },

    getById: async (id) => {
      return await dbHelpers.getNotificationById(id);
    },

    getUnread: async () => {
      return await dbHelpers.getUnreadNotifications();
    },    create: async (notification) => {
      console.log('🔄 [Service] Creating notification:', notification);
      const result = await dbHelpers.createNotification(notification);
      console.log('🔍 [Service] Create notification result:', result);
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

    // Check for and create automatic notifications for low stock and expiring products
    checkAutoNotifications: async () => {
      try {
        console.log('🔄 [Notifications] Checking for automatic notifications...');
        
        // Get low stock products
        const lowStockProducts = await dbHelpers.getLowStockProducts();
        console.log(`📦 [Notifications] Found ${lowStockProducts.length} low stock products`);
        
        // Get all products to check for out of stock
        const allProducts = await dbHelpers.getProducts();
        const outOfStockProducts = allProducts.data?.filter(product => (product.quantity || 0) === 0) || [];
        console.log(`❌ [Notifications] Found ${outOfStockProducts.length} out of stock products`);
        
        // Get expiring products (within 30 days)
        const expiringProducts = await dbHelpers.getExpiringProducts(30);
        console.log(`⏰ [Notifications] Found ${expiringProducts.length} expiring products`);
        
        let createdCount = 0;
        
        // Check if notifications already exist for these products to avoid duplicates
        const existingNotifications = await dbHelpers.getNotifications();
        const existingProductIds = new Set();
        
        if (existingNotifications.data) {
          existingNotifications.data.forEach(notification => {
            if (notification.data?.productId) {
              existingProductIds.add(notification.data.productId);
            }
          });
        }
        
        // Create notifications for low stock products
        for (const product of lowStockProducts) {
          if (!existingProductIds.has(product.id)) {
            const result = await dbHelpers.createNotification({
              type: 'warning',
              title: 'Low Stock Alert',
              message: `${product.name} is running low (${product.quantity || 0} left, minimum: ${product.min_stock_level || product.minStockLevel || 0})`,
              priority: 'high',
              data: { productId: product.id, currentStock: product.quantity },
              actionUrl: `/inventory/${product.id}`,
            });
            
            if (result.success) {
              createdCount++;
              console.log(`🔔 [Notifications] Created low stock alert for ${product.name}`);
            }
          }
        }
        
        // Create notifications for out of stock products
        for (const product of outOfStockProducts) {
          if (!existingProductIds.has(product.id)) {
            const result = await dbHelpers.createNotification({
              type: 'error',
              title: 'Out of Stock Alert',
              message: `${product.name} is completely out of stock!`,
              priority: 'high',
              data: { productId: product.id, currentStock: 0 },
              actionUrl: `/inventory/${product.id}`,
            });
            
            if (result.success) {
              createdCount++;
              console.log(`🚨 [Notifications] Created out of stock alert for ${product.name}`);
            }
          }
        }
        
        // Create notifications for expiring products
        for (const product of expiringProducts) {
          if (!existingProductIds.has(product.id)) {
            const daysUntilExpiry = Math.ceil((new Date(product.expiry_date || product.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
            const result = await dbHelpers.createNotification({
              type: 'warning',
              title: 'Product Expiring Soon',
              message: `${product.name} will expire in ${daysUntilExpiry} days`,
              priority: 'medium',
              data: { productId: product.id, daysUntilExpiry },
              actionUrl: `/inventory/${product.id}`,
            });
            
            if (result.success) {
              createdCount++;
              console.log(`⏰ [Notifications] Created expiry alert for ${product.name}`);
            }
          }
        }
        
        console.log(`✅ [Notifications] Auto-check complete. Created ${createdCount} new notifications.`);
        return { success: true, createdCount };
        
      } catch (error) {
        console.error('❌ [Notifications] Error in checkAutoNotifications:', error);
        return { success: false, error };
      }
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
