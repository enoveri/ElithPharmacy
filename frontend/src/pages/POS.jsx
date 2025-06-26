import { useState, useEffect } from "react";
import {
  FiSearch,
  FiPlus,
  FiMinus,
  FiTrash2,
  FiDollarSign,
  FiUser,
  FiCreditCard,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiPackage,
  FiAlertTriangle,
  FiInfo,
} from "react-icons/fi";
import { dataService } from "../services";
import { useNotificationsStore, useSettingsStore } from "../store";

// Enhanced Error Modal Component
const ErrorModal = ({ isOpen, onClose, title, message, type = "error" }) => {
  if (!isOpen) return null;

  const icons = {
    error: FiAlertCircle,
    success: FiCheckCircle,
    warning: FiAlertTriangle,
    info: FiInfo,
  };

  const colors = {
    error: {
      bg: "#fef2f2",
      border: "#ef4444",
      icon: "#dc2626",
      text: "#991b1b",
      button: "#ef4444"
    },
    success: {
      bg: "#f0fdf4",
      border: "#10b981",
      icon: "#059669",
      text: "#065f46",
      button: "#10b981"
    },
    warning: {
      bg: "#fffbeb",
      border: "#f59e0b",
      icon: "#d97706",
      text: "#92400e",
      button: "#f59e0b"
    },
    info: {
      bg: "#eff6ff",
      border: "#3b82f6",
      icon: "#2563eb",
      text: "#1e40af",
      button: "#3b82f6"
    }
  };

  const IconComponent = icons[type];
  const colorScheme = colors[type];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "20px",
          padding: "32px 24px",
          maxWidth: "420px",
          width: "100%",
          border: `2px solid ${colorScheme.border}`,
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.15)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "50%",
            color: "#6b7280",
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = "#f3f4f6";
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = "transparent";
          }}
        >
          <FiX size={20} />
        </button>

        {/* Icon and Title */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              backgroundColor: colorScheme.bg,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              border: `3px solid ${colorScheme.border}`,
              boxShadow: `0 4px 20px ${colorScheme.border}20`,
            }}
          >
            <IconComponent size={36} color={colorScheme.icon} />
          </div>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: "700",
              color: "#1f2937",
              margin: "0 0 8px 0",
              lineHeight: "1.3",
            }}
          >
            {title}
          </h2>
        </div>

        {/* Message */}
        <div
          style={{
            backgroundColor: colorScheme.bg,
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "24px",
            border: `1px solid ${colorScheme.border}20`,
          }}
        >
          <p
            style={{
              color: colorScheme.text,
              margin: 0,
              lineHeight: "1.6",
              fontSize: "15px",
              whiteSpace: "pre-line",
            }}
          >
            {message}
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "14px 24px",
            backgroundColor: colorScheme.button,
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: `0 4px 14px ${colorScheme.button}30`,
          }}
          onMouseOver={(e) => {
            e.target.style.transform = "translateY(-1px)";
            e.target.style.boxShadow = `0 6px 20px ${colorScheme.button}40`;
          }}
          onMouseOut={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = `0 4px 14px ${colorScheme.button}30`;
          }}
        >
          {type === "success" ? "Great!" : type === "warning" ? "Got It" : "Understood"}
        </button>
      </div>
    </div>
  );
};

// Enhanced Toast Notification Component
const Toast = ({ isVisible, message, type = "success", onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000); // Auto-close after 4 seconds
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const colors = {
    success: {
      bg: "#10b981",
      icon: "#ffffff",
      text: "#ffffff"
    },
    error: {
      bg: "#ef4444",
      icon: "#ffffff", 
      text: "#ffffff"
    },
    warning: {
      bg: "#f59e0b",
      icon: "#ffffff",
      text: "#ffffff"
    },
    info: {
      bg: "#3b82f6",
      icon: "#ffffff",
      text: "#ffffff"
    }
  };

  const icons = {
    success: FiCheckCircle,
    error: FiAlertCircle,
    warning: FiAlertTriangle,
    info: FiInfo
  };

  const colorScheme = colors[type];
  const IconComponent = icons[type];

  return (
    <div
      style={{
        position: "fixed",
        top: "90px", // Below header
        right: "20px",
        backgroundColor: colorScheme.bg,
        color: colorScheme.text,
        padding: "16px 20px",
        borderRadius: "12px",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        zIndex: 10000,
        maxWidth: "350px",
        animation: "slideInRight 0.3s ease-out",
        backdropFilter: "blur(8px)",
      }}
    >
      <IconComponent size={20} color={colorScheme.icon} />
      <span style={{ 
        fontSize: "14px", 
        fontWeight: "500",
        flex: 1,
        lineHeight: "1.4"
      }}>
        {message}
      </span>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: colorScheme.text,
          cursor: "pointer",
          padding: "4px",
          borderRadius: "4px",
          opacity: 0.8,
        }}
        onMouseOver={(e) => {
          e.target.style.opacity = "1";
          e.target.style.backgroundColor = "rgba(255,255,255,0.1)";
        }}
        onMouseOut={(e) => {
          e.target.style.opacity = "0.8";
          e.target.style.backgroundColor = "transparent";
        }}
      >
        <FiX size={16} />
      </button>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

