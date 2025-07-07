import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiPlus,
  FiPackage,
  FiList,
  FiUser,
  FiBarChart,
  FiRotateCcw,
  FiLogOut,
  FiMenu,
  FiX,
  FiTruck,
  FiShield,
} from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import { useUserRole } from "../../hooks/useUserRole";
import logo from '/logo.png';

const Sidebar = ({
  collapsed = false,
  onToggleCollapse,
  isMobile = false,
  mobileMenuOpen = false,
  onCloseMobileMenu,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { userRole, isAdmin, loading: roleLoading } = useUserRole();
  const isActive = (path) => location.pathname === path;

  const handleNavClick = () => {
    if (isMobile && onCloseMobileMenu) {
      onCloseMobileMenu();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Error logging out. Please try again.");
    }
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: FiHome },
    { path: "/pos", label: "Point of Sale", icon: FiPlus },
    { path: "/inventory", label: "Inventory", icon: FiPackage },
    { path: "/purchases", label: "Purchases", icon: FiTruck },
    { path: "/sales", label: "Sales", icon: FiList },
    { path: "/customers", label: "Customers", icon: FiUser },
    { path: "/reports", label: "Reports", icon: FiBarChart },
    ...(isAdmin ? [{ path: "/admin", label: "Admin Panel", icon: FiShield }] : []),
    { path: "/settings", label: "Settings", icon: FiRotateCcw },
  ];

  return (
    <aside
      className={`h-full ${isMobile ? "w-64" : collapsed ? "w-16" : "w-64"} transition-all duration-300 ease-in-out shadow-xl border-r flex flex-col bg-white`}
      style={{
        background: "var(--color-sidebar-bg)",
        borderColor: "var(--color-border-light)",
        fontFamily: "var(--font-family-sans)",
      }}
    >
      {/* Header Section */}
      <div
        className={`${collapsed && !isMobile ? "p-3" : "p-6"} flex items-center border-b backdrop-blur-sm transition-all duration-300 flex-[0_0_20%] relative`}
        style={{
          borderColor: "var(--color-border-light)",
          backgroundColor: "rgba(0, 0, 0, 0.1)",
        }}
      >
        <button
          onClick={onToggleCollapse}
          className="absolute top-2 left-2 p-2 rounded-lg transition-all duration-200 z-10"
          style={{
            color: "var(--color-sidebar-text)",
            backgroundColor: "transparent",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "var(--color-sidebar-hover)";
            e.target.style.color = "var(--color-sidebar-text-active)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "transparent";
            e.target.style.color = "var(--color-sidebar-text)";
          }}
        >
          {collapsed ? (
            <FiMenu className="w-5 h-5" /> 
          ) : (
            <FiX className="w-5 h-5" /> 
          )}
        </button>

        {/* Logo and Title */}
        {(!collapsed || isMobile) && (
          <div className="flex items-center ml-10 transition-all duration-300">
            <div
              className="w-16 h-13 flex items-center justify-center"
            >
              <img src={logo} alt="Elith Pharmacy Logo" 
              style={{
                paddingLeft: "20px",
              }}
              />
            </div>
            <div className="ml-4">
              <h1
                className="text-xl font-bold tracking-wide"
                style={{
                  color: "var(--color-sidebar-text-active)",
                  fontFamily: "var(--font-family-sans)",
                  paddingLeft: "20px",
                }}
              >
                Elith Pharmacy
              </h1>
              <p
                className="text-sm"
                style={{
                   color: "var(--color-sidebar-text)",
                   paddingLeft: "20px",
                  }}
              >
                Management System
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Section */}
      <nav
        className={`${collapsed && !isMobile ? "px-3 py-6" : "px-6 py-8"} transition-all duration-300 flex flex-col flex-[0_0_60%]`}
      >
        <ul className="flex flex-col h-full justify-stretch space-y-0">
          {navItems.map((item, index) => (
            <li key={index} className="flex-1">
              <Link
                to={item.path}
                onClick={handleNavClick}
                className={`group flex items-center justify-center gap-4 h-full ${
                  collapsed && !isMobile ? "p-4" : "px-6 py-4"
                } transition-all duration-200 relative rounded-xl`}
                style={{
                  color: isActive(item.path)
                    ? "var(--color-sidebar-text-active)"
                    : "var(--color-sidebar-text)",
                  background: isActive(item.path)
                    ? "var(--color-sidebar-active)"
                    : "transparent",
                  transform: isActive(item.path) ? "scale(1.05)" : "scale(1)",
                }}
                title={collapsed && !isMobile ? item.label : ""}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.target.style.backgroundColor =
                      "var(--color-sidebar-hover)";
                    e.target.style.color = "var(--color-sidebar-text-active)";
                    e.target.style.transform = "scale(1.02)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.color = "var(--color-sidebar-text)";
                    e.target.style.transform = "scale(1)";
                  }
                }}
              >
                <item.icon className="text-2xl transition-all duration-200" />
                {(!collapsed || isMobile) && (
                  <span
                    className="ml-4 font-medium transition-all duration-200 text-lg"
                    style={{ fontFamily: "var(--font-family-sans)" }}
                  >
                    {item.label}
                  </span>
                )}
                {isActive(item.path) && (!collapsed || isMobile) && (
                  <div
                    className="ml-auto w-2 h-2 rounded-full animate-pulse"
                    style={{
                      backgroundColor: "var(--color-sidebar-text-active)",
                    }}
                  ></div>
                )}
                {collapsed && !isMobile && (
                  <div
                    className="absolute left-16 top-1/2 transform -translate-y-1/2 px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50"
                    style={{
                      backgroundColor: "var(--color-sidebar-bg)",
                      color: "var(--color-sidebar-text-active)",
                      fontFamily: "var(--font-family-sans)",
                    }}
                  >
                    {item.label}
                    <div
                      className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 rotate-45"
                      style={{
                        backgroundColor: "var(--color-sidebar-bg)",
                      }}
                    ></div>
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer Section */}
      <div
        className={`${collapsed && !isMobile ? "p-3" : "p-6"} border-t backdrop-blur-sm transition-all duration-300 flex-[0_0_20%] flex flex-col justify-center`}
        style={{
          borderColor: "var(--color-border-light)",
          backgroundColor: "rgba(0, 0, 0, 0.1)",
        }}
      >
        <button
          onClick={handleLogout}
          className={`w-full group flex items-center justify-center gap-4 ${
            collapsed && !isMobile ? "p-4" : "px-6 py-4"
          } rounded-xl transition-all duration-200`}
          style={{
            color: "var(--color-danger-400)",
            backgroundColor: "transparent",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
            e.target.style.color = "var(--color-danger-300)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "transparent";
            e.target.style.color = "var(--color-danger-400)";
          }}
        >
          <FiLogOut className="text-2xl transition-all duration-200" />
          {(!collapsed || isMobile) && (
            <span
              className="font-medium text-lg"
              style={{ fontFamily: "var(--font-family-sans)" }}
            >
              Logout
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;