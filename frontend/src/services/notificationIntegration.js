import { notificationService } from "./notificationService";
import { dataService } from "./index";

/**
 * Business Logic Integration for Automatic Notifications
 * This service integrates with business operations to automatically trigger relevant notifications
 */
export class NotificationIntegrationService {
  constructor() {
    this.isInitialized = false;
    this.monitoringIntervals = new Map();
  }

  /**
   * Initialize the integration service
   */
  async initialize() {
    try {
      console.log(
        "🔄 [NotificationIntegration] Initializing notification integration..."
      );

      // Start background monitoring
      this.startBackgroundMonitoring();

      // Run initial comprehensive check
      await notificationService.runComprehensiveCheck();

      this.isInitialized = true;
      console.log(
        "✅ [NotificationIntegration] Notification integration initialized"
      );

      return { success: true };
    } catch (error) {
      console.error(
        "❌ [NotificationIntegration] Failed to initialize:",
        error
      );
      return { success: false, error };
    }
  }

  /**
   * Start background monitoring for various business events
   */
  startBackgroundMonitoring() {
    // Monitor inventory every 5 minutes
    this.monitoringIntervals.set(
      "inventory",
      setInterval(
        async () => {
          await this.checkInventoryChanges();
        },
        5 * 60 * 1000
      )
    );

    // Monitor sales every 2 minutes
    this.monitoringIntervals.set(
      "sales",
      setInterval(
        async () => {
          await this.checkRecentSales();
        },
        2 * 60 * 1000
      )
    );

    // Monitor system health every 10 minutes
    this.monitoringIntervals.set(
      "system",
      setInterval(
        async () => {
          await this.checkSystemHealth();
        },
        10 * 60 * 1000
      )
    );

    console.log("📡 [NotificationIntegration] Background monitoring started");
  }

  /**
   * Stop background monitoring
   */
  stopBackgroundMonitoring() {
    for (const [name, interval] of this.monitoringIntervals.entries()) {
      clearInterval(interval);
      console.log(`⏹️ [NotificationIntegration] Stopped monitoring: ${name}`);
    }
    this.monitoringIntervals.clear();
  }

  /**
   * Check for inventory changes that need notifications
   */
  async checkInventoryChanges() {
    try {
      console.log("🔄 [NotificationIntegration] Checking inventory changes...");

      // This would be more efficient with database triggers in production
      const result = await notificationService.checkInventoryNotifications();

      if (result.success && result.created > 0) {
        console.log(
          `📦 [NotificationIntegration] Created ${result.created} inventory notifications`
        );
      }

      return result;
    } catch (error) {
      console.error(
        "❌ [NotificationIntegration] Error checking inventory:",
        error
      );
      return { success: false, error };
    }
  }

  /**
   * Check for recent sales that need notifications
   */
  async checkRecentSales() {
    try {
      // Get sales from the last 5 minutes that might not have notifications yet
      const recentSales = await dataService.sales.getRecent(10);

      if (!recentSales || recentSales.length === 0)
        return { success: true, processed: 0 };

      let processed = 0;
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      for (const sale of recentSales) {
        const saleDate = new Date(sale.date || sale.created_at);

        // Only process very recent sales
        if (saleDate > fiveMinutesAgo) {
          const result = await notificationService.notifySaleCompleted(sale);
          if (result.success && !result.wasDuplicate) {
            processed++;
          }
        }
      }

      if (processed > 0) {
        console.log(
          `💰 [NotificationIntegration] Processed ${processed} recent sales`
        );
      }

      return { success: true, processed };
    } catch (error) {
      console.error(
        "❌ [NotificationIntegration] Error checking recent sales:",
        error
      );
      return { success: false, error };
    }
  }

