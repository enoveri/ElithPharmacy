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
import { mockData, mockHelpers } from "../lib/mockData";

function Purchases() {
  const navigate = useNavigate();
  const location = useLocation();
  const [purchases, setPurchases] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Load purchases from localStorage on component mount
  useEffect(() => {
    const savedPurchases = JSON.parse(
      localStorage.getItem("purchases") || "[]"
    );
    const mockPurchases = [
      {
        id: 1,
        purchaseNumber: "PO-2024-001",
        supplierId: 1,
        supplierName: "PharmaCorp Ltd",
        orderDate: "2024-01-15T10:00:00Z",
        expectedDelivery: "2024-01-20T00:00:00Z",
        actualDelivery: "2024-01-19T14:30:00Z",
        status: "delivered",
        totalAmount: 125000.0,
        items: [
          {
            productId: 1,
            productName: "Paracetamol 500mg",
            quantity: 500,
            unitCost: 18.0,
            total: 9000.0,
          },
          {
            productId: 5,
            productName: "Ibuprofen 400mg",
            quantity: 300,
            unitCost: 22.5,
            total: 6750.0,
          },
        ],
        notes: "Delivered on time, all items in good condition",
      },
      {
        id: 2,
        purchaseNumber: "PO-2024-002",
        supplierId: 2,
        supplierName: "MediPharm",
        orderDate: "2024-01-18T09:30:00Z",
        expectedDelivery: "2024-01-25T00:00:00Z",
        actualDelivery: null,
        status: "pending",
        totalAmount: 85000.0,
        items: [
          {
            productId: 2,
            productName: "Amoxicillin 250mg",
            quantity: 200,
            unitCost: 32.0,
            total: 6400.0,
          },
        ],
        notes: "Awaiting delivery confirmation",
      },
      {
        id: 3,
        purchaseNumber: "PO-2024-003",
        supplierId: 1,
        supplierName: "PharmaCorp Ltd",
        orderDate: "2024-01-20T11:15:00Z",
        expectedDelivery: "2024-01-28T00:00:00Z",
        actualDelivery: null,
        status: "ordered",
        totalAmount: 95000.0,
        items: [
          {
            productId: 3,
            productName: "Vitamin C 1000mg",
            quantity: 400,
            unitCost: 25.0,
            total: 10000.0,
          },
        ],
        notes: "Rush order for high-demand product",
      },
    ];

    // Combine saved purchases with mock data
    const allPurchases = [...savedPurchases, ...mockPurchases];
    setPurchases(allPurchases);
  }, []);

  // Handle success message from AddProduct
  useEffect(() => {
    if (location.state?.message) {
      // Show success notification
      const timer = setTimeout(() => {
        // Clear the message from state
        window.history.replaceState({}, document.title);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const handleAddPurchaseOrder = () => {
    // Navigate to AddProduct with purchase order context
    navigate("/inventory/add", {
      state: {
        fromPurchaseOrder: true,
        purchaseOrderData: {
          supplierId: null, // Will be selected in the form
          supplierName: null,
          expectedDelivery: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          quantity: 1,
          notes: "",
        },
      },
    });
  };

  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch =
      purchase.purchaseNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      purchase.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || purchase.status === statusFilter;
    const matchesSupplier =
      supplierFilter === "all" || purchase.supplierName === supplierFilter;

    let matchesDate = true;
    if (dateFilter !== "all") {
      const orderDate = new Date(purchase.orderDate);
      const now = new Date();
      const daysDiff = Math.ceil((now - orderDate) / (1000 * 60 * 60 * 24));

      switch (dateFilter) {
        case "today":
          matchesDate = daysDiff === 0;
          break;
        case "week":
          matchesDate = daysDiff <= 7;
          break;
        case "month":
          matchesDate = daysDiff <= 30;
          break;
        default:
          matchesDate = true;
      }
    }

    return matchesSearch && matchesStatus && matchesSupplier && matchesDate;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return { color: "#10b981", bg: "#dcfce7", text: "Delivered" };
      case "pending":
        return { color: "#f59e0b", bg: "#fef3c7", text: "Pending" };
      case "ordered":
        return { color: "#3b82f6", bg: "#dbeafe", text: "Ordered" };
      case "cancelled":
        return { color: "#ef4444", bg: "#fecaca", text: "Cancelled" };
      default:
        return { color: "#6b7280", bg: "#f3f4f6", text: "Unknown" };
    }
  };

  const getTotalPurchases = () =>
    purchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const getPendingPurchases = () =>
    purchases.filter((p) => p.status === "pending").length;
  const getDeliveredPurchases = () =>
    purchases.filter((p) => p.status === "delivered").length;
  const getOrderedPurchases = () =>
    purchases.filter((p) => p.status === "ordered").length;

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "8px",
            }}
          >
            Purchases
          </h1>
          <p style={{ color: "#6b7280" }}>
            Manage supplier orders and track deliveries
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: "white",
              color: "#6b7280",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            <FiDownload size={16} />
            Export
          </button>
          <button
            onClick={handleAddPurchaseOrder}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: "#3b82f6",
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

      {/* Success Message */}
      {location.state?.message && (
        <div
          style={{
            margin: "0 0 24px 0",
            padding: "12px 16px",
            backgroundColor: "#dcfce7",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            color: "#166534",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FiCheckCircle size={16} />
          {location.state.message}
        </div>
      )}

      {/* Statistics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "24px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#dbeafe",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "12px",
              }}
            >
              <FiDollarSign color="#3b82f6" size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Total Value
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                ₦{getTotalPurchases().toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#dcfce7",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "12px",
              }}
            >
              <FiCheckCircle color="#10b981" size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Delivered
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                {getDeliveredPurchases()}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#fef3c7",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "12px",
              }}
            >
              <FiClock color="#f59e0b" size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>Pending</div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                {getPendingPurchases()}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#e0e7ff",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "12px",
              }}
            >
              <FiTruck color="#6366f1" size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>Ordered</div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                {getOrderedPurchases()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 200px 200px 150px auto",
            gap: "16px",
            alignItems: "end",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                marginBottom: "8px",
              }}
            >
              Search
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Search by PO number or supplier..."
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
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                marginBottom: "8px",
              }}
            >
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                backgroundColor: "white",
              }}
            >
              <option value="all">All Status</option>
              <option value="ordered">Ordered</option>
              <option value="pending">Pending</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                marginBottom: "8px",
              }}
            >
              Supplier
            </label>
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                backgroundColor: "white",
              }}
            >
              <option value="all">All Suppliers</option>
              <option value="PharmaCorp Ltd">PharmaCorp Ltd</option>
              <option value="MediPharm">MediPharm</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                marginBottom: "8px",
              }}
            >
              Date
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                backgroundColor: "white",
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "#f3f4f6",
              borderRadius: "8px",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            {filteredPurchases.length} orders
          </div>
        </div>
      </div>

      {/* Purchases Table */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Purchase Order
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Supplier
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Order Date
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Expected Delivery
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Total Amount
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.map((purchase) => {
                const status = getStatusColor(purchase.status);

                return (
                  <tr
                    key={purchase.id}
                    onClick={() => navigate(`/purchases/${purchase.id}`)}
                    style={{
                      borderBottom: "1px solid #f3f4f6",
                      cursor: "pointer",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#f9fafb";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "transparent";
                    }}
                  >
                    <td style={{ padding: "16px 12px" }}>
                      <div>
                        <div style={{ fontWeight: "600", color: "#1f2937" }}>
                          {purchase.purchaseNumber}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                          {purchase.items.length} item(s)
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px 12px" }}>
                      <div style={{ fontWeight: "500", color: "#1f2937" }}>
                        {purchase.supplierName}
                      </div>
                    </td>
                    <td style={{ padding: "16px 12px", color: "#6b7280" }}>
                      {new Date(purchase.orderDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "16px 12px", color: "#6b7280" }}>
                      {new Date(purchase.expectedDelivery).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "16px 12px" }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "500",
                          backgroundColor: status.bg,
                          color: status.color,
                        }}
                      >
                        {status.text}
                      </span>
                    </td>
                    <td style={{ padding: "16px 12px" }}>
                      <div style={{ fontWeight: "600", color: "#1f2937" }}>
                        ₦{purchase.totalAmount.toLocaleString()}
                      </div>
                    </td>
                    <td style={{ padding: "16px 12px" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click
                            navigate(`/purchases/edit/${purchase.id}`);
                          }}
                          style={{
                            padding: "6px",
                            backgroundColor: "#dbeafe",
                            color: "#3b82f6",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                          title="Edit Purchase"
                        >
                          <FiEdit size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Purchases;
