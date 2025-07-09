import { create } from "zustand";
import { dataService } from "../services";
import { notificationService } from "../services/notificationService";
import { notificationDb } from "../lib/db/notifications";

const useNotificationsStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  lastAutoCheck: null,
  autoCheckEnabled: true,
  // Fetch notifications from database
  fetchNotifications: async (options = {}) => {
    try {
      set({ loading: true, error: null });

      // Use enhanced notification database layer
      const result = await notificationDb.getNotifications(options);

      if (!result.success) {
        throw new Error(
          result.error?.message || "Failed to fetch notifications"
        );
      }

      const notifications = result.data || [];

      // Get unread count
      const unreadResult = await notificationDb.getUnreadCount();
      const unreadCount = unreadResult.success ? unreadResult.count : 0;

      set({
        notifications,
        unreadCount,
        loading: false,
      });
    } catch (error) {
      set({
        error: error.message,
        loading: false,
        notifications: [],
        unreadCount: 0,
      });
    }
  },

  // Add a new notification
  addNotification: async (notificationData) => {
    try {
      const result = await dataService.notifications.create(notificationData);

      if (result.success) {
        const newNotification = result.data;
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));

        return { success: true, data: newNotification };
      } else {
        throw new Error(
          result.error?.message || "Failed to create notification"
        );
      }
    } catch (error) {
      set({ error: error.message });
      return { success: false, error };
    }
  },
  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      const result = await notificationDb.markAsRead(notificationId);

      if (result.success) {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId
              ? { ...n, is_read: true, updated_at: new Date().toISOString() }
              : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));

        return { success: true };
      } else {
        throw new Error(
          result.error?.message || "Failed to mark notification as read"
        );
      }
    } catch (error) {
      set({ error: error.message });
      return { success: false, error };
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const result = await notificationDb.markAllAsRead();

      if (result.success) {
        set((state) => ({
          notifications: state.notifications.map((n) => ({
            ...n,
            is_read: true,
            updated_at: new Date().toISOString(),
          })),
          unreadCount: 0,
        }));

        return { success: true };
      } else {
        throw new Error(
          result.error?.message || "Failed to mark all notifications as read"
        );
      }
    } catch (error) {
      set({ error: error.message });
      return { success: false, error };
    }
  },

  // Delete a notification
  deleteNotification: async (notificationId) => {
    try {
      const result = await dataService.notifications.delete(notificationId);

      if (result.success) {
        set((state) => {
          const notificationToDelete = state.notifications.find(
            (n) => n.id === notificationId
          );
          const wasUnread =
            notificationToDelete && !notificationToDelete.is_read;

          return {
            notifications: state.notifications.filter(
              (n) => n.id !== notificationId
            ),
            unreadCount: wasUnread
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
          };
        });

        return { success: true };
      } else {
        throw new Error(
          result.error?.message || "Failed to delete notification"
        );
      }
    } catch (error) {
      set({ error: error.message });
      return { success: false, error };
    }
  },

  // Delete all notifications
  deleteAllNotifications: async (userId = null) => {
    try {
      const result = await dataService.notifications.deleteAll(userId);

      if (result.success) {
        set({
          notifications: [],
          unreadCount: 0,
        });

        return { success: true };
      } else {
        throw new Error(
          result.error?.message || "Failed to delete all notifications"
        );
      }
    } catch (error) {
      set({ error: error.message });
      return { success: false, error };
    }
  },

  // Auto-notification creators
  createLowStockAlert: async (product) => {
    try {
      const result =
        await dataService.notifications.createLowStockAlert(product);
      if (result.success) {
        // Refresh notifications to include the new one
        await get().fetchNotifications();
      }
      return result;
    } catch (error) {
      return { success: false, error };
    }
  },

  createSaleAlert: async (sale) => {
    try {
      const result = await dataService.notifications.createSaleAlert(sale);
      if (result.success) {
        // Refresh notifications to include the new one
        await get().fetchNotifications();
      }
      return result;
    } catch (error) {
      return { success: false, error };
    }
  },

  createExpiryAlert: async (product) => {
    try {
      const result = await dataService.notifications.createExpiryAlert(product);
      if (result.success) {
        // Refresh notifications to include the new one
        await get().fetchNotifications();
      }
      return result;
    } catch (error) {
      return { success: false, error };
    }
  },
  // Check for automatic notifications with comprehensive service
  checkAutoNotifications: async () => {
    try {
      set({ lastAutoCheck: new Date().toISOString() });

      // Use the comprehensive notification service
      const result = await notificationService.runComprehensiveCheck();

      if (result.success) {
        // Refresh notifications to include new ones
        await get().fetchNotifications();
      }

      return result;
    } catch (error) {
      set({ error: error.message });
      return { success: false, error };
    }
  },

  // Enable/disable auto-checking
  setAutoCheckEnabled: (enabled) => set({ autoCheckEnabled: enabled }),

  // Enhanced notification creators using the service
  createLowStockAlert: async (product) => {
    try {
      const result = await notificationService.createNotification(
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

      if (result.success && !result.wasDuplicate) {
        await get().fetchNotifications();
      }
      return result;
    } catch (error) {
      return { success: false, error };
    }
  },

  createSaleAlert: async (sale) => {
    try {
      const result = await notificationService.notifySaleCompleted(sale);
      if (result.success) {
        await get().fetchNotifications();
      }
      return result;
    } catch (error) {
      return { success: false, error };
    }
  },

  createExpiryAlert: async (product) => {
    try {
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

      const result = await notificationService.createNotification(
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

      if (result.success && !result.wasDuplicate) {
        await get().fetchNotifications();
      }
      return result;
    } catch (error) {
      return { success: false, error };
    }
  },

  // Create custom notification
  createCustomNotification: async (type, title, message, options = {}) => {
    try {
      const result = await notificationService.createNotification(
        type,
        title,
        message,
        options
      );
      if (result.success && !result.wasDuplicate) {
        await get().fetchNotifications();
      }
      return result;
    } catch (error) {
      return { success: false, error };
    }
  },

  // Trigger specific notification checks
  triggerInventoryCheck: async () => {
    try {
      const result = await notificationService.checkInventoryNotifications();
      if (result.success) {
        await get().fetchNotifications();
      }
      return result;
    } catch (error) {
      return { success: false, error };
    }
  },
  // Manual notification creation
  createManualNotifications: async () => {
    try {
      // First, try to create a simple test notification
      const testNotification = {
        type: "info",
        title: "Test Notification",
        message: "This is a test notification to verify the system is working.",
        priority: "medium",
        data: { test: true },
      };

      const testResult =
        await dataService.notifications.create(testNotification);

      // Try to create another notification for low stock
      const lowStockNotification = {
        type: "warning",
        title: "Low Stock Alert",
        message: "Sample product is running low (5 left, minimum: 10)",
        priority: "high",
        data: { productId: "test-product", currentStock: 5 },
      };

      const lowStockResult =
        await dataService.notifications.create(lowStockNotification);

      // Refresh notifications
      await get().fetchNotifications();

      return { success: true, message: "Test notifications created" };
    } catch (error) {
      return { success: false, error };
    }
  },

  // Clear error state
  clearError: () => set({ error: null }),

  // Reset store
  reset: () =>
    set({
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: null,
    }),
}));

export { useNotificationsStore };
