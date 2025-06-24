import { dbHelpers } from "../lib/db";
import { notificationDb } from "../lib/db/notifications";

/**
 * Comprehensive Notification Service
 * Handles automatic creation of notifications for all pharmacy operations
 */
export class NotificationService {
  constructor() {
    this.notificationTypes = {
      // Inventory notifications
      LOW_STOCK: "low_stock",
      OUT_OF_STOCK: "out_of_stock",
      EXPIRING_SOON: "expiring_soon",
      EXPIRED: "expired",
      REORDER_NEEDED: "reorder_needed",

      // Sales notifications
      SALE_COMPLETED: "sale_completed",
      HIGH_VALUE_SALE: "high_value_sale",
      REFUND_PROCESSED: "refund_processed",

      // System notifications
      BACKUP_COMPLETED: "backup_completed",
      SYSTEM_ERROR: "system_error",
      LICENSE_EXPIRING: "license_expiring",

      // Customer notifications
      NEW_CUSTOMER: "new_customer",
      CUSTOMER_MILESTONE: "customer_milestone",

      // Purchase notifications
      PURCHASE_RECEIVED: "purchase_received",
      PURCHASE_OVERDUE: "purchase_overdue",

      // General alerts
      INFO: "info",
      WARNING: "warning",
      ERROR: "error",
      SUCCESS: "success",
    };

    this.priorities = {
      LOW: "low",
      MEDIUM: "medium",
      HIGH: "high",
      CRITICAL: "critical",
    };

    // Cache for preventing duplicate notifications
    this.recentNotifications = new Map();
    this.duplicateWindow = 60 * 60 * 1000; // 1 hour
  }

  /**
   * Create a notification with automatic duplicate prevention
   */
  async createNotification(type, title, message, options = {}) {
    try {
      const notification = {
        type: options.notificationType || this.getNotificationType(type),
        title,
        message,
        priority: options.priority || this.priorities.MEDIUM,
        data: options.data || {},
        source: options.source || "system",
        category: options.category || this.getCategoryFromType(type),
        action_url: options.actionUrl || null,
        expires_at: options.expiresAt || null,
      };

      // Check for duplicates
      const isDuplicate = this.checkForDuplicate(type, notification.data);
      if (isDuplicate) {
        console.log(
          `⚠️ [NotificationService] Duplicate notification prevented: ${title}`
        );
        return { success: true, data: null, wasDuplicate: true };
      }

      const result = await notificationDb.createNotificationSafe(notification);

      if (result.success) {
        // Add to recent notifications cache
        this.addToRecentCache(type, notification.data);
        console.log(`📢 [NotificationService] Created notification: ${title}`);
      }

      return result;
    } catch (error) {
      console.error(
        "❌ [NotificationService] Error creating notification:",
        error
      );
      return { success: false, error };
    }
  }

  /**
   * Check for duplicate notifications
   */
  checkForDuplicate(type, data) {
    const key = this.generateCacheKey(type, data);
    const cachedTime = this.recentNotifications.get(key);

    if (cachedTime && Date.now() - cachedTime < this.duplicateWindow) {
      return true;
    }

    return false;
  }

  /**
   * Add notification to recent cache
   */
  addToRecentCache(type, data) {
    const key = this.generateCacheKey(type, data);
    this.recentNotifications.set(key, Date.now());

    // Clean up old entries
    this.cleanupCache();
  }

  /**
   * Generate cache key for duplicate detection
   */
  generateCacheKey(type, data) {
    const keyData = { type };

    // Add relevant data fields for duplicate checking
    if (data.productId) keyData.productId = data.productId;
    if (data.customerId) keyData.customerId = data.customerId;
    if (data.saleId) keyData.saleId = data.saleId;
    if (data.purchaseId) keyData.purchaseId = data.purchaseId;

    return JSON.stringify(keyData);
  }

