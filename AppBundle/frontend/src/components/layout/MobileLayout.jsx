import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome,
  FiShoppingCart,
  FiPackage,
  FiUsers,
  FiBarChart,
  FiSettings,
  FiBell,
  FiUser,
  FiX,
  FiMenu,
  FiShield,
  FiRotateCcw,
  FiLogOut,
} from "react-icons/fi";
import Header from "./Header";
import { useAuth } from "../../contexts/AuthContext";

const MobileLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Update active tab based on current route
  useEffect(() => {
    const pathname = location.pathname;
    if (pathname === "/" || pathname === "/dashboard")
      setActiveTab("dashboard");
    else if (pathname.startsWith("/pos")) setActiveTab("pos");
    else if (pathname.startsWith("/inventory")) setActiveTab("inventory");
    else if (pathname.startsWith("/customers")) setActiveTab("customers");
    else if (pathname.startsWith("/reports")) setActiveTab("reports");
    else setActiveTab("more");
  }, [location.pathname]);

  // Get page title and subtitle based on current route
  const getPageInfo = (pathname) => {
    const titleMap = {
      "/": { title: "Dashboard", subtitle: "Welcome to your pharmacy" },
      "/dashboard": {
        title: "Dashboard",
        subtitle: "Welcome to your pharmacy",
      },
      "/pos": { title: "Point of Sale", subtitle: "Process sales quickly" },
      "/inventory": { title: "Inventory", subtitle: "Manage your products" },
      "/inventory/add": { title: "Add Product", subtitle: "Add new product" },
      "/customers": {
        title: "Customers",
        subtitle: "Manage customer relationships",
      },
      "/customers/add": { title: "Add Customer", subtitle: "Add new customer" },
      "/reports": { title: "Reports", subtitle: "Business insights" },
      "/settings": { title: "Settings", subtitle: "App preferences" },
      "/purchases": { title: "Purchases", subtitle: "Manage orders" },
      "/sales": { title: "Sales", subtitle: "Transaction history" },
      "/refunds": { title: "Refunds", subtitle: "Process refunds" },
      "/notifications": { title: "Notifications", subtitle: "System alerts" },
      "/admin": { title: "Admin Panel", subtitle: "System administration" },
    };

    // Handle dynamic routes
    if (pathname.includes("/inventory/edit/"))
      return { title: "Edit Product", subtitle: "Update product details" };
    if (pathname.includes("/inventory/view/"))
      return { title: "Product Details", subtitle: "View product information" };
    if (pathname.includes("/customers/edit/"))
      return { title: "Edit Customer", subtitle: "Update customer details" };
    if (pathname.includes("/customers/view/"))
      return {
        title: "Customer Details",
        subtitle: "View customer information",
      };

    return titleMap[pathname] || { title: "Elith Pharmacy", subtitle: null };
  };

  const pageInfo = getPageInfo(location.pathname);

  const bottomNavItems = [
    { id: "dashboard", label: "Home", icon: FiHome, path: "/" },
    { id: "pos", label: "POS", icon: FiShoppingCart, path: "/pos" },
    { id: "inventory", label: "Products", icon: FiPackage, path: "/inventory" },
    { id: "customers", label: "Customers", icon: FiUsers, path: "/customers" },
    { id: "reports", label: "Reports", icon: FiBarChart, path: "/reports" },
  ];

  const handleTabPress = (item) => {
    setActiveTab(item.id);
    navigate(item.path);
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 },
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.3,
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setShowMobileMenu(false);
      navigate('/login');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="mobile-layout">
      {/* Mobile Header */}
      <Header
        isMobile={true}
        title={pageInfo.title}
        subtitle={pageInfo.subtitle}
        onToggleMobileMenu={() => setShowMobileMenu(!showMobileMenu)}
        mobileMenuOpen={showMobileMenu}
      />

      {/* Mobile Side Menu Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            {/* Removed overlay */}
            {/* Enhanced Mobile Side Menu using CSS classes */}
            <motion.div
              initial={{ x: -350 }}
              animate={{ x: 0 }}
              exit={{ x: -350 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="mobile-sidebar"
            >
              <div className="mobile-sidebar-content">
                {/* Header Section */}
                <div className="mobile-sidebar-header">
                  <div className="mobile-sidebar-logo">
                    <div className="mobile-sidebar-brand">
                      <div className="mobile-sidebar-icon">E</div>
                      <div>
                        <h2 className="mobile-sidebar-title">Elith Pharmacy</h2>
                        <p className="mobile-sidebar-subtitle">
                          Management System
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowMobileMenu(false)}
                      className="mobile-sidebar-close"
                    >
                      <FiX size={24} />
                    </motion.button>
                  </div>
                </div>

                {/* Navigation Items */}
                <nav className="mobile-sidebar-nav" style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <div className="mobile-nav-grid mobile-nav-grid-expanded">
                    {[
                      {
                        icon: FiHome,
                        label: "Dashboard",
                        path: "/",
                      },
                      {
                        icon: FiShoppingCart,
                        label: "Point of Sale",
                        path: "/pos",
                      },
                      {
                        icon: FiPackage,
                        label: "Inventory",
                        path: "/inventory",
                      },
                      {
                        icon: FiUsers,
                        label: "Customers",
                        path: "/customers",
                      },
                      {
                        icon: FiShoppingCart,
                        label: "Purchases",
                        path: "/purchases",
                      },
                      {
                        icon: FiBarChart,
                        label: "Sales History",
                        path: "/sales",
                      },
                      {
                        icon: FiRotateCcw,
                        label: "Refunds",
                        path: "/refunds",
                      },
                      {
                        icon: FiBarChart,
                        label: "Reports",
                        path: "/reports",
                      },
                      {
                        icon: FiBell,
                        label: "Notifications",
                        path: "/notifications",
                      },
                      {
                        icon: FiShield,
                        label: "Admin Panel",
                        path: "/admin",
                      },
                      {
                        icon: FiLogOut,
                        label: "Logout",
                        path: "/logout",
                        isLogout: true,
                      },
                      {
                        icon: FiSettings,
                        label: "Settings",
                        path: "/settings",
                      },
                    ].map((item, index) => (
                      <motion.button
                        key={item.path}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        whileHover={{ scale: 1.12 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => {
                          if (item.isLogout) {
                            handleLogout();
                          } else {
                            navigate(item.path);
                            setShowMobileMenu(false);
                          }
                        }}
                        className={`mobile-nav-grid-item ${location.pathname === item.path ? "active" : ""} ${item.isLogout ? "logout" : ""}`}
                      >
                        <div className="mobile-nav-grid-icon">
                          <item.icon size={22} />
                        </div>
                        <div className="mobile-nav-grid-label">{item.label}</div>
                      </motion.button>
                    ))}
                  </div>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="mobile-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="min-h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <div className="mobile-bottom-nav-container">
          {bottomNavItems.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTabPress(item)}
              className={`mobile-nav-item ${
                activeTab === item.id ? "mobile-nav-item-active" : ""
              }`}
            >
              <motion.div
                animate={{
                  scale: activeTab === item.id ? 1.2 : 1,
                  color: activeTab === item.id ? "#3b82f6" : "#6b7280",
                }}
                transition={{ type: "spring", damping: 15, stiffness: 300 }}
              >
                <item.icon size={20} />
              </motion.div>
              <span
                className={`mobile-nav-label ${
                  activeTab === item.id ? "mobile-nav-label-active" : ""
                }`}
              >
                {item.label}
              </span>

              {/* Active indicator */}
              {activeTab === item.id && (
                <motion.div
                  layoutId="activeTab"
                  className="mobile-nav-indicator"
                  transition={{ type: "spring", damping: 15, stiffness: 300 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </nav>

      <style jsx>{`
        .mobile-layout {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #f8fafc;
        }

        .mobile-main {
          flex: 1;
          overflow-y: auto;
          padding-bottom: 80px; /* Space for bottom nav */
          background: #f8fafc;
        }

        .mobile-bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          border-top: 1px solid #e5e7eb;
          z-index: 30;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
        }

        .mobile-bottom-nav-container {
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 8px 16px;
          min-height: 70px;
        }

        .mobile-nav-item {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 8px 12px;
          border: none;
          background: none;
          cursor: pointer;
          border-radius: 12px;
          transition: all 0.2s ease;
          min-width: 60px;
        }

        .mobile-nav-item:hover {
          background: #f3f4f6;
        }

        .mobile-nav-item-active {
          background: #eff6ff;
        }

        .mobile-nav-label {
          font-size: 11px;
          font-weight: 500;
          color: #6b7280;
          transition: color 0.2s ease;
        }

        .mobile-nav-label-active {
          color: #3b82f6;
          font-weight: 600;
        }

        .mobile-nav-indicator {
          position: absolute;
          top: -2px;
          left: 50%;
          transform: translateX(-50%);
          width: 30px;
          height: 3px;
          background: #3b82f6;
          border-radius: 2px;
        }

        /* Hide scrollbar but keep functionality */
        .mobile-main::-webkit-scrollbar {
          display: none;
        }
        .mobile-main {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default MobileLayout;
