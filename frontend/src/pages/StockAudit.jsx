import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiEye,
  FiEdit,
  FiDownload,
  FiSave,
  FiCheck,
  FiClock,
  FiPackage,
  FiAlertTriangle,
} from "react-icons/fi";
import { stockAuditService, dataService } from "../services";

function StockAudit() {
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [auditDate, setAuditDate] = useState(new Date().toISOString().split("T")[0]);
  const [auditData, setAuditData] = useState({});

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        console.log("🔄 [StockAudit] Loading products...");
        const productsData = await dataService.products.getAll();
        console.log("✅ [StockAudit] Products loaded:", productsData?.length || 0);
        setProducts(productsData || []);
      } catch (error) {
        console.error("❌ [StockAudit] Error loading products:", error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log("🔄 [StockAudit] Loading categories...");
        const categoriesData = await dataService.categories.getAll();
        console.log("✅ [StockAudit] Categories loaded:", categoriesData?.length || 0);
        setCategories(categoriesData || []);
      } catch (error) {
        console.error("❌ [StockAudit] Error loading categories:", error);
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

  const getVariance = (productId) => {
    const product = products.find(p => p.id === productId);
    const physicalCount = auditData[productId]?.physicalCount;
    if (physicalCount === undefined || physicalCount === null || physicalCount === "") return 0;
    return parseInt(physicalCount) - (product?.quantity || 0);
  };

  const getAuditStatus = (productId) => {
    const variance = getVariance(productId);
    const physicalCount = auditData[productId]?.physicalCount;
    if (physicalCount === undefined || physicalCount === null || physicalCount === "") return "pending";
    if (variance === 0) return "matched";
    if (Math.abs(variance) >= 10) return "critical";
    return "variance";
  };

  const updatePhysicalCount = (productId, value) => {
    setAuditData(prev => ({
      ...prev,
      [productId]: { ...prev[productId], physicalCount: value }
    }));
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = (product.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.batch_number || product.batchNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.category || "").toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (statusFilter !== "all") {
      matchesStatus = getAuditStatus(product.id) === statusFilter;
    }

    const matchesCategory = categoryFilter === "all" || (product.category || "") === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const auditedItems = Object.keys(auditData).filter(
    key => auditData[key]?.physicalCount !== undefined && 
           auditData[key]?.physicalCount !== null && 
           auditData[key]?.physicalCount !== ""
  ).length;

  const totalVariance = Object.keys(auditData).reduce((sum, productId) => {
    return sum + getVariance(parseInt(productId));
  }, 0);

  const estimatedValue = totalVariance * 5000;

  const getStatusStyle = (status) => {
    const styles = {
      pending: { backgroundColor: "#f3f4f6", color: "#6b7280" },
      matched: { backgroundColor: "#d1fae5", color: "#065f46" },
      variance: { backgroundColor: "#fef3c7", color: "#92400e" },
      critical: { backgroundColor: "#fecaca", color: "#991b1b" }
    };
    return styles[status] || styles.pending;
  };

  const exportToCSV = async () => {
    try {
      const auditDataForExport = {
        audit_date: auditDate,
        audit_items: filteredProducts.map(product => ({
          ...product,
          physicalCount: auditData[product.id]?.physicalCount || null,
          variance: getVariance(product.id),
          status: getAuditStatus(product.id)
        })),
        total_items_audited: auditedItems,
        total_variance: totalVariance,
        estimated_value_impact: estimatedValue
      };
      await stockAuditService.exportAuditData(auditDataForExport, "csv");
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    }
  };

  const saveDraft = async () => {
    try {
      const draftData = {
        audit_date: auditDate,
        audit_items: products.map(product => ({
          ...product,
          physicalCount: auditData[product.id]?.physicalCount || null,
          variance: getVariance(product.id),
          status: getAuditStatus(product.id)
        })),
        status: "draft",
        total_items_audited: auditedItems,
        total_variance: totalVariance,
        estimated_value_impact: estimatedValue
      };
      await stockAuditService.saveDraft(draftData);
      alert("Draft saved successfully!");
    } catch (error) {
      console.error("Save failed:", error);
      alert("Save failed. Please try again.");
    }
  };

  const completeAudit = async () => {
    if (auditedItems < 5) {
      alert("Please audit at least 5 items before completing the audit.");
      return;
    }
    
    try {
      const auditDataForCompletion = {
        audit_date: auditDate,
        audit_items: products.map(product => ({
          ...product,
          physicalCount: auditData[product.id]?.physicalCount || null,
          variance: getVariance(product.id),
          status: getAuditStatus(product.id)
        })),
        status: "completed",
        total_items_audited: auditedItems,
        total_variance: totalVariance,
        estimated_value_impact: estimatedValue,
        completed_at: new Date().toISOString()
      };
      await stockAuditService.completeAudit(auditDataForCompletion);
      alert("Audit completed successfully!");
      navigate("/inventory");
    } catch (error) {
      console.error("Complete audit failed:", error);
      alert("Failed to complete audit. Please try again.");
    }
  };

  const stats = {
    totalProducts: products.length,
    itemsAudited: auditedItems,
    pendingItems: products.filter(p => getAuditStatus(p.id) === "pending").length,
    varianceItems: products.filter(p => {
      const status = getAuditStatus(p.id);
      return status === "variance" || status === "critical";
    }).length
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        backgroundColor: "#f8fafc"
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{
      padding: "24px",
      backgroundColor: "#f8fafc",
      minHeight: "100vh",
    }}>
      {/* Action Buttons */}
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "12px",
        marginBottom: "32px",
      }}>
        <button
          onClick={() => navigate("/inventory")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 20px",
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          Back to Inventory
        </button>
        <button
          onClick={exportToCSV}
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
          <FiDownload size={16} />
          Export CSV
        </button>
        <button
          onClick={saveDraft}
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
          <FiSave size={16} />
          Save Draft
        </button>
        <button
          onClick={completeAudit}
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
          <FiCheck size={16} />
          Complete Audit
        </button>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "24px",
        marginBottom: "32px",
      }}>
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{
              width: "48px",
              height: "48px",
              backgroundColor: "#dbeafe",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "12px",
            }}>
              <FiPackage color="#3b82f6" size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Total Items
              </div>
              <div style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#1f2937",
              }}>
                {stats.totalProducts}
              </div>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{
              width: "48px",
              height: "48px",
              backgroundColor: "#d1fae5",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "12px",
            }}>
              <FiCheck color="#10b981" size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Items Audited
              </div>
              <div style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#1f2937",
              }}>
                {stats.itemsAudited}
              </div>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{
              width: "48px",
              height: "48px",
              backgroundColor: "#fed7aa",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "12px",
            }}>
              <FiClock color="#f97316" size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Pending Items
              </div>
              <div style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#1f2937",
              }}>
                {stats.pendingItems}
              </div>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{
              width: "48px",
              height: "48px",
              backgroundColor: "#fecaca",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "12px",
            }}>
              <FiAlertTriangle color="#ef4444" size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Variance Items
              </div>
              <div style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#1f2937",
              }}>
                {stats.varianceItems}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        marginBottom: "24px",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 200px 200px 150px auto",
          gap: "16px",
          alignItems: "end",
        }}>
          <div>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              marginBottom: "8px",
            }}>
              Search Products
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Search by product name, SKU, or category..."
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
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              marginBottom: "8px",
            }}>
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "13px",
                backgroundColor: "white",
                minWidth: "140px"
              }}
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id || category.name || category} value={category.name || category}>
                  {category.name || category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              marginBottom: "8px",
            }}>
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
              <option value="pending">Pending</option>
              <option value="matched">Matched</option>
              <option value="variance">Variance</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              marginBottom: "8px",
            }}>
              Audit Date
            </label>
            <input
              type="date"
              value={auditDate}
              onChange={(e) => setAuditDate(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{
            padding: "12px 16px",
            backgroundColor: "#f3f4f6",
            borderRadius: "8px",
            fontSize: "14px",
            textAlign: "center",
          }}>
            {filteredProducts.length} products
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: "#f8fafc" }}>
              <tr>
                <th style={{ 
                  padding: "12px 16px", 
                  textAlign: "left", 
                  fontSize: "12px", 
                  fontWeight: "600", 
                  color: "#374151",
                  borderBottom: "1px solid #e5e7eb" 
                }}>
                  Product
                </th>
                <th style={{ 
                  padding: "12px 16px", 
                  textAlign: "center", 
                  fontSize: "12px", 
                  fontWeight: "600", 
                  color: "#374151",
                  borderBottom: "1px solid #e5e7eb" 
                }}>
                  System Stock
                </th>
                <th style={{ 
                  padding: "12px 16px", 
                  textAlign: "center", 
                  fontSize: "12px", 
                  fontWeight: "600", 
                  color: "#374151",
                  borderBottom: "1px solid #e5e7eb" 
                }}>
                  Physical Count
                </th>
                <th style={{ 
                  padding: "12px 16px", 
                  textAlign: "center", 
                  fontSize: "12px", 
                  fontWeight: "600", 
                  color: "#374151",
                  borderBottom: "1px solid #e5e7eb" 
                }}>
                  Variance
                </th>
                <th style={{ 
                  padding: "12px 16px", 
                  textAlign: "center", 
                  fontSize: "12px", 
                  fontWeight: "600", 
                  color: "#374151",
                  borderBottom: "1px solid #e5e7eb" 
                }}>
                  Status
                </th>
                <th style={{ 
                  padding: "12px 16px", 
                  textAlign: "center", 
                  fontSize: "12px", 
                  fontWeight: "600", 
                  color: "#374151",
                  borderBottom: "1px solid #e5e7eb" 
                }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const variance = getVariance(product.id);
                const status = getAuditStatus(product.id);
                
                return (
                  <tr key={product.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", textAlign: "left" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "4px",
                          backgroundColor: "#3b82f6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "white",
                          flexShrink: 0
                        }}>
                          {(product.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: "600", color: "#1f2937" }}>
                            {product.name || "Unknown Product"}
                          </div>
                          <div style={{ fontSize: "11px", color: "#6b7280" }}>
                            {product.batch_number || product.batchNumber || "No batch"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", fontWeight: "500" }}>
                      {product.quantity || 0}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <input
                        type="number"
                        min="0"
                        value={auditData[product.id]?.physicalCount || ""}
                        onChange={(e) => updatePhysicalCount(product.id, e.target.value)}
                        placeholder="0"
                        style={{
                          width: "80px",
                          padding: "8px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          textAlign: "center",
                          fontSize: "14px",
                        }}
                      />
                    </td>
                    <td style={{ 
                      padding: "12px", 
                      textAlign: "center", 
                      fontWeight: "600",
                      color: variance > 0 ? "#059669" : variance < 0 ? "#dc2626" : "#6b7280"
                    }}>
                      {variance > 0 ? `+${variance}` : variance === 0 ? "—" : variance}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "500",
                        textTransform: "capitalize",
                        ...getStatusStyle(status)
                      }}>
                        {status}
                      </span>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                        <button
                          style={{
                            padding: "6px",
                            border: "none",
                            borderRadius: "6px",
                            backgroundColor: "#f3f4f6",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          title="View Details"
                        >
                          <FiEye size={14} color="#6b7280" />
                        </button>
                        <button
                          style={{
                            padding: "6px",
                            border: "none",
                            borderRadius: "6px",
                            backgroundColor: "#f3f4f6",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          title="Adjust Stock"
                        >
                          <FiEdit size={14} color="#6b7280" />
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

      {/* Summary Bar */}
      <div style={{
        position: "sticky",
        bottom: "0",
        backgroundColor: "white",
        borderTop: "1px solid #e5e7eb",
        padding: "16px 24px",
        marginTop: "24px",
        borderRadius: "12px",
        boxShadow: "0 -1px 3px rgba(0,0,0,0.1)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ display: "flex", gap: "24px" }}>
          <div>
            <span style={{ fontSize: "14px", color: "#6b7280" }}>Total Items Audited: </span>
            <span style={{ fontWeight: "600", color: "#1f2937" }}>{auditedItems}</span>
          </div>
          <div>
            <span style={{ fontSize: "14px", color: "#6b7280" }}>Total Variance: </span>
            <span style={{ 
              fontWeight: "600", 
              color: totalVariance > 0 ? "#059669" : totalVariance < 0 ? "#dc2626" : "#1f2937"
            }}>
              {totalVariance > 0 ? `+${totalVariance}` : totalVariance}
            </span>
          </div>
          <div>
            <span style={{ fontSize: "14px", color: "#6b7280" }}>Estimated Impact: </span>
            <span style={{ 
              fontWeight: "600", 
              color: estimatedValue > 0 ? "#059669" : estimatedValue < 0 ? "#dc2626" : "#1f2937"
            }}>
              UGX {Math.abs(estimatedValue).toLocaleString()}
              {estimatedValue > 0 ? " (Gain)" : estimatedValue < 0 ? " (Loss)" : ""}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StockAudit; 