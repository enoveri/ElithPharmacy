import { useEffect, useCallback, useRef } from "react";
import { useNotificationsStore } from "../store/notifications";
import { notificationService } from "../services/notificationService";

/**
 * Enhanced notification hook with automatic background monitoring
 */
export const useNotifications = (options = {}) => {
  const {
    enableAutoCheck = true,
    checkInterval = 5 * 60 * 1000, // 5 minutes
    enableRealTime = true,
    onNewNotification = null,
    onError = null,
  } = options;

  const intervalRef = useRef(null);
  const lastCheckRef = useRef(0);

  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    checkAutoNotifications,
    clearError,
  } = useNotificationsStore();

  /**
   * Enhanced notification check that includes comprehensive monitoring
   */
  const runComprehensiveCheck = useCallback(async () => {
    try {
      // Run the comprehensive service check
      const serviceResult = await notificationService.runComprehensiveCheck();

      if (serviceResult.success) {
        // Refresh notifications from database
        await fetchNotifications();

        // Update last check timestamp
        lastCheckRef.current = Date.now();

        return serviceResult;
      }

      return { success: false, error };
    } catch (error) {
      if (onError) onError(error);
      return { success: false, error };
    }
  }, [fetchNotifications, onError]);

  /**
   * Manually trigger specific notification types
   */
  const triggerNotificationCheck = useCallback(
    async (type = "all") => {
      try {
        switch (type) {
          case "inventory":
            return await notificationService.checkInventoryNotifications();
          case "all":
          default:
            return await runComprehensiveCheck();
        }
      } catch (error) {
        return { success: false, error };
      }
    },
    [runComprehensiveCheck]
  );

  /**
   * Handle sale completion notification
   */
  const notifySaleCompleted = useCallback(
    async (sale) => {
      try {
        const result = await notificationService.notifySaleCompleted(sale);
        if (result.success) {
          await fetchNotifications(); // Refresh to show new notification
        }
        return result;
      } catch (error) {
        return { success: false, error };
      }
    },
    [fetchNotifications]
  );

  /**
   * Handle new customer notification
   */
  const notifyNewCustomer = useCallback(
    async (customer) => {
      try {
        const result = await notificationService.notifyNewCustomer(customer);
        if (result.success) {
          await fetchNotifications(); // Refresh to show new notification
        }
        return result;
      } catch (error) {
        return { success: false, error };
      }
    },
    [fetchNotifications]
  );

  /**
   * Handle refund notification
   */
  const notifyRefundProcessed = useCallback(
    async (refund) => {
      try {
        const result = await notificationService.notifyRefundProcessed(refund);
        if (result.success) {
          await fetchNotifications(); // Refresh to show new notification
        }
        return result;
      } catch (error) {
        return { success: false, error };
      }
    },
    [fetchNotifications]
  );

  /**
   * Create custom notification
   */
  const createCustomNotification = useCallback(
    async (type, title, message, options = {}) => {
      try {
        const result = await notificationService.createNotification(
          type,
          title,
          message,
          options
        );
        if (result.success) {
          await fetchNotifications(); // Refresh to show new notification
        }
        return result;
      } catch (error) {
        return { success: false, error };
      }
    },
    [fetchNotifications]
  );

  /**
   * Enhanced mark as read with callback
   */
  const markNotificationAsRead = useCallback(
    async (notificationId) => {
      try {
        const result = await markAsRead(notificationId);
        return result;
      } catch (error) {
        return { success: false, error };
      }
    },
    [markAsRead]
  );

  /**
   * Enhanced mark all as read
   */
  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      const result = await markAllAsRead();
      return result;
    } catch (error) {
      return { success: false, error };
    }
  }, [markAllAsRead]);

  /**
   * Delete notification with refresh
   */
  const deleteNotificationWithRefresh = useCallback(
    async (notificationId) => {
      try {
        const result = await deleteNotification(notificationId);
        return result;
      } catch (error) {
        return { success: false, error };
      }
    },
    [deleteNotification]
  );

  /**
   * Get notifications by category
   */
  const getNotificationsByCategory = useCallback(
    (category) => {
      return notifications.filter(
        (notification) =>
          notification.category === category ||
          notification.data?.category === category
      );
    },
    [notifications]
  );

  /**
   * Get notifications by type
   */
  const getNotificationsByType = useCallback(
    (type) => {
      return notifications.filter((notification) => notification.type === type);
    },
    [notifications]
  );

  /**
   * Get high priority notifications
   */
  const getHighPriorityNotifications = useCallback(() => {
    return notifications.filter(
      (notification) =>
        notification.priority === "high" || notification.priority === "critical"
    );
  }, [notifications]);

  /**
   * Setup automatic background checking
   */
  useEffect(() => {
    if (!enableAutoCheck) return;

    // Initial check
    runComprehensiveCheck();

    // Setup interval for periodic checks
    intervalRef.current = setInterval(() => {
      runComprehensiveCheck();
    }, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enableAutoCheck, checkInterval, runComprehensiveCheck]);

  /**
   * Handle new notification callbacks
   */
  useEffect(() => {
    if (onNewNotification && notifications.length > 0) {
      const latestNotification = notifications[0];
      const wasRecentlyCreated =
        new Date() - new Date(latestNotification.created_at) < 10000; // 10 seconds

      if (wasRecentlyCreated && !latestNotification.is_read) {
        onNewNotification(latestNotification);
      }
    }
  }, [notifications, onNewNotification]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    // State
    notifications,
    unreadCount,
    loading,
    error,

    // Basic actions
    fetchNotifications,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    deleteNotification: deleteNotificationWithRefresh,
    clearError,

    // Enhanced actions
    runComprehensiveCheck,
    triggerNotificationCheck,

    // Event-specific notifications
    notifySaleCompleted,
    notifyNewCustomer,
    notifyRefundProcessed,
    createCustomNotification,

    // Filtering and querying
    getNotificationsByCategory,
    getNotificationsByType,
    getHighPriorityNotifications,

    // Utilities
    lastCheck: lastCheckRef.current,
    isAutoCheckEnabled: enableAutoCheck,

    // Notification service instance for advanced usage
    notificationService,
  };
};

export default useNotifications;
