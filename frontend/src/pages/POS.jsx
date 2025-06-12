import { useState, useEffect } from "react";
import {
  FiSearch,
  FiPlus,
  FiMinus,
  FiTrash2,
  FiDollarSign,
  FiUser,
  FiCreditCard,
} from "react-icons/fi";
import { mockData, mockHelpers } from "../lib/mockData";

function POS() {
  const [products] = useState(mockData.products);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [customer, setCustomer] = useState(null);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.includes(searchTerm);
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.status === "active";
  });

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
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
    } else {
      setCart([...cart, { ...product, quantity: 1, total: product.price }]);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
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
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.total, 0);
  };

  const completeSale = () => {
    if (cart.length === 0) return;

    // Create new sale record
    const newSale = {
      id: mockData.sales.length + 1,
      transactionNumber: mockHelpers.generateTransactionNumber(),
      customerId: customer?.id || null,
      date: new Date().toISOString(),
      items: cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      })),
      subtotal: getCartTotal(),
      tax: getCartTotal() * 0.1,
      discount: 0,
      totalAmount: getCartTotal() * 1.1,
      paymentMethod: "cash",
      status: "completed",
      cashierId: 1,
    };

    // Add to mock sales data
    mockData.sales.push(newSale);

    // Update product quantities
    cart.forEach((item) => {
      const product = mockData.products.find((p) => p.id === item.id);
      if (product) {
        product.quantity -= item.quantity;
      }
    });

    // Clear cart
    setCart([]);
    setCustomer(null);

    alert(`Sale completed! Transaction: ${newSale.transactionNumber}`);
  };

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
            </div>
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
              {mockData.categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

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
              onClick={() => addToCart(product)}
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "16px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                {product.name}
              </h3>
              <p
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "8px",
                }}
              >
                {product.category}
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
                  ₦{product.price.toFixed(2)}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: product.quantity > 0 ? "#10b981" : "#ef4444",
                  }}
                >
                  Stock: {product.quantity}
                </span>
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
          )}
        </div>

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
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    ₦{item.price.toFixed(2)} each
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
                  ₦{item.total.toFixed(2)}
                </div>
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
              <span>₦{getCartTotal().toFixed(2)}</span>
            </div>
            <button
              onClick={completeSale}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Complete Sale
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default POS;
