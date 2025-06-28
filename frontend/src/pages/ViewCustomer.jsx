import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiEdit,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiUser,
  FiDollarSign,
  FiShoppingCart,
  FiClock,
  FiFileText,
  FiAlertCircle,
  FiTrendingUp,
  FiPackage,
} from "react-icons/fi";
import { dataService } from "../services";
import { useSettingsStore } from "../store";
import { useIsMobile } from "../hooks/useIsMobile";
import "../styles/mobile.css";

function ViewCustomer() {
  // Mobile detection hook
  const isMobile = useIsMobile();
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Use settings store instead of context
  const { settings } = useSettingsStore();
  const { currency = "UGX" } = settings;
  
  const [customer, setCustomer] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load real customer data and purchase history
  useEffect(() => {
    const loadCustomerData = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        console.log("🔄 [ViewCustomer] Loading customer data for ID:", id);
        
        // Fetch customer data and sales history in parallel
        const [customerData, salesData] = await Promise.all([
          dataService.customers.getById(id),
          dataService.sales.getByCustomer(id).catch(() => []) // Don't fail if no sales
        ]);

        console.log("✅ [ViewCustomer] Customer data loaded:", customerData);
        console.log("✅ [ViewCustomer] Sales data loaded:", salesData?.length || 0, "sales");

        if (!customerData) {
          setError("Customer not found");
          return;
        }

        setCustomer(customerData);
        setPurchaseHistory(salesData || []);

      } catch (err) {
        console.error("❌ [ViewCustomer] Error loading customer data:", err);
        setError("Failed to load customer data");
      } finally {
      setLoading(false);
      }
    };

    loadCustomerData();
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          padding: "24px",
          backgroundColor: "var(--color-bg-main)",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "4px solid #f3f4f6",
            borderTop: "4px solid var(--color-primary-600)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div
        style={{
          padding: "24px",
          backgroundColor: "var(--color-bg-main)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FiUser size={64} style={{ color: "#9ca3af", marginBottom: "16px" }} />
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: "#374151",
            marginBottom: "8px",
          }}
        >
          {error || "Customer Not Found"}
        </h2>
        <p style={{ color: "#6b7280", marginBottom: "24px" }}>
          {error === "Customer not found" 
            ? "The customer you're looking for doesn't exist or has been removed."
            : "There was an error loading the customer data. Please try again."
          }
        </p>
        <button
          onClick={() => navigate("/customers")}
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
          <FiArrowLeft size={16} />
          Back to Customers
        </button>
      </div>
    );
  }

  // Helper function to calculate customer stats from sales data
  const getCustomerStats = () => {
    const totalPurchases = purchaseHistory.length;
    const totalSpent = purchaseHistory.reduce((sum, sale) => {
      return sum + (sale.total_amount || sale.totalAmount || 0);
    }, 0);
    
    // Get last purchase date
    const lastPurchase = purchaseHistory.length > 0 
      ? purchaseHistory.sort((a, b) => new Date(b.sale_date || b.saleDate) - new Date(a.sale_date || a.saleDate))[0]
      : null;
    
    const lastPurchaseDate = lastPurchase 
      ? (lastPurchase.sale_date || lastPurchase.saleDate)
      : null;

    // Simple loyalty points calculation (could be enhanced)
    const loyaltyPoints = Math.floor(totalSpent / 100); // 1 point per 100 UGX spent

    return {
      totalPurchases,
      totalSpent,
      lastPurchaseDate,
      loyaltyPoints
    };
  };

  const stats = getCustomerStats();

  return (
    <div
      className={isMobile ? "mobile-container" : ""}
      style={
        isMobile
          ? {}
          : {
              padding: "24px",
              backgroundColor: "var(--color-bg-main)",
              minHeight: "100vh",
            }
      }
    >
      {/* Mobile Header */}
      {isMobile ? (
        <div className="mobile-card" style={{ marginBottom: "20px", position: "sticky", top: "16px", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
            <button
              onClick={() => navigate("/customers")}
              className="mobile-action-button secondary"
              style={{ marginRight: "12px" }}
            >
              <FiArrowLeft size={18} />
            </button>
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#1a202c",
                  margin: "0 0 4px 0",
                  lineHeight: "1.2",
                }}
              >
                {customer.first_name || customer.firstName} {customer.last_name || customer.lastName}
              </h1>
              <p
                style={{
                  fontSize: "13px",
                  color: "#718096",
                  margin: 0,
                }}
              >
                Customer since {new Date(customer.registration_date || customer.registrationDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/customers/edit/${customer.id}`)}
            className="mobile-action-button"
            style={{ 
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            <FiEdit size={16} />
            Edit Customer
          </button>
        </div>
      ) : (
        /* Desktop Header */
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
            onClick={() => navigate("/customers")}
              style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    backgroundColor: "white",
                    color: "var(--color-text-secondary)",
                    border: "1px solid var(--color-border-light)",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    marginRight: "16px",
              }}
          >
            <FiArrowLeft size={16} />
            Back to Customers
          </button>
          <div>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: "var(--color-text-primary)",
                margin: "0 0 4px 0",
              }}
            >
                {customer.first_name || customer.firstName} {customer.last_name || customer.lastName}
            </h1>
            <p
              style={{
                color: "var(--color-text-secondary)",
                margin: 0,
              }}
            >
              Customer since{" "}
                {new Date(customer.registration_date || customer.registrationDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate(`/customers/edit/${customer.id}`)}
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
          <FiEdit size={16} />
          Edit Customer
        </button>
      </div>
      )}

      {/* Customer Overview Cards - Mobile Responsive */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: isMobile ? "12px" : "24px",
          marginBottom: isMobile ? "20px" : "32px",
        }}
      >
        {/* Total Purchases */}
        <div className={isMobile ? "mobile-card" : ""} 
          style={isMobile ? {} : {
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "center" : "flex-start",
              textAlign: isMobile ? "center" : "left",
              gap: isMobile ? "8px" : "12px",
            }}
          >
            <div
              style={{
                width: isMobile ? "40px" : "48px",
                height: isMobile ? "40px" : "48px",
                backgroundColor: "#dbeafe",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiShoppingCart color="#3b82f6" size={isMobile ? 20 : 24} />
            </div>
            <div>
              <div style={{ fontSize: isMobile ? "11px" : "12px", color: "#6b7280", marginBottom: "2px" }}>
                Total Purchases
              </div>
              <div
                style={{
                  fontSize: isMobile ? "18px" : "24px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                {stats.totalPurchases}
              </div>
            </div>
          </div>
        </div>

        {/* Total Spent */}
        <div className={isMobile ? "mobile-card" : ""} 
          style={isMobile ? {} : {
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "center" : "flex-start",
              textAlign: isMobile ? "center" : "left",
              gap: isMobile ? "8px" : "12px",
            }}
          >
            <div
              style={{
                width: isMobile ? "40px" : "48px",
                height: isMobile ? "40px" : "48px",
                backgroundColor: "#d1fae5",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiDollarSign color="#10b981" size={isMobile ? 20 : 24} />
            </div>
            <div>
              <div style={{ fontSize: isMobile ? "11px" : "12px", color: "#6b7280", marginBottom: "2px" }}>
                Total Spent
              </div>
              <div
                style={{
                  fontSize: isMobile ? "18px" : "24px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                {currency}
                {stats.totalSpent.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Loyalty Points */}
        <div className={isMobile ? "mobile-card" : ""} 
          style={isMobile ? {} : {
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "center" : "flex-start",
              textAlign: isMobile ? "center" : "left",
              gap: isMobile ? "8px" : "12px",
            }}
          >
            <div
              style={{
                width: isMobile ? "40px" : "48px",
                height: isMobile ? "40px" : "48px",
                backgroundColor: "#fef3c7",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiTrendingUp color="#f59e0b" size={isMobile ? 20 : 24} />
            </div>
            <div>
              <div style={{ fontSize: isMobile ? "11px" : "12px", color: "#6b7280", marginBottom: "2px" }}>
                Loyalty Points
              </div>
              <div
                style={{
                  fontSize: isMobile ? "18px" : "24px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                {stats.loyaltyPoints}
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className={isMobile ? "mobile-card" : ""} 
          style={isMobile ? {} : {
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "center" : "flex-start",
              textAlign: isMobile ? "center" : "left",
              gap: isMobile ? "8px" : "12px",
            }}
          >
            <div
              style={{
                width: isMobile ? "40px" : "48px",
                height: isMobile ? "40px" : "48px",
                backgroundColor: customer.status === "active" ? "#d1fae5" : "#fef3c7",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiUser
                color={customer.status === "active" ? "#10b981" : "#f59e0b"}
                size={isMobile ? 20 : 24}
              />
            </div>
            <div>
              <div style={{ fontSize: isMobile ? "11px" : "12px", color: "#6b7280", marginBottom: "2px" }}>
                Status
              </div>
              <div
                style={{
                  fontSize: isMobile ? "16px" : "18px",
                  fontWeight: "bold",
                  color: customer.status === "active" ? "#10b981" : "#f59e0b",
                }}
              >
                {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile Responsive */}
      <div
        style={{
          display: isMobile ? "flex" : "grid",
          flexDirection: isMobile ? "column" : undefined,
          gridTemplateColumns: isMobile ? undefined : "1fr 1fr",
          gap: isMobile ? "20px" : "24px",
          marginBottom: isMobile ? "20px" : "32px",
        }}
      >
        {/* Customer Details */}
        <div className={isMobile ? "mobile-card" : ""} 
          style={isMobile ? {} : {
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              fontSize: isMobile ? "16px" : "18px",
              fontWeight: "600",
              color: "#1f2937",
              marginBottom: isMobile ? "16px" : "20px",
            }}
          >
            Customer Details
          </h3>

          <div
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: isMobile ? "12px" : "16px" 
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <FiMail color="#6b7280" size={16} />
              <div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>Email</div>
                <div style={{ fontSize: "14px", color: "#1f2937", wordBreak: "break-word" }}>
                  {customer.email || "N/A"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <FiPhone color="#6b7280" size={16} />
              <div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>Phone</div>
                <div style={{ fontSize: "14px", color: "#1f2937" }}>
                  {customer.phone || "N/A"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <FiMapPin color="#6b7280" size={16} style={{ marginTop: "2px" }} />
              <div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  Address
                </div>
                <div style={{ fontSize: "14px", color: "#1f2937", lineHeight: "1.4" }}>
                  {customer.address || "N/A"}{customer.city ? `, ${customer.city}` : ""}{customer.state ? `, ${customer.state}` : ""}{(customer.zip_code || customer.zipCode) ? ` ${customer.zip_code || customer.zipCode}` : ""}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <FiCalendar color="#6b7280" size={16} />
              <div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  Date of Birth
                </div>
                <div style={{ fontSize: "14px", color: "#1f2937" }}>
                  {(customer.date_of_birth || customer.dateOfBirth) ? new Date(customer.date_of_birth || customer.dateOfBirth).toLocaleDateString() : "N/A"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <FiClock color="#6b7280" size={16} />
              <div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  Last Purchase
                </div>
                <div style={{ fontSize: "14px", color: "#1f2937" }}>
                  {stats.lastPurchaseDate ? new Date(stats.lastPurchaseDate).toLocaleDateString() : "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className={isMobile ? "mobile-card" : ""} 
          style={isMobile ? {} : {
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              fontSize: isMobile ? "16px" : "18px",
              fontWeight: "600",
              color: "#1f2937",
              marginBottom: isMobile ? "16px" : "20px",
            }}
          >
            Medical Information
          </h3>

          <div
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: isMobile ? "12px" : "16px" 
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
                Emergency Contact
              </div>
              <div style={{ fontSize: "14px", color: "#1f2937" }}>
                {(customer.emergency_contact || customer.emergencyContact) || "N/A"}{(customer.emergency_phone || customer.emergencyPhone) ? ` - ${customer.emergency_phone || customer.emergencyPhone}` : ""}
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
                Known Allergies
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: customer.allergies ? "#ef4444" : "#6b7280",
                  padding: "8px 12px",
                  backgroundColor: customer.allergies ? "#fef2f2" : "#f9fafb",
                  borderRadius: "6px",
                  border: customer.allergies
                    ? "1px solid #fecaca"
                    : "1px solid #e5e7eb",
                }}
              >
                {customer.allergies || "No known allergies"}
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
                Medical Conditions
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: (customer.medical_conditions || customer.medicalConditions) ? "#f59e0b" : "#6b7280",
                  padding: "8px 12px",
                  backgroundColor: (customer.medical_conditions || customer.medicalConditions)
                    ? "#fffbeb"
                    : "#f9fafb",
                  borderRadius: "6px",
                  border: (customer.medical_conditions || customer.medicalConditions)
                    ? "1px solid #fed7aa"
                    : "1px solid #e5e7eb",
                }}
              >
                {(customer.medical_conditions || customer.medicalConditions) ||
                  "No medical conditions on record"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase History - Mobile Responsive */}
      <div className={isMobile ? "mobile-card" : ""} 
        style={isMobile ? {} : {
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h3
          style={{
            fontSize: isMobile ? "16px" : "18px",
            fontWeight: "600",
            color: "#1f2937",
            marginBottom: isMobile ? "16px" : "20px",
          }}
        >
          Purchase History
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "12px" : "16px" }}>
          {purchaseHistory.map((sale) => (
            <div
              key={sale.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: isMobile ? "12px" : "16px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                backgroundColor: "white",
                ...(isMobile && {
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "rgba(0,0,0,0.1)",
                })
              }}
              onClick={() => navigate(`/sales/${sale.id}`)}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                  e.target.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.target.style.boxShadow = "none";
                  e.target.style.transform = "translateY(0)";
                }
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: isMobile ? "flex-start" : "center",
                  marginBottom: "12px",
                  flexDirection: isMobile ? "column" : "row",
                  gap: isMobile ? "4px" : "0",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#1f2937",
                    }}
                  >
                    Sale #{sale.id}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    {new Date(sale.sale_date || sale.saleDate || sale.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: isMobile ? "18px" : "16px",
                    fontWeight: "bold",
                    color: "#10b981",
                    alignSelf: isMobile ? "flex-end" : "auto",
                  }}
                >
                  {currency}
                  {(sale.total_amount || sale.totalAmount || 0).toFixed(2)}
                </div>
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                {(sale.sale_items || sale.items || []).slice(0, isMobile ? 2 : 3).map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 10px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "4px",
                      fontSize: isMobile ? "13px" : "14px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <FiPackage color="#6b7280" size={12} />
                      <span style={{ 
                        color: "#1f2937",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {item.product_name || item.name || `Product #${item.product_id}`}
                      </span>
                    </div>
                    <div style={{ 
                      color: "#6b7280",
                      flexShrink: 0,
                      marginLeft: "8px",
                    }}>
                      {item.quantity} × {currency}
                      {(item.unit_price || item.price || 0).toFixed(2)}
                    </div>
                  </div>
                ))}
                {(sale.sale_items || sale.items || []).length > (isMobile ? 2 : 3) && (
                  <div
                    style={{
                      padding: "6px 10px",
                      textAlign: "center",
                      fontSize: "12px",
                      color: "#6b7280",
                      fontStyle: "italic",
                    }}
                  >
                    +{(sale.sale_items || sale.items || []).length - (isMobile ? 2 : 3)} more items
                  </div>
                )}
              </div>
            </div>
          ))}

          {purchaseHistory.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: isMobile ? "32px 16px" : "48px 0",
                color: "#6b7280",
              }}
            >
              <FiShoppingCart
                size={isMobile ? 40 : 48}
                style={{ marginBottom: "16px", opacity: 0.5 }}
              />
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                No Purchase History
              </h4>
              <p style={{ fontSize: isMobile ? "14px" : "16px" }}>
                This customer hasn't made any purchases yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ViewCustomer;
