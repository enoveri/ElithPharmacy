import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

const MainLayout = () => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Function to get page title based on current route
  const getPageTitle = (pathname) => {
    const routes = {
      "/": "Dashboard",
      "/dashboard": "Dashboard",
      "/pos": "Point of Sale",
      "/inventory": "Inventory Management",
      "/inventory/add": "Add Product",
      "/inventory/edit": "Edit Product",
      "/inventory/view": "View Product",
      "/purchases": "Purchase Orders",
      "/purchases/add": "Add Purchase Order",
      "/purchases/edit": "Edit Purchase Order",
      "/purchases/view": "Purchase Details",
      "/sales": "Sales History",
      "/sales/view": "Sale Details",
      "/refunds": "Refunds",
      "/customers": "Customer Management",
      "/customers/add": "Add Customer",
      "/customers/edit": "Edit Customer",
      "/customers/view": "Customer Details",
      "/customers/sales": "Customer Sales",
      "/reports": "Reports & Analytics",
      "/admin": "Admin Panel",
      "/settings": "Settings",
      "/setup": "Database Setup",
      "/notifications": "Notifications",
    };

    // Handle dynamic routes (with IDs)
    if (pathname.includes("/inventory/edit/")) return "Edit Product";
    if (pathname.includes("/inventory/view/")) return "View Product";
    if (pathname.includes("/purchases/")) return "Purchase Details";
    if (pathname.includes("/sales/")) return "Sale Details";
    if (pathname.includes("/customers/edit/")) return "Edit Customer";
    if (pathname.includes("/customers/view/")) return "Customer Details";
    if (pathname.includes("/customers/") && pathname.includes("/sales"))
      return "Customer Sales";

    return routes[pathname] || "Elith Pharmacy";
  };

  // Get current page title and subtitle
  const getPageInfo = (pathname) => {
    const titleMap = {
      "/": {
        title: "Dashboard",
        subtitle: "Welcome to your pharmacy dashboard",
      },
      "/dashboard": {
        title: "Dashboard",
        subtitle: "Welcome to your pharmacy dashboard",
      },
      "/pos": {
        title: "Point of Sale",
        subtitle: "Process sales and manage transactions",
      },
      "/inventory": {
        title: "Inventory Management",
        subtitle: "Manage your product inventory and stock levels",
      },
      "/inventory/add": {
        title: "Add Product",
        subtitle: "Add new product to inventory",
      },
      "/purchases": {
        title: "Purchase Orders",
        subtitle: "Manage inventory purchases and supplier orders",
      },
      "/sales": {
        title: "Sales History",
        subtitle: "View and manage sales transactions",
      },
      "/refunds": {
        title: "Refunds",
        subtitle: "Process and manage refund requests",
      },
      "/customers": {
        title: "Customer Management",
        subtitle: "Manage customer information and relationships",
      },
      "/customers/add": {
        title: "Add Customer",
        subtitle: "Add new customer to the system",
      },
      "/customers/sales": {
        title: "Customer Sales Management",
        subtitle: "Manage customer sales and purchase history",
      },
      "/reports": {
        title: "Reports & Analytics",
        subtitle: "View business insights and analytics",
      },
      "/admin": {
        title: "Admin Panel",
        subtitle: "Manage users and system settings",
      },
      "/settings": {
        title: "Settings",
        subtitle: "Manage your pharmacy settings and preferences",
      },
      "/setup": {
        title: "Database Setup",
        subtitle:
          "Configure your database and ensure all required tables exist",
      },
      "/notifications": {
        title: "Notifications",
        subtitle: "View and manage notifications",
      },
    };

    // Handle dynamic routes
    if (pathname.includes("/inventory/edit/"))
      return { title: "Edit Product", subtitle: "Update product information" };
    if (pathname.includes("/inventory/view/"))
      return {
        title: "Product Details",
        subtitle: "View product information and analytics",
      };
    if (pathname.includes("/purchases/"))
      return {
        title: "Purchase Details",
        subtitle: "View purchase order details",
      };
    if (pathname.includes("/sales/"))
      return { title: "Sale Details", subtitle: "View transaction details" };
    if (pathname.includes("/customers/edit/"))
      return {
        title: "Edit Customer",
        subtitle: "Update customer information",
      };
    if (pathname.includes("/customers/view/"))
      return {
        title: "Customer Details",
        subtitle: "View customer information and history",
      };
    if (pathname.includes("/customers/") && pathname.includes("/sales"))
      return {
        title: "Customer Sales",
        subtitle: "View customer purchase history",
      };

    return titleMap[pathname] || { title: "Elith Pharmacy", subtitle: null };
  };

  const pageInfo = getPageInfo(location.pathname);

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
      setMobileMenuOpen(false);
    }
  }, [isMobile]);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleCloseMobileMenu = () => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
      {/* Mobile Overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={handleCloseMobileMenu}
        ></div>
      )}
      {/* Enhanced Sidebar with mobile responsiveness */}
      <div
        className={`
          ${isMobile ? "fixed" : "relative"} 
          ${isMobile ? "z-50" : "z-10"}
          ${isMobile ? "h-full" : "h-screen"}
          ${isMobile && !mobileMenuOpen ? "-translate-x-full" : "translate-x-0"}
          ${!isMobile && sidebarCollapsed ? "w-16" : "w-64"} 
          transition-all duration-300 ease-in-out flex-shrink-0
          ${isMobile ? "lg:relative lg:translate-x-0" : ""}
        `}
      >
        <Sidebar
          collapsed={!isMobile && sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          isMobile={isMobile}
          mobileMenuOpen={mobileMenuOpen}
          onCloseMobileMenu={handleCloseMobileMenu}
        />
      </div>{" "}
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Enhanced Header with better spacing */}{" "}
        <div className="flex-shrink-0 border-b border-slate-200/80 bg-white/80 backdrop-blur-sm shadow-sm">
          <Header
            onToggleMobileMenu={handleToggleSidebar}
            isMobile={isMobile}
            mobileMenuOpen={mobileMenuOpen}
            title={pageInfo.title}
            subtitle={pageInfo.subtitle}
          />
        </div>
        {/* Enhanced Main Content with better padding and animations */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="min-h-full">
            {/* Content Container with enhanced spacing */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {/* Content wrapper with subtle animations */}
              <div className="animate-fade-in">
                <Outlet />
              </div>
            </div>

            {/* Subtle background pattern */}
            <div className="fixed inset-0 pointer-events-none opacity-5 bg-[radial-gradient(circle_at_1px_1px,_theme(colors.slate.400)_1px,_transparent_0)] bg-[length:20px_20px] -z-10"></div>
          </div>
        </main>
      </div>
      {/* Enhanced scroll indicator */}
      <div
        className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 origin-left transition-transform duration-300 ease-out z-50"
        id="scroll-indicator"
      ></div>
    </div>
  );
};

export default MainLayout;
