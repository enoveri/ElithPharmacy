import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiShoppingCart,
  FiMinus,
  FiPlus,
  FiXCircle,
  FiCreditCard,
  FiDollarSign,
  FiUser,
  FiCheck,
  FiCamera,
} from "react-icons/fi";
import { dataService } from "../../services";

const MobilePOS = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [tempPrice, setTempPrice] = useState("");

  // Remove cart animation to prevent interfering with centering

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [productsData, categoriesData, customersData] = await Promise.all(
          [
            dataService.products.getAll(),
            dataService.categories.getAll().catch(() => []),
            dataService.customers.getAll().catch(() => []),
          ]
        );

        setProducts(productsData || []);
        setCategories(categoriesData || []);
        setCustomers(customersData || []);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    const hasStock = product.quantity > 0;
    return matchesSearch && matchesCategory && hasStock;
  });

  // Cart functions
  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity < product.quantity) {
        setCart(
          cart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );

        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  };

  const removeFromCart = (productId) => {
    const existingItem = cart.find((item) => item.id === productId);

    if (existingItem.quantity === 1) {
      setCart(cart.filter((item) => item.id !== productId));
    } else {
      setCart(
        cart.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      );
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  // Handle price editing
  const startEditingPrice = (itemId, currentPrice) => {
    setEditingPrice(itemId);
    setTempPrice(currentPrice.toString());
  };

  const cancelEditingPrice = () => {
    setEditingPrice(null);
    setTempPrice("");
  };

  const saveEditedPrice = (itemId) => {
    const newPrice = parseFloat(tempPrice);
    if (isNaN(newPrice) || newPrice < 0) {
      alert("Please enter a valid price");
      return;
    }

    setCart(
      cart.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            price: newPrice,
            total: item.quantity * newPrice,
          };
        }
        return item;
      })
    );

    setEditingPrice(null);
    setTempPrice("");
  };

  const handlePriceKeyPress = (e, itemId) => {
    if (e.key === "Enter") {
      saveEditedPrice(itemId);
    } else if (e.key === "Escape") {
      cancelEditingPrice();
    }
  };

  // Calculate totals
  const subtotal = cart.reduce(
    (sum, item) => sum + (item.price || 0) * item.quantity,
    0
  );
  const tax = subtotal * 0.075; // 7.5% VAT
  const total = subtotal + tax;

  // Complete sale
  const completeSale = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    try {
      const saleData = {
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price || 0,
          total: (item.price || 0) * item.quantity,
        })),
        customer_id: selectedCustomer?.id || null,
        subtotal,
        tax,
        total,
        payment_method: paymentMethod,
        status: "completed",
      };

      await dataService.sales.create(saleData);

      // Update product quantities
      for (const item of cart) {
        await dataService.products.update(item.id, {
          quantity: item.quantity - item.quantity,
        });
      }

      // Success feedback
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      // Clear cart and close modals
      clearCart();
      setShowCart(false);
      setSelectedCustomer(null);

      alert("Sale completed successfully!");
    } catch (error) {
      console.error("Error completing sale:", error);
      alert("Error completing sale. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="mobile-container relative">
      {" "}
      {/* Fixed Header Section */}
      <div className="pos-fixed-header">
        <div className="px-4 py-4">
          {" "}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold pos-title">Point of Sale</h1>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCart(true)}
              className="mobile-action-button relative bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-200"
              style={{
                color: "white",
                padding: "12px",
                borderRadius: "12px",
              }}
            >
              <FiShoppingCart size={20} color="white" />
              {cart.length > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold shadow-lg"
                >
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </motion.div>
              )}
            </motion.button>
          </div>
          {/* Search and Scanner */}
          <div className="flex gap-3 mb-4">
            <div className="search-container flex-1">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search products or scan barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              className="mobile-action-button secondary"
              style={{ padding: "12px" }}
            >
              <FiCamera size={20} />
            </motion.button>
          </div>{" "}
          {/* Categories */}
          <div className="mb-4">
            <div className="pos-categories-container overflow-x-auto overflow-y-hidden">
              <div
                className="flex flex-nowrap space-x-4 pb-2"
                style={{ minWidth: "max-content" }}
              >
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory("all")}
                  className={`flex items-center px-6 py-3 rounded-2xl font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                    selectedCategory === "all"
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 transform scale-105"
                      : "bg-white/90 backdrop-blur-sm text-gray-700 border border-white/50 hover:bg-white hover:shadow-md hover:scale-102"
                  }`}
                >
                  All
                </motion.button>
                {categories.map((category) => (
                  <motion.button
                    key={category.id || category}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      setSelectedCategory(category.name || category)
                    }
                    className={`flex items-center px-6 py-3 rounded-2xl font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                      selectedCategory === (category.name || category)
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 transform scale-105"
                        : "bg-white/90 backdrop-blur-sm text-gray-700 border border-white/50 hover:bg-white hover:shadow-md hover:scale-102"
                    }`}
                  >
                    {category.name || category}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
          {/* Customer Selection */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCustomerModal(true)}
            className="mobile-action-button secondary w-full"
          >
            <FiUser size={20} />
            {selectedCustomer
              ? selectedCustomer.name
              : "Select Customer (Optional)"}
          </motion.button>
        </div>
      </div>{" "}
      {/* Spacer for main header + POS fixed header */}
      <div style={{ height: "384px" }}></div>
      {/* Products Grid */}
      <div className="px-4 pb-20">
        <div className="grid grid-cols-2 gap-3">
          <AnimatePresence>
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                className="mobile-list-item text-center"
              >
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 mb-2">
                  {product.manufacturer}
                </p>

                <div className="mb-3">
                  <span className="text-lg font-bold gradient-text">
                    ₦{product.price?.toFixed(2)}
                  </span>
                  <p className="text-xs text-gray-500 bg-gray-100 rounded-lg px-2 py-1 mt-1 inline-block">
                    Stock: {product.quantity}
                  </p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => addToCart(product)}
                  disabled={product.quantity === 0}
                  className="mobile-action-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiPlus size={16} />{" "}
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      {/* Cart Overlay */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCart(false)}
            className="cart-modal-overlay"
          >
            <div
              className="cart-modal"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
              <div className="cart-modal-header">
                <div className="flex items-center justify-between">
                  <h2 className="cart-modal-title">Shopping Cart</h2>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowCart(false)}
                    className="cart-close-button"
                  >
                    <FiXCircle className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              <div className="cart-modal-content">
                {cart.length === 0 ? (
                  <div className="cart-empty-state">
                    <div className="cart-empty-icon">
                      <FiShoppingCart className="w-10 h-10" />
                    </div>
                    <p className="text-lg font-medium">Your cart is empty</p>
                    <p className="text-sm mt-2">
                      Add some products to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <motion.div key={item.id} layout className="cart-item">
                        <div className="flex items-start justify-between">
                          <div className="cart-item-info flex-1 pr-3">
                            <h3 className="font-semibold text-gray-900 text-sm mb-1">
                              {item.name}
                            </h3>

                            {/* Editable Price */}
                            <div className="text-xs text-gray-600 mb-2">
                              {editingPrice === item.id ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-500">₦</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={tempPrice}
                                    onChange={(e) =>
                                      setTempPrice(e.target.value)
                                    }
                                    onKeyDown={(e) =>
                                      handlePriceKeyPress(e, item.id)
                                    }
                                    onBlur={() => saveEditedPrice(item.id)}
                                    autoFocus
                                    className="w-16 px-1 py-0.5 text-xs border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  <span className="text-gray-500">each</span>
                                </div>
                              ) : (
                                <span
                                  onClick={() =>
                                    startEditingPrice(item.id, item.price || 0)
                                  }
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-gray-50 border border-transparent hover:bg-gray-100 hover:border-gray-200 cursor-pointer transition-all duration-200"
                                  title="Tap to edit price"
                                >
                                  ₦{(item.price || 0).toFixed(2)} each
                                  <span className="text-gray-400">✏️</span>
                                </span>
                              )}
                            </div>

                            <div className="text-xs font-medium text-gray-800">
                              Total: ₦
                              {((item.price || 0) * item.quantity).toFixed(2)}
                            </div>
                          </div>

                          <div className="cart-quantity-controls">
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => removeFromCart(item.id)}
                              className="cart-quantity-button minus"
                            >
                              <FiMinus className="w-4 h-4" />
                            </motion.button>

                            <span className="cart-quantity-display">
                              {item.quantity}
                            </span>

                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => addToCart(item)}
                              disabled={item.quantity >= item.quantity}
                              className="cart-quantity-button plus"
                            >
                              <FiPlus className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="cart-modal-footer">
                  {/* Payment Method */}
                  <div className="payment-method-section">
                    <label className="payment-method-label">
                      Payment Method
                    </label>
                    <div className="payment-method-grid">
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setPaymentMethod("cash")}
                        className={`payment-method-button ${
                          paymentMethod === "cash" ? "active" : ""
                        }`}
                      >
                        <FiDollarSign className="w-5 h-5" />
                        Cash
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setPaymentMethod("card")}
                        className={`payment-method-button ${
                          paymentMethod === "card" ? "active" : ""
                        }`}
                      >
                        <FiCreditCard className="w-5 h-5" />
                        Card
                      </motion.button>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="cart-totals">
                    <div className="cart-total-row">
                      <span>Subtotal:</span>
                      <span className="font-semibold">
                        ₦{subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="cart-total-row">
                      <span>Tax (7.5%):</span>
                      <span className="font-semibold">₦{tax.toFixed(2)}</span>
                    </div>
                    <div className="cart-total-row final">
                      <span>Total:</span>
                      <span>₦{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="cart-action-buttons">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={clearCart}
                      className="cart-clear-button"
                    >
                      Clear Cart
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={completeSale}
                      disabled={loading}
                      className="cart-complete-button"
                    >
                      <FiCheck className="w-5 h-5" />
                      {loading ? "Processing..." : "Complete Sale"}
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Customer Modal */}
      <AnimatePresence>
        {showCustomerModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCustomerModal(false)}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-4 bg-white rounded-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    Select Customer
                  </h2>{" "}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowCustomerModal(false)}
                    className="p-2 rounded-full bg-gray-100"
                  >
                    <FiXCircle className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedCustomer(null);
                    setShowCustomerModal(false);
                  }}
                  className="w-full p-3 mb-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600"
                >
                  No Customer (Walk-in)
                </motion.button>

                <div className="space-y-2">
                  {customers.map((customer) => (
                    <motion.button
                      key={customer.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setShowCustomerModal(false);
                      }}
                      className="w-full p-3 bg-gray-50 rounded-lg text-left"
                    >
                      <div className="font-semibold text-gray-900">
                        {customer.first_name} {customer.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {customer.phone}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobilePOS;
