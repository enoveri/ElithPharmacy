import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiArrowLeft,
  FiShoppingCart,
  FiRefreshCw,
  FiDollarSign,
  FiCheck,
  FiXCircle,
} from "react-icons/fi";
import { dataService } from "../../services";
import { useSettingsStore } from "../../store";

function MobileRefunds() {
  const { settings } = useSettingsStore();
  const { currency } = settings;
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const formatCurrency = (amount) => {
    return `${currency} ${(amount || 0).toFixed(2)}`;
  };

  // Load products for reference
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const productsData = await dataService.products.getAll();
        setProducts(productsData || []);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleSearch = () => {
    if (searchTerm && products.length > 0) {
      const mockTransaction = {
        id: searchTerm,
        transactionNumber: `TXN-${searchTerm}`,
        date: new Date().toISOString(),
        amount: 50.0,
        status: "completed",
        items: products.slice(0, 2).map((product, index) => ({
          id: product.id,
          name: product.name,
          quantity: index + 1,
          unitPrice: product.price,
          total: product.price * (index + 1),
          refundable: true,
        })),
      };
      setSelectedTransaction(mockTransaction);
      setSelectedItems(
        mockTransaction.items.map((item) => ({ ...item, refundQuantity: 0 }))
      );
    }
  };

  const handleItemRefundChange = (itemId, quantity) => {
    setSelectedItems((items) =>
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              refundQuantity: Math.max(0, Math.min(quantity, item.quantity)),
            }
          : item
      )
    );
  };

  const calculateRefundTotal = () => {
    return selectedItems.reduce((total, item) => {
      return total + item.unitPrice * item.refundQuantity;
    }, 0);
  };

  const processRefund = async () => {
    if (!selectedTransaction || calculateRefundTotal() === 0) return;

    setLoading(true);
    try {
      // Simulate refund processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      alert("Refund processed successfully!");
      setSelectedTransaction(null);
      setSelectedItems([]);
      setRefundReason("");
      setSearchTerm("");
    } catch (error) {
      console.error("Error processing refund:", error);
      alert("Error processing refund. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !selectedTransaction) {
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
          <p>Loading refunds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      {/* Search Section */}
      <div className="search-filter-section mb-6">
        <h1 className="text-xl font-bold gradient-text mb-4">
          Process Refunds
        </h1>

        <div className="search-container">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Enter transaction ID or receipt number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSearch}
          disabled={!searchTerm}
          className="mobile-action-button w-full mt-3 disabled:opacity-50"
        >
          <FiSearch size={20} />
          Search Transaction
        </motion.button>
      </div>

      {/* Transaction Details */}
      <AnimatePresence>
        {selectedTransaction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Transaction Info */}
            <div className="mobile-card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Transaction Details
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-medium">
                    {selectedTransaction.transactionNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">
                    {new Date(selectedTransaction.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Original Amount:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(selectedTransaction.amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Items to Refund */}
            <div className="mobile-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Select Items to Refund
              </h3>
              <div className="space-y-3">
                {selectedItems.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(item.unitPrice)} × {item.quantity}
                        </p>
                      </div>
                      <span className="font-bold text-gray-900">
                        {formatCurrency(item.total)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">Refund Qty:</span>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() =>
                            handleItemRefundChange(
                              item.id,
                              item.refundQuantity - 1
                            )
                          }
                          className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center"
                        >
                          -
                        </motion.button>
                        <span className="w-8 text-center font-medium">
                          {item.refundQuantity}
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() =>
                            handleItemRefundChange(
                              item.id,
                              item.refundQuantity + 1
                            )
                          }
                          className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center"
                        >
                          +
                        </motion.button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Refund Reason */}
            <div className="mobile-card">
              <div className="mobile-form-group">
                <label className="mobile-form-label">Refund Reason</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter reason for refund..."
                  className="mobile-form-input resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Refund Summary */}
            <div className="mobile-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Refund Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Refund Amount:</span>
                  <span className="text-xl font-bold text-red-600">
                    {formatCurrency(calculateRefundTotal())}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedTransaction(null);
                  setSelectedItems([]);
                  setRefundReason("");
                }}
                className="mobile-action-button secondary"
              >
                <FiXCircle size={20} />
                Cancel
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={processRefund}
                disabled={
                  calculateRefundTotal() === 0 ||
                  !refundReason.trim() ||
                  loading
                }
                className="mobile-action-button disabled:opacity-50"
              >
                {loading ? (
                  <FiRefreshCw size={20} className="animate-spin" />
                ) : (
                  <FiCheck size={20} />
                )}
                {loading ? "Processing..." : "Process Refund"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!selectedTransaction && !loading && (
        <div className="mobile-card text-center py-12">
          <FiShoppingCart
            size={64}
            style={{ color: "#e5e7eb", margin: "0 auto 16px" }}
          />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Transaction Selected
          </h3>
          <p className="text-gray-500">
            Enter a transaction ID or receipt number to start processing a
            refund
          </p>
        </div>
      )}
    </div>
  );
}

export default MobileRefunds;
