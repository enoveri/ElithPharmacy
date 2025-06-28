import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBell,
  FiAlertTriangle,
  FiInfo,
  FiCheckCircle,
  FiX,
  FiCheck,
  FiRefreshCw,
  FiFilter,
  FiSearch,
  FiChevronLeft,
} from "react-icons/fi";
import { useNotificationsStore } from "../store";

const Notifications = () => {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingNotifications, setDeletingNotifications] = useState(new Set());

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
    fetchNotifications();
    checkAutoNotifications();
  }, [fetchNotifications, checkAutoNotifications]);

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

  // Filter notifications based on type and search term
  const filteredNotifications = notifications.filter((notification) => {
    const matchesFilter =
      filterType === "all" ||
      (filterType === "unread" && !notification.is_read) ||
      (filterType === "read" && notification.is_read) ||
      notification.type === filterType;

    const matchesSearch =
      searchTerm === "" ||
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleNotificationClick = async (notification) => {
    // Mark as read first
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate to action URL if available
    if (notification.action_url) {
      // Fix route mismatch issues
      let targetUrl = notification.action_url;

      // Fix inventory URLs: /inventory/4 -> /inventory/view/4
      if (targetUrl.match(/^\/inventory\/\d+$/)) {
        const id = targetUrl.split("/")[2];
        targetUrl = `/inventory/view/${id}`;
      }

      // Fix sales URLs: /sales/view/4 -> /sales/4
      if (targetUrl.startsWith("/sales/view/")) {
        targetUrl = targetUrl.replace("/sales/view/", "/sales/");
      }

      navigate(targetUrl);
    }
  };

  const handleDeleteNotification = async (notificationId, event) => {
    event.stopPropagation();

    // Add to deleting set for animation
    setDeletingNotifications((prev) => new Set([...prev, notificationId]));

    // Wait for animation to complete before actually deleting
    setTimeout(async () => {
      try {
        await deleteNotification(notificationId);
        setDeletingNotifications((prev) => {
          const newSet = new Set(prev);
          newSet.delete(notificationId);
          return newSet;
        });
      } catch (error) {
        setDeletingNotifications((prev) => {
          const newSet = new Set(prev);
          newSet.delete(notificationId);
          return newSet;
        });
      }
    }, 300);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleRefresh = async () => {
    try {
      await fetchNotifications();
      await checkAutoNotifications();
    } catch (error) {
      console.error("Error refreshing notifications:", error);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => navigate(-1)}
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
            <FiChevronLeft size={20} color="#374151" />{" "}
          </button>
          <span
            style={{
              backgroundColor: unreadCount > 0 ? "#ef4444" : "#6b7280",
              color: "white",
              padding: "4px 8px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            {unreadCount} unread
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={handleRefresh}
            style={{
              padding: "8px 16px",
              backgroundColor: "#f3f4f6",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              color: "#374151",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#e5e7eb";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#f3f4f6";
            }}
          >
            <FiRefreshCw size={16} />
            Refresh
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              style={{
                padding: "8px 16px",
                backgroundColor: "#3b82f6",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                color: "white",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#2563eb";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#3b82f6";
              }}
            >
              <FiCheck size={16} />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
          <FiSearch
            size={16}
            color="#6b7280"
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#3b82f6";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#d1d5db";
            }}
          />
        </div>

        {/* Filter Buttons */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <FiFilter size={16} color="#6b7280" />
          {[
            { key: "all", label: "All" },
            { key: "unread", label: "Unread" },
            { key: "read", label: "Read" },
            { key: "success", label: "Success" },
            { key: "warning", label: "Warning" },
            { key: "error", label: "Error" },
            { key: "info", label: "Info" },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setFilterType(filter.key)}
              style={{
                padding: "6px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                backgroundColor:
                  filterType === filter.key ? "#3b82f6" : "white",
                color: filterType === filter.key ? "white" : "#374151",
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        {filteredNotifications.length === 0 ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            <FiBell size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>
              {searchTerm || filterType !== "all"
                ? "No matching notifications"
                : "No notifications"}
            </h3>
            <p style={{ margin: 0, fontSize: "14px" }}>
              {searchTerm || filterType !== "all"
                ? "Try adjusting your search or filter criteria"
                : "You're all caught up!"}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification, index) => {
            const NotificationIcon = getNotificationIcon(notification.type);
            const iconColor =
              notification.type === "success"
                ? "#10b981"
                : notification.type === "warning"
                  ? "#f59e0b"
                  : notification.type === "error"
                    ? "#ef4444"
                    : "#6b7280";

            const isDeleting = deletingNotifications.has(notification.id);

            return (
              <div
                key={notification.id}
                onClick={() =>
                  !isDeleting && handleNotificationClick(notification)
                }
                style={{
                  padding: "16px 24px",
                  borderBottom:
                    index < filteredNotifications.length - 1
                      ? "1px solid #f3f4f6"
                      : "none",
                  cursor: isDeleting ? "default" : "pointer",
                  backgroundColor: notification.is_read
                    ? "transparent"
                    : "#f8fafc",
                  transition: "all 0.3s ease",
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-start",
                  transform: isDeleting ? "translateX(-100%)" : "translateX(0)",
                  opacity: isDeleting ? 0 : 1,
                  maxHeight: isDeleting ? "0" : "200px",
                  overflow: "hidden",
                  paddingTop: isDeleting ? "0" : "16px",
                  paddingBottom: isDeleting ? "0" : "16px",
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.backgroundColor = notification.is_read
                      ? "transparent"
                      : "#f8fafc";
                  }
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: `${iconColor}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <NotificationIcon size={20} color={iconColor} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: notification.is_read ? "normal" : "600",
                      color: "#1f2937",
                      marginBottom: "6px",
                    }}
                  >
                    {notification.title}
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      lineHeight: "1.5",
                      marginBottom: "8px",
                    }}
                  >
                    {notification.message}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#9ca3af",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>
                      {new Date(notification.created_at).toLocaleString()}
                    </span>
                    {!notification.is_read && (
                      <span
                        style={{
                          display: "inline-block",
                          width: "6px",
                          height: "6px",
                          backgroundColor: "#3b82f6",
                          borderRadius: "50%",
                        }}
                      />
                    )}
                    <span
                      style={{
                        backgroundColor: `${iconColor}20`,
                        color: iconColor,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: "500",
                        textTransform: "uppercase",
                      }}
                    >
                      {notification.type}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDeleteNotification(notification.id, e)}
                  disabled={isDeleting}
                  style={{
                    padding: "8px",
                    border: "none",
                    background: "none",
                    cursor: isDeleting ? "default" : "pointer",
                    borderRadius: "4px",
                    color: "#9ca3af",
                    flexShrink: 0,
                    opacity: isDeleting ? 0.3 : 0.6,
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: isDeleting ? "none" : "auto",
                  }}
                  onMouseEnter={(e) => {
                    if (!isDeleting) {
                      e.target.style.opacity = "1";
                      e.target.style.backgroundColor = "#fee2e2";
                      e.target.style.color = "#dc2626";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDeleting) {
                      e.target.style.opacity = "0.6";
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = "#9ca3af";
                    }
                  }}
                  title={isDeleting ? "Deleting..." : "Delete notification"}
                >
                  <FiX size={18} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;
