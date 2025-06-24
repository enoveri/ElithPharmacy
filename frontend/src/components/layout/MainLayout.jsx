import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

const MainLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        {/* Enhanced Header with better spacing */}
        <div className="flex-shrink-0 border-b border-slate-200/80 bg-white/80 backdrop-blur-sm shadow-sm">
          <Header
            onToggleMobileMenu={handleToggleSidebar}
            isMobile={isMobile}
            mobileMenuOpen={mobileMenuOpen}
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
