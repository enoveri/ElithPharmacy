import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiArrowLeft, FiShoppingCart } from "react-icons/fi";
import { dataService } from "../services";
import { useSettingsStore } from "../store";

function Refunds() {
  // Settings store for currency
  const { settings } = useSettingsStore();
  const { currency } = settings;

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return `${currency} ${(amount || 0).toFixed(2)}`;
  };

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [products, setProducts] = useState([]);

  // Load products for reference
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsData = await dataService.products.getAll();
        setProducts(productsData || []);
      } catch (error) {
        console.error("❌ [Refunds] Error loading products:", error);
      }
    };
    loadProducts();
  }, []);

  const handleSearch = () => {
    console.log("🔍 [Refunds] Searching for transaction:", searchTerm);

    // TODO: Replace with actual sales/transaction search when sales system is implemented
    // For now, create a mock transaction based on available products
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
          quantity: 1 + index,
          price: product.price || 10,
          total: (product.price || 10) * (1 + index),
        })),
      };

      setSelectedTransaction(mockTransaction);
      console.log("✅ [Refunds] Mock transaction created:", mockTransaction);
    } else {
      setSelectedTransaction(null);
      console.log(
        "❌ [Refunds] Transaction not found or no products available"
      );
    }
  };

  const handleItemSelect = (item) => {
    const existing = selectedItems.find((i) => i.id === item.id);
    if (existing) {
      setSelectedItems(selectedItems.filter((i) => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleRefund = () => {
    if (!selectedTransaction || selectedItems.length === 0 || !refundReason) {
      return;
    }

    // Create refund record
    const refund = {
      transactionId: selectedTransaction.id,
      date: new Date().toISOString(),
      items: selectedItems,
      reason: refundReason,
      amount: selectedItems.reduce((sum, item) => sum + item.total, 0),
    };

    // In a real app, this would be sent to the backend
    console.log("Processing refund:", refund);

    // Reset form
    setSelectedTransaction(null);
    setSelectedItems([]);
    setRefundReason("");
    setSearchTerm("");
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {" "}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/sales")}
          className="btn btn-icon"
          title="Go Back"
        >
          <FiArrowLeft />
        </button>
        <button
          onClick={() => navigate("/pos")}
          className="btn btn-outline btn-sm flex items-center gap-2"
        >
          <FiShoppingCart />
          Back to POS
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Search Section */}
        <div className="bg-[var(--color-bg-card)] p-4 rounded-lg shadow-[var(--shadow-card)]">
          <h3 className="font-semibold mb-4">Find Transaction</h3>{" "}
          <div className="flex gap-2">
            <div className="flex-1 relative min-w-[300px]">
              <FiSearch className="absolute left-10 top-1/2 transform -translate-y-1/2 text-black-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="                Enter transaction ID..."
                className="form-input w-full pl-10 pr-4 py-2"
              />
            </div>
            <button onClick={handleSearch} className="btn btn-primary">
              Search
            </button>
          </div>
        </div>

        {selectedTransaction && (
          <>
            {/* Transaction Details */}
            <div className="bg-[var(--color-bg-card)] p-4 rounded-lg shadow-[var(--shadow-card)]">
              <h3 className="font-semibold mb-4">Transaction Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction ID</span>
                  <span>{selectedTransaction.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span>
                    {new Date(selectedTransaction.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer</span>
                  <span>{selectedTransaction.customer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Amount</span>
                  <span>{formatCurrency(selectedTransaction.amount)}</span>
                </div>
              </div>
            </div>

            {/* Items Selection */}
            <div className="bg-[var(--color-bg-card)] p-4 rounded-lg shadow-[var(--shadow-card)] md:col-span-2">
              <h3 className="font-semibold mb-4">Select Items to Refund</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-[var(--color-border-light)]">
                      <th className="py-3 px-4 text-left">Select</th>
                      <th className="py-3 px-4 text-left">Product</th>
                      <th className="py-3 px-4 text-right">Price</th>
                      <th className="py-3 px-4 text-right">Quantity</th>
                      <th className="py-3 px-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTransaction.items?.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-[var(--color-border-light)]"
                      >
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.some(
                              (i) => i.id === item.id
                            )}
                            onChange={() => handleItemSelect(item)}
                            className="form-checkbox"
                          />
                        </td>
                        <td className="py-3 px-4">{item.name}</td>
                        <td className="py-3 px-4 text-right">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Refund Details */}
            <div className="bg-[var(--color-bg-card)] p-4 rounded-lg shadow-[var(--shadow-card)] md:col-span-2">
              <h3 className="font-semibold mb-4">Refund Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Reason for Refund
                  </label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="form-textarea w-full"
                    rows={3}
                    placeholder="Enter reason for refund..."
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-500">Refund Amount</div>
                    <div className="text-xl font-semibold">
                      {formatCurrency(
                        selectedItems.reduce((sum, item) => sum + item.total, 0)
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleRefund}
                    disabled={selectedItems.length === 0 || !refundReason}
                    className="btn btn-primary"
                  >
                    Process Refund
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Refunds;
