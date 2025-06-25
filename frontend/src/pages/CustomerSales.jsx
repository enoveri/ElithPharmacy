import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiTrash2,
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiShoppingCart,
  FiAlertTriangle,
} from "react-icons/fi";
import { dbHelpers } from "../lib/db";

function CustomerSales() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load customer details
        const customerData = await dbHelpers.getCustomerById(id);
        setCustomer(customerData);

        // Load customer sales
        const salesData = await dbHelpers.getSalesByCustomer(id);
        setSales(salesData || []);
      } catch (error) {
        console.error("Error loading customer sales:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id]);

  const handleDeleteSale = async (saleId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this sale? This action cannot be undone."
      )
    ) {
      try {
        const success = await dbHelpers.deleteSale(saleId);
        if (success) {
          setSales(sales.filter((sale) => sale.id !== saleId));
          console.log("✅ Sale deleted successfully");
        } else {
          alert("Failed to delete sale. Please try again.");
        }
      } catch (error) {
        console.error("Error deleting sale:", error);
        alert("Error deleting sale. Please try again.");
      }
    }
  };

  const handleDeleteCustomer = async () => {
    if (sales.length > 0) {
      alert(
        "Cannot delete customer while they still have sales records. Please delete all sales first."
      );
      return;
    }

    if (
      window.confirm(
        "Are you sure you want to delete this customer? This action cannot be undone."
      )
    ) {
      try {
        const result = await dbHelpers.deleteCustomer(id);
        if (result.success) {
          console.log("✅ Customer deleted successfully");
          navigate("/customers", {
            state: { message: "Customer deleted successfully!" },
          });
        } else {
          alert(
            result.message || "Failed to delete customer. Please try again."
          );
        }
      } catch (error) {
        console.error("Error deleting customer:", error);
        alert("Error deleting customer. Please try again.");
      }
    }
  };

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

  const customerName = customer
    ? `${customer.first_name || customer.firstName} ${customer.last_name || customer.lastName}`
    : "Unknown Customer";

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
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "32px",
        }}
      >
        <button
          onClick={() => navigate("/customers")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            backgroundColor: "transparent",
            color: "var(--color-text-secondary)",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          <FiArrowLeft size={16} />
          Back to Customers{" "}
        </button>
        <div>
          <p
            style={{
              color: "var(--color-text-secondary)",
              margin: 0,
            }}
          >
            Manage sales for {customerName}
          </p>
        </div>
      </div>

      {/* Customer Info Card */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          border: "1px solid #f3f4f6",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              backgroundColor: "#f3f4f6",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FiUser color="#6b7280" size={32} />
          </div>
          <div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "var(--color-text-primary)",
                margin: "0 0 8px 0",
              }}
            >
              {customerName}
            </h2>
            <p
              style={{
                color: "var(--color-text-secondary)",
                margin: "0 0 4px 0",
              }}
            >
              Email: {customer?.email || "N/A"}
            </p>
            <p
              style={{
                color: "var(--color-text-secondary)",
                margin: 0,
              }}
            >
              Phone: {customer?.phone || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Warning Card */}
      <div
        style={{
          backgroundColor: "#fef3c7",
          border: "1px solid #f59e0b",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <FiAlertTriangle color="#f59e0b" size={20} />
        <div>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#92400e",
              margin: "0 0 4px 0",
            }}
          >
            Cannot Delete Customer
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: "#92400e",
              margin: 0,
            }}
          >
            This customer has {sales.length} sale record(s). You must delete all
            sales before you can delete the customer.
          </p>
        </div>
      </div>

      {/* Sales List */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          border: "1px solid #f3f4f6",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "24px",
            borderBottom: "1px solid #f3f4f6",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "var(--color-text-primary)",
              margin: "0 0 8px 0",
            }}
          >
            Sales Records ({sales.length})
          </h3>
          <p
            style={{
              color: "var(--color-text-secondary)",
              margin: 0,
            }}
          >
            Delete individual sales to remove the customer's purchase history
          </p>
        </div>

        {sales.length === 0 ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              color: "var(--color-text-secondary)",
            }}
          >
            <FiShoppingCart
              size={48}
              style={{ marginBottom: "16px", opacity: 0.5 }}
            />
            <p>No sales records found for this customer.</p>
            <button
              onClick={handleDeleteCustomer}
              style={{
                marginTop: "16px",
                padding: "8px 16px",
                backgroundColor: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Delete Customer
            </button>
          </div>
        ) : (
          <div style={{ padding: "24px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    Sale ID
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    Total Amount
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    Items
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr
                    key={sale.id}
                    style={{ borderBottom: "1px solid #f3f4f6" }}
                  >
                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          fontWeight: "600",
                          color: "var(--color-text-primary)",
                        }}
                      >
                        #{sale.id}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <FiCalendar size={14} color="#6b7280" />
                        <span style={{ color: "var(--color-text-primary)" }}>
                          {new Date(
                            sale.created_at || sale.createdAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <FiDollarSign size={14} color="#6b7280" />
                        <span
                          style={{
                            fontWeight: "600",
                            color: "var(--color-text-primary)",
                          }}
                        >
                          UGX
                          {(
                            sale.total_amount ||
                            sale.totalAmount ||
                            0
                          ).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ color: "var(--color-text-secondary)" }}>
                        {sale.sale_items?.length || sale.items?.length || 0}{" "}
                        items
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <button
                        onClick={() => handleDeleteSale(sale.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          backgroundColor: "#dc2626",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        <FiTrash2 size={12} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {sales.length === 0 && (
              <div style={{ marginTop: "24px", textAlign: "center" }}>
                <button
                  onClick={handleDeleteCustomer}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  Now Delete Customer
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerSales;
