import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpring, animated } from "@react-spring/web";
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiPackage,
  FiAlertTriangle,
  FiCheck,
  FiEdit,
  FiEye,
  FiRefreshCw,
  FiClock,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { dataService } from "../../services";
import { useSettingsStore } from "../../store";

const MobileInventory = () => {
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  const { currency = "UGX" } = settings;
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [pullDistance, setPullDistance] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Pull-to-refresh state
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  // Animation for pull-to-refresh
  const pullAnimation = useSpring({
    transform: `translateY(${Math.min(pullDistance, 100)}px)`,
    config: { tension: 300, friction: 30 },
  });

  const refreshIconAnimation = useSpring({
    transform: `rotate(${pullDistance * 3.6}deg)`,
    opacity: Math.min(pullDistance / 50, 1),
    config: { tension: 300, friction: 30 },
  });

  // Load products
  const loadProducts = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const data = await dataService.products.getAll();
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Filter products
  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory]);

  // Pull-to-refresh handlers
  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling || window.scrollY > 0) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);
    setPullDistance(distance);
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 80) {
      setRefreshing(true);
      await loadProducts(false);

      // Add haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      setTimeout(() => {
        setRefreshing(false);
        setPullDistance(0);
        setIsPulling(false);
      }, 1000);
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  const getStockStatus = (product) => {
    const quantity = product.quantity || 0;
    const minStock = product.minStockLevel || 0;

    if (quantity === 0)
      return { status: "out", color: "#ef4444", text: "Out of Stock" };
    if (quantity <= minStock)
      return { status: "low", color: "#f59e0b", text: "Low Stock" };
    return { status: "in", color: "#10b981", text: "In Stock" };
  };

  const categories = [...new Set(products.map((p) => p.category))];
  if (loading) {
    return (
      <div className="mobile-container">
        <div className="loading-container">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="loading-spinner"
          >
            <FiRefreshCw size={32} />
          </motion.div>
          <p>Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mobile-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {" "}
      {/* Pull-to-refresh indicator */}
      {(isPulling || refreshing) && (
        <animated.div style={pullAnimation} className="pull-refresh-indicator">
          <animated.div style={refreshIconAnimation}>
            <FiRefreshCw
              className={`w-6 h-6 ${refreshing ? "animate-spin" : ""}`}
              style={{ color: pullDistance > 80 ? "#10b981" : "#6b7280" }}
            />
          </animated.div>
        </animated.div>
      )}
      {/* Search and Filter Section */}
      <div className="search-filter-section">
        <div className="search-container">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-section">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`filter-button ${showFilters ? "active" : ""}`}
          >
            <FiFilter size={16} />
            Filters
          </motion.button>
        </div>

        {/* Category Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              {" "}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-button w-full"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-3 gap-2 mt-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/inventory/receive")}
            className="mobile-action-button secondary"
            style={{ 
              backgroundColor: "#10b981",
              color: "white",
              border: "none"
            }}
          >
            <FiPackage size={18} />
            Receive
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/inventory/audit")}
            className="mobile-action-button secondary"
            style={{ 
              backgroundColor: "#f59e0b",
              color: "white",
              border: "none"
            }}
          >
            <FiClock size={18} />
            Audit
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/inventory/add")}
            className="mobile-action-button"
          >
            <FiPlus size={18} />
            Add
          </motion.button>
        </div>
      </div>
      {/* Stats Overview */}
      <div className="stats-grid mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="stat-card"
        >
          <div className="stat-content">
            <div className="stat-info">
              <h3>Total Products</h3>
              <div className="stat-value">{products.length}</div>
            </div>
            <div
              className="stat-icon"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              }}
            >
              <FiPackage size={20} style={{ color: "white" }} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="stat-card"
        >
          <div className="stat-content">
            <div className="stat-info">
              <h3>In Stock</h3>
              <div className="stat-value">
                {
                  products.filter((p) => getStockStatus(p).status === "in")
                    .length
                }
              </div>
            </div>
            <div
              className="stat-icon"
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
              }}
            >
              <FiCheck size={20} style={{ color: "white" }} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="stat-card"
        >
          <div className="stat-content">
            <div className="stat-info">
              <h3>Low Stock</h3>
              <div className="stat-value">
                {
                  products.filter((p) => getStockStatus(p).status === "low")
                    .length
                }
              </div>
            </div>
            <div
              className="stat-icon"
              style={{
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
              }}
            >
              <FiAlertTriangle size={20} style={{ color: "white" }} />
            </div>
          </div>
        </motion.div>
      </div>
      {/* Products List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredProducts.map((product, index) => {
            const stockInfo = getStockStatus(product);

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="mobile-list-item"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1 text-lg">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {product.manufacturer}
                    </p>

                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-xl font-bold text-gray-900">
                          {currency} {product.price?.toFixed(2)}
                        </span>
                        <span className="ml-3 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                          Qty: {product.quantity}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <span
                        className={`status-badge ${stockInfo.status === "in" ? "active" : stockInfo.status === "low" ? "low-stock" : "out-of-stock"}`}
                      >
                        {stockInfo.text}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => navigate(`/inventory/view/${product.id}`)}
                      className="mobile-action-button secondary"
                      style={{ padding: "8px" }}
                    >
                      <FiEye size={16} />
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => navigate(`/inventory/edit/${product.id}`)}
                      className="mobile-action-button secondary"
                      style={{ padding: "8px" }}
                    >
                      <FiEdit size={16} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      {/* Empty State */}
      {filteredProducts.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mobile-card text-center py-12"
        >
          <FiPackage
            size={64}
            style={{ color: "#e5e7eb", margin: "0 auto 16px" }}
          />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No products found
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedCategory !== "all"
              ? "Try adjusting your filters"
              : "Add your first product to get started"}
          </p>
          {!searchTerm && selectedCategory === "all" && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/inventory/add")}
              className="mobile-action-button"
            >
              <FiPlus size={20} />
              Add Product
            </motion.button>
          )}
        </motion.div>
      )}
      {/* Floating Action Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate("/inventory/add")}
        className="mobile-fab"
      >
        <FiPlus size={24} />
      </motion.button>
    </div>
  );
};

export default MobileInventory;