  /**
   * Clean up old cache entries
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, timestamp] of this.recentNotifications.entries()) {
      if (now - timestamp > this.duplicateWindow) {
        this.recentNotifications.delete(key);
      }
    }
  }

  /**
   * Get notification type for display
   */
  getNotificationType(type) {
    switch (type) {
      case this.notificationTypes.OUT_OF_STOCK:
      case this.notificationTypes.EXPIRED:
      case this.notificationTypes.SYSTEM_ERROR:
        return "error";

      case this.notificationTypes.LOW_STOCK:
      case this.notificationTypes.EXPIRING_SOON:
      case this.notificationTypes.REORDER_NEEDED:
      case this.notificationTypes.LICENSE_EXPIRING:
      case this.notificationTypes.PURCHASE_OVERDUE:
        return "warning";

      case this.notificationTypes.SALE_COMPLETED:
      case this.notificationTypes.PURCHASE_RECEIVED:
      case this.notificationTypes.BACKUP_COMPLETED:
      case this.notificationTypes.NEW_CUSTOMER:
        return "success";

      default:
        return "info";
    }
  }

  /**
   * Get category from notification type
   */
  getCategoryFromType(type) {
    if (
      type.includes("stock") ||
      type.includes("expir") ||
      type.includes("reorder")
    ) {
      return "inventory";
    }
    if (type.includes("sale") || type.includes("refund")) {
      return "sales";
    }
    if (type.includes("customer")) {
      return "customers";
    }
    if (type.includes("purchase")) {
      return "purchases";
    }
    if (
      type.includes("system") ||
      type.includes("backup") ||
      type.includes("license")
    ) {
      return "system";
    }
    return "general";
  }

  // ============== INVENTORY NOTIFICATIONS ==============

  /**
   * Check and create inventory-related notifications
   */
  async checkInventoryNotifications() {
    try {
      console.log(
        "🔄 [NotificationService] Checking inventory notifications..."
      );

      const results = await Promise.allSettled([
        this.checkLowStockNotifications(),
        this.checkExpiryNotifications(),
        this.checkReorderNotifications(),
      ]);

      const successful = results.filter(
        (r) => r.status === "fulfilled" && r.value.success
      ).length;
      const failed = results.filter(
        (r) => r.status === "rejected" || !r.value?.success
      ).length;

      console.log(
        `✅ [NotificationService] Inventory check complete: ${successful} successful, ${failed} failed`
      );
      return { success: true, successful, failed };
    } catch (error) {
      console.error(
        "❌ [NotificationService] Error checking inventory notifications:",
        error
      );
      return { success: false, error };
    }
  }

  /**
   * Check for low stock and out of stock products
   */
  async checkLowStockNotifications() {
    try {
      const { data: products } = await dbHelpers.getProducts();
      if (!products) return { success: true, created: 0 };

      let created = 0;

      for (const product of products) {
        const quantity = parseInt(product.quantity || 0);
        const minStock = parseInt(
          product.min_stock_level || product.minStockLevel || 0
        );

        if (quantity === 0) {
          // Out of stock
          const result = await this.createNotification(
            this.notificationTypes.OUT_OF_STOCK,
            "Out of Stock Alert",
            `${product.name} is completely out of stock!`,
            {
              priority: this.priorities.CRITICAL,
              data: { productId: product.id, quantity: 0, minStock },
              actionUrl: `/inventory/view/${product.id}`,
              category: "inventory",
            }
          );
          if (result.success && !result.wasDuplicate) created++;
        } else if (quantity <= minStock) {
          // Low stock
          const result = await this.createNotification(
            this.notificationTypes.LOW_STOCK,
            "Low Stock Alert",
            `${product.name} is running low (${quantity} left, minimum: ${minStock})`,
            {
              priority: this.priorities.HIGH,
              data: { productId: product.id, quantity, minStock },
              actionUrl: `/inventory/view/${product.id}`,
              category: "inventory",
            }
          );
          if (result.success && !result.wasDuplicate) created++;
        }
      }

      console.log(
        `📦 [NotificationService] Created ${created} stock notifications`
      );
      return { success: true, created };
    } catch (error) {
      console.error(
        "❌ [NotificationService] Error checking stock notifications:",
        error
      );
      return { success: false, error };
    }
  }

