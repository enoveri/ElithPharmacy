import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiSettings,
  FiBell,
  FiMenu,
  FiUser,
  FiX,
  FiAlertTriangle,
  FiInfo,
  FiCheckCircle,
  FiPackage,
  FiClock,
  FiExternalLink,
  FiCheck,
} from "react-icons/fi";
import { useNotificationsStore } from "../../store";
import NotificationPanel from "../NotificationPanel.jsx";
import { useAuth } from "../../contexts/AuthContext"; // Import useAuth hook

const Header = () => {
  const { user, logout } = useAuth(); // Call useAuth at the beginning

  const [time, setTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  // Use notification store
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    checkAutoNotifications,
    createManualNotifications, // Add this debug function
  } = useNotificationsStore();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Fetch notifications on component mount and set up periodic checks
  useEffect(() => {
    fetchNotifications();
    checkAutoNotifications(); // Check for automatic notifications

    // Set up periodic refresh and auto-notification checks
    const refreshInterval = setInterval(() => {
      fetchNotifications();
      checkAutoNotifications();
    }, 300000); // Refresh every 5 minutes

    return () => {
      clearInterval(refreshInterval);
    };
  }, [fetchNotifications, checkAutoNotifications]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const clearAllNotifications = async () => {
    try {
      await markAllAsRead();
      setShowNotifications(false);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read first
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate to action URL if available
    if (notification.action_url) {
      navigate(notification.action_url);
      setShowNotifications(false);
    }
  };

  // Notification action handlers
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      // Refresh notifications
      const updatedNotifications = notifications.map((n) =>
        n.id === notificationId ? { ...n, is_read: true } : n
      );
      setNotifications(updatedNotifications);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(user?.id);
      // Refresh notifications
      const updatedNotifications = notifications.map((n) => ({
        ...n,
        is_read: true,
      }));
      setNotifications(updatedNotifications);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      // Remove from local state
      const updatedNotifications = notifications.filter(
        (n) => n.id !== notificationId
      );
      setNotifications(updatedNotifications);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };
  // Cleanup old notifications on mount
  useEffect(() => {
    if (user?.id) {
      cleanupOldNotifications(user.id).catch(console.error);
    }
  }, [user?.id]);

  // Debug function to manually create notifications
  const handleCreateTestNotifications = async () => {
    console.log("🔧 [Debug] Manually creating test notifications...");
    try {
      await createManualNotifications();
      console.log("✅ [Debug] Test notifications created");
    } catch (error) {
      console.error("❌ [Debug] Error creating test notifications:", error);
    }
  };

  // Load notifications function
  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
      setNotifications([]);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setShowProfileMenu(false);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return FiCheckCircle;
      case "warning":
        return FiAlertTriangle;
      case "error":
        return FiAlertTriangle;
      case "info":
        return FiInfo;
      default:
        return FiBell;
    }
  };

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 24px",
        height: "64px",
        backgroundColor: "white",
        borderBottom: "1px solid #e5e7eb",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Left section */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <h1
          style={{
            fontSize: "20px",
            fontWeight: "600",
            color: "#1f2937",
            margin: 0,
          }}
        >
          Elith Pharmacy
        </h1>
      </div>

      {/* Right section */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* Time display */}
        <div
          style={{
            fontSize: "14px",
            color: "#6b7280",
            fontWeight: "500",
          }}
        >
          {time.toLocaleTimeString("en-US", {
            hour12: true,
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        {/* Notifications */}
        <div style={{ position: "relative" }} ref={notificationRef}>
          <button
            onClick={toggleNotifications}
            style={{
              position: "relative",
              padding: "8px",
              border: "none",
              background: "none",
              cursor: "pointer",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#f3f4f6";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
            }}
          >
            <FiBell size={20} color="#374151" />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  right: "2px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  borderRadius: "50%",
                  width: "18px",
                  height: "18px",
                  fontSize: "10px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "18px",
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Panel */}
          {showNotifications && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: "0",
                width: "360px",
                maxHeight: "400px",
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
                zIndex: 1000,
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: "16px",
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1f2937",
                  }}
                >
                  Notifications ({unreadCount})
                </h3>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    style={{
                      padding: "4px 8px",
                      fontSize: "12px",
                      color: "#6b7280",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <FiCheck size={12} />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div
                style={{
                  maxHeight: "320px",
                  overflowY: "auto",
                }}
              >
                {" "}
                {notifications.length === 0 ? (
                  <div
                    style={{
                      padding: "32px 16px",
                      textAlign: "center",
                      color: "#6b7280",
                    }}
                  >
                    <FiBell
                      size={32}
                      style={{ marginBottom: "8px", opacity: 0.5 }}
                    />
                    <div style={{ fontSize: "14px", marginBottom: "16px" }}>
                      No notifications
                    </div>
                    {/* Debug buttons */}
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexDirection: "column",
                      }}
                    >
                      <button
                        onClick={handleCreateTestNotifications}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        Create Test Notifications
                      </button>

                      <button
                        onClick={() => {
                          navigate("/database-setup");
                          setShowNotifications(false);
                        }}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        Database Setup
                      </button>
                    </div>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const NotificationIcon = getNotificationIcon(
                      notification.type
                    );
                    const iconColor =
                      notification.type === "success"
                        ? "#10b981"
                        : notification.type === "warning"
                          ? "#f59e0b"
                          : notification.type === "error"
                            ? "#ef4444"
                            : "#6b7280";

                    return (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid #f3f4f6",
                          cursor: "pointer",
                          backgroundColor: notification.is_read
                            ? "transparent"
                            : "#f8fafc",
                          transition: "background-color 0.2s",
                          display: "flex",
                          gap: "12px",
                          alignItems: "flex-start",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#f3f4f6";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = notification.is_read
                            ? "transparent"
                            : "#f8fafc";
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            backgroundColor: `${iconColor}15`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <NotificationIcon size={16} color={iconColor} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: notification.is_read
                                ? "normal"
                                : "600",
                              color: "#1f2937",
                              marginBottom: "4px",
                            }}
                          >
                            {notification.title}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              lineHeight: "1.4",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {notification.message}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#9ca3af",
                              marginTop: "4px",
                            }}
                          >
                            {new Date(
                              notification.created_at
                            ).toLocaleDateString()}
                          </div>
                        </div>

                        <button
                          onClick={(e) =>
                            handleDeleteNotification(notification.id, e)
                          }
                          style={{
                            padding: "4px",
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            borderRadius: "4px",
                            color: "#9ca3af",
                            flexShrink: 0,
                            opacity: 0.7,
                            transition: "opacity 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.opacity = "1";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.opacity = "0.7";
                          }}
                        >
                          <FiX size={14} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>{" "}
        {/* Settings */}
        <button
          onClick={() => navigate("/settings")}
          style={{
            padding: "8px",
            border: "none",
            background: "none",
            cursor: "pointer",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s",
          }}
          title="Settings"
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#f3f4f6";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "transparent";
          }}
        >
          <FiSettings size={20} color="#374151" />
        </button>
        {/* User Profile */}
        <button
          style={{
            padding: "8px",
            border: "none",
            background: "none",
            cursor: "pointer",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#f3f4f6";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "transparent";
          }}
        >
          <FiUser size={20} color="#374151" />
        </button>
      </div>
    </header>
  );
};

export default Header;
