import { useState, useEffect } from "react";
import {
  FiDollarSign,
  FiShoppingCart,
  FiUsers,
  FiPackage,
  FiTrendingUp,
  FiBarChart,
  FiDownload,
  FiX,
  FiArrowUp,
  FiArrowDown,
  FiPlus,
} from "react-icons/fi";
import { dataService } from "../services";
import { useNotificationsStore, useSettingsStore } from "../store";

const Dashboard = () => {
  // Settings store for currency
  const { settings } = useSettingsStore();
  const { currency } = settings;

  const [selectedPeriod, setSelectedPeriod] = useState("Month to date");
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    // Dashboard display fields
    todaysSales: 0,
    todaysTransactions: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalSales: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    lowStockItems: 0,
    lowStockCount: 0,
    monthlyRevenue: 0,
    monthlyGrowth: 0,
    recentSales: 0,
    recentRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const { fetchNotifications } = useNotificationsStore();

  // Fetch data using the unified data service
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch all dashboard data in parallel
        const [statsResult, salesData, stockData, customerData] =
          await Promise.all([
            dataService.dashboard.getStats(),
            dataService.sales.getRecent(3),
            dataService.products.getLowStock(),
            dataService.customers.getTop(3),
          ]);

        // Handle the stats result which might be wrapped in success/data structure
        let stats;
        if (statsResult && statsResult.success && statsResult.data) {
          stats = statsResult.data;
        } else if (statsResult && typeof statsResult === "object") {
          stats = statsResult;
        } else {
          stats = {
            totalProducts: 0,
            totalCustomers: 0,
            totalSales: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
            lowStockCount: 0,
          };
        }
        console.log("📊 [Dashboard] Stats received:", stats);
        console.log("📊 [Dashboard] Setting dashboard stats to:", stats);
        setDashboardStats(stats);
        setRecentSales(salesData || []);
        setLowStockProducts(stockData || []);
        setTopCustomers(customerData || []);

        // Also fetch notifications
        fetchNotifications();
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // You could show a toast notification here
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [fetchNotifications]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid var(--color-border-light)",
              backgroundColor: "white",
              fontSize: "14px",
            }}
          >
            <option>Month to date</option>
            <option>Year to date</option>
            <option>Today</option>
            <option>This week</option>
          </select>

          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
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
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics from database */}
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
              <FiDollarSign color="#3b82f6" size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Today's Sales
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                {currency}
                {(dashboardStats.todaysSales || 0).toLocaleString()}
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
              <FiShoppingCart color="#10b981" size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Transactions
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                {dashboardStats.todaysTransactions}
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
              <FiUsers color="#f59e0b" size={24} />
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
                {dashboardStats.totalCustomers}
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
                backgroundColor: "#fed7aa",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "12px",
              }}
            >
              <FiPackage color="#f97316" size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Low Stock Items
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                {dashboardStats.lowStockCount ||
                  dashboardStats.lowStockItems ||
                  0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          marginBottom: "32px",
        }}
      >
        {/* Recent Sales */}
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
            Recent Sales
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {loading ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                Loading...
              </div>
            ) : recentSales.length > 0 ? (
              recentSales.map((sale, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "8px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "600", color: "#1f2937" }}>
                      {sale.transaction_number || sale.transactionNumber}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      {new Date(sale.date).toLocaleDateString()}
                    </div>
                  </div>{" "}
                  <div style={{ fontWeight: "bold", color: "#10b981" }}>
                    {currency}
                    {(sale.total_amount || sale.totalAmount || 0).toFixed(2)}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "20px" }}>
                No recent sales found
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
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
            Low Stock Alerts
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {loading ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                Loading...
              </div>
            ) : lowStockProducts.length > 0 ? (
              lowStockProducts.slice(0, 3).map((product, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px",
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "8px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "600", color: "#1f2937" }}>
                      {product.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      Min: {product.min_stock_level || product.minStockLevel}{" "}
                      units
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#dc2626",
                      fontWeight: "600",
                    }}
                  >
                    {product.quantity} left
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "20px" }}>
                No low stock items found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "24px",
        }}
      >
        {/* Sales Chart */}
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
            Sales Overview
          </h3>
          {/* Simple bar chart */}
          <div
            style={{
              display: "flex",
              alignItems: "end",
              justifyContent: "space-between",
              height: "200px",
              padding: "20px 0",
            }}
          >
            {[40, 60, 80, 100, 70, 90, 120].map((height, index) => (
              <div
                key={index}
                style={{
                  width: "30px",
                  height: `${height}px`,
                  backgroundColor: "#10b981",
                  borderRadius: "4px 4px 0 0",
                  margin: "0 4px",
                }}
              />
            ))}
          </div>
        </div>

        {/* Top Customers */}
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
            Top Customers
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {loading ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                Loading...
              </div>
            ) : topCustomers.length > 0 ? (
              topCustomers.map((customer, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "8px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "600", color: "#1f2937" }}>
                      {customer.first_name || customer.firstName}{" "}
                      {customer.last_name || customer.lastName}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      {customer.total_purchases || customer.totalPurchases}{" "}
                      purchases
                    </div>
                  </div>{" "}
                  <div style={{ fontWeight: "bold", color: "#10b981" }}>
                    {currency}
                    {(
                      customer.total_spent ||
                      customer.totalSpent ||
                      0
                    ).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "20px" }}>
                No customer data found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Business Overview Stats */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "32px",
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
          Business Overview
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
          }}
        >
          {/* Total Products */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "16px",
              backgroundColor: "#f8fafc",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "#dbeafe",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiPackage color="#3b82f6" size={20} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Total Products
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                {dashboardStats.totalProducts || 0}
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "16px",
              backgroundColor: "#f0fdf4",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "#dcfce7",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiDollarSign color="#16a34a" size={20} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Total Revenue
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                {currency}
                {(dashboardStats.totalRevenue || 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Total Sales */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "16px",
              backgroundColor: "#fefce8",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "#fef3c7",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiShoppingCart color="#f59e0b" size={20} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Total Sales
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                {dashboardStats.totalSales || 0}
              </div>
            </div>
          </div>

          {/* Average Order Value */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "16px",
              backgroundColor: "#fdf4ff",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "#f3e8ff",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiTrendingUp color="#9333ea" size={20} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Avg Order Value
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                {currency}
                {(dashboardStats.averageOrderValue || 0).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Low Stock Alert */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "16px",
              backgroundColor:
                dashboardStats.lowStockCount > 0 ? "#fef2f2" : "#f8fafc",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                backgroundColor:
                  dashboardStats.lowStockCount > 0 ? "#fecaca" : "#e2e8f0",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiPackage
                color={dashboardStats.lowStockCount > 0 ? "#dc2626" : "#64748b"}
                size={20}
              />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Low Stock
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color:
                    dashboardStats.lowStockCount > 0 ? "#dc2626" : "#1f2937",
                }}
              >
                {dashboardStats.lowStockCount ||
                  dashboardStats.lowStockItems ||
                  0}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
