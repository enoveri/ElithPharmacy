import { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSpring, animated } from "@react-spring/web";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiDownload,
  FiUpload,
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiEye,
  FiShoppingCart,
  FiDollarSign,
  FiMoreVertical,
  FiFilter,
  FiRefreshCw,
} from "react-icons/fi";
import { dataService } from "../../services";
import { useSettingsStore } from "../../store";

function MobileCustomers() {
  const { settings } = useSettingsStore();
  const { currency } = settings;
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  
  // Pull-to-refresh animation
  const [{ y }, api] = useSpring(() => ({ y: 0 }));
  
  // Load customers
  useEffect(() => {
    const loadCustomers = async () => {
      setLoading(true);
      try {
        const customers = await dataService.customers.getAll();
        console.log(
          "✅ [MobileCustomers] Loaded customers from database:",
          customers?.length || 0
        );
        setCustomers(customers || []);
        setFilteredCustomers(customers || []);
      } catch (error) {
        console.error("❌ [MobileCustomers] Error loading customers:", error);
        setCustomers([]);
        setFilteredCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

  // Prevent scrollbar flickering during initial render
  useEffect(() => {
    // Ensure consistent scrollbar space to prevent layout shifts
    document.documentElement.style.scrollbarGutter = 'stable';
    
    return () => {
      document.documentElement.style.scrollbarGutter = '';
    };
  }, []);

  // Filter customers when search term or status changes
  useEffect(() => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter((customer) => {
        const firstName = customer.first_name || customer.firstName || "";
        const lastName = customer.last_name || customer.lastName || "";
        const email = customer.email || "";
        const phone = customer.phone || "";

        return (
          firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          phone.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (customer) => customer.status === selectedStatus
      );
    }

    setFilteredCustomers(filtered);
  }, [searchTerm, selectedStatus, customers]);

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openMenuId && !e.target.closest('.dropdown-menu') && !e.target.closest('.menu-button')) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMenuId]);
  
  // Pull to refresh
  const handlePullToRefresh = async () => {
    setRefreshing(true);

    // Animate the pull-to-refresh
    api.start({
      y: 50,
      config: { tension: 300, friction: 30 },
    });

    try {
      const customers = await dataService.customers.getAll();
      console.log(
        "🔄 [MobileCustomers] Refreshed customers from database:",
        customers?.length || 0
      );
      setCustomers(customers || []);
      setFilteredCustomers(customers || []);

      setTimeout(() => {
        api.start({ y: 0 });
        setRefreshing(false);
      }, 500);
    } catch (error) {
      console.error("❌ [MobileCustomers] Error refreshing customers:", error);
      api.start({ y: 0 });
      setRefreshing(false);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        await dataService.customers.delete(customerId);
        const updatedCustomers = customers.filter(c => c.id !== customerId);
        setCustomers(updatedCustomers);
        setFilteredCustomers(updatedCustomers);
        setOpenMenuId(null);
      } catch (error) {
        console.error("❌ [MobileCustomers] Error deleting customer:", error);
        alert("Failed to delete customer. Please try again.");
      }
    }
  };

  const handleMenuClick = (customerId, event) => {
    event.stopPropagation();
    event.preventDefault();
    
    if (openMenuId === customerId) {
      setOpenMenuId(null);
      return;
    }

    // Calculate position relative to viewport with bounds checking
    const rect = event.currentTarget.getBoundingClientRect();
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Calculate optimal position
    const menuHeight = 200; // Approximate menu height
    const menuWidth = 200; // Approximate menu width
    
    let top = rect.bottom + scrollY + 8;
    let right = viewportWidth - rect.right;
    
    // Adjust if menu would go below viewport
    if (top + menuHeight > scrollY + viewportHeight) {
      top = rect.top + scrollY - menuHeight - 8;
    }
    
    // Adjust if menu would go off left edge
    if (right + menuWidth > viewportWidth) {
      right = 10;
    }
    
    setMenuPosition({ top, right });
    setOpenMenuId(customerId);
  };

  const CustomerCard = ({ customer }) => {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate(`/customers/view/${customer.id}`)}
        className="mobile-list-item cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* Avatar */}
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <FiUser className="w-6 h-6 text-white" />
            </div>
            {/* Customer Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">
                {(customer.first_name || customer.firstName || "") +
                  " " +
                  (customer.last_name || customer.lastName || "")}
              </h3>
              <div className="flex items-center space-x-3">
                <span
                  className={`status-badge ${customer.status === "active" ? "active" : "inactive"}`}
                >
                  {customer.status}
                </span>
                <span className="text-sm font-semibold gradient-text">
                  {currency}
                  {(
                    customer.total_spent ||
                    customer.totalSpent ||
                    0
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Menu Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => handleMenuClick(customer.id, e)}
            className="menu-button p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <FiMoreVertical className="w-5 h-5 text-gray-600" />
          </motion.button>
        </div>
      </motion.div>
    );
  };

  // Dropdown menu as a portal
  const DropdownMenu = openMenuId
    ? ReactDOM.createPortal(
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          className="dropdown-menu absolute bg-white rounded-2xl shadow-2xl border border-gray-200 min-w-[200px] overflow-hidden"
          style={{
            top: menuPosition.top,
            right: menuPosition.right,
            zIndex: 9999,
            position: 'absolute',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)',
            maxHeight: 'calc(100vh - 20px)',
            maxWidth: 'calc(100vw - 20px)'
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/customers/view/${openMenuId}`);
              setOpenMenuId(null);
            }}
            className="w-full text-left px-5 py-4 text-sm text-gray-800 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-all font-medium border-b border-gray-100"
          >
            <FiEye className="w-5 h-5 text-blue-600" />
            View Details
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/customers/edit/${openMenuId}`);
              setOpenMenuId(null);
            }}
            className="w-full text-left px-5 py-4 text-sm text-gray-800 hover:bg-green-50 hover:text-green-700 flex items-center gap-3 transition-all font-medium border-b border-gray-100"
          >
            <FiEdit className="w-5 h-5 text-green-600" />
            Edit Customer
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/customers/sales/${openMenuId}`);
              setOpenMenuId(null);
            }}
            className="w-full text-left px-5 py-4 text-sm text-gray-800 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-3 transition-all font-medium border-b border-gray-100"
          >
            <FiShoppingCart className="w-5 h-5 text-purple-600" />
            View Sales
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteCustomer(openMenuId);
            }}
            className="w-full text-left px-5 py-4 text-sm text-red-700 hover:bg-red-50 hover:text-red-800 flex items-center gap-3 transition-all font-medium"
          >
            <FiTrash2 className="w-5 h-5 text-red-600" />
            Delete Customer
          </button>
        </motion.div>,
        document.body
      )
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <FiRefreshCw className="w-8 h-8 text-blue-600" />
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="mobile-container">
      {/* Mobile Search Header */}
      <div className="search-filter-section">
        <div className="search-container">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-section">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`filter-button ${showFilters ? "active" : ""}`}
          >
            <FiFilter size={16} />
            Filters
          </motion.button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex space-x-2">
                {["all", "active", "inactive"].map((status) => (
                  <motion.button
                    key={status}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-6 py-3 rounded-2xl text-sm font-semibold capitalize shadow-lg transition-all ${
                      selectedStatus === status
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                        : "bg-white/90 text-gray-600 backdrop-blur-sm"
                    }`}
                  >
                    {status}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Pull to Refresh Indicator */}
      <animated.div
        style={{
          transform: y.to((y) => `translateY(${y}px)`),
        }}
        className="flex justify-center py-2"
      >
        {refreshing && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <FiRefreshCw className="w-6 h-6 text-blue-600" />
          </motion.div>
        )}
      </animated.div>
      
      {/* Customer List */}
      <div
        className="flex-1 overflow-auto p-6"
        onTouchStart={() => {
          // Simple pull-to-refresh detection
          const startY = event.touches[0].clientY;
          const scrollTop = event.currentTarget.scrollTop;
          if (scrollTop === 0) {
            const handleTouchMove = (e) => {
              const currentY = e.touches[0].clientY;
              const pullDistance = currentY - startY;
              if (pullDistance > 100) {
                handlePullToRefresh();
                document.removeEventListener("touchmove", handleTouchMove);
              }
            };
            document.addEventListener("touchmove", handleTouchMove);
            document.addEventListener("touchend", () => {
              document.removeEventListener("touchmove", handleTouchMove);
            });
          }
        }}
      >
        <AnimatePresence>
          {filteredCustomers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </AnimatePresence>
        
        {filteredCustomers.length === 0 && (
          <div className="mobile-card text-center py-12">
            <FiUser
              size={64}
              style={{ color: "#e5e7eb", margin: "0 auto 16px" }}
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No customers found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
      
      {/* Floating Action Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate("/customers/add")}
        className="mobile-fab"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <FiPlus size={24} />
      </motion.button>

      {DropdownMenu}
    </div>
  );
}

export default MobileCustomers;
