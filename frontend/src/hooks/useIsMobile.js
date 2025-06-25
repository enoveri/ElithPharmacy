import { useState, useEffect } from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

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

  return isMobile;
}

export default useIsMobile;
