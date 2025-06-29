import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

// Desktop components
import Inventory from "../../pages/Inventory";
import Customers from "../../pages/Customers";
import Reports from "../../pages/Reports";
import Settings from "../../pages/Settings";
import SalesHistory from "../../pages/SalesHistory";
import Purchases from "../../pages/Purchases";
import POS from "../../pages/POS";
import Dashboard from "../../pages/Dashboard";

// Mobile components
import MobileInventory from "./MobileInventory";
import MobileCustomers from "./MobileCustomers";
import MobileReports from "./MobileReports";
import MobileSettings from "./MobileSettings";
import MobileSalesHistory from "./MobileSalesHistory";
import MobilePurchases from "./MobilePurchases";
import MobilePOS from "./MobilePOS";
import MobileDashboard from "../../pages/MobileDashboard";

function ResponsivePageWrapper() {
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const mobileRegex =
        /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i;
      const screenWidth = window.innerWidth;

      // Consider it mobile if:
      // 1. User agent indicates mobile device
      // 2. Screen width is less than 768px (tablet/mobile breakpoint)
      // 3. Touch capability is available
      const isMobileDevice =
        mobileRegex.test(userAgent) ||
        screenWidth <= 768 ||
        "ontouchstart" in window;

      setIsMobile(isMobileDevice);
    };

    checkIfMobile();

    // Listen for window resize to update mobile status
    window.addEventListener("resize", checkIfMobile);

    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const getCurrentPage = () => {
    const path = location.pathname;

    if (path.includes("/inventory")) {
      return isMobile ? <MobileInventory /> : <Inventory />;
    }
    if (path.includes("/customers")) {
      return isMobile ? <MobileCustomers /> : <Customers />;
    }
    if (path.includes("/reports")) {
      return isMobile ? <MobileReports /> : <Reports />;
    }
    if (path.includes("/settings")) {
      return isMobile ? <MobileSettings /> : <Settings />;
    }
    if (path.includes("/sales")) {
      return isMobile ? <MobileSalesHistory /> : <SalesHistory />;
    }
    if (path.includes("/purchases")) {
      return isMobile ? <MobilePurchases /> : <Purchases />;
    }
    if (path.includes("/pos")) {
      return isMobile ? <MobilePOS /> : <POS />;
    }
    if (path === "/dashboard" || path === "/") {
      return isMobile ? <MobileDashboard /> : <Dashboard />;
    }

    // Default fallback - this shouldn't normally happen
    return null;
  };

  return getCurrentPage();
}

export default ResponsivePageWrapper;
