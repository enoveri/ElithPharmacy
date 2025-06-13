import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiPackage,
  FiAlertTriangle,
  FiTrendingUp,
  FiSearch,
  FiFilter,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiEye,
  FiDownload,
  FiUpload,
  FiGrid,
  FiList,
  FiClock,
  FiDollarSign,
} from "react-icons/fi";
import { mockData, mockHelpers } from "../lib/mockData";

// Inventory page
function Inventory() {
  const location = useLocation();
  const navigate = useNavigate();
  const [products] = useState(mockData.products);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table"); // "table" or "grid"
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // Handle navigation from notifications
  useEffect(() => {
    if (location.state?.filter) {
      setStatusFilter(
        location.state.filter === "low-stock" ? "low-stock" : "expiring"
      );
    }
  }, [location.state]);

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === "low-stock") {
        matchesStatus = product.quantity <= product.minStockLevel;
      } else if (statusFilter === "out-of-stock") {
        matchesStatus = product.quantity === 0;
      } else if (statusFilter === "in-stock") {
        matchesStatus = product.quantity > product.minStockLevel;
      } else if (statusFilter === "expiring") {
        const daysUntilExpiry = Math.ceil(
          (new Date(product.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
        );
        matchesStatus = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      }

      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (
        sortBy === "price" ||
        sortBy === "costPrice" ||
        sortBy === "quantity"
      ) {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const lowStockProducts = mockHelpers.getLowStockProducts();
  const outOfStockProducts = products.filter((p) => p.quantity === 0);
  const totalValue = products.reduce(
    (sum, p) => sum + p.quantity * p.costPrice,
    0
  );
  const expiringProducts = products.filter((p) => {
    const daysUntilExpiry = Math.ceil(
      (new Date(p.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  const getStockStatus = (product) => {
    if (product.quantity === 0)
      return {
        status: "out-of-stock",
        color: "#ef4444",
        text: "Out of Stock",
      };
    if (product.quantity <= product.minStockLevel)
      return { status: "low-stock", color: "#f59e0b", text: "Low Stock" };
    return { status: "in-stock", color: "#10b981", text: "In Stock" };
  };

  const renderTableView = () => (
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
                color: "#374151",
              }}
            >
              Product
            </th>
            <th
              style={{
                padding: "12px",
                textAlign: "left",
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Category
            </th>
            <th
              style={{
                padding: "12px",
                textAlign: "left",
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Price
            </th>
            <th
              style={{
                padding: "12px",
                textAlign: "left",
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Stock
            </th>
            <th
              style={{
                padding: "12px",
                textAlign: "left",
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
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
                color: "#374151",
              }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product);

            return (
              <tr
                key={product.id}
                id={`product-${product.id}`}
                style={{
                  borderBottom: "1px solid #f3f4f6",
                  transition: "background-color 0.3s ease",
                }}
              >
                <td style={{ padding: "16px 12px" }}>
                  <div>
                    <div
                      style={{
                        fontWeight: "600",
                        color: "#1f2937",
                        fontSize: "14px",
                      }}
                    >
                      {product.name}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginTop: "2px",
                      }}
                    >
                      {product.manufacturer}
                    </div>
                  </div>
                </td>
                <td style={{ padding: "16px 12px" }}>
                  <span
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#f3f4f6",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#374151",
                      fontWeight: "500",
                    }}
                  >
                    {product.category}
                  </span>
                </td>
                <td style={{ padding: "16px 12px" }}>
                  <div
                    style={{
                      fontWeight: "600",
                      color: "#10b981",
                      fontSize: "14px",
                    }}
                  >
                    ₦{product.price.toFixed(2)}
                  </div>
                </td>
                <td style={{ padding: "16px 12px" }}>
                  <div
                    style={{
                      fontWeight: "600",
                      color: stockStatus.color,
                      fontSize: "14px",
                    }}
                  >
                    {product.quantity} units
                  </div>
                </td>
                <td style={{ padding: "16px 12px" }}>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "500",
                      backgroundColor: `${stockStatus.color}20`,
                      color: stockStatus.color,
                    }}
                  >
                    {stockStatus.text}
                  </span>
                </td>
                <td style={{ padding: "16px 12px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => navigate(`/inventory/view/${product.id}`)}
                      style={{
                        padding: "6px",
                        backgroundColor: "#f0fdf4",
                        color: "#10b981",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                      title="View Product"
                    >
                      <FiEye size={14} />
                    </button>
                    <button
                      onClick={() => navigate(`/inventory/edit/${product.id}`)}
                      style={{
                        padding: "6px",
                        backgroundColor: "#dbeafe",
                        color: "#3b82f6",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                      title="Edit Product"
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
  );

  const renderGridView = () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "20px",
      }}
    >
      {filteredProducts.map((product) => {
        const stockStatus = getStockStatus(product);
        const expiryStatus = getExpiryStatus(product);

        return (
          <div
            key={product.id}
            id={`product-${product.id}`}
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              transition: "transform 0.3s ease",
            }}
          >
            <div style={{ marginBottom: "12px" }}>
              <div
                style={{
                  fontWeight: "600",
                  color: "#1f2937",
                  fontSize: "16px",
                  marginBottom: "4px",
                }}
              >
                {product.name}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  marginBottom: "8px",
                }}
              >
                {product.manufacturer}
              </div>
              <div
                style={{
                  fontWeight: "600",
                  color: "#10b981",
                  fontSize: "16px",
                }}
              >
                ₦{product.price.toFixed(2)}
              </div>
            </div>

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
                    fontSize: "12px",
                    color: "#6b7280",
                    marginBottom: "4px",
                  }}
                >
                  Stock
                </div>
                <div
                  style={{
                    fontWeight: "600",
                    color: stockStatus.color,
                    fontSize: "14px",
                  }}
                >
                  {product.quantity} units
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginBottom: "4px",
                  }}
                >
                  Status
                </div>
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "500",
                    backgroundColor: `${stockStatus.color}20`,
                    color: stockStatus.color,
                  }}
                >
                  {stockStatus.text}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => navigate(`/inventory/view/${product.id}`)}
                style={{
                  flex: 1,
                  padding: "8px",
                  backgroundColor: "#f0fdf4",
                  color: "#10b981",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                <FiEye size={14} style={{ marginRight: "4px" }} />
                View
              </button>
              <button
                onClick={() => navigate(`/inventory/edit/${product.id}`)}
                style={{
                  flex: 1,
                  padding: "8px",
                  backgroundColor: "#dbeafe",
                  color: "#3b82f6",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                <FiEdit size={14} style={{ marginRight: "4px" }} />
                Edit
              </button>
            </div>
          </div>
        );
      })}
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
        <div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "8px",
            }}
          >
            Inventory Management
          </h1>
          <p style={{ color: "#6b7280" }}>
            Manage your product inventory and stock levels
          </p>
        </div>

        <button
          onClick={() => navigate("/inventory/add")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 20px",
            backgroundColor: "var(--color-primary-600)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          <FiPlus size={16} />
          Add Product
        </button>
      </div>

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
              <FiPackage color="#3b82f6" size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Total Products
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                {products.length}
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
                backgroundColor: "#fed7aa",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "12px",
              }}
            >
              <FiAlertTriangle color="#f97316" size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Low Stock
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                {lowStockProducts.length}
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
                backgroundColor: "#fecaca",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "12px",
              }}
            >
              <FiTrendingUp color="#ef4444" size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Out of Stock
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                {outOfStockProducts.length}
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
                backgroundColor: "#d1fae5",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "12px",
              }}
            >
              <FiDollarSign color="#10b981" size={24} />
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
                ₦{totalValue.toLocaleString()}
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
            gridTemplateColumns: "1fr 200px 200px auto",
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
              Search Products
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Search by name, manufacturer..."
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
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                width: "100%",
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
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
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
            {filteredProducts.length} products
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        {viewMode === "table" ? renderTableView() : renderGridView()}
      </div>
    </div>
  );
}

export default Inventory;
