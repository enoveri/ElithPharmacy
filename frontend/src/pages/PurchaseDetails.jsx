import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiEdit,
  FiDownload,
  FiPrinter,
  FiTruck,
  FiCalendar,
  FiDollarSign,
  FiPackage,
  FiUser,
  FiMapPin,
  FiPhone,
  FiMail,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiUpload,
  FiDatabase,
  FiBarChart,
} from "react-icons/fi";
import { useSettingsStore } from "../store";
import { dataService } from "../services";

function PurchaseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  const { currency = "UGX", disableTax = false } = settings;
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);



  useEffect(() => {
    const loadPurchase = async () => {
      try {
        setLoading(true);
        
        // Try to load from dataService
        const purchaseData = await dataService.purchases.getById(parseInt(id));
        if (purchaseData && purchaseData.data) {
          setPurchase(purchaseData.data);
          setError(null);
        } else {
          setError("Purchase order not found");
        }
      } catch (err) {
        console.error("Error loading purchase details:", err);
        setError("Failed to load purchase details");
      } finally {
        setLoading(false);
      }
    };

    loadPurchase();
  }, [id]);

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

  const handlePrint = () => {
    window.print();
  };

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

  if (error || !purchase) {
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
          {error || "Purchase Order Not Found"}
        </h2>
        <p style={{ color: "#6b7280", marginBottom: "24px" }}>
          The purchase order you're looking for doesn't exist or has been
          removed.
        </p>
        <button
          onClick={() => navigate("/purchases")}
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
          Back to Purchases
        </button>
      </div>
    );
  }

  const status = getStatusColor(purchase.status);

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
            onClick={() => navigate("/purchases")}
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
            Back to Purchases
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
              {purchase.purchaseNumber || purchase.purchase_number}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                color: "#6b7280",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <FiCalendar size={16} />
                {purchase.is_import ? 'Imported' : 'Ordered'} on {new Date(purchase.orderDate || purchase.order_date).toLocaleDateString()}
              </div>
              <div
                style={{
                  padding: "4px 8px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "500",
                  backgroundColor: status.bg,
                  color: status.color,
                }}
              >
                <FiCheckCircle size={12} style={{ marginRight: "4px" }} />
                {status.text}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={handlePrint}
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
            <FiPrinter size={16} />
            Print PO
          </button>
          <button
            onClick={() => navigate(`/purchases/edit/${purchase.id}`)}
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
            Edit Purchase Order
          </button>
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}
      >
        {/* Left Column - Items & Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Items List */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between",
              marginBottom: "20px"
            }}>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#1f2937",
                  margin: 0
                }}
              >
                {purchase.is_import ? 'Items Imported' : 'Items Ordered'}
              </h3>
              {purchase.is_import && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "#f3f4f6",
                  color: "#6b7280",
                  fontSize: "12px",
                  fontWeight: "500",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  textTransform: "uppercase"
                }}>
                  <FiUpload size={12} />
                  Bulk Import
                </div>
              )}
            </div>

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
                      Product
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Unit Cost
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Quantity
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(purchase.items || purchase.purchase_items || []).map((item, index) => (
                    <tr
                      key={index}
                      style={{ borderBottom: "1px solid #f3f4f6" }}
                    >
                      <td style={{ padding: "16px 12px" }}>
                        <div style={{ fontWeight: "600", color: "#1f2937" }}>
                          {item.productName || item.product_name || item.product?.name}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "16px 12px",
                          textAlign: "right",
                          color: "#6b7280",
                        }}
                      >
                        {currency}
                        {(item.unitCost || item.unit_cost || 0).toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: "16px 12px",
                          textAlign: "right",
                          color: "#6b7280",
                        }}
                      >
                        {item.quantity}
                      </td>
                      <td
                        style={{
                          padding: "16px 12px",
                          textAlign: "right",
                          fontWeight: "600",
                          color: "#1f2937",
                        }}
                      >
                        {currency}
                        {(item.total || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delivery Information */}
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
              Delivery Information
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <FiCalendar size={20} color="#6b7280" />
                <div>
                  <div style={{ fontSize: "14px", color: "#6b7280" }}>
                    Expected Delivery
                  </div>
                  <div style={{ fontWeight: "600", color: "#1f2937" }}>
                    {new Date(purchase.expectedDelivery || purchase.expected_delivery).toLocaleDateString()}
                  </div>
                </div>
              </div>
              {(purchase.actualDelivery || purchase.actual_delivery) && (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <FiTruck size={20} color="#6b7280" />
                  <div>
                    <div style={{ fontSize: "14px", color: "#6b7280" }}>
                      Actual Delivery
                    </div>
                    <div style={{ fontWeight: "600", color: "#10b981" }}>
                      {new Date(purchase.actualDelivery || purchase.actual_delivery).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {purchase.notes && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "16px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <FiFileText size={16} color="#6b7280" />
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    Notes
                  </span>
                </div>
                <p style={{ margin: 0, color: "#6b7280", lineHeight: 1.5 }}>
                  {purchase.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Summary & Supplier */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Order Summary */}
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
              Order Summary
            </h3>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280" }}>Subtotal:</span>
                <span style={{ fontWeight: "600", color: "#1f2937" }}>
                  {currency}
                  {(purchase.subtotal || 0).toFixed(2)}
                </span>
              </div>
              {!disableTax && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6b7280" }}>Tax:</span>
                  <span style={{ fontWeight: "600", color: "#1f2937" }}>
                    {currency}
                    {(purchase.tax || 0).toFixed(2)}
                  </span>
                </div>
              )}
              {purchase.discount > 0 && (
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "#6b7280" }}>Discount:</span>
                  <span style={{ fontWeight: "600", color: "#ef4444" }}>
                    -{currency}
                    {(purchase.discount || 0).toFixed(2)}
                  </span>
                </div>
              )}
              <div
                style={{
                  borderTop: "1px solid #e5e7eb",
                  paddingTop: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1f2937",
                  }}
                >
                  Total:
                </span>
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#10b981",
                  }}
                >
                  {currency}
                  {(purchase.totalAmount || purchase.total_amount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Import Statistics - Only show for import records */}
          {purchase.is_import && purchase.import_stats && (
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "20px"
              }}>
                <FiBarChart size={18} color="#3b82f6" />
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#1f2937",
                    margin: 0
                  }}
                >
                  Import Statistics
                </h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div style={{
                  padding: "12px",
                  backgroundColor: "#f0f9ff",
                  borderRadius: "8px",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#0ea5e9" }}>
                    {purchase.import_stats.processed}
                  </div>
                  <div style={{ fontSize: "12px", color: "#0369a1" }}>
                    Total Processed
                  </div>
                </div>
                <div style={{
                  padding: "12px",
                  backgroundColor: "#f0fdf4",
                  borderRadius: "8px",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#22c55e" }}>
                    {purchase.import_stats.updated}
                  </div>
                  <div style={{ fontSize: "12px", color: "#15803d" }}>
                    Updated Products
                  </div>
                </div>
                <div style={{
                  padding: "12px",
                  backgroundColor: "#fdf4ff",
                  borderRadius: "8px",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#a855f7" }}>
                    {purchase.import_stats.created}
                  </div>
                  <div style={{ fontSize: "12px", color: "#7c3aed" }}>
                    New Products
                  </div>
                </div>
                <div style={{
                  padding: "12px",
                  backgroundColor: "#fff7ed",
                  borderRadius: "8px",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#f97316" }}>
                    {purchase.import_stats.categoriesCreated || 0}
                  </div>
                  <div style={{ fontSize: "12px", color: "#c2410c" }}>
                    Categories Created
                  </div>
                </div>
              </div>

              {purchase.import_stats.import_date && (
                <div style={{
                  padding: "12px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                  marginTop: "12px"
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px"
                  }}>
                    <FiDatabase size={14} color="#6b7280" />
                    <span style={{ fontSize: "12px", fontWeight: "500", color: "#374151" }}>
                      Import Details
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    Imported on: {new Date(purchase.import_stats.import_date).toLocaleString()}
                  </div>
                  {purchase.import_stats.reference_number && (
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      Reference: {purchase.import_stats.reference_number}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Supplier Information */}
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
              Supplier Information
            </h3>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <FiUser size={20} color="#6b7280" />
                <div>
                  <div style={{ fontWeight: "600", color: "#1f2937" }}>
                    {purchase.supplierName || purchase.supplier?.name || 'Unknown Supplier'}
                  </div>
                  <div style={{ fontSize: "14px", color: "#6b7280" }}>
                    {purchase.supplierId ? `Supplier ID: ${purchase.supplierId}` : 
                     purchase.is_import ? 'Import Source' : 'Supplier'}
                  </div>
                </div>
              </div>

              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <FiPhone size={20} color="#6b7280" />
                <div>
                  <div style={{ fontWeight: "600", color: "#1f2937" }}>
                    {purchase.supplierContact?.phone || purchase.supplier?.phone || "Not provided"}
                  </div>
                  <div style={{ fontSize: "14px", color: "#6b7280" }}>
                    Phone Number
                  </div>
                </div>
              </div>

              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <FiMail size={20} color="#6b7280" />
                <div>
                  <div style={{ fontWeight: "600", color: "#1f2937" }}>
                    {purchase.supplierContact?.email || purchase.supplier?.email || "Not provided"}
                  </div>
                  <div style={{ fontSize: "14px", color: "#6b7280" }}>
                    Email Address
                  </div>
                </div>
              </div>

              {(purchase.supplierContact?.address || purchase.supplier?.contact) && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  <FiMapPin
                    size={20}
                    color="#6b7280"
                    style={{ marginTop: "2px" }}
                  />
                  <div>
                    <div style={{ fontWeight: "600", color: "#1f2937" }}>
                      {purchase.supplierContact?.address || purchase.supplier?.contact || "Not provided"}
                    </div>
                    <div style={{ fontSize: "14px", color: "#6b7280" }}>
                      Contact / Address
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default PurchaseDetails;
