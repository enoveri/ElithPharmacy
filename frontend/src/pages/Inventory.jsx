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
  FiCheck,
  FiX,
  FiArchive,
  FiLoader,
} from "react-icons/fi";
import { dataService } from "../services";
import { useProductsStore, useSettingsStore } from "../store";

// Inventory page
function Inventory() {
  // Settings store for currency
  const { settings } = useSettingsStore();
  const { currency } = settings;

  const location = useLocation();
  const navigate = useNavigate();
  const { products, fetchProducts, isLoading } = useProductsStore();
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Initial logging
  console.log("🏪 [Inventory] Component initialized");
  console.log("⚙️ [Inventory] Data service config:", {
    useMockData: dataService?.useMockData,
    serviceAvailable: !!dataService,
  });
  console.log("🏬 [Inventory] Store state:", {
    productsCount: products?.length || 0,
    isLoading,
    fetchProductsAvailable: !!fetchProducts,
  });
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table"); // "table" or "grid"
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc"); // Fetch products on component mount
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteType, setBulkDeleteType] = useState('archive'); // 'archive' or 'delete'
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkValidation, setBulkValidation] = useState({
    totalSelected: 0,
    canDelete: [],
    hasWarnings: [],
    warnings: []
  });

  useEffect(() => {
    console.log("🔄 [Inventory] Starting to fetch products...");
    console.log("📊 [Inventory] Current products state:", products);
    console.log("⏳ [Inventory] Loading state:", isLoading);
    fetchProducts();
  }, [fetchProducts]);

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      console.log("🔄 [Inventory] Starting to load categories...");
      try {
        console.log("📡 [Inventory] Calling dataService.categories.getAll()");
        const categoriesData = await dataService.categories.getAll();
        console.log(
          "✅ [Inventory] Categories loaded successfully:",
          categoriesData
        );
        console.log(
          "📝 [Inventory] Categories data type:",
          typeof categoriesData
        );
        console.log(
          "📊 [Inventory] Categories length:",
          categoriesData?.length
        );
        setCategories(categoriesData);
      } catch (error) {
        console.error("❌ [Inventory] Error loading categories:", error);
        console.log("🔄 [Inventory] Using fallback categories");
        // Fallback to hardcoded categories
        setCategories([
          { id: 1, name: "Pain Relief" },
          { id: 2, name: "Antibiotics" },
          { id: 3, name: "Vitamins & Supplements" },
          { id: 4, name: "Cold & Flu" },
          { id: 5, name: "Digestive Health" },
          { id: 6, name: "Heart & Blood Pressure" },
          { id: 7, name: "Diabetes Care" },
          { id: 8, name: "Skin Care" },
          { id: 9, name: "Eye Care" },
          { id: 10, name: "Other" },
        ]);
      }
    };

    loadCategories();
  }, []);

  // Handle navigation from notifications
  useEffect(() => {
    if (location.state?.filter) {
      setStatusFilter(
        location.state.filter === "low-stock" ? "low-stock" : "expiring"
      );
    }
  }, [location.state]);

  // Add logging for products data
  useEffect(() => {
    console.log("📊 [Inventory] Products state updated:");
    console.log("   - Products count:", products?.length || 0);
    console.log("   - Products sample:", products?.slice(0, 3));
    console.log("   - Loading state:", isLoading);

    if (products?.length > 0) {
      const sampleProduct = products[0];
      console.log("🔍 [Inventory] Sample product structure:", {
        id: sampleProduct?.id,
        name: sampleProduct?.name,
        quantity: sampleProduct?.quantity,
        price: sampleProduct?.price,
        costPrice: sampleProduct?.costPrice,
        cost_price: sampleProduct?.cost_price,
        minStockLevel: sampleProduct?.minStockLevel,
        min_stock_level: sampleProduct?.min_stock_level,
        expiryDate: sampleProduct?.expiryDate,
        expiry_date: sampleProduct?.expiry_date,
        batchNumber: sampleProduct?.batchNumber,
        batch_number: sampleProduct?.batch_number,
        manufacturer: sampleProduct?.manufacturer,
        category: sampleProduct?.category,
      });
    }
  }, [products, isLoading]);
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        (product.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.batchNumber || product.batch_number || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (product.manufacturer || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === "low-stock") {
        const minStock = product.minStockLevel || product.min_stock_level || 0;
        matchesStatus = (product.quantity || 0) <= minStock;
      } else if (statusFilter === "out-of-stock") {
        matchesStatus = (product.quantity || 0) === 0;
      } else if (statusFilter === "in-stock") {
        const minStock = product.minStockLevel || product.min_stock_level || 0;
        matchesStatus = (product.quantity || 0) > minStock;
      } else if (statusFilter === "expiring") {
        const expiryDate = product.expiryDate || product.expiry_date;
        if (expiryDate) {
          const daysUntilExpiry = Math.ceil(
            (new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
          );
          matchesStatus = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
        } else {
          matchesStatus = false;
        }
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

  // Log filtering results
  console.log("🔍 [Inventory] Filtering results:");
  console.log("   - Original products count:", products?.length || 0);
  console.log("   - Filtered products count:", filteredProducts?.length || 0);
  console.log("   - Search term:", searchTerm);
  console.log("   - Status filter:", statusFilter);
  console.log("   - Category filter:", categoryFilter);
  console.log("   - Sort by:", sortBy, "Order:", sortOrder);

  // Calculate derived data
  const lowStockProducts = products.filter(
    (p) => (p.quantity || 0) <= (p.minStockLevel || p.min_stock_level || 0)
  );
  const outOfStockProducts = products.filter((p) => (p.quantity || 0) === 0);
  const totalValue = products.reduce(
    (sum, p) => sum + (p.quantity || 0) * (p.costPrice || p.cost_price || 0),
    0
  );
  
  // Debug: Check for products with decimal costPrice values
  const productsWithDecimals = products.filter(p => {
    const costPrice = p.costPrice || p.cost_price || 0;
    return costPrice % 1 !== 0; // Has decimal places
  });
  
  if (productsWithDecimals.length > 0) {
    console.warn("🔍 [Inventory] Products with decimal costPrice detected:");
    productsWithDecimals.forEach(p => {
      const costPrice = p.costPrice || p.cost_price || 0;
      const contribution = (p.quantity || 0) * costPrice;
      console.warn(`   - ${p.name}: costPrice=${costPrice}, quantity=${p.quantity}, contribution=${contribution}`);
    });
  }
  
  // Analyze for tax contamination
  useEffect(() => {
    if (products.length > 0) {
      import('../utils/priceUtils.js').then(({ analyzeProductTaxContamination, generateTaxCleanupSQL }) => {
        const analysis = analyzeProductTaxContamination(products);
        
        if (analysis.contaminatedProducts > 0) {
          console.warn("💰 [Inventory] Tax Contamination Analysis:");
          console.warn(`   - Total products: ${analysis.totalProducts}`);
          console.warn(`   - Clean products: ${analysis.cleanProducts}`);
          console.warn(`   - Contaminated products: ${analysis.contaminatedProducts}`);
          console.warn(`   - Need cost price cleanup: ${analysis.summary.needsCostPriceCleanup}`);
          console.warn(`   - Need selling price cleanup: ${analysis.summary.needsSellingPriceCleanup}`);
          
          console.group("💰 [Inventory] Contaminated Products Details:");
          analysis.contaminated.forEach(p => {
            console.warn(`${p.name}:`, {
              originalCost: p.originalCostPrice,
              cleanCost: p.cleanCostPrice,
              originalPrice: p.originalSellingPrice,
              cleanPrice: p.cleanSellingPrice,
              costNeedsCleanup: p.costContaminated,
              priceNeedsCleanup: p.priceContaminated
            });
          });
          console.groupEnd();
          
          // Generate SQL cleanup commands
          const sqlCommands = generateTaxCleanupSQL(analysis.contaminated);
          if (sqlCommands) {
            console.warn("💰 [Inventory] SQL Cleanup Commands:");
            console.warn(sqlCommands);
            
            // Calculate total value after cleanup
            const cleanTotalValue = products.reduce((sum, p) => {
              const costPrice = p.costPrice || p.cost_price || 0;
              const cleanCostPrice = analysis.contaminated.find(c => c.id === p.id)?.cleanCostPrice || costPrice;
              return sum + (p.quantity || 0) * cleanCostPrice;
            }, 0);
            
            console.warn(`💰 [Inventory] Current Total Value: UGX ${totalValue.toLocaleString()}`);
            console.warn(`💰 [Inventory] Clean Total Value: UGX ${cleanTotalValue.toLocaleString()}`);
            console.warn(`💰 [Inventory] Difference: UGX ${(totalValue - cleanTotalValue).toLocaleString()}`);
          }
        } else {
          console.log("✅ [Inventory] No tax contamination detected in product pricing");
        }
      });
    }
  }, [products, totalValue]);
  const expiringProducts = products.filter((p) => {
    const expiryDate = p.expiryDate || p.expiry_date;
    if (!expiryDate) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  // Log derived data calculations
  console.log("📈 [Inventory] Derived data calculations:");
  console.log("   - Low stock products:", lowStockProducts?.length || 0);
  console.log("   - Out of stock products:", outOfStockProducts?.length || 0);
  console.log("   - Expiring products:", expiringProducts?.length || 0);
  console.log("   - Total inventory value:", totalValue);
  console.log("   - Categories loaded:", categories?.length || 0);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStockStatus = (product) => {
    const minStock = product.minStockLevel || product.min_stock_level || 0;
    const quantity = product.quantity || 0;

    if (quantity === 0) {
      return { text: "Out of Stock", color: "#ef4444" };
    } else if (quantity <= minStock) {
      return { text: "Low Stock", color: "#f59e0b" };
    } else {
      return { text: "In Stock", color: "#10b981" };
    }
  };

  // Bulk selection handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      const allProductIds = new Set(filteredProducts.map(product => product.id));
      setSelectedProducts(allProductIds);
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleSelectProduct = (productId, checked) => {
    const newSelection = new Set(selectedProducts);
    if (checked) {
      newSelection.add(productId);
    } else {
      newSelection.delete(productId);
    }
    setSelectedProducts(newSelection);
  };

  const validateBulkDelete = async (productIds) => {
    try {
      console.log("🔍 [Inventory] Validating bulk delete for products:", productIds);
      
      const validation = {
        totalSelected: productIds.size,
        canDelete: [],
        hasWarnings: [],
        warnings: []
      };

      // Get relations for each product
      const productIdsArray = Array.from(productIds);
      const relationsPromises = productIdsArray.map(id => 
        dataService.products.getRelations(id)
      );
      
      const relationsResults = await Promise.all(relationsPromises);
      
      productIdsArray.forEach((productId, index) => {
        const relations = relationsResults[index];
        const product = filteredProducts.find(p => p.id === productId);
        
        if (!relations || !product) return;

        const warnings = [];
        if (relations.salesCount > 0) {
          warnings.push(`${product.name}: ${relations.salesCount} sales records`);
        }
        if (product.quantity > 0) {
          warnings.push(`${product.name}: ${product.quantity} units in stock`);
        }
        if (relations.recentSalesCount > 0) {
          warnings.push(`${product.name}: ${relations.recentSalesCount} recent sales`);
        }

        if (warnings.length > 0) {
          validation.hasWarnings.push(productId);
          validation.warnings.push(...warnings);
        } else {
          validation.canDelete.push(productId);
        }
      });

      setBulkValidation(validation);
      return validation;
    } catch (error) {
      console.error("❌ [Inventory] Error validating bulk delete:", error);
      setBulkValidation({
        totalSelected: productIds.size,
        canDelete: [],
        hasWarnings: Array.from(productIds),
        warnings: ["Unable to validate product dependencies. Please try again."]
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    
    setShowBulkDeleteModal(true);
    await validateBulkDelete(selectedProducts);
  };

  const executeBulkAction = async () => {
    setIsBulkDeleting(true);
    try {
      const productIds = Array.from(selectedProducts);
      
      console.log(`🔄 [Inventory] Executing bulk ${bulkDeleteType} for ${productIds.length} products`);
      
      const options = {
        archive: bulkDeleteType === 'archive',
        cascadeDelete: true,
        archiveRelatedSales: bulkDeleteType === 'archive',
        reason: `Bulk ${bulkDeleteType} from inventory page`
      };
      
      const result = await dataService.products.bulkDelete(productIds, options);
      
      if (result.success) {
        const { successful, failed, totalProcessed } = result.data;
        
        console.log(`✅ [Inventory] Bulk operation completed: ${successful.length}/${totalProcessed} successful`);
        
        // Show detailed success message
        let message = `Successfully ${bulkDeleteType === 'archive' ? 'archived' : 'deleted'} ${successful.length} products!`;
        
        if (failed.length > 0) {
          message += `\n${failed.length} operations failed. Please check the console for details.`;
        }
        
        // Calculate total affected sales
        const totalAffectedSales = successful.reduce((sum, item) => {
          return sum + (item.result?.data?.affectedSales || 0);
        }, 0);
        
        if (totalAffectedSales > 0) {
          message += `\n${totalAffectedSales} related sales were also ${bulkDeleteType === 'archive' ? 'archived' : 'deleted'}.`;
        }
        
        alert(message);
        
        // Refresh products and clear selection
        await fetchProducts();
        setSelectedProducts(new Set());
        setShowBulkDeleteModal(false);
        
      } else {
        throw new Error(result.error?.message || "Bulk operation failed");
      }
      
    } catch (error) {
      console.error("❌ [Inventory] Error with bulk action:", error);
      alert(`Error performing bulk ${bulkDeleteType}. Please try again.\n\nError: ${error.message}`);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const closeBulkDeleteModal = () => {
    setShowBulkDeleteModal(false);
    setBulkValidation({
      totalSelected: 0,
      canDelete: [],
      hasWarnings: [],
      warnings: []
    });
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
                width: "40px",
              }}
            >
              <input
                type="checkbox"
                checked={selectedProducts.size > 0 && selectedProducts.size === filteredProducts.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
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
                  backgroundColor: selectedProducts.has(product.id) ? "#f0f9ff" : "transparent",
                }}
              >
                <td style={{ padding: "16px 12px" }}>
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product.id)}
                    onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </td>
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
                    {currency}
                    {(product.price || 0).toFixed(2)}
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
              backgroundColor: selectedProducts.has(product.id) ? "#f0f9ff" : "white",
              borderRadius: "12px",
              padding: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: selectedProducts.has(product.id) ? "2px solid #3b82f6" : "1px solid transparent",
              transition: "transform 0.3s ease",
              position: "relative",
            }}
          >
            {/* Checkbox */}
            <div style={{ position: "absolute", top: "12px", right: "12px" }}>
              <input
                type="checkbox"
                checked={selectedProducts.has(product.id)}
                onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
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
                {currency}
                {(product.price || 0).toFixed(2)}
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
      {/* Action Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "12px",
          marginBottom: "32px",
        }}
      >
        <button
          onClick={() => navigate("/inventory/receive")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 20px",
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          <FiPackage size={16} />
          Receive Stock
        </button>
        <button
          onClick={() => navigate("/inventory/audit")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 20px",
            backgroundColor: "#f59e0b",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          <FiClock size={16} />
          Stock Audit
        </button>
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
                {currency}
                {(totalValue || 0).toLocaleString()}
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
              {" "}
              <option value="all">All Categories</option>
              {categories.map((category) => (
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

      {/* Bulk Actions Toolbar */}
      {selectedProducts.size > 0 && (
        <div
          style={{
            backgroundColor: "#f0f9ff",
            border: "1px solid #bfdbfe",
            borderRadius: "12px",
            padding: "16px 24px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <FiCheck
              style={{
                backgroundColor: "#3b82f6",
                color: "white",
                borderRadius: "50%",
                padding: "4px",
                width: "24px",
                height: "24px",
              }}
            />
            <span style={{ fontSize: "14px", fontWeight: "500", color: "#1f2937" }}>
              {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setSelectedProducts(new Set())}
              style={{
                padding: "8px 16px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                backgroundColor: "white",
                color: "#6b7280",
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <FiX size={14} />
              Clear Selection
            </button>
            <button
              onClick={handleBulkDelete}
              style={{
                padding: "8px 16px",
                border: "1px solid #dc2626",
                borderRadius: "6px",
                backgroundColor: "#dc2626",
                color: "white",
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <FiTrash2 size={14} />
              Bulk Actions
            </button>
          </div>
        </div>
      )}

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

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-96 overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <FiAlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Bulk Actions
                  </h3>
                  <p className="text-sm text-gray-500">
                    Choose action for {bulkValidation.totalSelected} selected products
                  </p>
                </div>
              </div>
              <button
                onClick={closeBulkDeleteModal}
                className="text-gray-400 hover:text-gray-600"
                disabled={isBulkDeleting}
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Warnings */}
              {bulkValidation.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                  <div className="flex">
                    <FiAlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800 mb-2">
                        Warning: Some products have dependencies
                      </p>
                      <div className="text-yellow-700 max-h-32 overflow-y-auto">
                        {bulkValidation.warnings.slice(0, 5).map((warning, index) => (
                          <p key={index} className="mb-1">• {warning}</p>
                        ))}
                        {bulkValidation.warnings.length > 5 && (
                          <p className="text-yellow-600 italic">
                            ... and {bulkValidation.warnings.length - 5} more
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Type Selection */}
              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-3">Choose an action:</p>
                <div className="space-y-3">
                  <label className="flex items-center p-3 border border-blue-200 rounded-md bg-blue-50 cursor-pointer">
                    <input
                      type="radio"
                      name="bulkAction"
                      value="archive"
                      checked={bulkDeleteType === 'archive'}
                      onChange={(e) => setBulkDeleteType(e.target.value)}
                      className="mr-3"
                    />
                    <FiArchive className="w-4 h-4 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium text-blue-900">Archive Products</p>
                      <p className="text-blue-700 text-xs">Hide from inventory but keep all data</p>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border border-red-200 rounded-md bg-red-50 cursor-pointer">
                    <input
                      type="radio"
                      name="bulkAction"
                      value="delete"
                      checked={bulkDeleteType === 'delete'}
                      onChange={(e) => setBulkDeleteType(e.target.value)}
                      className="mr-3"
                    />
                    <FiTrash2 className="w-4 h-4 text-red-600 mr-2" />
                    <div>
                      <p className="font-medium text-red-900">Permanent Delete</p>
                      <p className="text-red-700 text-xs">Remove products but keep sales history</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={closeBulkDeleteModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                disabled={isBulkDeleting}
              >
                Cancel
              </button>
              <button
                onClick={executeBulkAction}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white ${
                  bulkDeleteType === 'archive' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={isBulkDeleting}
              >
                {isBulkDeleting ? (
                  <>
                    <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                    {bulkDeleteType === 'archive' ? 'Archiving...' : 'Deleting...'}
                  </>
                ) : (
                  <>
                    {bulkDeleteType === 'archive' ? (
                      <FiArchive className="w-4 h-4 mr-2" />
                    ) : (
                      <FiTrash2 className="w-4 h-4 mr-2" />
                    )}
                    {bulkDeleteType === 'archive' ? 'Archive Products' : 'Delete Products'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;
