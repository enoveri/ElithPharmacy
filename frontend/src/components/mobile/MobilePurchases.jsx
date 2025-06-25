import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSpring, animated } from "@react-spring/web";
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiDollarSign,
  FiUser,
  FiPackage,
  FiClock,
  FiEye,
  FiRefreshCw,
  FiChevronDown,
  FiTruck,
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi";
import { dataService } from "../../services";
import { useSettingsStore } from "../../store";

function MobilePurchases() {
  const { settings } = useSettingsStore();
  const { currency } = settings;
  const navigate = useNavigate();

  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [showFilters, setShowFilters] = useState(false);

  // Pull-to-refresh animation
  const [{ y }, api] = useSpring(() => ({ y: 0 }));

  // Mock purchase data
  const mockPurchases = [
    {
      id: "PUR-001",
      supplierName: "MedSupply Co.",
      supplierId: 1,
      total: 2450.0,
      items: 12,
      status: "delivered",
      orderDate: "2024-01-10T09:00:00Z",
      deliveryDate: "2024-01-12T14:30:00Z",
      products: [
        { name: "Aspirin 100mg", quantity: 100, unitCost: 8.5, total: 850.0 },
        {
          name: "Paracetamol 500mg",
          quantity: 200,
          unitCost: 4.25,
          total: 850.0,
        },
        { name: "Vitamin D3", quantity: 50, unitCost: 15.0, total: 750.0 },
      ],
    },
    {
      id: "PUR-002",
      supplierName: "HealthCare Distributors",
      supplierId: 2,
      total: 1890.5,
      items: 8,
      status: "pending",
      orderDate: "2024-01-14T11:15:00Z",
      deliveryDate: null,
      products: [
        {
          name: "Antibiotics Pack",
          quantity: 20,
          unitCost: 45.0,
          total: 900.0,
        },
        { name: "Cough Syrup", quantity: 30, unitCost: 33.0, total: 990.5 },
      ],
    },
    {
      id: "PUR-003",
      supplierName: "Pharma Direct",
      supplierId: 3,
      total: 3240.75,
      items: 15,
      status: "shipped",
      orderDate: "2024-01-08T16:20:00Z",
      deliveryDate: "2024-01-16T10:00:00Z",
      products: [
        { name: "Insulin Pens", quantity: 25, unitCost: 89.5, total: 2237.5 },
        {
          name: "Blood Pressure Monitor",
          quantity: 5,
          unitCost: 200.65,
          total: 1003.25,
        },
      ],
    },
    {
      id: "PUR-004",
      supplierName: "Medical Essentials",
      supplierId: 4,
      total: 567.3,
      items: 6,
      status: "cancelled",
      orderDate: "2024-01-12T13:45:00Z",
      deliveryDate: null,
      products: [
        { name: "Bandages", quantity: 50, unitCost: 5.5, total: 275.0 },
        { name: "Thermometers", quantity: 10, unitCost: 29.23, total: 292.3 },
      ],
    },
  ];

  useEffect(() => {
    loadPurchases();
  }, []);

  useEffect(() => {
    filterPurchases();
  }, [purchases, searchTerm, selectedStatus, selectedPeriod]);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      // In a real app, this would fetch from the database
      // const data = await dataService.getPurchases();
      setPurchases(mockPurchases);
    } catch (error) {
      console.error("Error loading purchases:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterPurchases = () => {
    let filtered = purchases;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (purchase) =>
          purchase.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          purchase.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (purchase) => purchase.status === selectedStatus
      );
    }

    // Filter by period
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (selectedPeriod !== "all") {
      filtered = filtered.filter((purchase) => {
        const purchaseDate = new Date(purchase.orderDate);
        switch (selectedPeriod) {
          case "week":
            return purchaseDate >= weekAgo;
          case "month":
            return purchaseDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Sort by order date (newest first)
    filtered.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

    setFilteredPurchases(filtered);
  };

  const handlePullToRefresh = async () => {
    setRefreshing(true);

    api.start({
      y: 50,
      config: { tension: 300, friction: 30 },
    });

    try {
      await loadPurchases();
      setTimeout(() => {
        api.start({ y: 0 });
        setRefreshing(false);
      }, 500);
    } catch (error) {
      api.start({ y: 0 });
      setRefreshing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "delivered":
        return FiPackage;
      case "shipped":
        return FiTruck;
      case "pending":
        return FiClock;
      case "cancelled":
        return FiXCircle;
      default:
        return FiPackage;
    }
  };

  const PurchaseCard = ({ purchase }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const orderDate = new Date(purchase.orderDate);
    const deliveryDate = purchase.deliveryDate
      ? new Date(purchase.deliveryDate)
      : null;
    const StatusIcon = getStatusIcon(purchase.status);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-900">{purchase.id}</h3>
                <span
                  className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(purchase.status)}`}
                >
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {purchase.status}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <FiUser className="w-4 h-4 mr-1" />
                {purchase.supplierName}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <FiClock className="w-4 h-4 mr-1" />
                Ordered: {orderDate.toLocaleDateString()}
              </div>
              {deliveryDate && (
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <FiTruck className="w-4 h-4 mr-1" />
                  Delivered: {deliveryDate.toLocaleDateString()}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-blue-600">
                {currency}
                {purchase.total.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">
                {purchase.items} item{purchase.items !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center text-sm text-blue-600 font-medium"
            >
              View Details
              <motion.div
                animate={{ rotate: showDetails ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="ml-1"
              >
                <FiChevronDown className="w-4 h-4" />
              </motion.div>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowActions(!showActions)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <FiMoreVertical className="w-5 h-5 text-gray-600" />
            </motion.button>
          </div>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-100"
              >
                <h4 className="font-medium text-gray-900 mb-3">
                  Products Ordered
                </h4>
                <div className="space-y-2">
                  {purchase.products.map((product, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-start"
                    >
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900 block">
                          {product.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {product.quantity} × {currency}
                          {product.unitCost.toFixed(2)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {currency}
                        {product.total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                    onClick={() => navigate(`/purchases/view/${purchase.id}`)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium"
                  >
                    <FiEye className="w-4 h-4 mr-1" />
                    View
                  </motion.button>
                  {purchase.status === "pending" && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate(`/purchases/edit/${purchase.id}`)}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium"
                    >
                      <FiEdit className="w-4 h-4 mr-1" />
                      Edit
                    </motion.button>
                  )}
                  {(purchase.status === "pending" ||
                    purchase.status === "cancelled") && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium"
                    >
                      <FiTrash2 className="w-4 h-4 mr-1" />
                      Delete
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  // Calculate summary stats
  const totalSpent = filteredPurchases.reduce(
    (sum, purchase) =>
      purchase.status !== "cancelled" ? sum + purchase.total : sum,
    0
  );
  const pendingOrders = filteredPurchases.filter(
    (p) => p.status === "pending"
  ).length;
  const deliveredOrders = filteredPurchases.filter(
    (p) => p.status === "delivered"
  ).length;

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
      {/* Mobile Header */}
      <div
        className="bg-white/95 backdrop-blur-lg border-b border-gray-200/50 p-4 sticky top-0 z-10"
        style={{
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {currency}
              {totalSpent.toFixed(2)}
            </div>
            <div className="text-xs text-gray-600">Total Spent</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-600">
              {pendingOrders}
            </div>
            <div className="text-xs text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {deliveredOrders}
            </div>
            <div className="text-xs text-gray-600">Delivered</div>
          </div>
        </div>

        <div className="flex items-center space-x-3 mb-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search purchases..."
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
              className="overflow-hidden space-y-3"
            >
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="flex space-x-2 flex-wrap">
                  {["all", "pending", "shipped", "delivered", "cancelled"].map(
                    (status) => (
                      <motion.button
                        key={status}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedStatus(status)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium capitalize mb-2 ${
                          selectedStatus === status
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {status}
                      </motion.button>
                    )
                  )}
                </div>
              </div>

              {/* Period Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Period
                </label>
                <div className="flex space-x-2">
                  {["week", "month", "all"].map((period) => (
                    <motion.button
                      key={period}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedPeriod(period)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium capitalize ${
                        selectedPeriod === period
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {period === "all" ? "All Time" : `Last ${period}`}
                    </motion.button>
                  ))}
                </div>
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

      {/* Purchases List */}
      <div
        className="flex-1 overflow-auto p-4"
        onTouchStart={() => {
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
          {filteredPurchases.map((purchase) => (
            <PurchaseCard key={purchase.id} purchase={purchase} />
          ))}
        </AnimatePresence>

        {filteredPurchases.length === 0 && (
          <div className="text-center py-12">
            <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No purchases found
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
        onClick={() => navigate("/purchases/add")}
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

export default MobilePurchases;