  /**
   * Check system health and create notifications for issues
   */
  async checkSystemHealth() {
    try {
      console.log("🔄 [NotificationIntegration] Checking system health...");

      // Check database connectivity
      try {
        await dataService.products.getAll();
      } catch (dbError) {
        await notificationService.notifySystemEvent(
          notificationService.notificationTypes.SYSTEM_ERROR,
          "Database Connection Issue",
          "Unable to connect to the database. Please check your connection.",
          {
            priority: notificationService.priorities.CRITICAL,
            data: {
              error: dbError.message,
              timestamp: new Date().toISOString(),
            },
          }
        );
      }

      // Check for other system health indicators here
      // - Memory usage
      // - Disk space
      // - Network connectivity
      // - License expiration

      return { success: true };
    } catch (error) {
      console.error(
        "❌ [NotificationIntegration] Error checking system health:",
        error
      );
      return { success: false, error };
    }
  }

  // ============== BUSINESS EVENT HANDLERS ==============

  /**
   * Handle product creation/update events
   */
  async onProductChanged(product, action = "update") {
    try {
      console.log(
        `📦 [NotificationIntegration] Product ${action}: ${product.name}`
      );

      // Check if this product now needs notifications
      const quantity = parseInt(product.quantity || 0);
      const minStock = parseInt(
        product.min_stock_level || product.minStockLevel || 0
      );
      // Check for low stock
      if (quantity <= minStock && quantity > 0) {
        await notificationService.createNotification(
          notificationService.notificationTypes.LOW_STOCK,
          "Low Stock Alert",
          `${product.name} is running low (${quantity} left, minimum: ${minStock})`,
          {
            priority: notificationService.priorities.HIGH,
            data: { productId: product.id, quantity, minStock },
            actionUrl: `/inventory/view/${product.id}`,
            category: "inventory",
          }
        );
      }

      // Check for out of stock
      if (quantity === 0) {
        await notificationService.createNotification(
          notificationService.notificationTypes.OUT_OF_STOCK,
          "Out of Stock Alert",
          `${product.name} is completely out of stock!`,
          {
            priority: notificationService.priorities.CRITICAL,
            data: { productId: product.id, quantity: 0, minStock },
            actionUrl: `/inventory/view/${product.id}`,
            category: "inventory",
          }
        );
      }

      // Check expiry if expiry date exists
      if (product.expiry_date || product.expiryDate) {
        const expiryDate = new Date(product.expiry_date || product.expiryDate);
        const daysUntilExpiry = Math.ceil(
          (expiryDate - new Date()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          await notificationService.createNotification(
            notificationService.notificationTypes.EXPIRING_SOON,
            "Product Expiring Soon",
            `${product.name} expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}`,
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
              actionUrl: `/inventory/view/${product.id}`,
              category: "inventory",
            }
          );
        } else if (daysUntilExpiry <= 0) {
          await notificationService.createNotification(
            notificationService.notificationTypes.EXPIRED,
            "Product Expired",
            `${product.name} has expired on ${expiryDate.toLocaleDateString()}`,
            {
              priority: notificationService.priorities.CRITICAL,
              data: {
                productId: product.id,
                expiryDate: expiryDate.toISOString(),
              },
              actionUrl: `/inventory/view/${product.id}`,
              category: "inventory",
            }
          );
        }
      }

      return { success: true };
    } catch (error) {
      console.error(
        "❌ [NotificationIntegration] Error handling product change:",
        error
      );
      return { success: false, error };
    }
  }

