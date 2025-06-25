import { useState, useEffect } from "react";
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
} from "react-icons/fi";
import Header from "./Header";

const MobileLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
            />

            {/* Side Menu */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">E</span>
                    </div>
                    <div>
                      <h2 className="font-bold text-lg">Elith Pharmacy</h2>
                      <p className="text-sm text-gray-500">Management System</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    <FiX size={24} />
                  </button>
                </div>

                {/* Menu Items */}
                <nav className="space-y-2">
                  {[
                    { icon: FiHome, label: "Dashboard", path: "/" },
                    {
                      icon: FiShoppingCart,
                      label: "Point of Sale",
                      path: "/pos",
                    },
                    { icon: FiPackage, label: "Inventory", path: "/inventory" },
                    { icon: FiUsers, label: "Customers", path: "/customers" },
                    { icon: FiBarChart, label: "Reports", path: "/reports" },
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
                    { icon: FiSettings, label: "Settings", path: "/settings" },
                  ].map((item) => (
                    <motion.button
                      key={item.path}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        navigate(item.path);
                        setShowMobileMenu(false);
                      }}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                        location.pathname === item.path
                          ? "bg-blue-50 text-blue-600 border border-blue-200"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <item.icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </motion.button>
                  ))}
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
