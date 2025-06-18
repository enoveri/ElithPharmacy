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
} from "react-icons/fi";
import { useNotificationsStore } from "../../store";

const Header = () => {
  const [time, setTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
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
      console.error('Error clearing notifications:', error);
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
  const handleDeleteNotification = async (notificationId, event) => {
    event.stopPropagation(); // Prevent triggering the click handler
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Get notification icon based on type  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return FiCheckCircle;
      case 'warning':
        return FiAlertTriangle;
      case 'error':
        return FiAlertTriangle;
      case 'info':
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
        <button
          style={{
            display: "none",
            padding: "8px",
            border: "none",
            background: "none",
            cursor: "pointer",
            borderRadius: "4px",
          }}
          className="mobile-only"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>

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
                {notifications.length === 0 ? (
                  <div
                    style={{
                      padding: "32px 16px",
                      textAlign: "center",
                      color: "#6b7280",
                    }}
                  >
                    <FiBell size={32} style={{ marginBottom: "8px", opacity: 0.5 }} />
                    <div style={{ fontSize: "14px" }}>No notifications</div>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const NotificationIcon = getNotificationIcon(notification.type);
                    const iconColor = notification.type === 'success' ? '#10b981' : 
                                    notification.type === 'warning' ? '#f59e0b' : 
                                    notification.type === 'error' ? '#ef4444' : '#6b7280';

                    return (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid #f3f4f6",
                          cursor: "pointer",
                          backgroundColor: notification.is_read ? "transparent" : "#f8fafc",
                          transition: "background-color 0.2s",
                          display: "flex",
                          gap: "12px",
                          alignItems: "flex-start",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#f3f4f6";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = notification.is_read ? "transparent" : "#f8fafc";
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
                              fontWeight: notification.is_read ? "normal" : "600",
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
                            {new Date(notification.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDeleteNotification(notification.id, e)}
                          style={{
                            padding: "4px",
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            borderRadius: "4px",
                            color: "#9ca3af",
                            flexShrink: 0,
                            opacity: 0,
                            transition: "opacity 0.2s",
                          }}
                          className="notification-delete"
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
        </div>

        {/* Settings */}
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
  };

  const getNotificationPriority = (notification) => {
    if (notification.type === "critical") {
      if (notification.id.startsWith("expired-")) return 1; // Highest priority
      if (
        notification.id.startsWith("expiry-") &&
        notification.daysUntilExpiry <= 3
      )
        return 2;
      if (notification.id.startsWith("stock-")) return 3;
    }
    if (notification.type === "warning") {
      if (notification.id.startsWith("expiry-")) return 4;
      return 5;
    }
    return 6; // Lowest priority
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Format date as "Thursday, November 25, 2021"
  const formattedDate = time.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Format time as "07:01:39"
  const hours = time.getHours() % 12 || 12;
  const formattedHours = hours.toString().padStart(2, "0");
  const formattedMinutes = time.getMinutes().toString().padStart(2, "0");
  const formattedSeconds = time.getSeconds().toString().padStart(2, "0");
  const amPm = time.getHours() >= 12 ? "PM" : "AM";

  const getNotificationIcon = (notification) => {
    const color = getNotificationColor(notification.type);
    
    // Determine icon based on notification ID or type
    if (notification.id.startsWith("stock-")) {
      return <FiPackage size={16} color={color} />;
    } else if (notification.id.startsWith("expiry-") || notification.id.startsWith("expired-")) {
      return <FiClock size={16} color={color} />;
    } else if (notification.id.startsWith("sale-")) {
      return <FiCheckCircle size={16} color={color} />;
    } else if (notification.id.startsWith("system-")) {
      return <FiInfo size={16} color={color} />;
    } else {
      // Default based on type
      switch (notification.type) {
        case "critical":
          return <FiAlertTriangle size={16} color={color} />;
        case "warning":
          return <FiAlertTriangle size={16} color={color} />;
        case "info":
          return <FiInfo size={16} color={color} />;
        case "success":
          return <FiCheckCircle size={16} color={color} />;
        default:
          return <FiBell size={16} color={color} />;
      }
    }
  };

  return (
    <header
      className="bg-white/95 backdrop-blur-sm border-b border-slate-200/80 shadow-sm"
      style={{ fontFamily: "var(--font-family-sans)" }}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section - Search */}
          <div className="flex items-center flex-1 max-w-lg ml-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search products, customers, transactions..."
                className="items-center block w-full pl-10 pr-4 py-4  transition-all outline-none duration-200 hover:shadow-sm border-b-2"
                style={{
                  borderBottom: "2px solid var(--color-border-light)",
                  color: "var(--color-text-primary)",
                  fontSize: "1rem",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--color-border-focus)";
                  e.target.style.boxShadow = "0 0 0 3px rgb(59 130 246 / 0.1)";
                  e.target.style.borderBottom =
                    "2px solid var(--color-border-focus)";
                  e.target.style.filter =
                    "drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--color-border-light)";
                  e.target.style.boxShadow = "none";
                  e.target.style.borderBottom =
                    "2px solid var(--color-border-light)";
                  e.target.style.filter = "none";
                }}
                onMouseEnter={(e) => {
                  if (document.activeElement !== e.target) {
                    e.target.style.borderBottom =
                      "2px solid var(--color-secondary-400)";
                    e.target.style.filter =
                      "drop-shadow(0 2px 4px rgba(56, 189, 248, 0.2))";
                  }
                }}
                onMouseLeave={(e) => {
                  if (document.activeElement !== e.target) {
                    e.target.style.borderBottom =
                      "2px solid var(--color-border-light)";
                    e.target.style.filter = "none";
                  }
                }}
              />
              <div className="absolute inset-y-0 right-0 pl-3 flex items-center pointer-events-none">
                <FiSearch
                  className="h-5 w-5"
                  style={{ color: "var(--color-text-muted)" }}
                />
              </div>
            </div>
          </div>

          {/* Enhanced Clock Display */}
          <div
            className="border rounded-xl shadow-sm p-4 min-w-[200px] backdrop-blur-sm"
            style={{
              background: "var(--color-bg-gradient-secondary)",
              borderColor: "var(--color-border-light)",
              fontFamily: "var(--font-family-sans)",
            }}
          >
            <div className="text-center">
              <div
                className="text-xs font-medium mb-1 tracking-wide"
                style={{ color: "var(--color-text-white)", opacity: 0.9 }}
              >
                {formattedDate}
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div
                  className="text-xl font-bold tracking-wider"
                  style={{
                    color: "var(--color-text-white)",
                    fontFamily: "var(--font-family-mono)",
                  }}
                >
                  {formattedHours}:{formattedMinutes}:{formattedSeconds}
                </div>
                <div
                  className="px-2 py-1 rounded-md text-xs font-bold shadow-sm"
                  style={{
                    background: "var(--color-primary-600)",
                    color: "var(--color-text-white)",
                  }}
                >
                  {amPm}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between px-4 items-center gap-4">
            <button
              className="p-2.5 rounded-xl transition-all duration-200 hover:shadow-sm"
              style={{
                color: "var(--color-text-secondary)",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "var(--color-bg-main)";
                e.target.style.color = "var(--color-text-primary)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "var(--color-text-secondary)";
              }}
            >
              <FiSettings className="h-5 w-5" />
            </button>

            {/* Enhanced Notification Button */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={toggleNotifications}
                className="p-2.5 rounded-xl transition-all duration-200 hover:shadow-sm relative"
                style={{
                  color: "var(--color-text-secondary)",
                  backgroundColor: showNotifications
                    ? "var(--color-bg-main)"
                    : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!showNotifications) {
                    e.target.style.backgroundColor = "var(--color-bg-main)";
                    e.target.style.color = "var(--color-text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showNotifications) {
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.color = "var(--color-text-secondary)";
                  }
                }}
              >
                <FiBell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: "var(--color-danger-500)" }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div
                  className="absolute right-0 top-full mt-2 w-96 rounded-xl shadow-xl border backdrop-blur-sm z-50"
                  style={{
                    backgroundColor: "white",
                    borderColor: "var(--color-border-light)",
                    maxHeight: "70vh",
                    overflow: "hidden",
                  }}
                >
                  {/* Notification Header */}
                  <div
                    className="p-4 border-b flex justify-between items-center"
                    style={{ borderColor: "var(--color-border-light)" }}
                  >
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      Notifications
                    </h3>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          style={{
                            fontSize: "12px",
                            color: "var(--color-primary-600)",
                            backgroundColor: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px 8px",
                            borderRadius: "4px",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor =
                              "var(--color-primary-50)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "transparent";
                          }}
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={clearAllNotifications}
                        style={{
                          fontSize: "12px",
                          color: "var(--color-text-muted)",
                          backgroundColor: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px",
                        }}
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Notification List */}
                  <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div
                        style={{
                          padding: "40px 20px",
                          textAlign: "center",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        <FiBell
                          size={32}
                          style={{ marginBottom: "12px", opacity: 0.5 }}
                        />
                        <p>No notifications</p>
                      </div>
                    ) : (
                      notifications
                        .sort(
                          (a, b) =>
                            getNotificationPriority(a) -
                            getNotificationPriority(b)
                        )
                        .map((notification) => {
                          const action = getNotificationAction(notification);
                          return (
                            <div
                              key={notification.id}
                              style={{
                                borderBottom:
                                  "1px solid var(--color-border-light)",
                                backgroundColor: notification.read
                                  ? "transparent"
                                  : "var(--color-primary-25)",
                                transition: "all 0.2s ease",
                                borderLeft:
                                  notification.type === "critical"
                                    ? "4px solid #ef4444"
                                    : notification.type === "warning"
                                      ? "4px solid #f59e0b"
                                      : "none",
                              }}
                            >
                              {/* Main notification content */}
                              <div
                                onClick={() =>
                                  handleNotificationClick(notification)
                                }
                                style={{
                                  padding: "12px 16px",
                                  cursor: "pointer",
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor =
                                    "var(--color-bg-main)";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor =
                                    "transparent";
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "12px",
                                  }}
                                >                                  <div
                                    style={{
                                      width: "32px",
                                      height: "32px",
                                      borderRadius: "50%",
                                      backgroundColor: `${getNotificationColor(notification.type)}20`,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {getNotificationIcon(notification)}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        marginBottom: "4px",
                                      }}
                                    >
                                      <h4
                                        style={{
                                          fontSize: "14px",
                                          fontWeight: notification.read
                                            ? "500"
                                            : "600",
                                          color: "var(--color-text-primary)",
                                          margin: 0,
                                        }}
                                      >
                                        {notification.title}
                                        {notification.type === "critical" && (
                                          <span
                                            style={{
                                              marginLeft: "6px",
                                              fontSize: "10px",
                                              padding: "2px 6px",
                                              backgroundColor: "#ef4444",
                                              color: "white",
                                              borderRadius: "8px",
                                              fontWeight: "bold",
                                            }}
                                          >
                                            URGENT
                                          </span>
                                        )}
                                      </h4>
                                      {!notification.read && (
                                        <div
                                          style={{
                                            width: "8px",
                                            height: "8px",
                                            borderRadius: "50%",
                                            backgroundColor:
                                              "var(--color-primary-600)",
                                            flexShrink: 0,
                                            marginLeft: "8px",
                                          }}
                                        />
                                      )}
                                    </div>
                                    <p
                                      style={{
                                        fontSize: "13px",
                                        color: "var(--color-text-secondary)",
                                        margin: "0 0 8px 0",
                                        lineHeight: 1.4,
                                      }}
                                    >
                                      {notification.message}
                                    </p>
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: "12px",
                                          color: "var(--color-text-muted)",
                                        }}
                                      >
                                        {formatTimestamp(
                                          notification.timestamp
                                        )}
                                      </span>
                                      {notification.daysUntilExpiry !==
                                        undefined && (
                                        <span
                                          style={{
                                            fontSize: "11px",
                                            padding: "2px 6px",
                                            backgroundColor:
                                              notification.daysUntilExpiry <= 7
                                                ? "#fef2f2"
                                                : "#fffbeb",
                                            color:
                                              notification.daysUntilExpiry <= 7
                                                ? "#dc2626"
                                                : "#92400e",
                                            borderRadius: "4px",
                                            fontWeight: "500",
                                          }}
                                        >
                                          {notification.daysUntilExpiry}d left
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Action button */}
                              <div
                                style={{
                                  padding: "8px 16px",
                                  borderTop:
                                    "1px solid var(--color-border-light)",
                                  backgroundColor: "#f9fafb",
                                }}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNotificationClick(notification);
                                  }}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "6px 12px",
                                    fontSize: "12px",
                                    fontWeight: "500",
                                    color: action.color,
                                    backgroundColor: "transparent",
                                    border: `1px solid ${action.color}`,
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    width: "100%",
                                    justifyContent: "center",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.backgroundColor =
                                      action.color;
                                    e.target.style.color = "white";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.backgroundColor =
                                      "transparent";
                                    e.target.style.color = action.color;
                                  }}
                                >
                                  <action.icon size={12} />
                                  {action.text}
                                </button>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>

                  {/* Notification Footer */}
                  {notifications.length > 0 && (
                    <div
                      className="p-3 border-t text-center"
                      style={{ borderColor: "var(--color-border-light)" }}
                    >
                      <button
                        style={{
                          fontSize: "14px",
                          color: "var(--color-primary-600)",
                          backgroundColor: "transparent",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: "500",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.textDecoration = "underline";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.textDecoration = "none";
                        }}
                      >
                        View all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              className="p-2.5 rounded-xl transition-all duration-200 hover:shadow-sm"
              style={{
                color: "var(--color-text-secondary)",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "var(--color-bg-main)";
                e.target.style.color = "var(--color-text-primary)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "var(--color-text-secondary)";
              }}
            >
              <FiUser className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
