import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  FiAlertCircle,
  FiPackage,
} from "react-icons/fi";
import { dataService } from "../../services";
import { useSalesStore, useSettingsStore } from "../../store";

function MobileSalesHistory() {
  const { settings } = useSettingsStore();
  const { currency } = settings;
  const location = useLocation();
  const navigate = useNavigate();

  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [showFilters, setShowFilters] = useState(false);
  const [highlightedSale, setHighlightedSale] = useState(null);

  // Pull-to-refresh animation
  const [{ y }, api] = useSpring(() => ({ y: 0 }));

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterSales();
  }, [sales, customers, searchTerm, selectedStatus, selectedPeriod]);

  useEffect(() => {
    if (location.state?.saleId) {
      setHighlightedSale(location.state.saleId);
      const saleElement = document.getElementById(
        `sale-${location.state.saleId}`
      );
      if (saleElement) {
        saleElement.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
          setHighlightedSale(null);
        }, 3000);
      }
    }
  }, [location.state]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [salesData, customersData] = await Promise.all([
        dataService.sales.getAll(),
        dataService.customers.getAll().catch(() => []),
      ]);
      setSales(salesData || []);
      setCustomers(customersData || []);
    } catch (err) {
      setError("Failed to load sales data");
      setSales([]);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (customerId) => {
    if (!customerId) return "Walk-in Customer";
    const customer = customers.find((c) => c.id === customerId);
    return customer
      ? `${customer.firstName || customer.first_name || ""} ${customer.lastName || customer.last_name || ""}`.trim() ||
          customer.name ||
          `Customer #${customerId}`
      : `Customer #${customerId}`;
  };

  const getPaymentMethodDisplay = (method) => {
    const paymentMethods = {
      cash: "Cash",
      mobile_money: "Mobile Money",
      bank: "Bank Transfer",
      credit: "Credit",
    };
    return paymentMethods[method] || method || "Unknown";
  };

  const getPaymentMethodColor = (method) => {
    const colors = {
      cash: "#10b981",
      mobile_money: "#f59e0b",
      bank: "#3b82f6",
      credit: "#ef4444",
    };
    return colors[method] || "#6b7280";
  };

  const filterSales = () => {
    let filtered = sales;
    if (searchTerm) {
      filtered = filtered.filter(
        (sale) =>
          (sale.id && sale.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (getCustomerName(sale.customerId).toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (selectedStatus !== "all") {
      filtered = filtered.filter((sale) => sale.status === selectedStatus);
    }
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
      await loadData();
      setTimeout(() => {
        api.start({ y: 0 });
        setRefreshing(false);
      }, 500);
    } catch (error) {
      api.start({ y: 0 });
      setRefreshing(false);
    }
  };

  // Summary stats (safe defaults)
  const totalRevenue = filteredSales.reduce(
    (sum, sale) => (sale.status === "completed" ? sum + (sale.total || 0) : sum),
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
    const safeTotal = typeof sale.total === "number" ? sale.total : 0;
    const safeItems = typeof sale.items === "number" ? sale.items : 0;
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
              {getCustomerName(sale.customerId)}
            </div>
            <div className="text-xs text-gray-500 truncate">
              Sale #{sale.id} • {safeItems} item{safeItems !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold gradient-text">
              {currency}{safeTotal.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              {(sale.paymentMethod || "").toUpperCase()}
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "var(--color-bg-main)",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "4px solid #f3f4f6",
            borderTop: "4px solid #3b82f6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "24px",
          backgroundColor: "var(--color-bg-main)",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
            textAlign: "center",
          }}
        >
          <FiAlertCircle
            size={64}
            style={{ color: "#ef4444", marginBottom: "16px" }}
          />
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#374151",
              marginBottom: "8px",
            }}
          >
            Error Loading Sales Data
          </h2>
          <p style={{ color: "#6b7280", marginBottom: "24px" }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "12px 20px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "12px", // slightly less padding for mobile
        backgroundColor: "var(--color-bg-main)",
        minHeight: "100vh",
      }}
    >
      <div style={{ marginBottom: "20px" }}>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "15px" }}>
          View and manage your sales transactions
        </p>
      </div>
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "10px",
          padding: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        {sales.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "32px",
              textAlign: "center",
            }}
          >
            <FiPackage
              size={40}
              style={{ color: "#9ca3af", marginBottom: "12px" }}
            />
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "6px",
              }}
            >
              No Sales Found
            </h3>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              No sales transactions have been recorded yet.
            </p>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {sales
              .map((sale) => {
                // Ensure sale object has required properties
                if (!sale || !sale.id) {
                  return null;
                }

                return (
                  <div
                    key={sale.id}
                    id={`sale-${sale.id}`}
                    onClick={() => navigate(`/sales/${sale.id}`)}
                    style={{
                      padding: "10px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "7px",
                      backgroundColor:
                        highlightedSale === sale.id ? "#fef3c7" : "transparent",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#1f2937",
                          }}
                        >
                          {sale.transactionNumber ||
                            sale.transaction_number ||
                            `Transaction #${sale.id}`}
                        </h3>
                        <p style={{ fontSize: "12px", color: "#6b7280" }}>
                          {sale.date
                            ? new Date(sale.date).toLocaleDateString()
                            : "Unknown date"}
                          {sale.date &&
                            ` at ${new Date(sale.date).toLocaleTimeString()}`}
                        </p>
                      </div>
                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight: "bold",
                          color: "#10b981",
                        }}
                      >
                        {currency}
                        {(sale.totalAmount || sale.total_amount || 0).toFixed(2)}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)", // 2 columns for mobile
                        gap: "10px",
                        fontSize: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <FiUser color="#6b7280" size={14} />
                        <div>
                          <div style={{ fontWeight: "500", color: "#1f2937" }}>
                            {getCustomerName(
                              sale.customerId || sale.customer_id
                            )}
                          </div>
                          <div style={{ fontSize: "11px", color: "#6b7280" }}>
                            Customer
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <FiPackage color="#6b7280" size={14} />
                        <div>
                          <div style={{ fontWeight: "500", color: "#1f2937" }}>
                            {sale.items && Array.isArray(sale.items)
                              ? sale.items.length
                              : sale.sale_items &&
                                Array.isArray(sale.sale_items)
                              ? sale.sale_items.length
                              : 0} item(s)
                          </div>
                          <div style={{ fontSize: "11px", color: "#6b7280" }}>
                            Products
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <FiDollarSign color="#6b7280" size={14} />
                        <div>
                          <div style={{ fontWeight: "500", color: "#1f2937" }}>
                            {currency}
                            {(sale.subtotal || 0).toFixed(2)}
                          </div>
                          <div style={{ fontSize: "11px", color: "#6b7280" }}>
                            Subtotal
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <div
                          style={{
                            width: "14px",
                            height: "14px",
                            borderRadius: "50%",
                            backgroundColor: getPaymentMethodColor(
                              sale.paymentMethod || sale.payment_method
                            ),
                          }}
                        />
                        <div>
                          <div
                            style={{
                              fontWeight: "500",
                              color: "#1f2937",
                            }}
                          >
                            {getPaymentMethodDisplay(
                              sale.paymentMethod || sale.payment_method
                            )}
                          </div>
                          <div style={{ fontSize: "11px", color: "#6b7280" }}>
                            Payment
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
              .filter(Boolean)}
          </div>
        )}
      </div>
    </div>
  );
}

export default MobileSalesHistory;
