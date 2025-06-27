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
import { useSettings } from "../../contexts/SettingsContext";

const MobilePOS = () => {
  // Get settings for currency and tax rate
  const { settings } = useSettings();
  const { currency = "UGX", taxRate = 18 } = settings;

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
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [creatingCustomer, setCreatingCustomer] = useState(false);

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

  // Cart functions with proper increment/decrement logic like desktop
  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity < product.quantity) {
        setCart(
          cart.map((item) =>
            item.id === product.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  total: (item.quantity + 1) * (item.price || 0),
                }
              : item
          )
        );

        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    } else {
      setCart([
        ...cart,
        {
          ...product,
          quantity: 1,
          total: product.price || 0,
        },
      ]);

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      // Check stock limit
      const product = products.find((p) => p.id === productId);
      const maxQuantity = product ? product.quantity : 0;

      if (newQuantity > maxQuantity) {
        alert(`Only ${maxQuantity} items available in stock`);
        return;
      }

      setCart(
        cart.map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: newQuantity,
                total: newQuantity * (item.price || 0),
              }
            : item
        )
      );
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Customer creation functionality like desktop
  const createNewCustomer = async (customerName) => {
    if (!customerName.trim()) {
      alert("Please enter a customer name");
      return;
    }

    try {
      setCreatingCustomer(true);
      console.log("🔄 [Mobile POS] Creating new customer:", customerName);

      // Parse the name into first and last name
      const nameParts = customerName.trim().split(/\s+/);
      const customerData = {
        firstName: nameParts[0] || "Customer",
        lastName: nameParts.slice(1).join(" ") || "",
      };

      const newCustomer = await dataService.customers.create(customerData);
      console.log("✅ [Mobile POS] New customer created:", newCustomer);

      if (!newCustomer) {
        throw new Error("Customer creation returned null");
      }

      // Add to local customers list
      setCustomers((prev) => [...prev, newCustomer]);

      // Select the newly created customer
      setSelectedCustomer(newCustomer);
      setNewCustomerName("");
      setShowCustomerModal(false);

      return newCustomer;
    } catch (error) {
      console.error("❌ [Mobile POS] Error creating customer:", error);
      alert("Error creating customer. Please try again.");
      return null;
    } finally {
      setCreatingCustomer(false);
    }
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

  // Calculate totals with Uganda tax rate
  const subtotal = cart.reduce(
    (sum, item) => sum + (item.total || (item.price || 0) * item.quantity),
    0
  );
  const tax = subtotal * (taxRate / 100); // Use Uganda VAT rate (18%)
  const total = subtotal + tax;

  // Complete sale with better data structure like desktop
  const completeSale = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    try {
      console.log("🚀 [Mobile POS] Starting sale completion...");
      console.log("🛒 [Mobile POS] Cart items:", cart);

      // Generate transaction number
      const transactionNumber = `TXN-${Date.now()}`;

      const saleData = {
        transactionNumber,
        customerId: selectedCustomer?.id || null,
        date: new Date().toISOString(),
        items: cart.map((item) => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.price || 0,
          total: item.total || item.quantity * (item.price || 0),
        })),
        subtotal,
        tax,
        discount: 0,
        totalAmount: total,
        paymentMethod,
        status: "completed",
        cashierId: 1, // TODO: Get from authenticated user
      };

      console.log("💾 [Mobile POS] Prepared sale data:", saleData);

      const savedSale = await dataService.sales.create(saleData);
      console.log("💰 [Mobile POS] Sale saved to database:", savedSale);

      // Update product quantities
      const updatePromises = cart.map((item) => {
        const currentProduct = products.find((p) => p.id === item.id);
        if (currentProduct) {
          const newQuantity = Math.max(
            0,
            currentProduct.quantity - item.quantity
          );
          return dataService.products.update(item.id, {
            quantity: newQuantity,
          });
        }
      });

      await Promise.all(updatePromises.filter(Boolean));

      // Update local products state
      setProducts(
        products.map((product) => {
          const cartItem = cart.find((item) => item.id === product.id);
          if (cartItem) {
            return {
              ...product,
              quantity: Math.max(0, product.quantity - cartItem.quantity),
            };
          }
          return product;
        })
      );

      // Success feedback
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      // Clear cart and close modals
      clearCart();
      setShowCart(false);
      // Keep customer selected for multiple purchases

      const customerInfo = selectedCustomer
        ? `\nCustomer: ${selectedCustomer.first_name || selectedCustomer.firstName || ""} ${selectedCustomer.last_name || selectedCustomer.lastName || ""}`.trim()
        : "";

      alert(
        `Sale completed! Transaction: ${transactionNumber}\nTotal: ${currency} ${total.toFixed(2)}${customerInfo}\nPayment: ${paymentMethod.replace("_", " ").toUpperCase()}`
      );

      console.log("✅ [Mobile POS] Sale completed successfully");
    } catch (error) {
      console.error("❌ [Mobile POS] Error completing sale:", error);
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
          <div className="flex items-center justify-between mb-4">
            {/* Removed POS heading */}
            <div />
            {/* Cart button will be moved below */}
          </div>
          {/* Search and Cart */}
          <div className="flex gap-3 mb-4">
            <div className="search-container flex-1 relative">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search products or scan barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCart(true)}
                className="mobile-action-button cart-icon-btn absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-200"
                style={{ color: "white", padding: "10px", borderRadius: "12px", lineHeight: 0 }}
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
            {/* Removed camera icon button */}
          </div>
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
              ? `${selectedCustomer.first_name || selectedCustomer.firstName || ""} ${selectedCustomer.last_name || selectedCustomer.lastName || ""}`.trim()
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
                    {currency} {product.price?.toFixed(2)}
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
                                  <span className="text-gray-500">
                                    {currency}
                                  </span>
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
                                  {currency}
                                  {(item.price || 0).toFixed(2)} each
                                  <span className="text-gray-400">✏️</span>
                                </span>
                              )}
                            </div>

                            <div className="text-xs font-medium text-gray-800">
                              Total: {currency}
                              {(
                                item.total || (item.price || 0) * item.quantity
                              ).toFixed(2)}
                            </div>
                          </div>

                          <div className="cart-quantity-controls">
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              className="cart-quantity-button minus"
                            >
                              <FiMinus className="w-4 h-4" />
                            </motion.button>

                            <span className="cart-quantity-display">
                              {item.quantity}
                            </span>

                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              disabled={
                                item.quantity >=
                                (products.find((p) => p.id === item.id)
                                  ?.quantity || 0)
                              }
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
                        <FiDollarSign className="w-4 h-4" />
                        Cash
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setPaymentMethod("mobile_money")}
                        className={`payment-method-button ${
                          paymentMethod === "mobile_money" ? "active" : ""
                        }`}
                      >
                        <FiCreditCard className="w-4 h-4" />
                        Mobile
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setPaymentMethod("bank")}
                        className={`payment-method-button ${
                          paymentMethod === "bank" ? "active" : ""
                        }`}
                      >
                        <FiCreditCard className="w-4 h-4" />
                        Bank
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setPaymentMethod("credit")}
                        className={`payment-method-button ${
                          paymentMethod === "credit" ? "active" : ""
                        }`}
                      >
                        <FiCreditCard className="w-4 h-4" />
                        Credit
                      </motion.button>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="cart-totals">
                    <div className="cart-total-row">
                      <span>Subtotal:</span>
                      <span className="font-semibold">
                        {currency}
                        {subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="cart-total-row">
                      <span>Tax ({taxRate}%):</span>
                      <span className="font-semibold">
                        {currency}
                        {tax.toFixed(2)}
                      </span>
                    </div>
                    <div className="cart-total-row final">
                      <span>Total:</span>
                      <span>
                        {currency}
                        {total.toFixed(2)}
                      </span>
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
                {/* Add new customer section */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Add New Customer
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter customer name..."
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => createNewCustomer(newCustomerName)}
                      disabled={!newCustomerName.trim() || creatingCustomer}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creatingCustomer ? "Adding..." : "Add"}
                    </motion.button>
                  </div>
                </div>

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
                        {customer.first_name || customer.firstName}{" "}
                        {customer.last_name || customer.lastName}
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
