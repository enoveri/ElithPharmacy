import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiDownload,
  FiUpload,
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiCalendar,
  FiEye,
  FiUsers,
  FiShoppingCart,
  FiDollarSign,
  FiClock,
} from "react-icons/fi";
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  formatCustomerDataForExport,
} from "../utils/exportUtils";
import {
  validateCustomerData,
  transformImportedCustomerData,
} from "../utils/importUtils";
import ImportModal from "../components/ImportModal";
import { dbHelpers } from "../lib/db";
import { dataService } from "../services";
import { useSettingsStore } from "../store";

function Customers() {
  // Settings store for currency
  const { settings } = useSettingsStore();
  const { currency } = settings;

  const navigate = useNavigate();
  const location = useLocation();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showImportModal, setShowImportModal] = useState(false);

  // Mock customer data
  const mockCustomers = [
    {
      id: 1,
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@email.com",
      phone: "+234 801 234 5678",
      address: "123 Lagos Street, Lagos",
      dateOfBirth: "1985-06-15",
      registrationDate: "2024-01-15",
      status: "active",
      totalPurchases: 12,
      totalSpent: 45750.5,
      lastPurchase: "2024-01-20",
      loyaltyPoints: 450,
    },
    {
      id: 2,
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@email.com",
      phone: "+234 802 345 6789",
      address: "456 Abuja Road, Abuja",
      dateOfBirth: "1992-03-22",
      registrationDate: "2024-01-10",
      status: "active",
      totalPurchases: 8,
      totalSpent: 32100.25,
      lastPurchase: "2024-01-18",
      loyaltyPoints: 320,
    },
    {
      id: 3,
      firstName: "Michael",
      lastName: "Brown",
      email: "michael.brown@email.com",
      phone: "+234 803 456 7890",
      address: "789 Port Harcourt Ave, PH",
      dateOfBirth: "1978-11-08",
      registrationDate: "2023-12-05",
      status: "active",
      totalPurchases: 25,
      totalSpent: 78900.75,
      lastPurchase: "2024-01-19",
      loyaltyPoints: 789,
    },
    {
      id: 4,
      firstName: "Emily",
      lastName: "Davis",
      email: "emily.davis@email.com",
      phone: "+234 804 567 8901",
      address: "321 Kano Street, Kano",
      dateOfBirth: "1995-09-12",
      registrationDate: "2024-01-05",
      status: "inactive",
      totalPurchases: 3,
      totalSpent: 8750.0,
      lastPurchase: "2023-12-28",
      loyaltyPoints: 87,
    },
    {
      id: 5,
      firstName: "David",
      lastName: "Wilson",
      email: "david.wilson@email.com",
      phone: "+234 805 678 9012",
      address: "654 Ibadan Close, Ibadan",
      dateOfBirth: "1980-07-30",
      registrationDate: "2023-11-20",
      status: "active",
      totalPurchases: 18,
      totalSpent: 56200.8,
      lastPurchase: "2024-01-17",
      loyaltyPoints: 562,
    },
  ];
  useEffect(() => {
    const loadCustomers = async () => {
      setLoading(true);
      try {
        const customers = await dataService.customers.getAll();
        console.log(
          "✅ [Customers] Loaded customers from database:",
          customers?.length || 0
        );
        setCustomers(customers || []);
        setFilteredCustomers(customers || []);
      } catch (error) {
        console.error("❌ [Customers] Error loading customers:", error);
        setCustomers([]);
        setFilteredCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();

    // Show success message if coming from add/edit
    if (location.state?.message) {
      console.log(location.state.message);
    }
  }, []);

  useEffect(() => {
    let filtered = customers;
    if (searchTerm) {
      filtered = filtered.filter((customer) => {
        const firstName = customer.first_name || customer.firstName || "";
        const lastName = customer.last_name || customer.lastName || "";
        const email = customer.email || "";
        const phone = customer.phone || "";

        return (
          firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          phone.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (customer) => customer.status === selectedStatus
      );
    }

    setFilteredCustomers(filtered);
  }, [searchTerm, selectedStatus, customers]);
  const handleDeleteCustomer = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        const result = await dbHelpers.deleteCustomer(id);
        if (result.success) {
          console.log("✅ [Customers] Customer deleted successfully");
          // Remove from local state
          setCustomers(customers.filter((customer) => customer.id !== id));
          setFilteredCustomers(
            filteredCustomers.filter((customer) => customer.id !== id)
          );
        } else {
          console.error(
            "❌ [Customers] Failed to delete customer:",
            result.error
          );
          if (result.error === "CONSTRAINT_ERROR") {
            // Redirect to customer sales management page
            if (
              window.confirm(
                "This customer has existing sales records. Would you like to manage their sales to delete them first?"
              )
            ) {
              navigate(`/customers/sales/${id}`);
            }
          } else {
            alert(
              result.message || "Failed to delete customer. Please try again."
            );
          }
        }
      } catch (error) {
        console.error("❌ [Customers] Error deleting customer:", error);
        alert("Error deleting customer. Please try again.");
      }
    }
  };
  const getCustomerStats = () => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(
      (c) => c.status === "active"
    ).length;
    const totalRevenue = customers.reduce((sum, c) => {
      const totalSpent = c.total_spent || c.totalSpent || 0;
      return sum + (typeof totalSpent === "number" ? totalSpent : 0);
    }, 0);
    const averageSpending =
      totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    return { totalCustomers, activeCustomers, totalRevenue, averageSpending };
  };

  const stats = getCustomerStats();

  const handleExport = (format) => {
    const exportData = formatCustomerDataForExport(filteredCustomers);
    const filename = `customers_${new Date().toISOString().split("T")[0]}`;

    switch (format) {
      case "csv":
        exportToCSV(exportData, `${filename}.csv`);
        break;
      case "excel":
        exportToExcel(exportData, `${filename}.xlsx`);
        break;
      case "pdf":
        exportToPDF(exportData, `${filename}.pdf`, "Customer List");
        break;
      default:
        exportToCSV(exportData, `${filename}.csv`);
    }
  };

  const handleImport = async (importedData) => {
    // Simulate API call to import customers
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Add imported customers to existing list
    const newCustomers = importedData.map((customer, index) => ({
      ...customer,
      id: customers.length + index + 1,
      registrationDate: new Date().toISOString().split("T")[0],
      totalPurchases: 0,
      totalSpent: 0,
      loyaltyPoints: 0,
      lastPurchase: null,
    }));

    setCustomers([...customers, ...newCustomers]);
    setShowImportModal(false);
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
        <div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "var(--color-text-primary)",
              margin: "0 0 8px 0",
            }}
          >
            Customers
          </h1>
          <p
            style={{
              color: "var(--color-text-secondary)",
              margin: 0,
            }}
          >
            Manage your customer database
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          {/* Export Dropdown */}
          <div style={{ position: "relative", display: "inline-block" }}>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleExport(e.target.value);
                  e.target.value = "";
                }
              }}
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
              }}
            >
              <option value="">Export ↓</option>
              <option value="csv">Export as CSV</option>
              <option value="excel">Export as Excel</option>
              <option value="pdf">Export as PDF</option>
            </select>
          </div>
          <button
            onClick={() => setShowImportModal(true)}
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
            }}
          >
            <FiUpload size={16} />
            Import
          </button>{" "}
          <button
            onClick={() => navigate("/customers/add")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
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
            Add Customer
          </button>
        </div>
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
              <FiUsers color="#3b82f6" size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Total Customers
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                {stats.totalCustomers}
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
              <FiUser color="#10b981" size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Active Customers
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                {stats.activeCustomers}
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
              <FiDollarSign color="#f59e0b" size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Total Revenue
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                {currency}
                {(stats.totalRevenue || 0).toLocaleString()}
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
                backgroundColor: "#e0e7ff",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "12px",
              }}
            >
              <FiShoppingCart color="#8b5cf6" size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Avg. Spending
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                {currency}
                {(stats.averageSpending || 0).toLocaleString()}
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
            gridTemplateColumns: "1fr 200px 200px 150px",
            gap: "16px",
            alignItems: "end",
          }}
        >
          {/* Search */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Search Customers
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 40px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              <FiSearch
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#6b7280",
                }}
                size={16}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                backgroundColor: "white",
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Results Count */}
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "#f3f4f6",
              borderRadius: "8px",
              fontSize: "14px",
              color: "#374151",
              textAlign: "center",
            }}
          >
            Showing {filteredCustomers.length} of {customers.length}
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: "24px",
        }}
      >
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
                  Customer
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
                  Contact
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
                  Purchases
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
                  Total Spent
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
                  Last Purchase
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
              </tr>{" "}
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  style={{ borderBottom: "1px solid #f3f4f6" }}
                >
                  <td style={{ padding: "16px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          backgroundColor: "#f3f4f6",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: "12px",
                        }}
                      >
                        <FiUser color="#6b7280" size={20} />
                      </div>
                      <div>
                        {" "}
                        <div style={{ fontWeight: "600", color: "#1f2937" }}>
                          {customer.first_name || customer.firstName}{" "}
                          {customer.last_name || customer.lastName}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                          Member since{" "}
                          {new Date(
                            customer.registration_date ||
                              customer.registrationDate
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "16px 12px" }}>
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#1f2937",
                          marginBottom: "2px",
                        }}
                      >
                        <FiMail size={12} style={{ marginRight: "6px" }} />
                        {customer.email}
                      </div>
                      <div style={{ fontSize: "14px", color: "#6b7280" }}>
                        <FiPhone size={12} style={{ marginRight: "6px" }} />
                        {customer.phone}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "16px 12px" }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "16px",
                        fontSize: "12px",
                        fontWeight: "500",
                        backgroundColor:
                          customer.status === "active" ? "#d1fae5" : "#fef3c7",
                        color:
                          customer.status === "active" ? "#065f46" : "#92400e",
                      }}
                    >
                      {customer.status.charAt(0).toUpperCase() +
                        customer.status.slice(1)}
                    </span>
                  </td>{" "}
                  <td style={{ padding: "16px 12px" }}>
                    <div style={{ fontWeight: "600", color: "#1f2937" }}>
                      {customer.total_purchases || customer.totalPurchases || 0}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      {customer.loyalty_points || customer.loyaltyPoints || 0}{" "}
                      points
                    </div>
                  </td>
                  <td style={{ padding: "16px 12px" }}>
                    <div style={{ fontWeight: "600", color: "#1f2937" }}>
                      {currency}
                      {(
                        customer.total_spent ||
                        customer.totalSpent ||
                        0
                      ).toLocaleString()}
                    </div>
                  </td>
                  <td style={{ padding: "16px 12px" }}>
                    <div style={{ fontSize: "14px", color: "#1f2937" }}>
                      {customer.last_purchase || customer.lastPurchase
                        ? new Date(
                            customer.last_purchase || customer.lastPurchase
                          ).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </td>
                  <td style={{ padding: "16px 12px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() =>
                          navigate(`/customers/view/${customer.id}`)
                        }
                        style={{
                          padding: "8px",
                          backgroundColor: "#f3f4f6",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          color: "#6b7280",
                        }}
                        title="View Customer"
                      >
                        <FiEye size={16} />
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/customers/edit/${customer.id}`)
                        }
                        style={{
                          padding: "8px",
                          backgroundColor: "#dbeafe",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          color: "#3b82f6",
                        }}
                        title="Edit Customer"
                      >
                        <FiEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        style={{
                          padding: "8px",
                          backgroundColor: "#fecaca",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          color: "#ef4444",
                        }}
                        title="Delete Customer"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCustomers.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "48px 0",
                color: "#6b7280",
              }}
            >
              <FiUsers
                size={48}
                style={{ marginBottom: "16px", opacity: 0.5 }}
              />
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                No customers found
              </h3>
              <p style={{ marginBottom: "16px" }}>
                {searchTerm || selectedStatus !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by adding your first customer"}
              </p>
              {!searchTerm && selectedStatus === "all" && (
                <button
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
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
                  Add Customer
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
        type="customers"
        validateData={validateCustomerData}
        transformData={transformImportedCustomerData}
      />
    </div>
  );
}

export default Customers;
