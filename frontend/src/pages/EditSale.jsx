import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiSave,
  FiArrowLeft,
  FiPackage,
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiCreditCard,
  FiTrash2,
  FiPlus,
  FiMinus,
  FiAlertCircle,
} from "react-icons/fi";
import { dataService } from "../services";
import { useSalesStore, useSettingsStore } from "../store";
import { useIsMobile } from "../hooks/useIsMobile";
import "../styles/mobile.css";

function EditSale() {
  // Mobile detection hook
  const isMobile = useIsMobile();

  // Settings store for currency
  const { settings } = useSettingsStore();
  const { currency } = settings;

  const { id } = useParams();
  const navigate = useNavigate();
  const { updateSale } = useSalesStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [saleData, setSaleData] = useState({
    customerId: "",
    customerName: "",
    items: [],
    paymentMethod: "cash",
    discount: 0,
    notes: "",
    saleDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load existing sale data
        const existingSale = await dataService.sales.getById(id);
        if (!existingSale) {
          setError("Sale not found");
          return;
        }

        // Load customers and products
        const [customersData, productsData] = await Promise.all([
          dataService.customers.getAll(),
          dataService.products.getAll(),
        ]);

        setCustomers(customersData || []);
        setProducts(productsData || []);

        // Set sale data
        setSaleData({
          customerId: existingSale.customerId || "",
          customerName: existingSale.customerName || "",
          items: existingSale.items || [],
          paymentMethod: existingSale.paymentMethod || "cash",
          discount: existingSale.discount || 0,
          notes: existingSale.notes || "",
          saleDate: existingSale.saleDate
            ? existingSale.saleDate.split("T")[0]
            : new Date().toISOString().split("T")[0],
        });
      } catch (error) {
        console.error("Error loading data:", error);
        setError("Failed to load sale data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    const customer = customers.find((c) => c.id === customerId);

    setSaleData((prev) => ({
      ...prev,
      customerId,
      customerName: customer
        ? `${customer.firstName} ${customer.lastName}`
        : "",
    }));
  };

  const addItem = () => {
    setSaleData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now(),
          productId: "",
          productName: "",
          quantity: 1,
          price: 0,
          total: 0,
        },
      ],
    }));
  };

  const removeItem = (itemId) => {
    setSaleData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  };

  const updateItem = (itemId, field, value) => {
    setSaleData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };

          // Update product details if product changed
          if (field === "productId") {
            const product = products.find((p) => p.id === value);
            if (product) {
              updatedItem.productName = product.name;
              updatedItem.price = product.price;
              updatedItem.total = updatedItem.quantity * product.price;
            }
          }

          // Update total if quantity or price changed
          if (field === "quantity" || field === "price") {
            updatedItem.total = updatedItem.quantity * updatedItem.price;
          }

          return updatedItem;
        }
        return item;
      }),
    }));
  };

  const calculateTotals = () => {
    const subtotal = saleData.items.reduce(
      (sum, item) => sum + (item.total || 0),
      0
    );
    const discountAmount = (subtotal * saleData.discount) / 100;
    const total = subtotal - discountAmount;

    return { subtotal, discountAmount, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!saleData.customerId) {
      setError("Please select a customer");
      return;
    }

    if (saleData.items.length === 0) {
      setError("Please add at least one item");
      return;
    }

    const invalidItems = saleData.items.filter(
      (item) => !item.productId || item.quantity <= 0
    );
    if (invalidItems.length > 0) {
      setError("Please ensure all items have valid products and quantities");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { total } = calculateTotals();

      const updatedSale = {
        ...saleData,
        totalAmount: total,
        updatedAt: new Date().toISOString(),
      };

      await dataService.sales.update(id, updatedSale);
      updateSale(id, updatedSale);

      navigate(`/sales/${id}`);
    } catch (error) {
      console.error("Error updating sale:", error);
      setError("Failed to update sale. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className={isMobile ? "mobile-container" : ""}
        style={
          isMobile
            ? {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "50vh",
              }
            : {
                padding: "24px",
                backgroundColor: "#f8fafc",
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }
        }
      >
        <div className="loading-container">
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
          <p
            style={{ marginTop: "16px", color: isMobile ? "white" : "#6b7280" }}
          >
            Loading sale data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={isMobile ? "mobile-container" : ""}
        style={
          isMobile
            ? {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "50vh",
              }
            : {
                padding: "24px",
                backgroundColor: "#f8fafc",
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }
        }
      >
        <div
          className={isMobile ? "mobile-card" : ""}
          style={
            isMobile
              ? {
                  textAlign: "center",
                  background: "rgba(239, 68, 68, 0.1)",
                  borderColor: "rgba(239, 68, 68, 0.3)",
                }
              : {
                  textAlign: "center",
                  padding: "24px",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }
          }
        >
          <FiAlertCircle size={48} color="#ef4444" />
          <h2 style={{ marginTop: "16px", color: "#ef4444" }}>Error</h2>
          <p style={{ color: isMobile ? "white" : "#6b7280" }}>{error}</p>
          <button
            onClick={() => navigate("/sales")}
            className={isMobile ? "mobile-action-button secondary" : ""}
            style={
              isMobile
                ? { marginTop: "16px" }
                : {
                    marginTop: "16px",
                    padding: "8px 16px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }
            }
          >
            Back to Sales
          </button>
        </div>
      </div>
    );
  }

  const { subtotal, discountAmount, total } = calculateTotals();

  return (
    <div
      className={isMobile ? "mobile-container" : ""}
      style={
        isMobile
          ? {}
          : { maxWidth: "1200px", margin: "0 auto", padding: "16px" }
      }
    >
      {/* Header */}
      <div
        className={isMobile ? "mobile-card" : ""}
        style={
          isMobile
            ? {}
            : {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
                padding: "12px 16px",
                backgroundColor: "white",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid #f1f5f9",
              }
        }
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => navigate("/sales")}
            className={isMobile ? "mobile-action-button secondary" : ""}
            style={
              isMobile
                ? {}
                : {
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    backgroundColor: "#f8fafc",
                    color: "#64748b",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }
            }
          >
            <div className={isMobile ? "mobile-nav-icon" : ""}>
              <FiArrowLeft size={14} />
            </div>
            Back
          </button>
          <div>
            <h1
              style={{
                fontSize: isMobile ? "20px" : "18px",
                fontWeight: "600",
                color: isMobile ? "white" : "#1f2937",
                margin: "0",
                textShadow: isMobile ? "0 2px 4px rgba(0, 0, 0, 0.1)" : "none",
              }}
            >
              Edit Sale #{id}
            </h1>
            <p
              style={{
                color: isMobile ? "rgba(255, 255, 255, 0.8)" : "#6b7280",
                fontSize: "12px",
                margin: "0",
              }}
            >
              Modify sale details and items
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Customer Selection */}
        <div
          className={isMobile ? "mobile-card" : ""}
          style={
            isMobile
              ? { marginBottom: "16px" }
              : {
                  backgroundColor: "white",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "16px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  border: "1px solid #f1f5f9",
                }
          }
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: "16px",
              color: isMobile ? "white" : "#1f2937",
              fontSize: isMobile ? "18px" : "16px",
            }}
          >
            Customer Information
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: "16px",
            }}
          >
            <div className={isMobile ? "mobile-form-group" : ""}>
              <label
                className={isMobile ? "mobile-form-label" : ""}
                style={
                  isMobile
                    ? {}
                    : {
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }
                }
              >
                Customer *
              </label>
              <select
                value={saleData.customerId}
                onChange={handleCustomerChange}
                className={isMobile ? "mobile-form-select" : ""}
                style={
                  isMobile
                    ? {}
                    : {
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        fontSize: "13px",
                        backgroundColor: "#ffffff",
                      }
                }
                required
              >
                <option value="">Select Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className={isMobile ? "mobile-form-group" : ""}>
              <label
                className={isMobile ? "mobile-form-label" : ""}
                style={
                  isMobile
                    ? {}
                    : {
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }
                }
              >
                Sale Date
              </label>
              <input
                type="date"
                value={saleData.saleDate}
                onChange={(e) =>
                  setSaleData((prev) => ({ ...prev, saleDate: e.target.value }))
                }
                className={isMobile ? "mobile-form-input" : ""}
                style={
                  isMobile
                    ? {}
                    : {
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        fontSize: "13px",
                        backgroundColor: "#ffffff",
                      }
                }
              />
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div
          className={isMobile ? "mobile-card" : ""}
          style={
            isMobile
              ? { marginBottom: "16px" }
              : {
                  backgroundColor: "white",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "16px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  border: "1px solid #f1f5f9",
                }
          }
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h3
              style={{
                margin: 0,
                color: isMobile ? "white" : "#1f2937",
                fontSize: isMobile ? "18px" : "16px",
              }}
            >
              Sale Items
            </h3>
            <button
              type="button"
              onClick={addItem}
              className={isMobile ? "mobile-action-button" : ""}
              style={
                isMobile
                  ? {}
                  : {
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      backgroundColor: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: "500",
                      cursor: "pointer",
                    }
              }
            >
              <FiPlus size={14} />
              Add Item
            </button>
          </div>

          {saleData.items.length === 0 ? (
            <p
              style={{
                color: isMobile ? "rgba(255, 255, 255, 0.7)" : "#6b7280",
                textAlign: "center",
                padding: "20px",
              }}
            >
              No items added yet. Click "Add Item" to start.
            </p>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {saleData.items.map((item, index) => (
                <div
                  key={item.id}
                  className={isMobile ? "mobile-list-item" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          display: "grid",
                          gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
                          gap: "12px",
                          alignItems: "center",
                          padding: "12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          backgroundColor: "#f9fafb",
                        }
                  }
                >
                  {/* Product Selection */}
                  <div className={isMobile ? "mobile-form-group" : ""}>
                    <select
                      value={item.productId}
                      onChange={(e) =>
                        updateItem(item.id, "productId", e.target.value)
                      }
                      className={isMobile ? "mobile-form-select" : ""}
                      style={
                        isMobile
                          ? {}
                          : {
                              width: "100%",
                              padding: "8px 10px",
                              border: "1px solid #d1d5db",
                              borderRadius: "4px",
                              fontSize: "12px",
                            }
                      }
                      required
                    >
                      <option value="">Select Product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className={isMobile ? "mobile-form-group" : ""}>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "quantity",
                          parseInt(e.target.value)
                        )
                      }
                      className={isMobile ? "mobile-form-input" : ""}
                      style={
                        isMobile
                          ? {}
                          : {
                              width: "100%",
                              padding: "8px 10px",
                              border: "1px solid #d1d5db",
                              borderRadius: "4px",
                              fontSize: "12px",
                            }
                      }
                      min="1"
                      placeholder="Qty"
                      required
                    />
                  </div>

                  {/* Price */}
                  <div className={isMobile ? "mobile-form-group" : ""}>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(item.id, "price", parseFloat(e.target.value))
                      }
                      className={isMobile ? "mobile-form-input" : ""}
                      style={
                        isMobile
                          ? {}
                          : {
                              width: "100%",
                              padding: "8px 10px",
                              border: "1px solid #d1d5db",
                              borderRadius: "4px",
                              fontSize: "12px",
                            }
                      }
                      min="0"
                      step="0.01"
                      placeholder="Price"
                      required
                    />
                  </div>

                  {/* Total */}
                  <div
                    style={{
                      fontWeight: "600",
                      color: isMobile ? "white" : "#1f2937",
                      fontSize: isMobile ? "16px" : "14px",
                    }}
                  >
                    {currency} {item.total?.toFixed(2) || "0.00"}
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className={isMobile ? "mobile-action-button danger" : ""}
                    style={
                      isMobile
                        ? {}
                        : {
                            padding: "6px",
                            backgroundColor: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }
                    }
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment & Summary */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: "16px",
          }}
        >
          {/* Payment Details */}
          <div
            className={isMobile ? "mobile-card" : ""}
            style={
              isMobile
                ? {}
                : {
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    border: "1px solid #f1f5f9",
                  }
            }
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "16px",
                color: isMobile ? "white" : "#1f2937",
                fontSize: isMobile ? "18px" : "16px",
              }}
            >
              Payment Details
            </h3>

            <div className={isMobile ? "mobile-form-group" : ""}>
              <label
                className={isMobile ? "mobile-form-label" : ""}
                style={
                  isMobile
                    ? {}
                    : {
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }
                }
              >
                Payment Method
              </label>
              <select
                value={saleData.paymentMethod}
                onChange={(e) =>
                  setSaleData((prev) => ({
                    ...prev,
                    paymentMethod: e.target.value,
                  }))
                }
                className={isMobile ? "mobile-form-select" : ""}
                style={
                  isMobile
                    ? {}
                    : {
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        fontSize: "13px",
                        backgroundColor: "#ffffff",
                      }
                }
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mobile">Mobile Money</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>

            <div className={isMobile ? "mobile-form-group" : ""}>
              <label
                className={isMobile ? "mobile-form-label" : ""}
                style={
                  isMobile
                    ? {}
                    : {
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }
                }
              >
                Discount (%)
              </label>
              <input
                type="number"
                value={saleData.discount}
                onChange={(e) =>
                  setSaleData((prev) => ({
                    ...prev,
                    discount: parseFloat(e.target.value) || 0,
                  }))
                }
                className={isMobile ? "mobile-form-input" : ""}
                style={
                  isMobile
                    ? {}
                    : {
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        fontSize: "13px",
                        backgroundColor: "#ffffff",
                      }
                }
                min="0"
                max="100"
                step="0.1"
              />
            </div>

            <div className={isMobile ? "mobile-form-group" : ""}>
              <label
                className={isMobile ? "mobile-form-label" : ""}
                style={
                  isMobile
                    ? {}
                    : {
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }
                }
              >
                Notes
              </label>
              <textarea
                value={saleData.notes}
                onChange={(e) =>
                  setSaleData((prev) => ({ ...prev, notes: e.target.value }))
                }
                className={isMobile ? "mobile-form-input" : ""}
                style={
                  isMobile
                    ? {}
                    : {
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        fontSize: "13px",
                        backgroundColor: "#ffffff",
                        minHeight: "80px",
                        resize: "vertical",
                      }
                }
                placeholder="Add any notes..."
              />
            </div>
          </div>

          {/* Summary */}
          <div
            className={isMobile ? "mobile-card" : ""}
            style={
              isMobile
                ? {}
                : {
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    border: "1px solid #f1f5f9",
                  }
            }
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "16px",
                color: isMobile ? "white" : "#1f2937",
                fontSize: isMobile ? "18px" : "16px",
              }}
            >
              Order Summary
            </h3>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span
                  style={{
                    color: isMobile ? "rgba(255, 255, 255, 0.8)" : "#6b7280",
                  }}
                >
                  Subtotal:
                </span>
                <span
                  style={{
                    color: isMobile ? "white" : "#1f2937",
                    fontWeight: "500",
                  }}
                >
                  {currency} {subtotal.toFixed(2)}
                </span>
              </div>

              {saleData.discount > 0 && (
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span
                    style={{
                      color: isMobile ? "rgba(255, 255, 255, 0.8)" : "#6b7280",
                    }}
                  >
                    Discount ({saleData.discount}%):
                  </span>
                  <span style={{ color: "#ef4444", fontWeight: "500" }}>
                    -{currency} {discountAmount.toFixed(2)}
                  </span>
                </div>
              )}

              <hr
                style={{
                  border: "none",
                  borderTop: "1px solid #e5e7eb",
                  margin: "8px 0",
                }}
              />

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: isMobile ? "white" : "#1f2937",
                  }}
                >
                  Total:
                </span>
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: isMobile ? "white" : "#1f2937",
                  }}
                >
                  {currency} {total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className={isMobile ? "mobile-card" : ""}
            style={
              isMobile
                ? {
                    marginTop: "16px",
                    background: "rgba(239, 68, 68, 0.1)",
                    borderColor: "rgba(239, 68, 68, 0.3)",
                  }
                : {
                    marginTop: "16px",
                    padding: "12px",
                    backgroundColor: "#fef2f2",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }
            }
          >
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <button
            type="submit"
            disabled={saving}
            className={isMobile ? "mobile-action-button" : ""}
            style={
              isMobile
                ? {
                    opacity: saving ? 0.5 : 1,
                    cursor: saving ? "not-allowed" : "pointer",
                    width: "100%",
                  }
                : {
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 24px",
                    backgroundColor: saving ? "#9ca3af" : "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: saving ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }
            }
          >
            {saving ? (
              <>
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
                Updating...
              </>
            ) : (
              <>
                <FiSave size={16} />
                Update Sale
              </>
            )}
          </button>
        </div>
      </form>

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default EditSale;
