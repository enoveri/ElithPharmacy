import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSpring, animated } from "@react-spring/web";
import {
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
  FiShoppingCart,
  FiTrendingUp,
  FiMoreVertical,
} from "react-icons/fi";
import { dataService } from "../../services";
import { useSettingsStore } from "../../store";

function MobileSalesHistory() {
  const { settings } = useSettingsStore();
  const { currency } = settings;
  const navigate = useNavigate();

  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [showFilters, setShowFilters] = useState(false);

  // Pull-to-refresh animation
  const [{ y }, api] = useSpring(() => ({ y: 0 }));

  // Mock sales data
  const mockSales = [
    {
      id: "SAL-001",
      customerName: "John Doe",
      customerId: 1,
      total: 145.50,
      items: 3,
      status: "completed",
      paymentMethod: "cash",
      date: "2024-01-15T10:30:00Z",
      products: [
        { name: "Aspirin 100mg", quantity: 2, price: 15.00 },
        { name: "Vitamin D3", quantity: 1, price: 25.50 },
        { name: "Paracetamol", quantity: 3, price: 35.00 },
      ]
    },
    {
      id: "SAL-002",
      customerName: "Jane Smith",
      customerId: 2,
      total: 89.25,
      items: 2,
      status: "completed",
      paymentMethod: "mpesa",
      date: "2024-01-15T14:15:00Z",
      products: [
        { name: "Cough Syrup", quantity: 1, price: 45.00 },
        { name: "Bandages", quantity: 2, price: 22.25 },
      ]
    },
    {
      id: "SAL-003",
      customerName: "Mike Johnson",
      customerId: 3,
      total: 67.80,
      items: 1,
      status: "refunded",
      paymentMethod: "card",
      date: "2024-01-14T16:45:00Z",
      products: [
        { name: "Pain Relief Gel", quantity: 1, price: 67.80 },
      ]
    },
    {
      id: "SAL-004",
      customerName: "Sarah Wilson",
      customerId: 4,
      total: 234.90,
      items: 5,
      status: "completed",
      paymentMethod: "cash",
      date: "2024-01-14T09:20:00Z",
      products: [
        { name: "Antibiotic Course", quantity: 1, price: 120.00 },
        { name: "Vitamins", quantity: 2, price: 50.00 },
        { name: "First Aid Kit", quantity: 1, price: 64.90 },
      ]
    },
  ];

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    filterSales();
  }, [sales, searchTerm, selectedStatus, selectedPeriod]);

  const loadSales = async () => {
    try {
      setLoading(true);
      // In a real app, this would fetch from the database
      // const data = await dataService.getSales();
      setSales(mockSales);
    } catch (error) {
      console.error("Error loading sales:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterSales = () => {
    let filtered = sales;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(sale =>
        sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(sale => sale.status === selectedStatus);
    }

    // Filter by period
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (selectedPeriod !== "all") {
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.date);
        switch (selectedPeriod) {
          case "today":
            return saleDate >= today;
          case "yesterday":
            return saleDate >= yesterday && saleDate < today;
          case "week":
            return saleDate >= weekAgo;
          case "month":
            return saleDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    setFilteredSales(filtered);
  };

  const handlePullToRefresh = async () => {
    setRefreshing(true);
    
    api.start({
      y: 50,
      config: { tension: 300, friction: 30 },
    });

    try {
      await loadSales();
      setTimeout(() => {
        api.start({ y: 0 });
        setRefreshing(false);
      }, 500);
    } catch (error) {
      api.start({ y: 0 });
      setRefreshing(false);
    }
  };

  const SaleCard = ({ sale }) => {
    const [showDetails, setShowDetails] = useState(false);
    const saleDate = new Date(sale.date);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden"
      >
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowDetails(!showDetails)}
          className="p-4 cursor-pointer"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-900">{sale.id}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  sale.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : sale.status === "refunded"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}>
                  {sale.status}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <FiUser className="w-4 h-4 mr-1" />
                {sale.customerName}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <FiClock className="w-4 h-4 mr-1" />
                {saleDate.toLocaleDateString()} at {saleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-green-600">
                {currency}{sale.total.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">
                {sale.items} item{sale.items !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <FiShoppingCart className="w-4 h-4 mr-1" />
                {sale.paymentMethod.toUpperCase()}
              </div>
            </div>
            <motion.div
              animate={{ rotate: showDetails ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <FiChevronDown className="w-5 h-5 text-gray-400" />
            </motion.div>
          </div>
        </motion.div>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-100"
            >
              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Items Purchased</h4>
                <div className="space-y-2 mb-4">
                  {sale.products.map((product, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {product.name}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          × {product.quantity}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {currency}{product.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/sales/${sale.id}`);
                    }}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium"
                  >
                    <FiEye className="w-4 h-4 mr-1" />
                    View Details
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/customers/view/${sale.customerId}`);
                    }}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium"
                  >
                    <FiUser className="w-4 h-4 mr-1" />
                    Customer
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // Calculate summary stats
  const totalRevenue = filteredSales.reduce((sum, sale) => 
    sale.status === "completed" ? sum + sale.total : sum, 0
  );
  const totalTransactions = filteredSales.filter(sale => sale.status === "completed").length;
  const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

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
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {currency}{totalRevenue.toFixed(2)}
            </div>
            <div className="text-xs text-gray-600">Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{totalTransactions}</div>
            <div className="text-xs text-gray-600">Sales</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {currency}{averageOrderValue.toFixed(2)}
            </div>
            <div className="text-xs text-gray-600">Avg. Order</div>
          </div>
        </div>

        <div className="flex items-center space-x-3 mb-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search sales..."
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="flex space-x-2">
                  {["all", "completed", "refunded"].map((status) => (
                    <motion.button
                      key={status}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedStatus(status)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium capitalize ${
                        selectedStatus === status
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {status}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Period Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                <div className="flex space-x-2 flex-wrap">
                  {["today", "yesterday", "week", "month", "all"].map((period) => (
                    <motion.button
                      key={period}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedPeriod(period)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium capitalize mb-2 ${
                        selectedPeriod === period
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {period === "all" ? "All Time" : period}
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

      {/* Sales List */}
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
          {filteredSales.map((sale) => (
            <SaleCard key={sale.id} sale={sale} />
          ))}
        </AnimatePresence>

        {filteredSales.length === 0 && (
          <div className="text-center py-12">
            <FiShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sales found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MobileSalesHistory;
