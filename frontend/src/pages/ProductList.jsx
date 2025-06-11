import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiDownload,
  FiUpload,
  FiEye,
  FiPackage,
  FiAlertCircle,
  FiCheck,
} from "react-icons/fi";

// Product List page
function ProductList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const categories = [
    "Pain Relief",
    "Antibiotics",
    "Vitamins & Supplements",
    "Cold & Flu",
    "Digestive Health",
    "Heart & Blood Pressure",
    "Diabetes Care",
    "Skin Care",
    "Eye Care",
    "Other",
  ];

  // Mock data
  const mockProducts = [
    {
      id: 1,
      name: "Paracetamol 500mg",
      category: "Pain Relief",
      price: 25.5,
      costPrice: 18.0,
      quantity: 150,
      minStockLevel: 20,
      status: "active",
      manufacturer: "PharmaCorp Ltd",
      expiryDate: "2025-12-31",
      batchNumber: "PC2024001",
    },
    {
      id: 2,
      name: "Amoxicillin 250mg",
      category: "Antibiotics",
      price: 45.0,
      costPrice: 32.0,
      quantity: 8,
      minStockLevel: 15,
      status: "active",
      manufacturer: "MediPharm",
      expiryDate: "2024-06-30",
      batchNumber: "MP2023045",
    },
    {
      id: 3,
      name: "Vitamin C 1000mg",
      category: "Vitamins & Supplements",
      price: 35.75,
      costPrice: 25.0,
      quantity: 200,
      minStockLevel: 30,
      status: "active",
      manufacturer: "HealthPlus",
      expiryDate: "2025-03-15",
      batchNumber: "HP2024012",
    },
    {
      id: 4,
      name: "Cough Syrup 100ml",
      category: "Cold & Flu",
      price: 28.0,
      costPrice: 20.0,
      quantity: 0,
      minStockLevel: 10,
      status: "inactive",
      manufacturer: "CureMed",
      expiryDate: "2024-08-20",
      batchNumber: "CM2023078",
    },
    {
      id: 5,
      name: "Ibuprofen 400mg",
      category: "Pain Relief",
      price: 32.25,
      costPrice: 22.5,
      quantity: 75,
      minStockLevel: 25,
      status: "active",
      manufacturer: "PharmaCorp Ltd",
      expiryDate: "2025-01-10",
      batchNumber: "PC2024015",
    },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProducts(mockProducts);
      setFilteredProducts(mockProducts);
      setLoading(false);
    }, 1000);

    // Show success message if coming from edit/add
    if (location.state?.message) {
      // You can implement a toast notification here
      console.log(location.state.message);
    }
  }, []);

  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.manufacturer
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          product.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (product) => product.status === selectedStatus
      );
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, selectedStatus, products]);

  const getStockStatus = (product) => {
    if (product.quantity === 0) return "out-of-stock";
    if (product.quantity <= product.minStockLevel) return "low-stock";
    return "in-stock";
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case "out-of-stock":
        return "var(--color-danger-500)";
      case "low-stock":
        return "var(--color-warning-500)";
      case "in-stock":
        return "var(--color-success-500)";
      default:
        return "var(--color-text-muted)";
    }
  };

  const getStockStatusText = (status) => {
    switch (status) {
      case "out-of-stock":
        return "Out of Stock";
      case "low-stock":
        return "Low Stock";
      case "in-stock":
        return "In Stock";
      default:
        return "Unknown";
    }
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter((product) => product.id !== id));
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center"
        style={{ backgroundColor: "var(--color-bg-main)" }}
      >
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: "var(--color-primary-600)" }}
        ></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: "var(--color-bg-main)" }}
    >
      <div className="w-full">
        {/* Header */}
        <div className="topbar">
          <div className="flex justify-between items-center">
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Products
              </h1>
              <p style={{ color: "var(--color-text-secondary)" }}>
                Manage your pharmacy inventory
              </p>
            </div>
            <div className="flex gap-3">
              <button className="btn btn-outline">
                <FiDownload className="w-4 h-4" />
                Export
              </button>
              <button className="btn btn-outline">
                <FiUpload className="w-4 h-4" />
                Import
              </button>
              <button
                onClick={() => navigate("/products/add")}
                className="btn btn-primary"
              >
                <FiPlus className="w-4 h-4" />
                Add Product
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 pb-6">
          <div className="card">
            <div className="card-content">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="form-group">
                  <label className="form-label">Search Products</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name, manufacturer, batch..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="form-input pl-10"
                    />
                    <FiSearch
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                      style={{ color: "var(--color-text-muted)" }}
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="form-input"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="form-input"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </div>

                {/* Results Count */}
                <div className="flex items-end">
                  <div
                    className="text-sm px-3 py-2 rounded-lg"
                    style={{
                      backgroundColor: "var(--color-secondary-50)",
                      color: "var(--color-secondary-800)",
                    }}
                  >
                    Showing {filteredProducts.length} of {products.length}{" "}
                    products
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="px-6 pb-6">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Expiry</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <tr key={product.id}>
                      <td>
                        <div>
                          <div
                            className="font-semibold"
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            {product.name}
                          </div>
                          <div
                            className="text-sm"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            {product.manufacturer} • {product.batchNumber}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className="badge badge-info"
                          style={{
                            backgroundColor: "var(--color-secondary-100)",
                            color: "var(--color-secondary-800)",
                          }}
                        >
                          {product.category}
                        </span>
                      </td>
                      <td>
                        <div>
                          <div
                            className="font-semibold"
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            ₦{product.price.toFixed(2)}
                          </div>
                          <div
                            className="text-sm"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            Cost: ₦{product.costPrice.toFixed(2)}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: getStockStatusColor(stockStatus),
                            }}
                          ></div>
                          <div>
                            <div
                              className="font-semibold"
                              style={{ color: "var(--color-text-primary)" }}
                            >
                              {product.quantity}
                            </div>
                            <div
                              className="text-xs"
                              style={{
                                color: getStockStatusColor(stockStatus),
                              }}
                            >
                              {getStockStatusText(stockStatus)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            product.status === "active"
                              ? "badge-success"
                              : "badge-warning"
                          }`}
                        >
                          {product.status.charAt(0).toUpperCase() +
                            product.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div
                          className="text-sm"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {new Date(product.expiryDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              navigate(`/products/edit/${product.id}`)
                            }
                            className="p-2 rounded-lg transition-all duration-200"
                            style={{
                              color: "var(--color-secondary-600)",
                              backgroundColor: "transparent",
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor =
                                "var(--color-secondary-50)";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = "transparent";
                            }}
                            title="Edit Product"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 rounded-lg transition-all duration-200"
                            style={{
                              color: "var(--color-danger-600)",
                              backgroundColor: "transparent",
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor =
                                "var(--color-danger-50)";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = "transparent";
                            }}
                            title="Delete Product"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <FiPackage
                  className="w-16 h-16 mx-auto mb-4"
                  style={{ color: "var(--color-text-muted)" }}
                />
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  No products found
                </h3>
                <p style={{ color: "var(--color-text-muted)" }}>
                  {searchTerm ||
                  selectedCategory !== "all" ||
                  selectedStatus !== "all"
                    ? "Try adjusting your filters"
                    : "Get started by adding your first product"}
                </p>
                {!searchTerm &&
                  selectedCategory === "all" &&
                  selectedStatus === "all" && (
                    <button
                      onClick={() => navigate("/products/add")}
                      className="btn btn-primary mt-4"
                    >
                      <FiPlus className="w-4 h-4" />
                      Add Product
                    </button>
                  )}
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        {filteredProducts.length > 0 && (
          <div className="px-6 pb-6">
            <div className="dashboard-grid">
              <div className="stat-card stat-card-blue">
                <div className="stat-card-icon">
                  <FiPackage className="w-6 h-6" />
                </div>
                <div className="stat-card-value">{products.length}</div>
                <div className="stat-card-label">Total Products</div>
              </div>

              <div className="stat-card stat-card-green">
                <div className="stat-card-icon">
                  <FiCheck className="w-6 h-6" />
                </div>
                <div className="stat-card-value">
                  {
                    products.filter((p) => getStockStatus(p) === "in-stock")
                      .length
                  }
                </div>
                <div className="stat-card-label">In Stock</div>
              </div>

              <div className="stat-card stat-card-orange">
                <div className="stat-card-icon">
                  <FiAlertCircle className="w-6 h-6" />
                </div>
                <div className="stat-card-value">
                  {
                    products.filter((p) => getStockStatus(p) === "low-stock")
                      .length
                  }
                </div>
                <div className="stat-card-label">Low Stock</div>
              </div>

              <div className="stat-card stat-card-red">
                <div className="stat-card-icon">
                  <FiAlertCircle className="w-6 h-6" />
                </div>
                <div className="stat-card-value">
                  {
                    products.filter((p) => getStockStatus(p) === "out-of-stock")
                      .length
                  }
                </div>
                <div className="stat-card-label">Out of Stock</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductList;