  /**
   * Handle sale completion events
   */
  async onSaleCompleted(sale) {
    try {
      console.log(
        `💰 [NotificationIntegration] Sale completed: ${sale.transaction_number}`
      );

      // Create sale notification
      await notificationService.notifySaleCompleted(sale);

      // Update product quantities and check for low stock
      if (sale.sale_items && Array.isArray(sale.sale_items)) {
        for (const item of sale.sale_items) {
          const product = await dataService.products.getById(item.product_id);
          if (product) {
            // Check if product is now low stock after the sale
            await this.onProductChanged(product, "sale_update");
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error(
        "❌ [NotificationIntegration] Error handling sale completion:",
        error
      );
      return { success: false, error };
    }
  }

  /**
   * Handle customer creation events
   */
  async onCustomerCreated(customer) {
    try {
      console.log(
        `👤 [NotificationIntegration] New customer: ${customer.first_name} ${customer.last_name}`
      );

      await notificationService.notifyNewCustomer(customer);

      return { success: true };
    } catch (error) {
      console.error(
        "❌ [NotificationIntegration] Error handling customer creation:",
        error
      );
      return { success: false, error };
    }
  }

  /**
   * Handle refund events
   */
  async onRefundProcessed(refund) {
    try {
      console.log(
        `🔄 [NotificationIntegration] Refund processed: ${refund.amount}`
      );

      await notificationService.notifyRefundProcessed(refund);

      return { success: true };
    } catch (error) {
      console.error(
        "❌ [NotificationIntegration] Error handling refund:",
        error
      );
      return { success: false, error };
    }
  }

  /**
   * Handle purchase receipt events
   */
  async onPurchaseReceived(purchase) {
    try {
      console.log(
        `📦 [NotificationIntegration] Purchase received: ${purchase.purchase_number}`
      );

      await notificationService.createNotification(
        notificationService.notificationTypes.PURCHASE_RECEIVED,
        "Purchase Received",
        `Purchase order ${purchase.purchase_number} has been received from ${purchase.supplier?.name || "supplier"}`,
        {
          priority: notificationService.priorities.MEDIUM,
          data: {
            purchaseId: purchase.id,
            purchaseNumber: purchase.purchase_number,
            supplierId: purchase.supplier_id,
          },
          actionUrl: `/purchases/view/${purchase.id}`,
          category: "purchases",
        }
      );

      return { success: true };
    } catch (error) {
      console.error(
        "❌ [NotificationIntegration] Error handling purchase receipt:",
        error
      );
      return { success: false, error };
    }
  }

  /**
   * Handle specific business events
   */
  async handleBusinessEvent(eventType, eventData) {
    try {
      console.log(
        "🔄 [NotificationIntegration] Handling business event:",
        eventType,
        eventData
      );

      switch (eventType) {
        case "sale_completed":
          await this.handleSaleCompleted(eventData);
          break;
        case "product_created":
          await this.handleProductCreated(eventData);
          break;
        case "product_updated":
          await this.handleProductUpdated(eventData);
          break;
        case "customer_created":
          await this.handleCustomerCreated(eventData);
          break;
        case "purchase_created":
          await this.handlePurchaseCreated(eventData);
          break;
        case "refund_processed":
          await this.handleRefundProcessed(eventData);
          break;
        default:
          console.log(
            "ℹ️ [NotificationIntegration] Unknown event type:",
            eventType
          );
      }

      return { success: true };
    } catch (error) {
      console.error(
        "❌ [NotificationIntegration] Error handling business event:",
        error
      );
      return { success: false, error };
    }
  }

  /**
   * Cleanup when shutting down
   */
  async cleanup() {
    console.log("🧹 [NotificationIntegration] Cleaning up...");
    this.stopBackgroundMonitoring();
    this.isInitialized = false;
  }
}

// Create singleton instance
export const notificationIntegration = new NotificationIntegrationService();

// Convenience methods for easy integration
export const NotificationTriggers = {
  productChanged: (product, action) =>
    notificationIntegration.onProductChanged(product, action),
  saleCompleted: (sale) => notificationIntegration.onSaleCompleted(sale),
  customerCreated: (customer) =>
    notificationIntegration.onCustomerCreated(customer),
  refundProcessed: (refund) =>
    notificationIntegration.onRefundProcessed(refund),
  purchaseReceived: (purchase) =>
    notificationIntegration.onPurchaseReceived(purchase),
};

export default notificationIntegration;
