import { useState, useEffect } from "react";
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
            onClick={(e) => {
              e.stopPropagation();
              // You can add a menu or actions here if needed
            }}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <FiMoreVertical className="w-5 h-5 text-gray-600" />
          </motion.button>
        </div>
      </motion.div>
    );
  };

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
      </animated.div>{" "}
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
        </AnimatePresence>{" "}
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
    </div>
  );
}

export default MobileCustomers;
