import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSpring, animated } from "@react-spring/web";
import {
  FiSearch,
  FiFilter,
  FiDollarSign,
  FiUser,
  FiShoppingCart,
  FiTrendingUp,
  FiRefreshCw,
  FiMoreVertical,
  FiCalendar,
  FiX,
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
      total: 145.5,
      items: 3,
      status: "completed",
      paymentMethod: "cash",
      date: "2024-01-15T10:30:00Z",
      products: [
        { name: "Aspirin 100mg", quantity: 2, price: 15.0 },
        { name: "Vitamin D3", quantity: 1, price: 25.5 },
        { name: "Paracetamol", quantity: 3, price: 35.0 },
      ],
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
        { name: "Cough Syrup", quantity: 1, price: 45.0 },
        { name: "Bandages", quantity: 2, price: 22.25 },
      ],
    },
    {
      id: "SAL-003",
      customerName: "Mike Johnson",
      customerId: 3,
      total: 67.8,
      items: 1,
      status: "refunded",
      paymentMethod: "card",
      date: "2024-01-14T16:45:00Z",
      products: [{ name: "Pain Relief Gel", quantity: 1, price: 67.8 }],
    },
    {
      id: "SAL-004",
      customerName: "Sarah Wilson",
      customerId: 4,
      total: 234.9,
      items: 5,
      status: "completed",
      paymentMethod: "cash",
      date: "2024-01-14T09:20:00Z",
      products: [
        { name: "Antibiotic Course", quantity: 1, price: 120.0 },
        { name: "Vitamins", quantity: 2, price: 50.0 },
        { name: "First Aid Kit", quantity: 1, price: 64.9 },
      ],
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
      filtered = filtered.filter(
        (sale) =>
          sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter((sale) => sale.status === selectedStatus);
    }

    // Filter by period
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (selectedPeriod !== "all") {
      filtered = filtered.filter((sale) => {
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

  // Summary stats
  const totalRevenue = filteredSales.reduce(
    (sum, sale) => (sale.status === "completed" ? sum + sale.total : sum),
    0
  );
  const totalTransactions = filteredSales.filter(
    (sale) => sale.status === "completed"
  ).length;
  const averageOrderValue =
    totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Sale card
  const SaleCard = ({ sale }) => {
    const saleDate = new Date(sale.date);
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate(`/sales/${sale.id}`)}
        className="glass-card mobile-sale-card cursor-pointer"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className={`sale-status-badge ${sale.status}`}>{sale.status}</div>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <FiCalendar className="inline-block" />
            {saleDate.toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="sale-icon">
            <FiShoppingCart size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-base text-gray-900 truncate">
              {sale.customerName}
            </div>
            <div className="text-xs text-gray-500 truncate">
              Sale #{sale.id} • {sale.items} item{sale.items !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold gradient-text">
              {currency}{sale.total.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              {sale.paymentMethod.toUpperCase()}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Filter modal (bottom sheet)
  const FilterModal = () => (
    <AnimatePresence>
      {showFilters && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="mobile-filter-modal"
        >
          <div className="flex items-center justify-between p-4 border-b">
            <span className="font-semibold text-lg">Filters</span>
            <button onClick={() => setShowFilters(false)} className="p-2 rounded-full hover:bg-gray-100">
              <FiX size={20} />
            </button>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex space-x-2">
                {["all", "completed", "refunded"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                      selectedStatus === status
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
              <div className="flex space-x-2 flex-wrap">
                {["today", "yesterday", "week", "month", "all"].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize mb-2 transition-all ${
                      selectedPeriod === period
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {period === "all" ? "All Time" : period}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <FiRefreshCw className="w-8 h-8 text-blue-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mobile-sales-history-page">
      {/* Sticky glassy header with summary */}
      <div className="mobile-sales-header glass-card">
        <div className="grid grid-cols-3 gap-4 mb-2">
          <div className="summary-card">
            <div className="icon-bg green"><FiDollarSign size={18} /></div>
            <div className="summary-value">{currency}{totalRevenue.toFixed(2)}</div>
            <div className="summary-label">Revenue</div>
          </div>
          <div className="summary-card">
            <div className="icon-bg blue"><FiShoppingCart size={18} /></div>
            <div className="summary-value">{totalTransactions}</div>
            <div className="summary-label">Sales</div>
          </div>
          <div className="summary-card">
            <div className="icon-bg purple"><FiTrendingUp size={18} /></div>
            <div className="summary-value">{currency}{averageOrderValue.toFixed(2)}</div>
            <div className="summary-label">Avg. Order</div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search sales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 shadow-sm"
              style={{ boxShadow: "0 2px 8px rgba(59,130,246,0.06)" }}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowFilters(true)}
            className="p-3 bg-blue-50 rounded-xl shadow-sm"
          >
            <FiFilter className="w-5 h-5 text-blue-600" />
          </motion.button>
        </div>
      </div>
      <FilterModal />
      {/* Pull to Refresh Indicator */}
      <animated.div
        style={{ transform: y.to((y) => `translateY(${y}px)`) }}
        className="flex justify-center py-2"
      >
        {refreshing && (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <FiRefreshCw className="w-6 h-6 text-blue-600" />
          </motion.div>
        )}
      </animated.div>
      {/* Sales List */}
      <div
        className="flex-1 overflow-auto p-4 mobile-sales-list"
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
          {filteredSales.map((sale) => (
            <SaleCard key={sale.id} sale={sale} />
          ))}
        </AnimatePresence>
        {filteredSales.length === 0 && (
          <div className="empty-sales-state">
            <FiShoppingCart className="w-14 h-14 text-blue-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No sales found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
            <button className="cta-btn" onClick={() => navigate('/pos')}>Make a Sale</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MobileSalesHistory;
