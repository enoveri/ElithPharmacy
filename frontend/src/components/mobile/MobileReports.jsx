import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpring, animated } from "@react-spring/web";
import {
  FiBarChart,
  FiTrendingUp,
  FiDownload,
  FiCalendar,
  FiDollarSign,
  FiShoppingCart,
  FiUsers,
  FiPackage,
  FiRefreshCw,
  FiPieChart,
  FiActivity,
  FiChevronRight,
  FiFilter,
} from "react-icons/fi";
import { dataService } from "../../services";
import { useSettingsStore } from "../../store";

function MobileReports() {
  const { settings } = useSettingsStore();
  const { currency } = settings;

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  // Pull-to-refresh animation
  const [{ y }, api] = useSpring(() => ({ y: 0 }));

  // Mock report data
  const [reportData, setReportData] = useState({
    overview: {
      totalSales: 12450.75,
      totalTransactions: 156,
      totalCustomers: 89,
      averageOrderValue: 79.81,
      growth: {
        sales: 15.3,
        transactions: 8.7,
        customers: 12.1,
      },
    },
    quickStats: [
      {
        title: "Today's Sales",
        value: 1240.5,
        icon: FiDollarSign,
        color: "green",
        change: "+8.2%",
      },
      {
        title: "Orders",
        value: 23,
        icon: FiShoppingCart,
        color: "blue",
        change: "+12%",
      },
      {
        title: "Products Sold",
        value: 127,
        icon: FiPackage,
        color: "purple",
        change: "+5.4%",
      },
      {
        title: "New Customers",
        value: 7,
        icon: FiUsers,
        color: "orange",
        change: "+3.1%",
      },
    ],
    topProducts: [
      { name: "Aspirin 100mg", sales: 45, revenue: 450.0 },
      { name: "Vitamin D3", sales: 32, revenue: 640.0 },
      { name: "Amoxicillin", sales: 28, revenue: 560.0 },
      { name: "Ibuprofen", sales: 25, revenue: 375.0 },
    ],
    salesChart: [
      { date: "2024-01-01", sales: 850 },
      { date: "2024-01-02", sales: 920 },
      { date: "2024-01-03", sales: 780 },
      { date: "2024-01-04", sales: 1100 },
      { date: "2024-01-05", sales: 950 },
      { date: "2024-01-06", sales: 1200 },
      { date: "2024-01-07", sales: 1340 },
    ],
  });

  // Load report data
  const loadReportData = async () => {
    try {
      setLoading(true);
      // In a real app, this would fetch from the database
      // const data = await dataService.getReports(dateRange);
      // setReportData(data);
    } catch (error) {
      console.error("Error loading report data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Pull to refresh
  const handlePullToRefresh = async () => {
    setRefreshing(true);

    api.start({
      y: 50,
      config: { tension: 300, friction: 30 },
    });

    try {
      await loadReportData();
      setTimeout(() => {
        api.start({ y: 0 });
        setRefreshing(false);
      }, 500);
    } catch (error) {
      api.start({ y: 0 });
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [dateRange, activeTab]);
  const StatCard = ({ stat }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.98 }}
      className="stat-card"
    >
      <div className="stat-content">
        <div className="stat-info">
          <h3>{stat.title}</h3>
          <div className="stat-value">
            {typeof stat.value === "number" && stat.title.includes("Sales")
              ? `${currency}${stat.value.toFixed(2)}`
              : stat.value}
          </div>
          <div className="stat-change">{stat.change}</div>
        </div>
        <div
          className="stat-icon"
          style={{
            background:
              stat.color === "green"
                ? "linear-gradient(135deg, #10b981, #059669)"
                : stat.color === "blue"
                  ? "linear-gradient(135deg, #3b82f6, #1d4ed8)"
                  : stat.color === "purple"
                    ? "linear-gradient(135deg, #8b5cf6, #7c3aed)"
                    : "linear-gradient(135deg, #f59e0b, #d97706)",
          }}
        >
          <stat.icon size={20} style={{ color: "white" }} />
        </div>
      </div>
    </motion.div>
  );
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="stats-grid">
        {reportData.quickStats.map((stat, index) => (
          <StatCard key={index} stat={stat} />
        ))}
      </div>

      {/* Main Overview Cards */}
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mobile-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Sales Overview</h3>
            <FiTrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Sales</span>
              <span className="font-semibold text-green-600">
                {currency}
                {reportData.overview.totalSales.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Transactions</span>
              <span className="font-semibold">
                {reportData.overview.totalTransactions}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Avg. Order Value</span>
              <span className="font-semibold">
                {currency}
                {reportData.overview.averageOrderValue.toFixed(2)}
              </span>
            </div>
          </div>
        </motion.div>{" "}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mobile-card mt-6"
          style={{ borderRadius: "12px" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Top Products</h3>
            <FiPackage className="w-5 h-5 text-blue-600" />
          </div>
          <div className="space-y-3">
            {reportData.topProducts.map((product, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.sales} sold</p>
                </div>
                <span className="font-semibold text-green-600">
                  {currency}
                  {product.revenue.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
  const SalesTab = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mobile-card"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Sales Trend</h3>
          <FiBarChart className="w-5 h-5 text-blue-600" />
        </div>

        {/* Simple chart representation */}
        <div className="space-y-3">
          {reportData.salesChart.map((day, index) => {
            const maxSales = Math.max(
              ...reportData.salesChart.map((d) => d.sales)
            );
            const percentage = (day.sales / maxSales) * 100;

            return (
              <div key={index} className="flex items-center space-x-3">
                <span className="text-xs text-gray-600 w-16">
                  {new Date(day.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
                  />
                </div>
                <span className="text-xs font-medium text-gray-900 w-20 text-right">
                  {currency}
                  {day.sales}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );

  const tabs = [
    { id: "overview", label: "Overview", icon: FiActivity },
    { id: "sales", label: "Sales", icon: FiBarChart },
    { id: "inventory", label: "Inventory", icon: FiPackage },
    { id: "customers", label: "Customers", icon: FiUsers },
  ];

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
      <div className="search-filter-section">
        {/* Date Range Selector */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="mobile-form-group">
            <label className="mobile-form-label">From</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
              className="mobile-form-input"
            />
          </div>
          <div className="mobile-form-group">
            <label className="mobile-form-label">To</label>{" "}
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
              className="mobile-form-input"
            />
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={loadReportData}
          className="mobile-action-button w-full"
        >
          <FiRefreshCw size={16} />
          Generate Report
        </motion.button>{" "}
        {/* Tab Navigation */}
        <div className="overflow-x-auto overflow-y-hidden scrollbar-hide">
          <div
            className="flex flex-nowrap space-x-3 pb-2"
            style={{ minWidth: "max-content" }}
          >
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
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
      {/* Content */}
      <div
        className="flex-1 overflow-auto pb-6"
        style={{ padding: "0 16px" }}
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
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <OverviewTab />
            </motion.div>
          )}
          {activeTab === "sales" && (
            <motion.div
              key="sales"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SalesTab />
            </motion.div>
          )}
          {(activeTab === "inventory" || activeTab === "customers") && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center py-12"
            >
              <FiPieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === "inventory"
                  ? "Inventory Reports"
                  : "Customer Reports"}
              </h3>
              <p className="text-gray-500">Coming soon...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>{" "}
      {/* Export Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center z-20"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <FiDownload className="w-6 h-6" />
      </motion.button>
    </div>
  );
}

export default MobileReports;
