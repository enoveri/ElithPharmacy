import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiDownload,
  FiEye,
  FiEdit,
  FiTrash2,
  FiTruck,
  FiCalendar,
  FiDollarSign,
  FiPackage,
  FiUser,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
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
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Load purchases and suppliers from database
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log("🔄 [Purchases] Loading purchases data...");

        const [purchasesData, suppliersData] = await Promise.all([
          dataService.purchases.getAll(),
          dataService.suppliers.getAll(),
        ]);

        console.log("📦 [Purchases] Loaded purchases:", purchasesData);
        console.log("🏢 [Purchases] Loaded suppliers:", suppliersData);

        setPurchases(purchasesData || []);
        setSuppliers(suppliersData || []);
      } catch (error) {
        console.error("❌ [Purchases] Error loading data:", error);
        // Show fallback mock data if database fails
        const mockPurchases = [
          {
            id: 1,
            purchase_number: "PO-2024-001",
            supplier: { name: "PharmaCorp Ltd" },
            order_date: "2024-01-15T10:00:00Z",
            expected_delivery: "2024-01-20T00:00:00Z",
            actual_delivery: "2024-01-19T14:30:00Z",
            status: "delivered",
            total_amount: 125000.0,
            purchase_items: [
              {
                product: { name: "Paracetamol 500mg" },
                quantity: 500,
                unit_cost: 18.0,
                total: 9000.0,
              },
            ],
            notes: "Delivered on time, all items in good condition",
          },
          {
            id: 2,
            purchase_number: "PO-2024-002",
            supplier: { name: "MediPharm" },
            order_date: "2024-01-18T09:30:00Z",
            expected_delivery: "2024-01-25T00:00:00Z",
            actual_delivery: null,
            status: "pending",
            total_amount: 85000.0,
            purchase_items: [
              {
                product: { name: "Amoxicillin 250mg" },
                quantity: 200,
                unit_cost: 32.0,
                total: 6400.0,
              },
            ],
            notes: "Awaiting delivery confirmation",
          },
        ];
        setPurchases(mockPurchases);
        setSuppliers([
          { id: 1, name: "PharmaCorp Ltd" },
          { id: 2, name: "MediPharm" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle successful purchase creation/update from navigation state
  useEffect(() => {
    if (location.state?.message) {
      alert(location.state.message);
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
      (purchase.supplier?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (purchase.notes || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || purchase.status === statusFilter;

    const matchesSupplier =
      supplierFilter === "all" ||
      (purchase.supplier?.id || purchase.supplier_id) ===
        parseInt(supplierFilter);

    const matchesDate = (() => {
      const orderDate = new Date(purchase.order_date || purchase.orderDate);
      const now = new Date();

      switch (dateFilter) {
        case "today":
          return orderDate.toDateString() === now.toDateString();
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= weekAgo;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return orderDate >= monthAgo;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesStatus && matchesSupplier && matchesDate;
  });

  const handleDeletePurchase = async (purchaseId) => {
    if (!confirm("Are you sure you want to delete this purchase order?")) {
      return;
    }

    try {
      console.log("🗑️ [Purchases] Deleting purchase:", purchaseId);
      const result = await dataService.purchases.delete(purchaseId);

      if (result.success) {
        setPurchases(purchases.filter((p) => p.id !== purchaseId));
        alert("Purchase order deleted successfully!");
      } else {
        throw new Error(result.error?.message || "Failed to delete purchase");
      }
    } catch (error) {
      console.error("❌ [Purchases] Error deleting purchase:", error);
      alert("Error deleting purchase order. Please try again.");
    }
  };

  // Get stats for different purchase statuses
  const getStatusStats = () => {
    const stats = {
      total: filteredPurchases.length,
      pending: filteredPurchases.filter((p) => p.status === "pending").length,
      ordered: filteredPurchases.filter((p) => p.status === "ordered").length,
      delivered: filteredPurchases.filter((p) => p.status === "delivered")
        .length,
      cancelled: filteredPurchases.filter((p) => p.status === "cancelled")
        .length,
    };
    return stats;
  };

  const statusStats = getStatusStats();

  // Get status icon and color
  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return { icon: FiClock, color: "#f59e0b" };
      case "ordered":
        return { icon: FiTruck, color: "#3b82f6" };
      case "delivered":
        return { icon: FiCheckCircle, color: "#10b981" };
      case "cancelled":
        return { icon: FiAlertTriangle, color: "#ef4444" };
      default:
        return { icon: FiClock, color: "#6b7280" };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => navigate("/purchases/add")}
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
            New Purchase Order
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        {[
          {
            label: "Total Orders",
            value: statusStats.total,
            icon: FiPackage,
            color: "#3b82f6",
          },
          {
            label: "Pending",
            value: statusStats.pending,
            icon: FiClock,
            color: "#f59e0b",
          },
          {
            label: "Ordered",
            value: statusStats.ordered,
            icon: FiTruck,
            color: "#3b82f6",
          },
          {
            label: "Delivered",
            value: statusStats.delivered,
            icon: FiCheckCircle,
            color: "#10b981",
          },
          {
            label: "Cancelled",
            value: statusStats.cancelled,
            icon: FiAlertTriangle,
            color: "#ef4444",
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
              {stat.value}
            </div>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filters Section */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
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
              placeholder="Search purchase orders..."
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
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="ordered">Ordered</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Supplier Filter */}
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            style={{
              padding: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          >
            <option value="all">All Suppliers</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              padding: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          {/* Export Button */}
          <button
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px",
              backgroundColor: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            <FiDownload size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead
              style={{
                backgroundColor: "#f9fafb",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <tr>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Purchase Order
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Supplier
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Order Date
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Delivery Date
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Total Amount
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      padding: "48px",
                      textAlign: "center",
                      color: "#6b7280",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <FiPackage size={48} color="#d1d5db" />
                      <div style={{ fontSize: "18px", fontWeight: "500" }}>
                        No purchase orders found
                      </div>
                      <div style={{ fontSize: "14px" }}>
                        {searchTerm ||
                        statusFilter !== "all" ||
                        supplierFilter !== "all" ||
                        dateFilter !== "all"
                          ? "Try adjusting your filters"
                          : "Create your first purchase order to get started"}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => {
                  const statusInfo = getStatusIcon(purchase.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr
                      key={purchase.id}
                      style={{ borderBottom: "1px solid #f3f4f6" }}
                    >
                      <td style={{ padding: "16px" }}>
                        <div>
                          <div style={{ fontWeight: "600", color: "#1f2937" }}>
                            {purchase.purchase_number ||
                              purchase.purchaseNumber}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            {
                              (purchase.purchase_items || purchase.items || [])
                                .length
                            }{" "}
                            items
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <FiUser size={16} color="#6b7280" />
                          <span style={{ color: "#374151" }}>
                            {purchase.supplier?.name ||
                              purchase.supplierName ||
                              "Unknown Supplier"}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "16px", color: "#374151" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <FiCalendar size={16} color="#6b7280" />
                          <span>
                            {new Date(
                              purchase.order_date || purchase.orderDate
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "16px", color: "#374151" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <FiTruck size={16} color="#6b7280" />
                          <span>
                            {purchase.actual_delivery || purchase.actualDelivery
                              ? new Date(
                                  purchase.actual_delivery ||
                                    purchase.actualDelivery
                                ).toLocaleDateString()
                              : new Date(
                                  purchase.expected_delivery ||
                                    purchase.expectedDelivery
                                ).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <StatusIcon size={16} color={statusInfo.color} />
                          <span
                            style={{
                              padding: "4px 8px",
                              fontSize: "12px",
                              fontWeight: "500",
                              borderRadius: "4px",
                              backgroundColor: `${statusInfo.color}15`,
                              color: statusInfo.color,
                              textTransform: "capitalize",
                            }}
                          >
                            {purchase.status}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <FiDollarSign size={16} color="#6b7280" />
                          <span style={{ fontWeight: "600", color: "#1f2937" }}>
                            {currency}
                            {(
                              purchase.total_amount ||
                              purchase.totalAmount ||
                              0
                            ).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <button
                            onClick={() =>
                              navigate(`/purchases/${purchase.id}`)
                            }
                            style={{
                              padding: "8px",
                              backgroundColor: "#f3f4f6",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            title="View Details"
                          >
                            <FiEye size={16} color="#6b7280" />
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/purchases/${purchase.id}/edit`)
                            }
                            style={{
                              padding: "8px",
                              backgroundColor: "#f3f4f6",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            title="Edit Purchase"
                          >
                            <FiEdit size={16} color="#6b7280" />
                          </button>
                          <button
                            onClick={() => handleDeletePurchase(purchase.id)}
                            style={{
                              padding: "8px",
                              backgroundColor: "#fef2f2",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            title="Delete Purchase"
                          >
                            <FiTrash2 size={16} color="#ef4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Purchases;
