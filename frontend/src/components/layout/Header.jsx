import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiSettings, FiBell, FiMenu, FiUser, FiX, FiAlertTriangle, FiInfo, FiCheckCircle, FiPackage, FiClock, FiExternalLink } from "react-icons/fi";
import { mockData, mockHelpers } from "../../lib/mockData";

const Header = () => {
  const [time, setTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Generate notifications based on mock data
  useEffect(() => {
    const generateNotifications = () => {
      const lowStockProducts = mockHelpers.getLowStockProducts();
      const recentSales = mockHelpers.getRecentSales(3);
      const expiringProducts = mockHelpers.getExpiringProducts(30);
      const expiredProducts = mockHelpers.getExpiredProducts();
      
      const stockNotifications = lowStockProducts.map(product => ({
        id: `stock-${product.id}`,
        type: product.quantity === 0 ? 'critical' : 'warning',
        title: product.quantity === 0 ? 'Out of Stock' : 'Low Stock Alert',
        message: `${product.name} has ${product.quantity === 0 ? 'no stock remaining' : `only ${product.quantity} units left`}`,
        timestamp: new Date(Date.now() - Math.random() * 3600000),
        read: false,
        icon: FiPackage
      }));

      const salesNotifications = recentSales.map(sale => ({
        id: `sale-${sale.id}`,
        type: 'info',
        title: 'New Sale Completed',
        message: `Transaction ${sale.transactionNumber} - ₦${sale.totalAmount.toFixed(2)}`,
        timestamp: new Date(sale.date),
        read: Math.random() > 0.5,
        icon: FiCheckCircle
      }));

      // Add expiry notifications
      const expiryNotifications = expiringProducts.map(product => {
        const daysUntilExpiry = Math.ceil((new Date(product.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return {
          id: `expiry-${product.id}`,
          type: daysUntilExpiry <= 7 ? 'critical' : 'warning',
          title: daysUntilExpiry <= 7 ? 'Product Expiring Soon' : 'Product Expiry Warning',
          message: `${product.name} expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'} (${new Date(product.expiryDate).toLocaleDateString()})`,
          timestamp: new Date(Date.now() - Math.random() * 1800000), // Random time within last 30 minutes
          read: false,
          icon: FiClock,
          expiryDate: product.expiryDate,
          daysUntilExpiry: daysUntilExpiry
        };
      });

      // Add expired product notifications
      const expiredNotifications = expiredProducts.map(product => ({
        id: `expired-${product.id}`,
        type: 'critical',
        title: 'Product Expired',
        message: `${product.name} expired on ${new Date(product.expiryDate).toLocaleDateString()} - Remove from inventory`,
        timestamp: new Date(product.expiryDate),
        read: false,
        icon: FiAlertTriangle,
        expiryDate: product.expiryDate
      }));

      // Add system notifications
      const systemNotifications = [
        {
          id: 'system-1',
          type: 'info',
          title: 'System Update',
          message: 'Inventory management system updated successfully',
          timestamp: new Date(Date.now() - 7200000), // 2 hours ago
          read: false,
          icon: FiInfo
        },
        {
          id: 'system-2',
          type: 'warning',
          title: 'Expiry Check Complete',
          message: `${expiringProducts.length + expiredProducts.length} products require attention due to expiry dates`,
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          read: false,
          icon: FiClock
        }
      ];

      const allNotifications = [...stockNotifications, ...salesNotifications, ...expiryNotifications, ...expiredNotifications, ...systemNotifications]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 15); // Increased limit to accommodate expiry notifications

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.filter(n => !n.read).length);
    };

    generateNotifications();
    
    // Update notifications every 30 seconds
    const notificationTimer = setInterval(generateNotifications, 30000);
    
    return () => clearInterval(notificationTimer);
  }, []);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    setShowNotifications(false);
  };

  const handleNotificationClick = (notification) => {
    // Mark as read first
    markAsRead(notification.id);
    
    // Route to appropriate page based on notification type
    switch (true) {
      case notification.id.startsWith('stock-'):
      case notification.id.startsWith('expiry-'):
      case notification.id.startsWith('expired-'):
        // Navigate to inventory page with filter
        navigate('/inventory', { 
          state: { 
            filter: notification.id.startsWith('stock-') ? 'low-stock' : 'expiring',
            productId: notification.productId 
          }
        });
        break;
        
      case notification.id.startsWith('sale-'):
        // Navigate to sales history
        navigate('/sales', { 
          state: { 
            saleId: notification.saleId 
          }
        });
        break;
        
      case notification.id.startsWith('system-'):
        // Navigate to settings for system notifications
        navigate('/settings');
        break;
        
      default:
        // For unknown notification types, stay on current page
        break;
    }
    
    // Close notification panel
    setShowNotifications(false);
  };

  const getNotificationAction = (notification) => {
    switch (true) {
      case notification.id.startsWith('stock-'):
        return {
          text: 'Restock Product',
          icon: FiPackage,
          color: '#f59e0b'
        };
      case notification.id.startsWith('expiry-'):
        return {
          text: 'Check Inventory',
          icon: FiClock,
          color: '#f59e0b'
        };
      case notification.id.startsWith('expired-'):
        return {
          text: 'Remove from Stock',
          icon: FiAlertTriangle,
          color: '#ef4444'
        };
      case notification.id.startsWith('sale-'):
        return {
          text: 'View Transaction',
          icon: FiExternalLink,
          color: '#3b82f6'
        };
      case notification.id.startsWith('system-'):
        return {
          text: 'View Settings',
          icon: FiSettings,
          color: '#6b7280'
        };
      default:
        return {
          text: 'View Details',
          icon: FiExternalLink,
          color: '#6b7280'
        };
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'critical':
        return '#ef4444'; // red
      case 'warning':
        return '#f59e0b'; // amber
      case 'info':
        return '#3b82f6'; // blue
      case 'success':
        return '#10b981'; // green
      default:
        return '#6b7280'; // gray
    }
  };

  const getNotificationPriority = (notification) => {
    if (notification.type === 'critical') {
      if (notification.id.startsWith('expired-')) return 1; // Highest priority
      if (notification.id.startsWith('expiry-') && notification.daysUntilExpiry <= 3) return 2;
      if (notification.id.startsWith('stock-')) return 3;
    }
    if (notification.type === 'warning') {
      if (notification.id.startsWith('expiry-')) return 4;
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

    if (minutes < 1) return 'Just now';
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
                  backgroundColor: showNotifications ? "var(--color-bg-main)" : "transparent",
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
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div
                  className="absolute right-0 top-full mt-2 w-96 rounded-xl shadow-xl border backdrop-blur-sm z-50"
                  style={{
                    backgroundColor: 'white',
                    borderColor: 'var(--color-border-light)',
                    maxHeight: '70vh',
                    overflow: 'hidden'
                  }}
                >
                  {/* Notification Header */}
                  <div
                    className="p-4 border-b flex justify-between items-center"
                    style={{ borderColor: 'var(--color-border-light)' }}
                  >
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: 'var(--color-text-primary)'
                    }}>
                      Notifications
                    </h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          style={{
                            fontSize: '12px',
                            color: 'var(--color-primary-600)',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'var(--color-primary-50)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                          }}
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={clearAllNotifications}
                        style={{
                          fontSize: '12px',
                          color: 'var(--color-text-muted)',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Notification List */}
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{
                        padding: '40px 20px',
                        textAlign: 'center',
                        color: 'var(--color-text-muted)'
                      }}>
                        <FiBell size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                        <p>No notifications</p>
                      </div>
                    ) : (
                      notifications
                        .sort((a, b) => getNotificationPriority(a) - getNotificationPriority(b))
                        .map((notification) => {
                          const action = getNotificationAction(notification);
                          return (
                            <div
                              key={notification.id}
                              style={{
                                borderBottom: '1px solid var(--color-border-light)',
                                backgroundColor: notification.read ? 'transparent' : 'var(--color-primary-25)',
                                transition: 'all 0.2s ease',
                                borderLeft: notification.type === 'critical' ? '4px solid #ef4444' : 
                                          notification.type === 'warning' ? '4px solid #f59e0b' : 'none'
                              }}
                            >
                              {/* Main notification content */}
                              <div
                                onClick={() => handleNotificationClick(notification)}
                                style={{
                                  padding: '12px 16px',
                                  cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = 'var(--color-bg-main)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = 'transparent';
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                  <div
                                    style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '50%',
                                      backgroundColor: `${getNotificationColor(notification.type)}20`,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0
                                    }}
                                  >
                                    <notification.icon 
                                      size={16} 
                                      color={getNotificationColor(notification.type)} 
                                    />
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'flex-start',
                                      marginBottom: '4px'
                                    }}>
                                      <h4 style={{
                                        fontSize: '14px',
                                        fontWeight: notification.read ? '500' : '600',
                                        color: 'var(--color-text-primary)',
                                        margin: 0
                                      }}>
                                        {notification.title}
                                        {notification.type === 'critical' && (
                                          <span style={{
                                            marginLeft: '6px',
                                            fontSize: '10px',
                                            padding: '2px 6px',
                                            backgroundColor: '#ef4444',
                                            color: 'white',
                                            borderRadius: '8px',
                                            fontWeight: 'bold'
                                          }}>
                                            URGENT
                                          </span>
                                        )}
                                      </h4>
                                      {!notification.read && (
                                        <div
                                          style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            backgroundColor: 'var(--color-primary-600)',
                                            flexShrink: 0,
                                            marginLeft: '8px'
                                          }}
                                        />
                                      )}
                                    </div>
                                    <p style={{
                                      fontSize: '13px',
                                      color: 'var(--color-text-secondary)',
                                      margin: '0 0 8px 0',
                                      lineHeight: 1.4
                                    }}>
                                      {notification.message}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{
                                        fontSize: '12px',
                                        color: 'var(--color-text-muted)'
                                      }}>
                                        {formatTimestamp(notification.timestamp)}
                                      </span>
                                      {notification.daysUntilExpiry !== undefined && (
                                        <span style={{
                                          fontSize: '11px',
                                          padding: '2px 6px',
                                          backgroundColor: notification.daysUntilExpiry <= 7 ? '#fef2f2' : '#fffbeb',
                                          color: notification.daysUntilExpiry <= 7 ? '#dc2626' : '#92400e',
                                          borderRadius: '4px',
                                          fontWeight: '500'
                                        }}>
                                          {notification.daysUntilExpiry}d left
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Action button */}
                              <div style={{
                                padding: '8px 16px',
                                borderTop: '1px solid var(--color-border-light)',
                                backgroundColor: '#f9fafb'
                              }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNotificationClick(notification);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    color: action.color,
                                    backgroundColor: 'transparent',
                                    border: `1px solid ${action.color}`,
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    width: '100%',
                                    justifyContent: 'center'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = action.color;
                                    e.target.style.color = 'white';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
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
                      style={{ borderColor: 'var(--color-border-light)' }}
                    >
                      <button
                        style={{
                          fontSize: '14px',
                          color: 'var(--color-primary-600)',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.textDecoration = 'underline';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.textDecoration = 'none';
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
