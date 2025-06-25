import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import MainLayout from "./MainLayout";
import MobileLayout from "./MobileLayout";

const ResponsiveLayout = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      // Consider mobile if screen width is less than 768px (tablet breakpoint)
      setIsMobile(window.innerWidth < 768);
    };

    // Check initial screen size
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);

    // Cleanup event listener on unmount
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  // Render mobile layout for mobile devices, desktop layout for larger screens
  if (isMobile) {
    return <MobileLayout />;
  }

  // For desktop, we use the existing MainLayout which handles its own Outlet
  return <MainLayout />;
};

export default ResponsiveLayout;
