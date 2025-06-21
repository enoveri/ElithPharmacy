import React, { useState, useEffect } from "react";
import { FiBell, FiUser, FiLogOut, FiSettings } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  cleanupOldNotifications,
} from "../../lib/db/index.js";
import { checkAutoNotifications } from "../../utils/notifications.js";
import NotificationPanel from "../NotificationPanel.jsx";

const Header = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Load notifications on component mount
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      // Check for auto notifications periodically
      checkAutoNotifications();
      const interval = setInterval(checkAutoNotifications, 5 * 60 * 1000); // Every 5 minutes
      return () => clearInterval(interval);
    }
  }, [user?.id]);

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

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
      setNotifications([]);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleLogout = async () => {
    try {
      await logout();
      setShowProfileMenu(false);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">{/* Logo and branding can go here */}</div>
          <div className="hidden sm:flex sm:items-center">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FiBell className="h-6 w-6" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center h-3 w-3 rounded-full bg-red-600 text-white text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                id="user-menu-button"
                aria-expanded={showProfileMenu}
                aria-haspopup="true"
              >
                <span className="sr-only">Open user menu</span>
                <FiUser className="h-8 w-8 text-gray-500" aria-hidden="true" />
              </button>

              {showProfileMenu && (
                <div
                  className="absolute right-0 z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                  tabIndex="-1"
                >
                  <div className="py-1" role="none">
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Your Profile
                    </a>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Settings
                    </a>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showNotifications && (
        <NotificationPanel
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onDelete={handleDeleteNotification}
          onClose={() => setShowNotifications(false)}
        />
      )}
    </header>
  );
};

export default Header;
