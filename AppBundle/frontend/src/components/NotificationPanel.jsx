import React from "react";
import {
  FiBell,
  FiX,
  FiCheck,
  FiCheckCircle,
  FiTrash2,
  FiClock,
  FiAlertTriangle,
  FiInfo,
  FiXCircle,
} from "react-icons/fi";

const NotificationPanel = ({
  notifications = [],
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
}) => {
  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "error":
        return <FiXCircle style={{ color: "#dc2626" }} />;
      case "warning":
        return <FiAlertTriangle style={{ color: "#f59e0b" }} />;
      case "success":
        return <FiCheckCircle style={{ color: "#10b981" }} />;
      case "info":
      default:
        return <FiInfo style={{ color: "#3b82f6" }} />;
    }
  };

  // Get notification background color based on type
  const getNotificationBg = (type, isRead) => {
    const opacity = isRead ? "0.5" : "1";
    switch (type) {
      case "error":
        return `rgba(254, 242, 242, ${opacity})`;
      case "warning":
        return `rgba(255, 251, 235, ${opacity})`;
      case "success":
        return `rgba(240, 253, 244, ${opacity})`;
      case "info":
      default:
        return `rgba(239, 246, 255, ${opacity})`;
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "60px",
        right: "20px",
        width: "400px",
        maxHeight: "600px",
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        border: "1px solid #e5e7eb",
        zIndex: 1000,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#f9fafb",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FiBell size={20} style={{ color: "#6b7280" }} />
          <h3
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: "600",
              color: "#1f2937",
            }}
          >
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span
              style={{
                backgroundColor: "#dc2626",
                color: "white",
                fontSize: "12px",
                fontWeight: "600",
                padding: "2px 8px",
                borderRadius: "12px",
                minWidth: "20px",
                textAlign: "center",
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "6px",
                fontSize: "12px",
                color: "#3b82f6",
                fontWeight: "500",
              }}
              title="Mark all as read"
            >
              <FiCheck size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "6px",
              color: "#6b7280",
            }}
          >
            <FiX size={18} />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div
        style={{
          maxHeight: "500px",
          overflowY: "auto",
        }}
      >
        {notifications.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            <FiBell
              size={48}
              style={{ color: "#d1d5db", marginBottom: "16px" }}
            />
            <p style={{ margin: 0, fontSize: "14px" }}>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #f3f4f6",
                backgroundColor: getNotificationBg(
                  notification.type,
                  notification.is_read
                ),
                opacity: notification.is_read ? 0.7 : 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", gap: "12px", flex: 1 }}>
                  <div style={{ marginTop: "2px" }}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "4px",
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          fontWeight: "600",
                          color: notification.is_read ? "#6b7280" : "#1f2937",
                        }}
                      >
                        {notification.title}
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <FiClock size={12} style={{ color: "#9ca3af" }} />
                        <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                          {formatTimeAgo(notification.created_at)}
                        </span>
                      </div>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        color: notification.is_read ? "#9ca3af" : "#4b5563",
                        lineHeight: "1.4",
                      }}
                    >
                      {notification.message}
                    </p>
                    {notification.category && (
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: "8px",
                          padding: "2px 8px",
                          backgroundColor: "#f3f4f6",
                          color: "#6b7280",
                          fontSize: "11px",
                          borderRadius: "12px",
                          textTransform: "capitalize",
                        }}
                      >
                        {notification.category}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  {!notification.is_read && (
                    <button
                      onClick={() => onMarkAsRead(notification.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px",
                        borderRadius: "4px",
                        color: "#10b981",
                      }}
                      title="Mark as read"
                    >
                      <FiCheck size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(notification.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "4px",
                      color: "#dc2626",
                    }}
                    title="Delete notification"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: "12px", color: "#6b7280" }}>
            {notifications.length} total • {unreadCount} unread
          </span>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
