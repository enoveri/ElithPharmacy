import { useState, useEffect } from "react";
import Dashboard from "./Dashboard";
import MobileDashboard from "./MobileDashboard";

const ResponsiveDashboard = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      // Consider mobile if screen width is less than 768px (tablet breakpoint)
      setIsMobile(window.innerWidth < 768);
    };

    // Check initial screen size
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener("resize", checkScreenSize);

    // Cleanup event listener on unmount
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Render mobile dashboard for mobile devices, desktop dashboard for larger screens
  if (isMobile) {
    return <MobileDashboard />;
  }

  return <Dashboard />;
};

export default ResponsiveDashboard;
