import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiPackage,
  FiAlertCircle,
} from "react-icons/fi";
import { dataService } from "../services";
import { useSalesStore } from "../store";

function SalesHistory() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highlightedSale, setHighlightedSale] = useState(null); // Initialize sales data with error handling
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [salesData, customersData] = await Promise.all([
          dataService.sales.getAll(),
          dataService.customers.getAll().catch(() => []),
        ]);

        console.log("✅ [SalesHistory] Sales loaded:", salesData?.length || 0);
        console.log(
          "✅ [SalesHistory] Customers loaded:",
          customersData?.length || 0
        );

        setSales(salesData || []);
        setCustomers(customersData || []);
        setError(null);
      } catch (err) {
        console.error("❌ [SalesHistory] Error loading data:", err);
        setError("Failed to load sales data");
        setSales([]);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle navigation from notifications
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
        padding: "24px",
        backgroundColor: "var(--color-bg-main)",
        minHeight: "100vh",
      }}
    >
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "bold",
            color: "var(--color-text-primary)",
            marginBottom: "8px",
          }}
        >
          Sales History
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          View and manage your sales transactions
        </p>
      </div>

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        {sales.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px",
              textAlign: "center",
            }}
          >
            <FiPackage
              size={48}
              style={{ color: "#9ca3af", marginBottom: "16px" }}
            />
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              No Sales Found
            </h3>
            <p style={{ color: "#6b7280" }}>
              No sales transactions have been recorded yet.
            </p>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {sales
              .map((sale) => {
                // Ensure sale object has required properties
                if (!sale || !sale.id) {
                  console.warn("Invalid sale object:", sale);
                  return null;
                }

                return (
                  <div
                    key={sale.id}
                    id={`sale-${sale.id}`}
                    onClick={() => navigate(`/sales/${sale.id}`)}
                    style={{
                      padding: "16px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      backgroundColor:
                        highlightedSale === sale.id ? "#fef3c7" : "transparent",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor =
                        highlightedSale === sale.id ? "#fef3c7" : "#f9fafb";
                      e.target.style.transform = "translateY(-1px)";
                      e.target.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor =
                        highlightedSale === sale.id ? "#fef3c7" : "transparent";
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "none";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <div>
                        {" "}
                        <h3
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#1f2937",
                          }}
                        >
                          {sale.transactionNumber ||
                            sale.transaction_number ||
                            `Transaction #${sale.id}`}
                        </h3>
                        <p style={{ fontSize: "14px", color: "#6b7280" }}>
                          {sale.date
                            ? new Date(sale.date).toLocaleDateString()
                            : "Unknown date"}
                          {sale.date &&
                            ` at ${new Date(sale.date).toLocaleTimeString()}`}
                        </p>
                      </div>
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: "bold",
                          color: "#10b981",
                        }}
                      >
                        ₦
                        {(sale.totalAmount || sale.total_amount || 0).toFixed(
                          2
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: "16px",
                        fontSize: "14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <FiUser color="#6b7280" size={16} />
                        <div>
                          {" "}
                          <div style={{ fontWeight: "500", color: "#1f2937" }}>
                            {getCustomerName(
                              sale.customerId || sale.customer_id
                            )}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            Customer
                          </div>
                        </div>
                      </div>{" "}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <FiPackage color="#6b7280" size={16} />
                        <div>
                          {" "}
                          <div style={{ fontWeight: "500", color: "#1f2937" }}>
                            {sale.items && Array.isArray(sale.items)
                              ? sale.items.length
                              : sale.sale_items &&
                                  Array.isArray(sale.sale_items)
                                ? sale.sale_items.length
                                : 0}{" "}
                            item(s)
                          </div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            Products
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <FiDollarSign color="#6b7280" size={16} />
                        <div>
                          {" "}
                          <div style={{ fontWeight: "500", color: "#1f2937" }}>
                            ₦{(sale.subtotal || 0).toFixed(2)}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            Subtotal
                          </div>
                        </div>
                      </div>{" "}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: "16px",
                            height: "16px",
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
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            Payment
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
              .filter(Boolean)}{" "}
            {/* Filter out null values */}
          </div>
        )}
      </div>
    </div>
  );
}

export default SalesHistory;
