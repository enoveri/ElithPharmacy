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
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  formatProductDataForExport,
} from "../utils/exportUtils";
import {
  validateProductData,
  transformImportedProductData,
} from "../utils/importUtils";
import ImportModal from "../components/ImportModal";
import { dataService } from "../services";

// Product List page
function ProductList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("🔄 [ProductList] Loading products and categories...");
        setLoading(true);

        const [productsData, categoriesData] = await Promise.all([
          dataService.products.getAll(),
          dataService.categories.getAll().catch(() => []),
        ]);

        console.log(
          "✅ [ProductList] Products loaded:",
          productsData?.length || 0
        );
        console.log(
          "✅ [ProductList] Categories loaded:",
          categoriesData?.length || 0
        );

        setProducts(productsData || []);
        setFilteredProducts(productsData || []);

        // Extract category names
        const categoryNames = categoriesData.map((cat) => cat.name || cat);
        setCategories(categoryNames);
      } catch (error) {
        console.error("❌ [ProductList] Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Show success message if coming from edit/add
    if (location.state?.message) {
      console.log(location.state.message);
    }
  }, [location.state]);

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
    const quantity = product.quantity || 0;
    const minStockLevel = product.minStockLevel || product.min_stock_level || 0;

    if (quantity === 0) return "out-of-stock";
    if (quantity <= minStockLevel) return "low-stock";
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

  const handleExport = (format) => {
    const exportData = formatProductDataForExport(filteredProducts);
    const filename = `products_${new Date().toISOString().split("T")[0]}`;

    switch (format) {
      case "csv":
        exportToCSV(exportData, `${filename}.csv`);
        break;
      case "excel":
        exportToExcel(exportData, `${filename}.xlsx`);
        break;
      case "pdf":
        exportToPDF(exportData, `${filename}.pdf`, "Product List");
        break;
      default:
        exportToCSV(exportData, `${filename}.csv`);
    }
  };
  const handleImport = async (importedData) => {
    try {
      console.log("🔄 [ProductList] Starting product import...");
      console.log("📥 [ProductList] Imported data:", importedData);

      // Process and create products in database
      const createPromises = importedData.map(async (product) => {
        const productForDb = {
          name: product.name || "Unknown Product",
          category: product.category || "Other",
          manufacturer: product.manufacturer || "",
          description: product.description || "",
          costPrice: parseFloat(product.costPrice) || 0,
          price: parseFloat(product.price) || 0,
          quantity: parseInt(product.quantity) || 0,
          minStockLevel: parseInt(product.minStockLevel) || 0,
          expiryDate: product.expiryDate || null,
          batchNumber: product.batchNumber || "",
          barcode: product.barcode || "",
          status: "active",
        };

        return dataService.products.create(productForDb);
      });

      const createdProducts = await Promise.all(createPromises);
      const successfulImports = createdProducts.filter(Boolean);

      console.log(
        `✅ [ProductList] Successfully imported ${successfulImports.length} products`
      );

      // Refresh the products list
      const updatedProducts = await dataService.products.getAll();
      setProducts(updatedProducts || []);
      setFilteredProducts(updatedProducts || []);

      setShowImportModal(false);

      // Show success message
      alert(`Successfully imported ${successfulImports.length} products!`);
    } catch (error) {
      console.error("❌ [ProductList] Error importing products:", error);
      alert("Error importing products. Please try again.");
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
              {/* Export Dropdown */}
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleExport(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="btn btn-outline"
              >
                <option value="">
                  <FiDownload className="w-4 h-4" />
                  Export
                </option>
                <option value="csv">Export as CSV</option>
                <option value="excel">Export as Excel</option>
                <option value="pdf">Export as PDF</option>
              </select>

              <button
                onClick={() => setShowImportModal(true)}
                className="btn btn-outline"
              >
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
                      </td>{" "}
                      <td>
                        <div>
                          <div
                            className="font-semibold"
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            ₦{(product.price || 0).toFixed(2)}
                          </div>
                          <div
                            className="text-sm"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            Cost: ₦
                            {(
                              product.costPrice ||
                              product.cost_price ||
                              0
                            ).toFixed(2)}
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

        {/* Import Modal */}
        <ImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
          type="products"
          validateData={validateProductData}
          transformData={transformImportedProductData}
        />
      </div>
    </div>
  );
}

export default ProductList;
