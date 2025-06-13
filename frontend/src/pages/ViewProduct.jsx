import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiEdit,
  FiTrash2,
  FiPackage,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiShoppingCart,
  FiCalendar,
  FiAlertTriangle,
  FiBarChart,
  FiPieChart,
  FiClock,
  FiUser,
  FiMapPin,
} from "react-icons/fi";
import { mockData, mockHelpers } from "../lib/mockData";

function ViewProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Mock analytics data for the product
  const [productAnalytics, setProductAnalytics] = useState({
    salesHistory: [
      { date: "2024-01-20", quantity: 5, revenue: 127.5, profit: 37.5 },
      { date: "2024-01-19", quantity: 3, revenue: 76.5, profit: 22.5 },
      { date: "2024-01-18", quantity: 8, revenue: 204.0, profit: 60.0 },
      { date: "2024-01-17", quantity: 2, revenue: 51.0, profit: 15.0 },
      { date: "2024-01-16", quantity: 6, revenue: 153.0, profit: 45.0 },
    ],
    totalSales: 24,
    totalRevenue: 612.0,
    totalProfit: 180.0,
    averageQuantityPerSale: 4.8,
    topCustomers: [
      { name: "John Doe", purchases: 8, totalSpent: 204.0 },
      { name: "Sarah Johnson", purchases: 6, totalSpent: 153.0 },
      { name: "Michael Brown", purchases: 5, totalSpent: 127.5 },
    ],
    stockMovement: {
      received: 200,
      sold: 24,
      remaining: 176,
      turnoverRate: 12.0,
    },
    profitMargin: 29.4,
    demandTrend: "increasing",
  });

  useEffect(() => {
    // Simulate API call to get product details
    setTimeout(() => {
      const foundProduct = mockHelpers.getProductById(id);
      setProduct(foundProduct);
      setLoading(false);
    }, 1000);
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#f8fafc",
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

  if (!product) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#f8fafc",
          textAlign: "center",
        }}
      >
        <FiPackage
          size={64}
          style={{ color: "#9ca3af", marginBottom: "16px" }}
        />
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: "#374151",
            marginBottom: "8px",
          }}
        >
          Product Not Found
        </h2>
        <p style={{ color: "#6b7280", marginBottom: "24px" }}>
          The product you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => navigate("/inventory")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
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
          <FiArrowLeft size={16} />
          Back to Inventory
        </button>
      </div>
    );
  }

  const getStockStatus = () => {
    if (product.quantity === 0)
      return { color: "#ef4444", text: "Out of Stock", bg: "#fef2f2" };
    if (product.quantity <= product.minStockLevel)
      return { color: "#f59e0b", text: "Low Stock", bg: "#fffbeb" };
    return { color: "#10b981", text: "In Stock", bg: "#f0fdf4" };
  };

  const getExpiryStatus = () => {
    const daysUntilExpiry = Math.ceil(
      (new Date(product.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilExpiry <= 0)
      return { color: "#ef4444", text: "Expired", bg: "#fef2f2" };
    if (daysUntilExpiry <= 30)
      return {
        color: "#f59e0b",
        text: `${daysUntilExpiry} days left`,
        bg: "#fffbeb",
      };
    return { color: "#10b981", text: "Fresh", bg: "#f0fdf4" };
  };

  const stockStatus = getStockStatus();
  const expiryStatus = getExpiryStatus();

  const tabs = [
    { id: "overview", label: "Overview", icon: FiBarChart },
    { id: "analytics", label: "Analytics", icon: FiTrendingUp },
    { id: "sales", label: "Sales History", icon: FiShoppingCart },
    { id: "customers", label: "Top Customers", icon: FiUser },
  ];

  const renderOverview = () => (
    <div
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}
    >
      {/* Product Details */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#1f2937",
            marginBottom: "20px",
          }}
        >
          Product Information
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#6b7280" }}>Category:</span>
            <span style={{ fontWeight: "600", color: "#1f2937" }}>
              {product.category}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#6b7280" }}>Manufacturer:</span>
            <span style={{ fontWeight: "600", color: "#1f2937" }}>
              {product.manufacturer}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#6b7280" }}>Batch Number:</span>
            <span style={{ fontWeight: "600", color: "#1f2937" }}>
              {product.batchNumber}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#6b7280" }}>Barcode:</span>
            <span style={{ fontWeight: "600", color: "#1f2937" }}>
              {product.barcode}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#6b7280" }}>Expiry Date:</span>
            <span style={{ fontWeight: "600", color: "#1f2937" }}>
              {new Date(product.expiryDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Pricing & Stock */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#1f2937",
            marginBottom: "20px",
          }}
        >
          Pricing & Stock
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#6b7280" }}>Selling Price:</span>
            <span
              style={{ fontWeight: "600", color: "#10b981", fontSize: "16px" }}
            >
              ₦{product.price.toFixed(2)}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#6b7280" }}>Cost Price:</span>
            <span style={{ fontWeight: "600", color: "#1f2937" }}>
              ₦{product.costPrice.toFixed(2)}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#6b7280" }}>Profit Margin:</span>
            <span style={{ fontWeight: "600", color: "#10b981" }}>
              {productAnalytics.profitMargin}%
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#6b7280" }}>Current Stock:</span>
            <span style={{ fontWeight: "600", color: stockStatus.color }}>
              {product.quantity} units
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#6b7280" }}>Min Stock Level:</span>
            <span style={{ fontWeight: "600", color: "#1f2937" }}>
              {product.minStockLevel} units
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#6b7280" }}>Total Value:</span>
            <span style={{ fontWeight: "600", color: "#1f2937" }}>
              ₦{(product.quantity * product.costPrice).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "24px",
      }}
    >
      {/* Performance Metrics */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          gridColumn: "span 2",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#1f2937",
            marginBottom: "20px",
          }}
        >
          Performance Metrics
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: "16px",
              backgroundColor: "#f0fdf4",
              borderRadius: "8px",
            }}
          >
            <FiShoppingCart
              size={24}
              style={{ color: "#10b981", marginBottom: "8px" }}
            />
            <div
              style={{ fontSize: "20px", fontWeight: "bold", color: "#1f2937" }}
            >
              {productAnalytics.totalSales}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Total Sales
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "16px",
              backgroundColor: "#eff6ff",
              borderRadius: "8px",
            }}
          >
            <FiDollarSign
              size={24}
              style={{ color: "#3b82f6", marginBottom: "8px" }}
            />
            <div
              style={{ fontSize: "20px", fontWeight: "bold", color: "#1f2937" }}
            >
              ₦{productAnalytics.totalRevenue.toFixed(2)}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Total Revenue
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "16px",
              backgroundColor: "#fefce8",
              borderRadius: "8px",
            }}
          >
            <FiTrendingUp
              size={24}
              style={{ color: "#f59e0b", marginBottom: "8px" }}
            />
            <div
              style={{ fontSize: "20px", fontWeight: "bold", color: "#1f2937" }}
            >
              ₦{productAnalytics.totalProfit.toFixed(2)}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Total Profit
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "16px",
              backgroundColor: "#f3e8ff",
              borderRadius: "8px",
            }}
          >
            <FiBarChart
              size={24}
              style={{ color: "#8b5cf6", marginBottom: "8px" }}
            />
            <div
              style={{ fontSize: "20px", fontWeight: "bold", color: "#1f2937" }}
            >
              {productAnalytics.stockMovement.turnoverRate}%
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Turnover Rate
            </div>
          </div>
        </div>
      </div>

      {/* Stock Movement */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#1f2937",
            marginBottom: "20px",
          }}
        >
          Stock Movement
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: "#6b7280" }}>Received:</span>
            <span style={{ fontWeight: "600", color: "#10b981" }}>
              +{productAnalytics.stockMovement.received} units
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: "#6b7280" }}>Sold:</span>
            <span style={{ fontWeight: "600", color: "#ef4444" }}>
              -{productAnalytics.stockMovement.sold} units
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: "#6b7280" }}>Remaining:</span>
            <span style={{ fontWeight: "600", color: "#1f2937" }}>
              {productAnalytics.stockMovement.remaining} units
            </span>
          </div>
        </div>
      </div>

      {/* Demand Trend */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#1f2937",
            marginBottom: "20px",
          }}
        >
          Demand Trend
        </h3>

        <div style={{ textAlign: "center" }}>
          {productAnalytics.demandTrend === "increasing" ? (
            <FiTrendingUp
              size={48}
              style={{ color: "#10b981", marginBottom: "12px" }}
            />
          ) : (
            <FiTrendingDown
              size={48}
              style={{ color: "#ef4444", marginBottom: "12px" }}
            />
          )}
          <div
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#1f2937",
              marginBottom: "4px",
            }}
          >
            {productAnalytics.demandTrend === "increasing"
              ? "Increasing"
              : "Decreasing"}
          </div>
          <div style={{ fontSize: "14px", color: "#6b7280" }}>
            Based on recent sales data
          </div>
        </div>
      </div>
    </div>
  );

  const renderSalesHistory = () => (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <h3
        style={{
          fontSize: "18px",
          fontWeight: "600",
          color: "#1f2937",
          marginBottom: "20px",
        }}
      >
        Sales History (Last 30 Days)
      </h3>

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
                Date
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Quantity Sold
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Revenue
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Profit
              </th>
            </tr>
          </thead>
          <tbody>
            {productAnalytics.salesHistory.map((sale, index) => (
              <tr key={index} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "12px", color: "#1f2937" }}>
                  {new Date(sale.date).toLocaleDateString()}
                </td>
                <td
                  style={{
                    padding: "12px",
                    color: "#1f2937",
                    fontWeight: "600",
                  }}
                >
                  {sale.quantity} units
                </td>
                <td
                  style={{
                    padding: "12px",
                    color: "#10b981",
                    fontWeight: "600",
                  }}
                >
                  ₦{sale.revenue.toFixed(2)}
                </td>
                <td
                  style={{
                    padding: "12px",
                    color: "#f59e0b",
                    fontWeight: "600",
                  }}
                >
                  ₦{sale.profit.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTopCustomers = () => (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <h3
        style={{
          fontSize: "18px",
          fontWeight: "600",
          color: "#1f2937",
          marginBottom: "20px",
        }}
      >
        Top Customers
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {productAnalytics.topCustomers.map((customer, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <div>
              <div style={{ fontWeight: "600", color: "#1f2937" }}>
                {customer.name}
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                {customer.purchases} purchases
              </div>
            </div>
            <div style={{ fontWeight: "bold", color: "#10b981" }}>
              ₦{customer.totalSpent.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

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
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            onClick={() => navigate("/inventory")}
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
              marginRight: "16px",
            }}
          >
            <FiArrowLeft size={16} />
            Back to Inventory
          </button>
          <div>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: "#1f2937",
                margin: "0 0 4px 0",
              }}
            >
              {product.name}
            </h1>
            <p style={{ color: "#6b7280", margin: 0 }}>{product.description}</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => navigate(`/inventory/edit/${product.id}`)}
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
            <FiEdit size={16} />
            Edit Product
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            backgroundColor: stockStatus.bg,
            border: `1px solid ${stockStatus.color}40`,
            borderRadius: "12px",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <FiPackage size={24} color={stockStatus.color} />
          <div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: stockStatus.color,
              }}
            >
              {stockStatus.text}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Current stock level
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: expiryStatus.bg,
            border: `1px solid ${expiryStatus.color}40`,
            borderRadius: "12px",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <FiClock size={24} color={expiryStatus.color} />
          <div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: expiryStatus.color,
              }}
            >
              {expiryStatus.text}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Product expiry status
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "16px 24px",
                backgroundColor: "transparent",
                border: "none",
                borderBottom:
                  activeTab === tab.id
                    ? "2px solid #3b82f6"
                    : "2px solid transparent",
                color: activeTab === tab.id ? "#3b82f6" : "#6b7280",
                fontWeight: activeTab === tab.id ? "600" : "500",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "overview" && renderOverview()}
        {activeTab === "analytics" && renderAnalytics()}
        {activeTab === "sales" && renderSalesHistory()}
        {activeTab === "customers" && renderTopCustomers()}
      </div>
    </div>
  );
}

export default ViewProduct;
