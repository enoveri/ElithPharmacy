import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  FiArrowLeft,
  FiTag,
  FiPackage,
  FiSearch,
  FiFilter,
  FiGrid,
  FiList,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiDollarSign,
  FiCalendar,
  FiAlertCircle,
  FiEye,
} from "react-icons/fi";
import { dataService } from "../services";
import { useProductsStore, useSettingsStore } from "../store";
import { removeTaxContamination } from "../utils/priceUtils";

function CategoryProducts() {
  const { settings } = useSettingsStore();
  const currency = "UGX";

  const navigate = useNavigate();
  const { categoryId } = useParams();
  const location = useLocation();
  
  // Use the products store to get all products
  const { products, fetchProducts, isLoading } = useProductsStore();
  
  // Get category info from navigation state or fetch it
  const [categoryInfo, setCategoryInfo] = useState({
    name: location.state?.categoryName || "",
    description: location.state?.categoryDescription || "",
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const [sortBy, setSortBy] = useState("name"); // "name", "price", "stock", "date"
  const [filterStock, setFilterStock] = useState("all"); // "all", "inStock", "lowStock", "outOfStock"

  useEffect(() => {
    console.log("🔄 [CategoryProducts] Component initialized for category:", categoryId);
    console.log("🔄 [CategoryProducts] All products:", products?.length || 0);
    
    // Fetch products if not already loaded
    if (!products || products.length === 0) {
      fetchProducts();
    }
    
    // Load category info if not provided via navigation state
    if (!categoryInfo.name) {
      loadCategoryInfo();
    }
  }, [categoryId, fetchProducts]);

  const loadCategoryInfo = async () => {
    try {
      console.log("🔄 [CategoryProducts] Loading category info for ID:", categoryId);
      const category = await dataService.categories.getById(categoryId);
      console.log("✅ [CategoryProducts] Category info loaded:", category);
      setCategoryInfo({
        name: category.name,
        description: category.description || "",
      });
    } catch (error) {
      console.error("❌ [CategoryProducts] Error loading category info:", error);
      // Try to find category by ID in the fallback categories
      const fallbackCategories = [
        { id: 1, name: "Pain Relief", description: "Pain management medications" },
        { id: 2, name: "Antibiotics", description: "Antibiotic medications" },
        { id: 3, name: "Vitamins & Supplements", description: "Nutritional supplements" },
        { id: 4, name: "Cold & Flu", description: "Cold and flu remedies" },
        { id: 5, name: "Digestive Health", description: "Digestive system medications" },
        { id: 6, name: "Heart & Blood Pressure", description: "Cardiovascular medications" },
        { id: 7, name: "Diabetes Care", description: "Diabetes management products" },
        { id: 8, name: "Skin Care", description: "Dermatological products" },
        { id: 9, name: "Eye Care", description: "Ophthalmic products" },
        { id: 10, name: "Other", description: "Miscellaneous products" },
      ];
      
      const fallbackCategory = fallbackCategories.find(cat => cat.id === parseInt(categoryId));
      if (fallbackCategory) {
        setCategoryInfo({
          name: fallbackCategory.name,
          description: fallbackCategory.description,
        });
      }
    }
  };

  // Filter products by category - this is the key fix!
  const categoryProducts = products.filter(product => {
    // Check if product category matches the selected category
    const productCategory = product.category;
    const targetCategoryName = categoryInfo.name;
    
    console.log("🔍 [CategoryProducts] Checking product:", {
      productName: product.name,
      productCategory,
      targetCategoryName,
      matches: productCategory === targetCategoryName
    });
    
    return productCategory === targetCategoryName;
  });

  console.log("📊 [CategoryProducts] Category filtering results:");
  console.log("   - Category ID:", categoryId);
  console.log("   - Category Name:", categoryInfo.name);
  console.log("   - Total products:", products?.length || 0);
  console.log("   - Category products:", categoryProducts?.length || 0);
  console.log("   - Sample category products:", categoryProducts?.slice(0, 3));

  // Filter and sort products
  const filteredAndSortedProducts = categoryProducts
    .filter((product) => {
      const matchesSearch = (product.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStockFilter = (() => {
        const stock = product.quantity || 0;
        const lowStockThreshold = product.minStockLevel || product.min_stock_level || 0;
        
        switch (filterStock) {
          case "inStock":
            return stock > lowStockThreshold;
          case "lowStock":
            return stock > 0 && stock <= lowStockThreshold;
          case "outOfStock":
            return stock === 0;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesStockFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price":
          return (a.price || 0) - (b.price || 0);
        case "stock":
          return (b.quantity || 0) - (a.quantity || 0);
        case "date":
          const dateA = new Date(a.createdAt || a.created_at || 0);
          const dateB = new Date(b.createdAt || b.created_at || 0);
          return dateB - dateA;
        default:
          return (a.name || "").localeCompare(b.name || "");
      }
    });

  const getStockStatus = (product) => {
    const stock = product.quantity || 0;
    const lowStockThreshold = product.minStockLevel || product.min_stock_level || 0;
    
    if (stock === 0) return { status: "out", color: "#ef4444", text: "Out of Stock" };
    if (stock <= lowStockThreshold) return { status: "low", color: "#f59e0b", text: "Low Stock" };
    return { status: "in", color: "#10b981", text: "In Stock" };
  };

  const handleEditProduct = (product) => {
    navigate(`/inventory/edit/${product.id}`);
  };

  const handleViewProduct = (product) => {
    navigate(`/inventory/view/${product.id}`);
  };

  const handleDeleteProduct = (product) => {
    // Implement delete functionality
    console.log("Delete product:", product);
    // You can add a confirmation dialog here
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      // Call your delete API here
      console.log("Deleting product:", product.id);
    }
  };

  const handleAddProduct = () => {
    navigate("/inventory/add", { 
      state: { 
        preselectedCategory: { 
          id: categoryId, 
          name: categoryInfo.name 
        } 
      } 
    });
  };

  // Calculate stats for the category
  const totalProducts = categoryProducts.length;
  const inStockProducts = categoryProducts.filter(p => {
    const stock = p.quantity || 0;
    const threshold = p.minStockLevel || p.min_stock_level || 0;
    return stock > threshold;
  }).length;
  const lowStockProducts = categoryProducts.filter(p => {
    const stock = p.quantity || 0;
    const threshold = p.minStockLevel || p.min_stock_level || 0;
    return stock > 0 && stock <= threshold;
  }).length;
  const outOfStockProducts = categoryProducts.filter(p => (p.quantity || 0) === 0).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => navigate("/categories")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                backgroundColor: "white",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <FiArrowLeft size={16} />
              Back to Categories
            </button>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: "#dbeafe",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FiTag color="#3b82f6" size={16} />
                </div>
                <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1f2937", margin: 0 }}>
                  {categoryInfo.name}
                </h1>
              </div>
              <p style={{ fontSize: "16px", color: "#6b7280", margin: 0 }}>
                {categoryInfo.description || "Products in this category"}
              </p>
            </div>
          </div>
          <button
            onClick={handleAddProduct}
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
            <FiPlus size={16} />
            Add Product
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>Total Products</p>
              <p style={{ fontSize: "24px", fontWeight: "bold", color: "#1f2937", margin: "4px 0 0 0" }}>
                {totalProducts}
              </p>
            </div>
            <FiPackage size={24} color="#3b82f6" />
          </div>
        </div>
        
        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>In Stock</p>
              <p style={{ fontSize: "24px", fontWeight: "bold", color: "#10b981", margin: "4px 0 0 0" }}>
                {inStockProducts}
              </p>
            </div>
            <div style={{ width: "12px", height: "12px", backgroundColor: "#10b981", borderRadius: "50%" }} />
          </div>
        </div>
        
        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>Low Stock</p>
              <p style={{ fontSize: "24px", fontWeight: "bold", color: "#f59e0b", margin: "4px 0 0 0" }}>
                {lowStockProducts}
              </p>
            </div>
            <FiAlertCircle size={24} color="#f59e0b" />
          </div>
        </div>
        
        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>Out of Stock</p>
              <p style={{ fontSize: "24px", fontWeight: "bold", color: "#ef4444", margin: "4px 0 0 0" }}>
                {outOfStockProducts}
              </p>
            </div>
            <div style={{ width: "12px", height: "12px", backgroundColor: "#ef4444", borderRadius: "50%" }} />
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
            {/* Filters and Controls */}
      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
            {/* Search */}
            <div style={{ position: "relative", minWidth: "300px" }}>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 36px 8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
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

            {/* Stock Filter */}
            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "white",
              }}
            >
              <option value="all">All Stock Levels</option>
              <option value="inStock">In Stock</option>
              <option value="lowStock">Low Stock</option>
              <option value="outOfStock">Out of Stock</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "white",
              }}
            >
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
              <option value="stock">Sort by Stock</option>
              <option value="date">Sort by Date</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: "flex", border: "1px solid #d1d5db", borderRadius: "6px", overflow: "hidden" }}>
            <button
              onClick={() => setViewMode("grid")}
              style={{
                padding: "8px 12px",
                backgroundColor: viewMode === "grid" ? "#3b82f6" : "white",
                color: viewMode === "grid" ? "white" : "#6b7280",
                border: "none",
                cursor: "pointer",
              }}
            >
              <FiGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              style={{
                padding: "8px 12px",
                backgroundColor: viewMode === "list" ? "#3b82f6" : "white",
                color: viewMode === "list" ? "white" : "#6b7280",
                border: "none",
                borderLeft: "1px solid #d1d5db",
                cursor: "pointer",
              }}
            >
              <FiList size={16} />
            </button>
          </div>
        </div>
        
        {/* Results count */}
        <div style={{ marginTop: "12px", fontSize: "14px", color: "#6b7280" }}>
          Showing {filteredAndSortedProducts.length} of {categoryProducts.length} products
        </div>
      </div>

      {/* Products Display */}
      {filteredAndSortedProducts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", backgroundColor: "white", borderRadius: "8px" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              backgroundColor: "#f3f4f6",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <FiPackage size={32} color="#9ca3af" />
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
            {categoryProducts.length === 0 ? "No products in this category" : "No products found"}
          </h3>
          <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "20px" }}>
            {categoryProducts.length === 0 
              ? "This category doesn't have any products yet. Add some products to get started." 
              : "Try adjusting your search or filter criteria"}
          </p>
          <button
            onClick={handleAddProduct}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            <FiPlus size={16} />
            Add Product to {categoryInfo.name}
          </button>
        </div>
      ) : (
        <div
          style={{
            display: viewMode === "grid" ? "grid" : "block",
            gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(280px, 1fr))" : "1fr",
            gap: viewMode === "grid" ? "20px" : "12px",
          }}
        >
          {filteredAndSortedProducts.map((product) => {
            const stockStatus = getStockStatus(product);
            
            if (viewMode === "list") {
              return (
                <div
                  key={product.id}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          backgroundColor: "#f3f4f6",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FiPackage size={20} color="#6b7280" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", margin: 0 }}>
                          {product.name}
                        </h3>
                        {(product.description || product.manufacturer) && (
                          <p style={{ fontSize: "14px", color: "#6b7280", margin: "2px 0 0 0" }}>
                            {product.description || product.manufacturer}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                      <div style={{ textAlign: "center" }}>
                        <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>Price</p>
                        <p style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", margin: "2px 0 0 0" }}>
                        
                         UGX
                         {(product.price || 0).toFixed(2)}
                        </p>
                      </div>
                      
                      <div style={{ textAlign: "center" }}>
                        <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>Stock</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              backgroundColor: stockStatus.color,
                              borderRadius: "50%",
                            }}
                          />
                          <span style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937" }}>
                            {product.quantity || 0}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleViewProduct(product)}
                          style={{
                            padding: "8px",
                            backgroundColor: "#f0fdf4",
                            color: "#10b981",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                          title="View Product"
                        >
                          <FiEye size={16} />
                        </button>
                        <button
                          onClick={() => handleEditProduct(product)}
                          style={{
                            padding: "8px",
                            backgroundColor: "#dbeafe",
                            color: "#3b82f6",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                          title="Edit Product"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          style={{
                            padding: "8px",
                            backgroundColor: "#fecaca",
                            color: "#ef4444",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                          title="Delete Product"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Grid view
            return (
              <div
                key={product.id}
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  border: "1px solid #e5e7eb",
                  transition: "all 0.2s ease-in-out",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                }}
              >
                {/* Product Image Placeholder */}
                <div
                  style={{
                    width: "100%",
                    height: "120px",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                  }}
                >
                  <FiPackage size={32} color="#9ca3af" />
                </div>

                {/* Product Info */}
                <div style={{ marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", margin: "0 0 4px 0" }}>
                    {product.name}
                  </h3>
                  {(product.description || product.manufacturer) && (
                    <p style={{ fontSize: "14px", color: "#6b7280", margin: 0, lineHeight: "1.4" }}>
                      {product.description || product.manufacturer}
                    </p>
                  )}
                </div>

                {/* Price and Stock */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <FiDollarSign size={16} color="#10b981" />
                    <span style={{ fontSize: "18px", fontWeight: "700", color: "#10b981" }}>
                      {(product.price || 0).toFixed(2)}
                    </span>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        backgroundColor: stockStatus.color,
                        borderRadius: "50%",
                      }}
                    />
                    <span style={{ fontSize: "14px", fontWeight: "500", color: stockStatus.color }}>
                      {product.quantity || 0} units
                    </span>
                  </div>
                </div>

                {/* Stock Status Badge */}
                <div
                  style={{
                    display: "inline-block",
                    padding: "4px 8px",
                    backgroundColor: `${stockStatus.color}20`,
                    color: stockStatus.color,
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "500",
                    marginBottom: "16px",
                  }}
                >
                  {stockStatus.text}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#6b7280" }}>
                    <FiCalendar size={12} />
                    {new Date(product.createdAt || product.created_at || Date.now()).toLocaleDateString()}
                  </div>
                  
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => handleViewProduct(product)}
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
                      onClick={() => handleEditProduct(product)}
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
                    <button
                      onClick={() => handleDeleteProduct(product)}
                      style={{
                        padding: "6px",
                        backgroundColor: "#fecaca",
                        color: "#ef4444",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                      title="Delete Product"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CategoryProducts;