// Add CSS for loading spinner
const loadingStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = loadingStyles;
  document.head.appendChild(style);
}

function POS() {
  // Settings store for currency and receipt settings
  const { settings } = useSettingsStore();
  const { currency, taxRate, receiptHeader, receiptFooter } = settings;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [customer, setCustomer] = useState(null);
  const [editingPrice, setEditingPrice] = useState(null);
  const [tempPrice, setTempPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [processing, setProcessing] = useState(false);
  
  // Error modal states
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "error"
  });
  
  // Toast notification states
  const [toast, setToast] = useState({
    isVisible: false,
    message: "",
    type: "success"
  });
  
  // Customer search states
  const [customers, setCustomers] = useState([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Helper function to show error modal
  const showError = (title, message, type = "error") => {
    setErrorModal({
      isOpen: true,
      title,
      message,
      type
    });
  };

  // Helper function to show success modal
  const showSuccess = (title, message) => {
    setErrorModal({
      isOpen: true,
      title,
      message,
      type: "success"
    });
  };

  // Helper function to show toast notification
  const showToast = (message, type = "success") => {
    setToast({
      isVisible: true,
      message,
      type
    });
  };

  // Helper function to close modal
  const closeModal = () => {
    setErrorModal({
      isOpen: false,
      title: "",
      message: "",
      type: "error"
    });
  };

  // Helper function to close toast
  const closeToast = () => {
    setToast({
      isVisible: false,
      message: "",
      type: "success"
    });
  };

  // Load products and categories
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("🔄 [POS] Loading products and categories...");
        setLoading(true);
        const [productsData, categoriesData, customersData] = await Promise.all(
          [
            dataService.products.getAll(),
            dataService.categories.getAll().catch(() => []),
            dataService.customers.getAll().catch(() => []),
          ]
        );

        console.log("✅ [POS] Products loaded:", productsData?.length || 0);
        console.log("✅ [POS] Categories loaded:", categoriesData?.length || 0);
        console.log("✅ [POS] Customers loaded:", customersData?.length || 0);

        setProducts(productsData || []);
        setCategories(categoriesData || []);
        setCustomers(customersData || []);
      } catch (error) {
        console.error("❌ [POS] Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);
  const filteredProducts = products.filter((product) => {
    const productName = (product.name || "").toLowerCase();
    const productBarcode = product.barcode || "";
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      productName.includes(searchLower) || productBarcode.includes(searchTerm);
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    const isActive = (product.status || "active") === "active";
    const hasStock = (product.quantity || 0) > 0;

    return matchesSearch && matchesCategory && isActive && hasStock;
  });

  const addToCart = (product) => {
    // Check if product is out of stock
    if (product.quantity <= 0) {
      showError("Out of Stock", `${product.name} is currently out of stock.`);
      return;
    }

    const existingItem = cart.find((item) => item.id === product.id);
    
    if (existingItem) {
      // Check if adding one more would exceed available stock
      if (existingItem.quantity >= product.quantity) {
        showError(
          "Insufficient Stock", 
          `Cannot add more ${product.name}. Only ${product.quantity} items available in stock.`
        );
        return;
      }
      
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.price,
              }
            : item
        )
      );
      showToast(`Added ${product.name} to cart`, "success");
    } else {
      setCart([...cart, { ...product, quantity: 1, total: product.price }]);
      showToast(`${product.name} added to cart`, "success");
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    // Find the product to check available stock
    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.quantity) {
      showError(
        "Insufficient Stock",
        `Cannot set quantity to ${newQuantity}. Only ${product.quantity} items available for ${product.name}.`
      );
      return;
    }
    
    setCart(
      cart.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: newQuantity,
              total: newQuantity * item.price,
            }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    const removedItem = cart.find(item => item.id === productId);
    setCart(cart.filter((item) => item.id !== productId));
    
    if (removedItem) {
      showToast(`${removedItem.name} removed from cart`, "info");
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.total, 0);
  };
  const completeSale = async () => {
    // Basic validation
    if (cart.length === 0) {
      showError("Cart Empty", "Please add some items to the cart before completing the sale.");
      return;
    }

    // Stock validation
    const stockErrors = [];
    for (const cartItem of cart) {
      const product = products.find(p => p.id === cartItem.id);
      if (!product) {
        stockErrors.push(`Product "${cartItem.name}" not found in inventory.`);
        continue;
      }
      
      const availableStock = product.quantity || 0;
      if (cartItem.quantity > availableStock) {
        stockErrors.push(`Insufficient stock for "${cartItem.name}". Available: ${availableStock}, Requested: ${cartItem.quantity}`);
      }
    }

    if (stockErrors.length > 0) {
      showError(
        "Insufficient Stock", 
        `The following items have insufficient stock:\n\n${stockErrors.join('\n')}\n\nPlease adjust quantities or remove items from cart.`
      );
      return;
    }

    // Payment method validation
    if (!paymentMethod) {
      showError("Payment Method Required", "Please select a payment method before completing the sale.");
      return;
    }

    setProcessing(true);

    try {
      console.log("🚀 [POS] Starting sale completion...");
      console.log("🛒 [POS] Cart items:", cart);

      const subtotal = getCartTotal();
      const tax = subtotal * (taxRate || 0.1); // Use settings tax rate or default 10%
      const totalAmount = subtotal + tax;

      // Generate transaction number
      const transactionNumber = `TXN-${Date.now()}`;

      // Create new sale record with correct field names for database
      const newSale = {
        transactionNumber,
        customerId: customer?.id || null, // Correct field name for database
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
        totalAmount,
        paymentMethod,
        status: "completed",
        cashierId: 1, // TODO: Get from authenticated user
      };

      console.log("💾 [POS] Prepared sale data:", newSale);

      // Save sale to database
      let savedSale;
      try {
        savedSale = await dataService.sales.create(newSale);
        console.log("💰 [POS] Sale saved to database:", savedSale);
      } catch (error) {
        console.error("❌ [POS] Error saving sale:", error);
        console.error("❌ [POS] Sale data that failed:", newSale);
        
        // Provide user-friendly error messages based on error type
        let errorTitle = "Sale Failed";
        let errorMessage = "An unexpected error occurred while saving the sale.";
        
        if (error.message.includes("customer_name") || error.message.includes("customer_id")) {
          errorTitle = "Customer Information Error";
          errorMessage = "There was an issue with customer information. Please try selecting the customer again or proceed without a customer.";
        } else if (error.message.includes("product") || error.message.includes("item")) {
          errorTitle = "Product Information Error";
          errorMessage = "There was an issue with product information. Please refresh the page and try again.";
        } else if (error.message.includes("network") || error.message.includes("fetch") || error.message.includes("NetworkError")) {
          errorTitle = "Network Connection Error";
          errorMessage = "Unable to connect to the server. Please check your internet connection and try again.";
        } else if (error.message.includes("permission") || error.message.includes("auth") || error.message.includes("401") || error.message.includes("403")) {
          errorTitle = "Permission Error";
          errorMessage = "You don't have permission to complete this sale. Please contact your administrator.";
        } else if (error.message.includes("duplicate") || error.message.includes("conflict")) {
          errorTitle = "Transaction Conflict";
          errorMessage = "This transaction may have already been processed. Please check recent sales history.";
        } else if (error.message.includes("validation") || error.message.includes("invalid")) {
          errorTitle = "Data Validation Error";
          errorMessage = "Some sale information is invalid. Please check all fields and try again.";
        } else if (error.message.includes("timeout")) {
          errorTitle = "Request Timeout";
          errorMessage = "The request took too long to process. Please try again.";
        }
        
        showError(errorTitle, `${errorMessage}\n\nTechnical details: ${error.message}`);
        return;
      }

      // Update product quantities in database
      try {
        const updatePromises = cart.map(async (item) => {
          const currentProduct = products.find((p) => p.id === item.id);
          if (currentProduct) {
            const newQuantity = Math.max(0, (currentProduct.quantity || 0) - item.quantity);
            console.log(`📦 [POS] Updating product ${item.name}: ${currentProduct.quantity} → ${newQuantity}`);
            
            return dataService.products.update(item.id, { quantity: newQuantity });
          }
        });

        await Promise.all(updatePromises.filter(Boolean));
        console.log("✅ [POS] Product quantities updated successfully");
      } catch (error) {
        console.error("❌ [POS] Error updating product quantities:", error);
        // Show warning but don't fail the sale since it's already saved
        showError(
          "Inventory Update Warning", 
          `The sale was completed successfully, but there was an issue updating inventory quantities. Please manually check and update stock levels.\n\nError: ${error.message}`,
          "warning"
        );
      }

      // Update local products state
      setProducts(
        products.map((product) => {
          const cartItem = cart.find((item) => item.id === product.id);
          if (cartItem) {
            return {
              ...product,
              quantity: Math.max(0, (product.quantity || 0) - cartItem.quantity),
            };
          }
          return product;
        })
      );

      // Clear cart and customer
      setCart([]);
      setCustomer(null);
      setCustomerSearchTerm("");

      // Show success toast notification
      const customerInfo = customer 
        ? `${customer.firstName || customer.first_name || ''} ${customer.lastName || customer.last_name || ''}`.trim()
        : 'Walk-in Customer';
      
      showToast(
        `🎉 Sale completed! ${transactionNumber} • ${currency} ${totalAmount.toFixed(2)} • ${customerInfo}`,
        "success"
      );

      console.log("🎉 [POS] Sale completed successfully!");

    } catch (error) {
      console.error("❌ [POS] Unexpected error in completeSale:", error);
      
      // Handle different types of unexpected errors
      let errorTitle = "Unexpected Error";
      let errorMessage = `An unexpected error occurred: ${error.message}`;
      
      if (error.name === "TypeError") {
        errorTitle = "System Error";
        errorMessage = "A system error occurred. Please refresh the page and try again.";
      } else if (error.name === "ReferenceError") {
        errorTitle = "System Configuration Error";
        errorMessage = "There's a configuration issue. Please contact support.";
      }
      
      showError(
        errorTitle, 
        `${errorMessage}\n\nPlease try again or contact support if the problem persists.`
      );
    } finally {
      setProcessing(false);
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

  // Customer search and selection functions
  const handleCustomerSearch = (searchValue) => {
    setCustomerSearchTerm(searchValue);

    if (!searchValue.trim()) {
      setFilteredCustomers([]);
      setShowCustomerDropdown(false);
      return;
    }
    const filtered = customers.filter((customer) => {
      // Safety check to ensure customer is not null/undefined
      if (!customer) return false;

      const firstName = customer.firstName || customer.first_name || "";
      const lastName = customer.lastName || customer.last_name || "";
      const fullName = `${firstName} ${lastName}`.toLowerCase().trim();
      const phone = customer.phone || "";
      const email = customer.email || "";

      return (
        fullName.includes(searchValue.toLowerCase()) ||
        phone.includes(searchValue) ||
        email.toLowerCase().includes(searchValue.toLowerCase())
      );
    });
    setFilteredCustomers(filtered);
    setShowCustomerDropdown(true); // Always show dropdown when searching
  };

  const createNewCustomer = async (searchTerm) => {
    try {
      setCreatingCustomer(true);
      console.log("🔄 [POS] Creating new customer:", searchTerm);

      // Parse the search term to extract name and phone if possible
      const isPhone = /^\+?[\d\s\-()]+$/.test(searchTerm.trim());
      const isEmail = /\S+@\S+\.\S+/.test(searchTerm.trim());

      let customerData;
      if (isPhone) {
        // If it looks like a phone number
        customerData = {
          firstName: "Customer",
          lastName: "",
          phone: searchTerm.trim(),
        };
      } else if (isEmail) {
        // If it looks like an email
        customerData = {
          firstName: "Customer",
          lastName: "",
          email: searchTerm.trim(),
        };
      } else {
        // Assume it's a name
        const nameParts = searchTerm.trim().split(/\s+/);
        customerData = {
          firstName: nameParts[0] || "Customer",
          lastName: nameParts.slice(1).join(" ") || "",
        };
      }
      const newCustomer = await dataService.customers.create(customerData);
      console.log("✅ [POS] New customer created:", newCustomer);

      // Check if customer was actually created
      if (!newCustomer) {
        throw new Error("Customer creation returned null");
      }

      // Add to local customers list
      setCustomers((prev) => [...prev, newCustomer]);

      // Select the newly created customer
      selectCustomer(newCustomer);

      return newCustomer;
    } catch (error) {
      console.error("❌ [POS] Error creating customer:", error);

      // Provide more specific error messages
      let errorMessage = "Error creating customer. Please try again.";
      if (error.message && error.message.includes("duplicate key")) {
        errorMessage =
          "A customer with this information already exists. Please search for them instead.";
      } else if (error.message && error.message.includes("constraint")) {
        errorMessage =
          "Invalid customer information. Please check and try again.";
      }

      alert(errorMessage);
      return null;
    } finally {
      setCreatingCustomer(false);
    }
  };
  const selectCustomer = (selectedCustomer) => {
    if (!selectedCustomer) {
      console.error("❌ [POS] Cannot select null customer");
      return;
    }

    setCustomer(selectedCustomer);
    const firstName =
      selectedCustomer.firstName || selectedCustomer.first_name || "";
    const lastName =
      selectedCustomer.lastName || selectedCustomer.last_name || "";
    setCustomerSearchTerm(`${firstName} ${lastName}`.trim());
    setShowCustomerDropdown(false);
  };

  const clearCustomer = () => {
    setCustomer(null);
    setCustomerSearchTerm("");
    setShowCustomerDropdown(false);
  };

  // Close customer dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showCustomerDropdown &&
        !event.target.closest(".customer-search-container")
      ) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCustomerDropdown]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "var(--color-bg-main)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "32px",
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #f3f4f6",
              borderTop: "4px solid #3b82f6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          ></div>
          <p style={{ color: "#6b7280", margin: 0 }}>Loading POS...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 400px",
        height: "100vh",
        backgroundColor: "var(--color-bg-main)",
      }}
    >
      {/* Left Panel - Products */}
      <div style={{ padding: "24px", overflow: "auto" }}>
        {/* Search and Filters */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                type="text"
                placeholder="Search products or scan barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 40px 12px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              />
              <FiSearch
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#6b7280",
                }}
              />
            </div>{" "}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                backgroundColor: "white",
              }}
            >
              <option value="all">All Categories</option>
              {categories.map((category, index) => (
                <option
                  key={category.id || index}
                  value={category.name || category}
                >
                  {category.name || category}
                </option>
              ))}{" "}
            </select>
          </div>
          {/* Customer Search */}
          <div
            style={{ flex: 1, position: "relative" }}
            className="customer-search-container"
          >
            <input
              type="text"
              placeholder="Search or create customer..."
              value={customerSearchTerm}
              onChange={(e) => handleCustomerSearch(e.target.value)}
              onFocus={() =>
                customerSearchTerm && setShowCustomerDropdown(true)
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  customerSearchTerm.trim() &&
                  filteredCustomers.length === 0
                ) {
                  e.preventDefault();
                  createNewCustomer(customerSearchTerm);
                }
              }}
              style={{
                width: "100%",
                padding: "12px 40px 12px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            />
            <FiUser
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af",
                pointerEvents: "none",
              }}
              size={16}
            />

            {/* Customer Dropdown */}
            {showCustomerDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "white",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  zIndex: 10,
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                {" "}
                {filteredCustomers.map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => selectCustomer(cust)}
                    style={{
                      padding: "12px",
                      cursor: "pointer",
                      borderBottom: "1px solid #f3f4f6",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#f9fafb";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "transparent";
                    }}
                  >
                    <div style={{ fontWeight: "500", color: "#1f2937" }}>
                      {`${cust.firstName || cust.first_name || ""} ${cust.lastName || cust.last_name || ""}`.trim()}
                    </div>
                    {cust.phone && (
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>
                        {cust.phone}
                      </div>
                    )}
                  </div>
                ))}
                {/* No customers found message */}
                {filteredCustomers.length === 0 &&
                  customerSearchTerm.trim() && (
                    <div
                      style={{
                        padding: "12px",
                        color: "#6b7280",
                        fontSize: "14px",
                        fontStyle: "italic",
                        textAlign: "center",
                      }}
                    >
                      No existing customers found
                    </div>
                  )}
                {/* Create new customer option */}
                {customerSearchTerm.trim() && (
                  <div
                    onClick={() => createNewCustomer(customerSearchTerm)}
                    style={{
                      padding: "12px",
                      cursor: creatingCustomer ? "not-allowed" : "pointer",
                      backgroundColor: creatingCustomer ? "#f3f4f6" : "#f0f9ff",
                      border: "2px dashed #3b82f6",
                      borderRadius: "4px",
                      margin: "4px",
                      opacity: creatingCustomer ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!creatingCustomer) {
                        e.target.style.backgroundColor = "#dbeafe";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!creatingCustomer) {
                        e.target.style.backgroundColor = "#f0f9ff";
                      }
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "500",
                        color: "#2563eb",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <FiPlus size={16} />
                      {creatingCustomer
                        ? "Creating..."
                        : `Create "${customerSearchTerm}"`}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      {creatingCustomer
                        ? "Please wait..."
                        : "Add as new customer"}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Selected Customer Display */}
        {customer && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px",
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: "500", color: "#15803d" }}>
                Customer:{" "}
                {`${customer.firstName || customer.first_name || ""} ${customer.lastName || customer.last_name || ""}`.trim()}
              </div>
              {customer.phone && (
                <div style={{ fontSize: "12px", color: "#16a34a" }}>
                  {customer.phone}
                </div>
              )}
            </div>
            <button
              onClick={clearCustomer}
              style={{
                padding: "4px 8px",
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Clear
            </button>
          </div>
        )}

        {/* Products Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => product.quantity > 0 && addToCart(product)}
              style={{
                backgroundColor: product.quantity <= 0 ? "#fef2f2" : "white",
                borderRadius: "8px",
                padding: "16px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                cursor: product.quantity <= 0 ? "not-allowed" : "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                position: "relative",
                opacity: product.quantity <= 0 ? 0.6 : 1,
                border: product.quantity <= 0 ? "1px solid #fecaca" : "none",
              }}
              onMouseEnter={(e) => {
                if (product.quantity > 0) {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                }
              }}
              onMouseLeave={(e) => {
                if (product.quantity > 0) {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                }
              }}
            >
              {/* Stock Status Badge */}
              {product.quantity <= 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    backgroundColor: "#ef4444",
                    color: "white",
                    fontSize: "10px",
                    fontWeight: "600",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  OUT
                </div>
              )}
              {product.quantity > 0 && product.quantity <= 5 && (
                <div
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    backgroundColor: "#f59e0b",
                    color: "white",
                    fontSize: "10px",
                    fontWeight: "600",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  LOW
                </div>
              )}

              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  marginBottom: "8px",
                  paddingRight: product.quantity <= 5 ? "35px" : "0",
                }}
              >
                {product.name || "Unknown Product"}
              </h3>
              <p
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "8px",
                }}
              >
                {product.category || "Uncategorized"}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#10b981",
                  }}
                >
                  {currency} {(product.price || 0).toFixed(2)}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <FiPackage 
                    size={14} 
                    color={
                      product.quantity <= 0 
                        ? "#ef4444" 
                        : product.quantity <= 5 
                          ? "#f59e0b" 
                          : "#10b981"
                    } 
                  />
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "500",
                      color: 
                        product.quantity <= 0 
                          ? "#ef4444" 
                          : product.quantity <= 5 
                            ? "#f59e0b" 
                            : "#10b981",
                    }}
                  >
                    {product.quantity <= 0 ? "Out of Stock" : `${product.quantity} left`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div
        style={{
          backgroundColor: "white",
          borderLeft: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Cart Header */}
        <div
          style={{
            padding: "24px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              marginBottom: "16px",
            }}
          >
            Current Sale
          </h2>
          {customer && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#f3f4f6",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            >
              <div style={{ fontSize: "14px", fontWeight: "600" }}>
                {customer.firstName} {customer.lastName}
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                {customer.phone}
              </div>
            </div>
          )}{" "}
        </div>

        {/* Price Edit Hint */}
        {cart.length > 0 && (
          <div
            style={{
              padding: "8px 24px",
              backgroundColor: "#fef3c7",
              borderBottom: "1px solid #e5e7eb",
              fontSize: "12px",
              color: "#92400e",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            ✏️ Click prices to edit
          </div>
        )}

        {/* Cart Items */}
        <div style={{ flex: 1, padding: "16px", overflow: "auto" }}>
          {cart.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: "#6b7280",
                marginTop: "40px",
              }}
            >
              <p>No items in cart</p>
              <p style={{ fontSize: "12px" }}>Scan or select products to add</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px",
                  borderBottom: "1px solid #f3f4f6",
                  marginBottom: "8px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "600", fontSize: "14px" }}>
                    {item.name}
                  </div>{" "}
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    {editingPrice === item.id ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span>{currency}</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={tempPrice}
                          onChange={(e) => setTempPrice(e.target.value)}
                          onKeyDown={(e) => handlePriceKeyPress(e, item.id)}
                          onBlur={() => saveEditedPrice(item.id)}
                          autoFocus
                          style={{
                            width: "60px",
                            padding: "2px 4px",
                            border: "1px solid #3b82f6",
                            borderRadius: "4px",
                            fontSize: "12px",
                            outline: "none",
                          }}
                        />
                        <span style={{ fontSize: "10px", color: "#6b7280" }}>
                          each
                        </span>
                      </div>
                    ) : (
                      <span
                        onClick={() =>
                          startEditingPrice(item.id, item.price || 0)
                        }
                        style={{
                          cursor: "pointer",
                          padding: "2px 4px",
                          borderRadius: "4px",
                          transition: "background-color 0.2s",
                          border: "1px solid transparent",
                          display: "inline-block",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#f3f4f6";
                          e.target.style.borderColor = "#d1d5db";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "transparent";
                          e.target.style.borderColor = "transparent";
                        }}
                        title="Click to edit price"
                      >
                        {currency} {(item.price || 0).toFixed(2)} each ✏️
                      </span>
                    )}
                  </div>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    style={{
                      padding: "4px",
                      backgroundColor: "#f3f4f6",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    <FiMinus size={12} />
                  </button>
                  <span style={{ minWidth: "20px", textAlign: "center" }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    style={{
                      padding: "4px",
                      backgroundColor: "#f3f4f6",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    <FiPlus size={12} />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    style={{
                      padding: "4px",
                      backgroundColor: "#fecaca",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      marginLeft: "8px",
                    }}
                  >
                    <FiTrash2 size={12} color="#dc2626" />
                  </button>
                </div>
                <div
                  style={{
                    minWidth: "80px",
                    textAlign: "right",
                    fontWeight: "600",
                  }}
                >
                  {currency} {(item.total || 0).toFixed(2)}
                </div>
                {/* Price Editing */}
                {editingPrice === item.id ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <input
                      type="text"
                      value={tempPrice}
                      onChange={(e) => setTempPrice(e.target.value)}
                      onKeyDown={(e) => handlePriceKeyPress(e, item.id)}
                      style={{
                        width: "80px",
                        padding: "8px",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        fontSize: "14px",
                        textAlign: "right",
                      }}
                    />
                    <button
                      onClick={() => saveEditedPrice(item.id)}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditingPrice}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#f3f4f6",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => startEditingPrice(item.id, item.price)}
                    style={{
                      cursor: "pointer",
                      color: "#3b82f6",
                      fontWeight: "600",
                      fontSize: "14px",
                    }}
                  >
                    ✏️
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        {cart.length > 0 && (
          <div
            style={{
              padding: "24px",
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "16px",
                fontSize: "18px",
                fontWeight: "600",
              }}
            >
              <span>Total:</span>
              <span>
                {currency} {(getCartTotal() || 0).toFixed(2)}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  backgroundColor: "white",
                }}
              >
                <option value="cash">Cash</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="bank">Bank Transfer</option>
                <option value="credit">Credit</option>
              </select>
            </div>
            <button
              onClick={completeSale}
              disabled={processing || cart.length === 0}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: processing 
                  ? "#9ca3af" 
                  : cart.length === 0 
                    ? "#d1d5db" 
                    : "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: processing || cart.length === 0 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                opacity: processing || cart.length === 0 ? 0.7 : 1,
              }}
            >
              {processing && (
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid transparent",
                    borderTop: "2px solid white",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
              )}
              {processing ? "Processing..." : cart.length === 0 ? "Add Items to Cart" : "Complete Sale"}
            </button>
          </div>
        )}
      </div>

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={closeModal}
        title={errorModal.title}
        message={errorModal.message}
        type={errorModal.type}
      />

      {/* Toast Notification */}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  );
}

export default POS;
