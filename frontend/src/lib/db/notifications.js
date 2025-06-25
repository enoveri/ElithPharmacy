import { supabase } from "../supabase";

/**
 * Enhanced Notification Database Operations
 * Handles notifications with proper authentication and RLS support
 */
export const notificationDb = {
  /**
   * Get current user for RLS
   */
  getCurrentUser: async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.warn("⚠️ [NotificationDB] No authenticated user:", error.message);
      return null;
    }
  },

  /**
   * Create a notification with proper authentication
   */
  createNotification: async (notificationData) => {
    try {
      console.log(
        "🔄 [NotificationDB] Creating notification:",
        notificationData
      );

      // Get current user
      const user = await notificationDb.getCurrentUser();

      // Clean notification data to match database schema
      const cleanNotification = {
        user_id: user?.id || null, // Set user_id for RLS if authenticated
        type: notificationData.type || "info",
        title: notificationData.title,
        message: notificationData.message,
        priority: notificationData.priority || "medium",
        data: notificationData.data || {},
        action_url: notificationData.action_url || null,
        is_read: false,
      };

      console.log(
        "🔍 [NotificationDB] Clean notification data:",
        cleanNotification
      );

      const { data, error } = await supabase
        .from("notifications")
        .insert([cleanNotification])
        .select()
        .single();

      if (error) {
        console.error(
          "❌ [NotificationDB] Error creating notification:",
          error
        );

        // Handle specific error cases
        if (
          error.code === "42501" ||
          error.message?.includes("row-level security")
        ) {
          console.error(
            "🚨 [NotificationDB] RLS policy blocking notification creation!"
          );
          console.error(
            "💡 [NotificationDB] Consider disabling RLS for notifications table or creating appropriate policies"
          );
        }

        return { success: false, error, data: null };
      }

      console.log("✅ [NotificationDB] Created notification:", data);
      return { success: true, data, error: null };
    } catch (error) {
      console.error("❌ [NotificationDB] Error creating notification:", error);
      return { success: false, error, data: null };
    }
  },

  /**
   * Create notification with duplicate prevention
   */
  createNotificationSafe: async (notification) => {
    try {
      // Check for duplicate notifications in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const user = await notificationDb.getCurrentUser();

      let query = supabase
        .from("notifications")
        .select("id, created_at")
        .eq("type", notification.type)
        .eq("title", notification.title)
        .gte("created_at", oneHourAgo)
        .limit(1);

      // Add user filter if authenticated
      if (user?.id) {
        query = query.eq("user_id", user.id);
      }

      const { data: existing } = await query;

      if (existing && existing.length > 0) {
        console.log(
          "⚠️ [NotificationDB] Duplicate notification prevented:",
          notification.title
        );
        return { success: true, data: existing[0], duplicate: true };
      }

      return await notificationDb.createNotification(notification);
    } catch (error) {
      console.error(
        "❌ [NotificationDB] Error in createNotificationSafe:",
        error
      );
      return { success: false, error, data: null };
    }
  },

  /**
   * Get notifications for the current user
   */
  getNotifications: async (options = {}) => {
    try {
      const {
        limit = 50,
        offset = 0,
        unreadOnly = false,
        type = null,
        priority = null,
      } = options;

      const user = await notificationDb.getCurrentUser();

      let query = supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      // Add user filter if authenticated (for RLS)
      if (user?.id) {
        query = query.eq("user_id", user.id);
      } else {
        // For non-authenticated users, get system-wide notifications
        query = query.is("user_id", null);
      }

      // Apply filters
      if (unreadOnly) {
        query = query.eq("is_read", false);
      }

      if (type) {
        query = query.eq("type", type);
      }

      if (priority) {
        query = query.eq("priority", priority);
      }

      const { data, error } = await query;

      if (error) {
        console.error(
          "❌ [NotificationDB] Error fetching notifications:",
          error
        );
        return { success: false, error, data: [] };
      }

      console.log(`✅ [NotificationDB] Fetched ${data.length} notifications`);
      return { success: true, data, error: null };
    } catch (error) {
      console.error("❌ [NotificationDB] Error getting notifications:", error);
      return { success: false, error, data: [] };
    }
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async () => {
    try {
      const user = await notificationDb.getCurrentUser();

      let query = supabase
        .from("notifications")
        .select("id", { count: "exact" })
        .eq("is_read", false);

      // Add user filter if authenticated
      if (user?.id) {
        query = query.eq("user_id", user.id);
      } else {
        query = query.is("user_id", null);
      }

      const { count, error } = await query;

      if (error) {
        console.error("❌ [NotificationDB] Error getting unread count:", error);
        return { success: false, error, count: 0 };
      }

      return { success: true, count: count || 0, error: null };
    } catch (error) {
      console.error("❌ [NotificationDB] Error getting unread count:", error);
      return { success: false, error, count: 0 };
    }
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId) => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", notificationId)
        .select()
        .single();

      if (error) {
        console.error(
          "❌ [NotificationDB] Error marking notification as read:",
          error
        );
        return { success: false, error, data: null };
      }

      console.log("✅ [NotificationDB] Marked notification as read:", data);
      return { success: true, data, error: null };
    } catch (error) {
      console.error(
        "❌ [NotificationDB] Error marking notification as read:",
        error
      );
      return { success: false, error, data: null };
    }
  },

  /**
   * Mark all notifications as read for current user
   */
  markAllAsRead: async () => {
    try {
      const user = await notificationDb.getCurrentUser();

      let query = supabase
        .from("notifications")
        .update({
          is_read: true,
          updated_at: new Date().toISOString(),
        })
        .eq("is_read", false);

      // Add user filter if authenticated
      if (user?.id) {
        query = query.eq("user_id", user.id);
      } else {
        query = query.is("user_id", null);
      }

      const { data, error } = await query.select();

      if (error) {
        console.error(
          "❌ [NotificationDB] Error marking all notifications as read:",
          error
        );
        return { success: false, error, count: 0 };
      }

      console.log(
        `✅ [NotificationDB] Marked ${data.length} notifications as read`
      );
      return { success: true, count: data.length, error: null };
    } catch (error) {
      console.error(
        "❌ [NotificationDB] Error marking all notifications as read:",
        error
      );
      return { success: false, error, count: 0 };
    }
  },

  /**
   * Delete old notifications
   */
  cleanupOldNotifications: async (daysOld = 30) => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const user = await notificationDb.getCurrentUser();

      let query = supabase
        .from("notifications")
        .delete()
        .lt("created_at", cutoffDate.toISOString());

      // Add user filter if authenticated
      if (user?.id) {
        query = query.eq("user_id", user.id);
      } else {
        query = query.is("user_id", null);
      }

      const { data, error } = await query.select();

      if (error) {
        console.error(
          "❌ [NotificationDB] Error cleaning up old notifications:",
          error
        );
        return { success: false, error, count: 0 };
      }

      console.log(
        `✅ [NotificationDB] Cleaned up ${data.length} old notifications`
      );
      return { success: true, count: data.length, error: null };
    } catch (error) {
      console.error(
        "❌ [NotificationDB] Error cleaning up old notifications:",
        error
      );
      return { success: false, error, count: 0 };
    }
  },

  /**
   * Delete notification by ID
   */
  deleteNotification: async (notificationId) => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId)
        .select()
        .single();

      if (error) {
        console.error(
          "❌ [NotificationDB] Error deleting notification:",
          error
        );
        return { success: false, error, data: null };
      }

      console.log("✅ [NotificationDB] Deleted notification:", data);
      return { success: true, data, error: null };
    } catch (error) {
      console.error("❌ [NotificationDB] Error deleting notification:", error);
      return { success: false, error, data: null };
    }
  },

  /**
   * Run automated stock checks and create notifications
   */
  runStockChecks: async () => {
    try {
      console.log("🔄 [NotificationDB] Running automated stock checks...");

      // Call the database function that creates stock notifications
      const { data, error } = await supabase.rpc(
        "check_and_create_stock_notifications"
      );

      if (error) {
        console.error("❌ [NotificationDB] Error running stock checks:", error);
        return { success: false, error };
      }

      console.log("✅ [NotificationDB] Stock checks completed successfully");
      return { success: true, data };
    } catch (error) {
      console.error("❌ [NotificationDB] Error running stock checks:", error);
      return { success: false, error };
    }
  },

  /**
   * Get notification statistics
   */
  getStats: async () => {
    try {
      const user = await notificationDb.getCurrentUser();

      let baseQuery = supabase.from("notifications");

      // Add user filter if authenticated
      if (user?.id) {
        baseQuery = baseQuery.select("*").eq("user_id", user.id);
      } else {
        baseQuery = baseQuery.select("*").is("user_id", null);
      }

      const { data: allNotifications, error } = await baseQuery;

      if (error) {
        console.error(
          "❌ [NotificationDB] Error getting notification stats:",
          error
        );
        return { success: false, error, stats: null };
      }

      const stats = {
        total: allNotifications.length,
        unread: allNotifications.filter((n) => !n.is_read).length,
        byType: {},
        byPriority: {},
        recent: allNotifications.filter((n) => {
          const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
          return new Date(n.created_at) > hourAgo;
        }).length,
      };

      // Count by type
      allNotifications.forEach((n) => {
        stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
        stats.byPriority[n.priority] = (stats.byPriority[n.priority] || 0) + 1;
      });

      console.log("✅ [NotificationDB] Generated notification stats:", stats);
      return { success: true, stats, error: null };
    } catch (error) {
      console.error(
        "❌ [NotificationDB] Error getting notification stats:",
        error
      );
      return { success: false, error, stats: null };
    }
  },

  /**
   * Get notification statistics (alias for getStats)
   */
  getNotificationStats: async () => {
    const result = await notificationDb.getStats();
    return {
      success: result.success,
      data: result.stats,
      error: result.error,
    };
  },
};

export default notificationDb;
