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

  // Mock customer data for mobile
  const mockCustomers = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      phone: "+1234567890",
      address: "123 Main St, City",
      totalPurchases: 2450.00,
      lastPurchase: "2024-01-15",
      status: "active",
      registeredDate: "2023-06-15",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "+1987654321",
      address: "456 Oak Ave, Town",
      totalPurchases: 1890.50,
      lastPurchase: "2024-01-12",
      status: "active",
      registeredDate: "2023-08-22",
    },
    {
      id: 3,
      name: "Mike Johnson",
      email: "mike@example.com",
      phone: "+1122334455",
      address: "789 Pine Rd, Village",
      totalPurchases: 340.25,
      lastPurchase: "2023-12-28",
      status: "inactive",
      registeredDate: "2023-11-10",
    },
  ];

  // Load customers
  useEffect(() => {
    loadCustomers();
  }, []);

  // Filter customers when search term or status changes
  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, selectedStatus]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      // In a real app, this would fetch from the database
      // const data = await dataService.getCustomers();
      setCustomers(mockCustomers);
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter(
        customer =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone.includes(searchTerm)
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(customer => customer.status === selectedStatus);
    }

    setFilteredCustomers(filtered);
  };

  // Pull to refresh
  const handlePullToRefresh = async () => {
    setRefreshing(true);
    
    // Animate the pull-to-refresh
    api.start({
      y: 50,
      config: { tension: 300, friction: 30 },
    });

    try {
      await loadCustomers();
      setTimeout(() => {
        api.start({ y: 0 });
        setRefreshing(false);
      }, 500);
    } catch (error) {
      api.start({ y: 0 });
      setRefreshing(false);
    }
  };

  const CustomerCard = ({ customer }) => {
    const [showActions, setShowActions] = useState(false);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileTap={{ scale: 0.98 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiUser className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{customer.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    customer.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {customer.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <FiMail className="w-4 h-4 mr-2" />
                  {customer.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FiPhone className="w-4 h-4 mr-2" />
                  {customer.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FiMapPin className="w-4 h-4 mr-2" />
                  {customer.address}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-500">Total Purchases</div>
                    <div className="font-semibold text-green-600">
                      {currency}{customer.totalPurchases.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Last Purchase</div>
                    <div className="text-sm font-medium">{customer.lastPurchase}</div>
                  </div>
                </div>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowActions(!showActions)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <FiMoreVertical className="w-5 h-5 text-gray-600" />
            </motion.button>
          </div>

          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-gray-100"
              >
                <div className="flex space-x-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/customers/view/${customer.id}`)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium"
                  >
                    <FiEye className="w-4 h-4 mr-1" />
                    View
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/customers/edit/${customer.id}`)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium"
                  >
                    <FiEdit className="w-4 h-4 mr-1" />
                    Edit
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium"
                  >
                    <FiTrash2 className="w-4 h-4 mr-1" />
                    Delete
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
    <div className="h-full flex flex-col bg-gray-50">
      {/* Mobile Search Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center space-x-3 mb-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowFilters(!showFilters)}
            className="p-3 bg-gray-100 rounded-xl"
          >
            <FiFilter className="w-5 h-5 text-gray-600" />
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
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                      selectedStatus === status
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600"
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
          transform: y.to(y => `translateY(${y}px)`),
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
        className="flex-1 overflow-auto p-4"
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
                document.removeEventListener('touchmove', handleTouchMove);
              }
            };
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', () => {
              document.removeEventListener('touchmove', handleTouchMove);
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
          <div className="text-center py-12">
            <FiUser className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate("/customers/add")}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-20"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <FiPlus className="w-6 h-6" />
      </motion.button>
    </div>
  );
}

export default MobileCustomers;
