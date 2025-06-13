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

function ViewCustomer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock customer data with purchase history
  useEffect(() => {
    setTimeout(() => {
      setCustomer({
        id: 1,
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@email.com",
        phone: "+234 801 234 5678",
        address: "123 Lagos Street, Lagos",
        city: "Lagos",
        state: "Lagos State",
        zipCode: "100001",
        dateOfBirth: "1985-06-15",
        gender: "male",
        registrationDate: "2024-01-15",
        status: "active",
        totalPurchases: 12,
        totalSpent: 45750.5,
        lastPurchase: "2024-01-20",
        loyaltyPoints: 450,
        emergencyContact: "Jane Doe",
        emergencyPhone: "+234 802 345 6789",
        allergies: "Penicillin, Shellfish",
        medicalConditions: "Hypertension",
      });

      setPurchaseHistory([
        {
          id: 1,
          date: "2024-01-20",
          items: [
            { name: "Paracetamol 500mg", quantity: 2, price: 25.5 },
            { name: "Vitamin C 1000mg", quantity: 1, price: 35.75 },
          ],
          total: 86.75,
          status: "completed",
        },
        {
          id: 2,
          date: "2024-01-15",
          items: [
            { name: "Amoxicillin 250mg", quantity: 1, price: 45.0 },
            { name: "Ibuprofen 400mg", quantity: 3, price: 32.25 },
          ],
          total: 141.75,
          status: "completed",
        },
        {
          id: 3,
          date: "2024-01-10",
          items: [{ name: "Cough Syrup 100ml", quantity: 2, price: 28.0 }],
          total: 56.0,
          status: "completed",
        },
      ]);

      setLoading(false);
    }, 1000);
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

  if (!customer) {
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
          Customer Not Found
        </h2>
        <p style={{ color: "#6b7280", marginBottom: "24px" }}>
          The customer you're looking for doesn't exist or has been removed.
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

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "var(--color-bg-main)",
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
              {customer.firstName} {customer.lastName}
            </h1>
            <p
              style={{
                color: "var(--color-text-secondary)",
                margin: 0,
              }}
            >
              Customer since{" "}
              {new Date(customer.registrationDate).toLocaleDateString()}
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

      {/* Customer Overview Cards */}
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
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
              <FiShoppingCart color="#3b82f6" size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Total Purchases
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                {customer.totalPurchases}
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
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
                Total Spent
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                ₦{customer.totalSpent.toLocaleString()}
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
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
              <FiTrendingUp color="#f59e0b" size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Loyalty Points
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                {customer.loyaltyPoints}
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor:
                  customer.status === "active" ? "#d1fae5" : "#fef3c7",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "12px",
              }}
            >
              <FiUser
                color={customer.status === "active" ? "#10b981" : "#f59e0b"}
                size={24}
              />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>Status</div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: customer.status === "active" ? "#10b981" : "#f59e0b",
                }}
              >
                {customer.status.charAt(0).toUpperCase() +
                  customer.status.slice(1)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          marginBottom: "32px",
        }}
      >
        {/* Customer Details */}
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
            Customer Details
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <FiMail color="#6b7280" size={16} />
              <div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>Email</div>
                <div style={{ fontSize: "14px", color: "#1f2937" }}>
                  {customer.email}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <FiPhone color="#6b7280" size={16} />
              <div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>Phone</div>
                <div style={{ fontSize: "14px", color: "#1f2937" }}>
                  {customer.phone}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <FiMapPin color="#6b7280" size={16} />
              <div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  Address
                </div>
                <div style={{ fontSize: "14px", color: "#1f2937" }}>
                  {customer.address}, {customer.city}, {customer.state}{" "}
                  {customer.zipCode}
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
                  {new Date(customer.dateOfBirth).toLocaleDateString()}
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
                  {new Date(customer.lastPurchase).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Medical Information */}
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
            Medical Information
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
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
                {customer.emergencyContact} - {customer.emergencyPhone}
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
                  color: customer.medicalConditions ? "#f59e0b" : "#6b7280",
                  padding: "8px 12px",
                  backgroundColor: customer.medicalConditions
                    ? "#fffbeb"
                    : "#f9fafb",
                  borderRadius: "6px",
                  border: customer.medicalConditions
                    ? "1px solid #fed7aa"
                    : "1px solid #e5e7eb",
                }}
              >
                {customer.medicalConditions ||
                  "No medical conditions on record"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase History */}
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
          Purchase History
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {purchaseHistory.map((purchase) => (
            <div
              key={purchase.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "16px",
              }}
            >
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
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#1f2937",
                    }}
                  >
                    Purchase #{purchase.id}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    {new Date(purchase.date).toLocaleDateString()}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "#10b981",
                  }}
                >
                  ₦{purchase.total.toFixed(2)}
                </div>
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {purchase.items.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "6px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <FiPackage color="#6b7280" size={14} />
                      <span style={{ fontSize: "14px", color: "#1f2937" }}>
                        {item.name}
                      </span>
                    </div>
                    <div style={{ fontSize: "14px", color: "#6b7280" }}>
                      {item.quantity} × ₦{item.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {purchaseHistory.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "48px 0",
                color: "#6b7280",
              }}
            >
              <FiShoppingCart
                size={48}
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
              <p>This customer hasn't made any purchases yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ViewCustomer;