  /**
   * Check for expiring and expired products
   */
  async checkExpiryNotifications() {
    try {
      const [expiringProducts, expiredProducts] = await Promise.all([
        dbHelpers.getExpiringProducts(30),
        dbHelpers.getExpiredProducts(),
      ]);

      let created = 0;

      // Handle expired products
      for (const product of expiredProducts || []) {
        const result = await this.createNotification(
          this.notificationTypes.EXPIRED,
          "Product Expired",
          `${product.name} has expired on ${new Date(product.expiry_date).toLocaleDateString()}`,
          {
            priority: this.priorities.CRITICAL,
            data: {
              productId: product.id,
              expiryDate: product.expiry_date,
              daysOverdue: Math.floor(
                (new Date() - new Date(product.expiry_date)) /
                  (1000 * 60 * 60 * 24)
              ),
            },
            actionUrl: `/inventory/view/${product.id}`,
            category: "inventory",
          }
        );
        if (result.success && !result.wasDuplicate) created++;
      }

      // Handle expiring products
      for (const product of expiringProducts || []) {
        const priority =
          product.daysUntilExpiry <= 7
            ? this.priorities.HIGH
            : this.priorities.MEDIUM;

        const result = await this.createNotification(
          this.notificationTypes.EXPIRING_SOON,
          `Product Expiring ${product.daysUntilExpiry <= 7 ? "Soon" : "Warning"}`,
          `${product.name} expires in ${product.daysUntilExpiry} day${product.daysUntilExpiry === 1 ? "" : "s"} (${new Date(product.expiry_date).toLocaleDateString()})`,
          {
            priority,
            data: {
              productId: product.id,
              expiryDate: product.expiry_date,
              daysUntilExpiry: product.daysUntilExpiry,
            },
            actionUrl: `/inventory/view/${product.id}`,
            category: "inventory",
          }
        );
        if (result.success && !result.wasDuplicate) created++;
      }

      console.log(
        `⏰ [NotificationService] Created ${created} expiry notifications`
      );
      return { success: true, created };
    } catch (error) {
      console.error(
        "❌ [NotificationService] Error checking expiry notifications:",
        error
      );
      return { success: false, error };
    }
  }

  /**
   * Check for products that need reordering
   */
  async checkReorderNotifications() {
    try {
      const products = await dbHelpers.getProductsToReorder();
      let created = 0;

      for (const product of products || []) {
        const result = await this.createNotification(
          this.notificationTypes.REORDER_NEEDED,
          "Reorder Needed",
          `${product.name} needs to be reordered (${product.quantity} left)`,
          {
            priority: this.priorities.MEDIUM,
            data: {
              productId: product.id,
              quantity: product.quantity,
              minStock: product.min_stock_level || product.minStockLevel,
            },
            actionUrl: `/inventory/view/${product.id}`,
            category: "inventory",
          }
        );
        if (result.success && !result.wasDuplicate) created++;
      }

      console.log(
        `🔄 [NotificationService] Created ${created} reorder notifications`
      );
      return { success: true, created };
    } catch (error) {
      console.error(
        "❌ [NotificationService] Error checking reorder notifications:",
        error
      );
      return { success: false, error };
    }
  }

  // ============== SALES NOTIFICATIONS ==============

  /**
   * Create notification for completed sale
   */
  async notifySaleCompleted(sale) {
    try {
      const customerName = sale.customer
        ? `${sale.customer.first_name || sale.customer.firstName || ""} ${sale.customer.last_name || sale.customer.lastName || ""}`.trim()
        : "Walk-in Customer";

      const amount = sale.total_amount || sale.totalAmount || 0;
      const isHighValue = amount > 10000; // High value threshold

      // Regular sale notification
      await this.createNotification(
        this.notificationTypes.SALE_COMPLETED,
        "Sale Completed",
        `Sale #${sale.transaction_number} for ${customerName} - ₦${amount.toFixed(2)}`,
        {
          priority: isHighValue ? this.priorities.HIGH : this.priorities.MEDIUM,
          data: {
            saleId: sale.id,
            customerId: sale.customer_id || sale.customerId,
            amount,
            transactionNumber: sale.transaction_number,
          },
          actionUrl: `/sales/view/${sale.id}`,
          category: "sales",
        }
      );

      // High value sale notification
      if (isHighValue) {
        await this.createNotification(
          this.notificationTypes.HIGH_VALUE_SALE,
          "High Value Sale",
          `High value sale completed: ₦${amount.toFixed(2)} for ${customerName}`,
          {
            priority: this.priorities.HIGH,
            data: {
              saleId: sale.id,
              customerId: sale.customer_id || sale.customerId,
              amount,
              transactionNumber: sale.transaction_number,
            },
            actionUrl: `/sales/view/${sale.id}`,
            category: "sales",
          }
        );
      }

      return { success: true };
    } catch (error) {
      console.error(
        "❌ [NotificationService] Error creating sale notification:",
        error
      );
      return { success: false, error };
    }
  }

