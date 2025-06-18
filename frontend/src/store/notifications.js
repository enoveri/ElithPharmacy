import { create } from 'zustand';
import { dataService } from '../services';

const useNotificationsStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  // Fetch notifications from database
  fetchNotifications: async (userId = null) => {
    try {
      set({ loading: true, error: null });
      
      const notifications = await dataService.notifications.getAll(userId);
      const unreadCount = notifications.filter(n => !n.is_read).length;
      
      set({ 
        notifications, 
        unreadCount, 
        loading: false 
      });
      
      console.log(`📬 [Notifications] Loaded ${notifications.length} notifications (${unreadCount} unread)`);
    } catch (error) {
      console.error('❌ [Notifications] Error fetching notifications:', error);
      set({ 
        error: error.message, 
        loading: false,
        notifications: [],
        unreadCount: 0
      });
    }
  },

  // Add a new notification
  addNotification: async (notificationData) => {
    try {
      const result = await dataService.notifications.create(notificationData);
      
      if (result.success) {
        const newNotification = result.data;
        set(state => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1
        }));
        
        console.log('📢 [Notifications] New notification added:', newNotification.title);
        return { success: true, data: newNotification };
      } else {
        throw new Error(result.error?.message || 'Failed to create notification');
      }
    } catch (error) {
      console.error('❌ [Notifications] Error adding notification:', error);
      set({ error: error.message });
      return { success: false, error };
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      const result = await dataService.notifications.markAsRead(notificationId);
      
      if (result.success) {
        set(state => ({
          notifications: state.notifications.map(n => 
            n.id === notificationId 
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }));
        
        console.log('✅ [Notifications] Notification marked as read:', notificationId);
        return { success: true };
      } else {
        throw new Error(result.error?.message || 'Failed to mark notification as read');
      }
    } catch (error) {
      console.error('❌ [Notifications] Error marking notification as read:', error);
      set({ error: error.message });
      return { success: false, error };
    }
  },

  // Mark all notifications as read
  markAllAsRead: async (userId = null) => {
    try {
      const result = await dataService.notifications.markAllAsRead(userId);
      
      if (result.success) {
        set(state => ({
          notifications: state.notifications.map(n => ({ 
            ...n, 
            is_read: true, 
            read_at: new Date().toISOString() 
          })),
          unreadCount: 0
        }));
        
        console.log('✅ [Notifications] All notifications marked as read');
        return { success: true };
      } else {
        throw new Error(result.error?.message || 'Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('❌ [Notifications] Error marking all notifications as read:', error);
      set({ error: error.message });
      return { success: false, error };
    }
  },

  // Delete a notification
  deleteNotification: async (notificationId) => {
    try {
      const result = await dataService.notifications.delete(notificationId);
      
      if (result.success) {
        set(state => {
          const notificationToDelete = state.notifications.find(n => n.id === notificationId);
          const wasUnread = notificationToDelete && !notificationToDelete.is_read;
          
          return {
            notifications: state.notifications.filter(n => n.id !== notificationId),
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
          };
        });
        
        console.log('🗑️ [Notifications] Notification deleted:', notificationId);
        return { success: true };
      } else {
        throw new Error(result.error?.message || 'Failed to delete notification');
      }
    } catch (error) {
      console.error('❌ [Notifications] Error deleting notification:', error);
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
          unreadCount: 0
        });
        
        console.log('🗑️ [Notifications] All notifications deleted');
        return { success: true };
      } else {
        throw new Error(result.error?.message || 'Failed to delete all notifications');
      }
    } catch (error) {
      console.error('❌ [Notifications] Error deleting all notifications:', error);
      set({ error: error.message });
      return { success: false, error };
    }
  },

  // Auto-notification creators
  createLowStockAlert: async (product) => {
    try {
      const result = await dataService.notifications.createLowStockAlert(product);
      if (result.success) {
        // Refresh notifications to include the new one
        await get().fetchNotifications();
      }
      return result;
    } catch (error) {
      console.error('❌ [Notifications] Error creating low stock alert:', error);
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
      console.error('❌ [Notifications] Error creating sale alert:', error);
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
      console.error('❌ [Notifications] Error creating expiry alert:', error);
      return { success: false, error };
    }
  },

  // Check for automatic notifications
  checkAutoNotifications: async () => {
    try {
      const result = await dataService.notifications.checkAutoNotifications();
      if (result.success) {
        // Refresh notifications to include any new ones
        await get().fetchNotifications();
      }
      return result;
    } catch (error) {
      console.error('❌ [Notifications] Error checking auto notifications:', error);
      return { success: false, error };
    }
  },

  // Manual notification creation for debugging
  createManualNotifications: async () => {
    try {
      console.log('🔧 [Debug] Creating manual notifications for testing...');
      
      // Get low stock products
      const lowStockProducts = await dataService.products.getLowStock();
      console.log('📦 [Debug] Found low stock products:', lowStockProducts);

      // Create notifications for each low stock product
      for (const product of lowStockProducts) {
        const notification = {
          type: 'warning',
          title: 'Low Stock Alert',
          message: `${product.name} is running low (${product.quantity || 0} left, minimum: ${product.min_stock_level || product.minStockLevel || 0})`,
          priority: 'high',
          data: { productId: product.id, currentStock: product.quantity },
          action_url: `/inventory/${product.id}`,
        };

        const result = await dataService.notifications.create(notification);
        console.log('🔔 [Debug] Created notification:', result);
      }

      // Get out of stock products
      const allProducts = await dataService.products.getAll();
      const outOfStockProducts = allProducts.filter(product => (product.quantity || 0) === 0);
      console.log('❌ [Debug] Found out of stock products:', outOfStockProducts);

      // Create notifications for out of stock products
      for (const product of outOfStockProducts) {
        const notification = {
          type: 'error',
          title: 'Out of Stock Alert',
          message: `${product.name} is completely out of stock!`,
          priority: 'high',
          data: { productId: product.id, currentStock: 0 },
          action_url: `/inventory/${product.id}`,
        };

        const result = await dataService.notifications.create(notification);
        console.log('🚨 [Debug] Created out of stock notification:', result);
      }

      // Refresh notifications
      await get().fetchNotifications();
      
      return { success: true };
    } catch (error) {
      console.error('❌ [Debug] Error creating manual notifications:', error);
      return { success: false, error };
    }
  },

  // Clear error state
  clearError: () => set({ error: null }),

  // Reset store
  reset: () => set({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null
  }),
}));

export { useNotificationsStore };
