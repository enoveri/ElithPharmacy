import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSettings,
  FiBell,
  FiMenu,
  FiUser,
  FiX,
  FiAlertTriangle,
  FiInfo,
  FiCheckCircle,
  FiCheck,
} from "react-icons/fi";
import { useNotificationsStore } from "../../store";
import { useAuth } from "../../contexts/AuthContext";

const Header = ({
  onToggleMobileMenu,
  isMobile = false,
  mobileMenuOpen = false,
}) => {
  const { user, logout } = useAuth();
  const [time, setTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [deletingNotifications, setDeletingNotifications] = useState(new Set());
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
      setShowNotifications(false);
    }
  };
  const handleDeleteNotification = async (notificationId, event) => {
    // Prevent the notification click event from firing
    event.stopPropagation();

    // Add to deleting set for animation
    setDeletingNotifications((prev) => new Set([...prev, notificationId]));

    // Wait for animation to complete before actually deleting
    setTimeout(async () => {
      try {
        await deleteNotification(notificationId);
        // Remove from deleting set after successful deletion
        setDeletingNotifications((prev) => {
          const newSet = new Set(prev);
          newSet.delete(notificationId);
          return newSet;
        });
      } catch (error) {
        console.error("Error deleting notification:", error);
        // Remove from deleting set if error occurs
        setDeletingNotifications((prev) => {
          const newSet = new Set(prev);
          newSet.delete(notificationId);
          return newSet;
        });
      }
    }, 300); // Animation duration
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
        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={onToggleMobileMenu}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 md:hidden"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#374151",
            }}
          >
            {mobileMenuOpen ? (
              <FiX className="w-6 h-6" />
            ) : (
              <FiMenu className="w-6 h-6" />
            )}
          </button>
        )}

        <h1
          className={`${isMobile ? "text-lg" : "text-xl"} font-semibold text-gray-800 m-0`}
          style={{
            fontSize: isMobile ? "18px" : "20px",
            fontWeight: "600",
            color: "#1f2937",
            margin: 0,
          }}
        >
          Elith Pharmacy
        </h1>
      </div>{" "}
      {/* Right section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? "8px" : "16px",
        }}
      >
        {/* Time display - hide on very small screens */}
        {!isMobile && (
          <div
            style={{
              fontSize: "14px",
              color: "#6b7280",
              fontWeight: "500",
            }}
            className="hidden sm:block"
          >
            {time.toLocaleTimeString("en-US", {
              hour12: true,
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}{" "}
        {/* Notifications */}
        <div style={{ position: "relative" }} ref={notificationRef}>
          <button
            onClick={toggleNotifications}
            style={{
              position: "relative",
              padding: isMobile ? "6px" : "8px",
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
            <FiBell size={isMobile ? 18 : 20} color="#374151" />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  right: "2px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  borderRadius: "50%",
                  width: isMobile ? "16px" : "18px",
                  height: isMobile ? "16px" : "18px",
                  fontSize: isMobile ? "9px" : "10px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: isMobile ? "16px" : "18px",
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>{" "}
          {/* Notifications Panel */}
          {showNotifications && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: "0",
                width: isMobile ? "90vw" : "360px",
                maxWidth: isMobile ? "350px" : "360px",
                maxHeight: isMobile ? "70vh" : "400px",
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
                )}{" "}
              </div>

              {/* Show All Notifications Button - only show when there are notifications */}
              {notifications.length > 0 && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <button
                    onClick={() => {
                      navigate("/notifications");
                      setShowNotifications(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 16px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      color: "#374151",
                      fontWeight: "500",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#3b82f6";
                      e.target.style.color = "white";
                      e.target.style.borderColor = "#3b82f6";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "#f8fafc";
                      e.target.style.color = "#374151";
                      e.target.style.borderColor = "#e5e7eb";
                    }}
                  >
                    <FiBell size={16} />
                    View All Notifications
                  </button>
                </div>
              )}

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
                    <div style={{ fontSize: "14px" }}>No notifications</div>
                  </div>
                ) : (
                  // Show only the first 5 notifications in the dropdown
                  notifications.slice(0, 5).map((notification) => {
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

                    const isDeleting = deletingNotifications.has(
                      notification.id
                    );

                    return (
                      <div
                        key={notification.id}
                        onClick={() =>
                          !isDeleting && handleNotificationClick(notification)
                        }
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid #f3f4f6",
                          cursor: isDeleting ? "default" : "pointer",
                          backgroundColor: notification.is_read
                            ? "transparent"
                            : "#f8fafc",
                          transition: "all 0.3s ease",
                          display: "flex",
                          gap: "12px",
                          alignItems: "flex-start",
                          transform: isDeleting
                            ? "translateX(-100%)"
                            : "translateX(0)",
                          opacity: isDeleting ? 0 : 1,
                          maxHeight: isDeleting ? "0" : "200px",
                          overflow: "hidden",
                          paddingTop: isDeleting ? "0" : "12px",
                          paddingBottom: isDeleting ? "0" : "12px",
                          marginBottom: isDeleting ? "0" : "0",
                        }}
                        onMouseEnter={(e) => {
                          if (!isDeleting) {
                            e.currentTarget.style.backgroundColor = "#f3f4f6";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isDeleting) {
                            e.currentTarget.style.backgroundColor =
                              notification.is_read ? "transparent" : "#f8fafc";
                          }
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
                        </div>{" "}
                        <button
                          onClick={(e) =>
                            handleDeleteNotification(notification.id, e)
                          }
                          disabled={isDeleting}
                          style={{
                            padding: "6px",
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
                          title={
                            isDeleting ? "Deleting..." : "Delete notification"
                          }
                        >
                          <FiX size={16} />
                        </button>{" "}
                      </div>
                    );
                  })
                )}
                {/* View All Button for more than 5 notifications */}
                {notifications.length > 5 && (
                  <div
                    style={{
                      padding: "12px 16px",
                      borderTop: "1px solid #f3f4f6",
                      backgroundColor: "#f9fafb",
                    }}
                  >
                    <button
                      onClick={() => {
                        navigate("/notifications");
                        setShowNotifications(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 16px",
                        backgroundColor: "#3b82f6",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px",
                        color: "white",
                        fontWeight: "500",
                        transition: "background-color 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#2563eb";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#3b82f6";
                      }}
                    >
                      <FiBell size={16} />
                      View All {notifications.length} Notifications
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>{" "}
        {/* Settings */} {/* Settings Button - hide on small mobile screens */}
        <button
          className={isMobile ? "hidden sm:flex" : ""}
          onClick={() => navigate("/settings")}
          style={{
            padding: isMobile ? "6px" : "8px",
            border: "none",
            background: "none",
            cursor: "pointer",
            borderRadius: "50%",
            display: isMobile ? "none" : "flex",
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
          <FiSettings size={isMobile ? 18 : 20} color="#374151" />
        </button>
        {/* User Profile */}
        <button
          style={{
            padding: isMobile ? "6px" : "8px",
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
          <FiUser size={isMobile ? 18 : 20} color="#374151" />
        </button>
      </div>
    </header>
  );
};

export default Header;
