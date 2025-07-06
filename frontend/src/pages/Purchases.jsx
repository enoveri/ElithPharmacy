import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiPlus,
  FiSearch,
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiPackage,
  FiAlertCircle,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiArrowLeft,
  FiFilter,
  FiDatabase,
  FiBarChart,
} from "react-icons/fi";
import { dataService } from "../services";
import { useSettingsStore } from "../store";

function Purchases() {
  // Settings store for currency
  const { settings } = useSettingsStore();
  const { currency } = settings;

  const navigate = useNavigate();
  const location = useLocation();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [highlightedPurchase, setHighlightedPurchase] = useState(null);

  // Load purchases data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log("🔄 [Purchases] Loading purchases data...");

        const purchasesData = await dataService.purchases.getAll();
        console.log("📦 [Purchases] Loaded purchases:", purchasesData);
        
        setPurchases(purchasesData || []);
        setError(null);
      } catch (err) {
        console.error("❌ [Purchases] Error loading data:", err);
        setError("Failed to load purchases data");
        setPurchases([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle success message from navigation state
  useEffect(() => {
    if (location.state?.message) {
      alert(location.state.message);
      if (location.state.newPurchaseId) {
        setHighlightedPurchase(location.state.newPurchaseId);
        setTimeout(() => {
          setHighlightedPurchase(null);
        }, 3000);
      }
      // Clear the state
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate]);

  // Filter purchases based on search and filters
  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch =
      (purchase.purchase_number || purchase.purchaseNumber || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (purchase.supplier_name || purchase.supplierName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (purchase.notes || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || purchase.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Get purchase stats
  const getPurchaseStats = () => {
    const stats = {
      total: filteredPurchases.length,
      delivered: filteredPurchases.filter((p) => p.status === "delivered").length,
      pending: filteredPurchases.filter((p) => p.status === "pending").length,
      totalAmount: filteredPurchases.reduce((sum, p) => sum + (p.total_amount || p.totalAmount || 0), 0),
      stockReceipts: filteredPurchases.filter((p) => p.type === "stock_receipt" || p.is_stock_receipt).length,
    };
    return stats;
  };

  const stats = getPurchaseStats();

  // Get status display info
  const getStatusInfo = (status) => {
    switch (status) {
      case "delivered":
        return { icon: FiCheckCircle, color: "#10b981", text: "Delivered" };
      case "pending":
        return { icon: FiClock, color: "#f59e0b", text: "Pending" };
      case "ordered":
        return { icon: FiTruck, color: "#3b82f6", text: "Ordered" };
      default:
        return { icon: FiClock, color: "#6b7280", text: "Unknown" };
    }
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
            Error Loading Purchases
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
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#1f2937",
              margin: 0,
            }}
          >
            Purchase History
          </h1>
          <button
            onClick={() => navigate("/inventory/receive")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            <FiPlus size={16} />
            Receive Stock
          </button>
        </div>
        <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>
          View and manage your purchase transactions and stock receipts
        </p>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        {[
          {
            label: "Total Purchases",
            value: stats.total,
            icon: FiPackage,
            color: "#3b82f6",
          },
          {
            label: "Stock Receipts",
            value: stats.stockReceipts,
            icon: FiDatabase,
            color: "#10b981",
          },
          {
            label: "Delivered",
            value: stats.delivered,
            icon: FiCheckCircle,
            color: "#10b981",
          },
          {
            label: "Total Amount",
            value: `${currency}${stats.totalAmount.toLocaleString()}`,
            icon: FiDollarSign,
            color: "#f59e0b",
          },
        ].map((stat, index) => (
          <div
            key={index}
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: `${stat.color}15`,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <stat.icon size={24} color={stat.color} />
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: "4px",
              }}
            >
              {typeof stat.value === "number" ? stat.value : stat.value}
            </div>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto auto",
            gap: "16px",
            alignItems: "center",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative" }}>
            <FiSearch
              size={20}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#6b7280",
              }}
            />
            <input
              type="text"
              placeholder="Search purchases by reference, supplier, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 12px 12px 44px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              minWidth: "120px",
            }}
          >
            <option value="all">All Status</option>
            <option value="delivered">Delivered</option>
            <option value="pending">Pending</option>
            <option value="ordered">Ordered</option>
          </select>
        </div>
      </div>

      {/* Purchases History */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        {filteredPurchases.length === 0 ? (
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
              No Purchases Found
            </h3>
            <p style={{ color: "#6b7280", marginBottom: "24px" }}>
              {searchTerm || statusFilter !== "all"
                ? "No purchases match your search criteria."
                : "No purchase transactions have been recorded yet."}
            </p>
            <button
              onClick={() => navigate("/inventory/receive")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              <FiPlus size={16} />
              Receive Stock
            </button>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {filteredPurchases
              .sort((a, b) => new Date(b.order_date || b.orderDate) - new Date(a.order_date || a.orderDate))
              .map((purchase) => {
                if (!purchase || !purchase.id) {
                  console.warn("Invalid purchase object:", purchase);
                  return null;
                }

                const statusInfo = getStatusInfo(purchase.status);
                const StatusIcon = statusInfo.icon;
                const isStockReceipt = purchase.type === "stock_receipt" || purchase.is_stock_receipt;

                return (
                  <div
                    key={purchase.id}
                    id={`purchase-${purchase.id}`}
                    onClick={() => navigate(`/purchases/${purchase.id}`)}
                    style={{
                      padding: "16px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      backgroundColor:
                        highlightedPurchase === purchase.id ? "#fef3c7" : "transparent",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor =
                        highlightedPurchase === purchase.id ? "#fef3c7" : "#f9fafb";
                      e.target.style.transform = "translateY(-1px)";
                      e.target.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor =
                        highlightedPurchase === purchase.id ? "#fef3c7" : "transparent";
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
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "4px",
                          }}
                        >
                          <h3
                            style={{
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#1f2937",
                              margin: 0,
                            }}
                          >
                            {purchase.purchase_number || purchase.purchaseNumber || `Purchase #${purchase.id}`}
                          </h3>
                          {isStockReceipt && (
                            <span
                              style={{
                                backgroundColor: "#10b981",
                                color: "white",
                                fontSize: "10px",
                                fontWeight: "500",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                textTransform: "uppercase",
                              }}
                            >
                              Stock Receipt
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
                          {purchase.order_date || purchase.orderDate
                            ? new Date(purchase.order_date || purchase.orderDate).toLocaleDateString()
                            : "Unknown date"}
                          {purchase.order_date || purchase.orderDate
                            ? ` at ${new Date(purchase.order_date || purchase.orderDate).toLocaleTimeString()}`
                            : ""}
                        </p>
                      </div>
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: "bold",
                          color: "#10b981",
                        }}
                      >
                        {currency}
                        {(purchase.total_amount || purchase.totalAmount || 0).toLocaleString()}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
                          <div style={{ fontWeight: "500", color: "#1f2937" }}>
                            {purchase.supplier_name || purchase.supplierName || "Unknown Supplier"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            Supplier
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
                        <FiPackage color="#6b7280" size={16} />
                        <div>
                          <div style={{ fontWeight: "500", color: "#1f2937" }}>
                            {(purchase.purchase_items || purchase.items || []).length || purchase.total_items || 0} items
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
                        <StatusIcon color={statusInfo.color} size={16} />
                        <div>
                          <div
                            style={{
                              fontWeight: "500",
                              color: statusInfo.color,
                            }}
                          >
                            {statusInfo.text}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            Status
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
                        <FiCalendar color="#6b7280" size={16} />
                        <div>
                          <div style={{ fontWeight: "500", color: "#1f2937" }}>
                            {purchase.delivery_date || purchase.deliveryDate || purchase.expected_delivery || purchase.expectedDelivery
                              ? new Date(purchase.delivery_date || purchase.deliveryDate || purchase.expected_delivery || purchase.expectedDelivery).toLocaleDateString()
                              : "Not specified"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            Delivery Date
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Purchases;