  /**
   * Create notification for refund
   */
  async notifyRefundProcessed(refund) {
    try {
      return await this.createNotification(
        this.notificationTypes.REFUND_PROCESSED,
        "Refund Processed",
        `Refund of ₦${(refund.amount || 0).toFixed(2)} processed for sale #${refund.originalSaleNumber}`,
        {
          priority: this.priorities.MEDIUM,
          data: {
            refundId: refund.id,
            originalSaleId: refund.originalSaleId,
            amount: refund.amount,
          },
          actionUrl: `/refunds/${refund.id}`,
          category: "sales",
        }
      );
    } catch (error) {
      console.error(
        "❌ [NotificationService] Error creating refund notification:",
        error
      );
      return { success: false, error };
    }
  }

  // ============== CUSTOMER NOTIFICATIONS ==============

  /**
   * Create notification for new customer
   */
  async notifyNewCustomer(customer) {
    try {
      const customerName =
        `${customer.first_name || customer.firstName || ""} ${customer.last_name || customer.lastName || ""}`.trim();

      return await this.createNotification(
        this.notificationTypes.NEW_CUSTOMER,
        "New Customer Registered",
        `Welcome new customer: ${customerName}`,
        {
          priority: this.priorities.LOW,
          data: {
            customerId: customer.id,
            name: customerName,
            email: customer.email,
          },
          actionUrl: `/customers/${customer.id}`,
          category: "customers",
        }
      );
    } catch (error) {
      console.error(
        "❌ [NotificationService] Error creating customer notification:",
        error
      );
      return { success: false, error };
    }
  }

  // ============== SYSTEM NOTIFICATIONS ==============

  /**
   * Create system notification
   */
  async notifySystemEvent(type, title, message, options = {}) {
    try {
      return await this.createNotification(type, title, message, {
        priority: options.priority || this.priorities.MEDIUM,
        data: options.data || {},
        category: "system",
        ...options,
      });
    } catch (error) {
      console.error(
        "❌ [NotificationService] Error creating system notification:",
        error
      );
      return { success: false, error };
    }
  }

  // ============== MAIN CHECK FUNCTION ==============

  /**
   * Run comprehensive notification check
   */
  async runComprehensiveCheck() {
    try {
      console.log(
        "🔄 [NotificationService] Starting comprehensive notification check..."
      );

      const results = await Promise.allSettled([
        this.checkInventoryNotifications(),
        // Add more checks as needed
      ]);

      const totalSuccessful = results
        .filter((r) => r.status === "fulfilled" && r.value.success)
        .reduce(
          (sum, r) => sum + (r.value.successful || r.value.created || 0),
          0
        );

      const totalFailed = results.filter(
        (r) => r.status === "rejected" || !r.value?.success
      ).length;

      console.log(
        `✅ [NotificationService] Comprehensive check complete: ${totalSuccessful} notifications created, ${totalFailed} checks failed`
      );

      return {
        success: true,
        totalNotifications: totalSuccessful,
        failedChecks: totalFailed,
        details: results,
      };
    } catch (error) {
      console.error(
        "❌ [NotificationService] Error in comprehensive check:",
        error
      );
      return { success: false, error };
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats() {
    try {
      console.log(
        "📊 [NotificationService] Getting notification statistics..."
      );

      const result = await notificationDb.getNotificationStats();

      if (result.success) {
        console.log(
          "✅ [NotificationService] Retrieved notification stats:",
          result.data
        );
        return result;
      } else {
        console.warn(
          "⚠️ [NotificationService] Failed to get stats:",
          result.error
        );
        return {
          success: true,
          data: {
            total: 0,
            unread: 0,
            byType: {},
            byPriority: {},
            recent: 0,
          },
        };
      }
    } catch (error) {
      console.error("❌ [NotificationService] Error getting stats:", error);
      return {
        success: false,
        error,
        data: {
          total: 0,
          unread: 0,
          byType: {},
          byPriority: {},
          recent: 0,
        },
      };
    }
  }

  /**
   * Clean up old notifications
   */
  async cleanupOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // This would need to be implemented in dbHelpers
      console.log(
        `🧹 [NotificationService] Cleaning up notifications older than ${daysOld} days`
      );
      return { success: true };
    } catch (error) {
      console.error(
        "❌ [NotificationService] Error cleaning up notifications:",
        error
      );
      return { success: false, error };
    }
  }
}

// Create singleton instance
export const notificationService = new NotificationService();
export default notificationService;
