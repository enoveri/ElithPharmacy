import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBarChart,
  FiTrendingUp,
  FiDownload,
  FiCalendar,
  FiDollarSign,
  FiShoppingCart,
  FiUsers,
  FiPackage,
  FiFilter,
  FiRefreshCw,
  FiFileText,
  FiPieChart,
  FiActivity,
} from "react-icons/fi";
import { exportToCSV, exportToPDF } from "../utils/exportUtils";

function Reports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [selectedReport, setSelectedReport] = useState("overview");

  // Mock data for different reports
  const [reportData, setReportData] = useState({
    overview: {
      totalSales: 45750.5,
      totalTransactions: 234,
      totalCustomers: 89,
      averageOrderValue: 195.73,
      topProducts: [
        { name: "Paracetamol 500mg", sales: 5420.5, quantity: 142 },
        { name: "Amoxicillin 250mg", sales: 4800.0, quantity: 96 },
        { name: "Vitamin C 1000mg", sales: 3200.75, quantity: 89 },
      ],
      salesByCategory: [
        { category: "Pain Relief", amount: 12500.5, percentage: 27.3 },
        { category: "Antibiotics", amount: 10200.25, percentage: 22.3 },
        { category: "Vitamins", amount: 8900.75, percentage: 19.5 },
        { category: "Cold & Flu", amount: 7800.0, percentage: 17.0 },
        { category: "Other", amount: 6349.0, percentage: 13.9 },
      ],
    },
    sales: {
      dailySales: [
        { date: "2024-01-15", amount: 1250.5, transactions: 8 },
        { date: "2024-01-16", amount: 1890.75, transactions: 12 },
        { date: "2024-01-17", amount: 2100.25, transactions: 15 },
        { date: "2024-01-18", amount: 1670.0, transactions: 11 },
        { date: "2024-01-19", amount: 2340.8, transactions: 18 },
        { date: "2024-01-20", amount: 1950.45, transactions: 14 },
      ],
      monthlySales: [
        { month: "Jan 2024", amount: 45750.5, growth: 12.5 },
        { month: "Dec 2023", amount: 40650.25, growth: 8.3 },
        { month: "Nov 2023", amount: 37890.75, growth: -2.1 },
      ],
    },
    inventory: {
      stockStatus: {
        inStock: 156,
        lowStock: 23,
        outOfStock: 8,
        totalProducts: 187,
      },
      topMovingProducts: [
        { name: "Paracetamol 500mg", movement: 142, trend: "up" },
        { name: "Vitamin C 1000mg", movement: 89, trend: "up" },
        { name: "Ibuprofen 400mg", movement: 76, trend: "down" },
      ],
      expiringProducts: [
        { name: "Amoxicillin 250mg", expiryDate: "2024-03-15", quantity: 25 },
        { name: "Cough Syrup 100ml", expiryDate: "2024-04-20", quantity: 12 },
      ],
    },
    customers: {
      customerMetrics: {
        totalCustomers: 89,
        newCustomers: 15,
        activeCustomers: 67,
        customerRetention: 75.3,
      },
      topCustomers: [
        { name: "John Doe", totalSpent: 2450.75, visits: 12 },
        { name: "Sarah Johnson", totalSpent: 1890.5, visits: 8 },
        { name: "Michael Brown", totalSpent: 1650.25, visits: 15 },
      ],
    },
  });

  // Add new section data for Reports section
  const [sectionData, setSectionData] = useState({
    quickStats: {
      todayRevenue: 2450.75,
      yesterdayRevenue: 2180.5,
      monthlyGrowth: 12.3,
      weeklyOrders: 89,
      activeCustomers: 156,
      lowStockAlerts: 7,
    },
    recentActivity: [
      {
        type: "sale",
        message: "Sale #12345 completed",
        amount: 125.5,
        time: "2 mins ago",
      },
      {
        type: "stock",
        message: "Low stock alert: Paracetamol 500mg",
        time: "15 mins ago",
      },
      {
        type: "customer",
        message: "New customer registered: John Doe",
        time: "1 hour ago",
      },
      {
        type: "return",
        message: "Return processed for order #12340",
        amount: 45.0,
        time: "2 hours ago",
      },
    ],
    topPerformers: {
      products: [
        {
          name: "Paracetamol 500mg",
          revenue: 5420.5,
          units: 142,
          growth: 15.2,
        },
        { name: "Vitamin C 1000mg", revenue: 3200.75, units: 89, growth: 8.7 },
        { name: "Amoxicillin 250mg", revenue: 4800.0, units: 96, growth: -2.1 },
      ],
      categories: [
        { name: "Pain Relief", revenue: 12500.5, percentage: 27.3 },
        { name: "Vitamins", revenue: 8900.75, percentage: 19.5 },
        { name: "Antibiotics", revenue: 10200.25, percentage: 22.3 },
      ],
    },
  });

  const reportTypes = [
    {
      id: "overview",
      name: "Business Overview",
      icon: FiBarChart,
      description: "Complete business performance summary",
    },
    {
      id: "sales",
      name: "Sales Report",
      icon: FiTrendingUp,
      description: "Detailed sales analysis and trends",
    },
    {
      id: "inventory",
      name: "Inventory Report",
      icon: FiPackage,
      description: "Stock levels and product movement",
    },
    {
      id: "customers",
      name: "Customer Report",
      icon: FiUsers,
      description: "Customer analytics and behavior",
    },
  ];

  const handleDateRangeChange = (field, value) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const generateReport = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  const handleExportReport = (format) => {
    const currentData = reportData[selectedReport];
    let exportData = [];
    let filename = `${selectedReport}_report_${new Date().toISOString().split("T")[0]}`;

    switch (selectedReport) {
      case "overview":
        exportData = [
          {
            Metric: "Total Sales",
            Value: `₦${currentData.totalSales.toLocaleString()}`,
          },
          {
            Metric: "Total Transactions",
            Value: currentData.totalTransactions,
          },
          { Metric: "Total Customers", Value: currentData.totalCustomers },
          {
            Metric: "Average Order Value",
            Value: `₦${currentData.averageOrderValue.toFixed(2)}`,
          },
          ...currentData.topProducts.map((product) => ({
            Metric: `Top Product - ${product.name}`,
            Value: `₦${product.sales.toLocaleString()} (${product.quantity} units)`,
          })),
        ];
        break;
      case "sales":
        exportData = currentData.dailySales.map((sale) => ({
          Date: sale.date,
          Amount: `₦${sale.amount.toLocaleString()}`,
          Transactions: sale.transactions,
        }));
        break;
      case "inventory":
        exportData = [
          { Category: "In Stock", Count: currentData.stockStatus.inStock },
          { Category: "Low Stock", Count: currentData.stockStatus.lowStock },
          {
            Category: "Out of Stock",
            Count: currentData.stockStatus.outOfStock,
          },
          {
            Category: "Total Products",
            Count: currentData.stockStatus.totalProducts,
          },
        ];
        break;
      case "customers":
        exportData = currentData.topCustomers.map((customer) => ({
          "Customer Name": customer.name,
          "Total Spent": `₦${customer.totalSpent.toLocaleString()}`,
          Visits: customer.visits,
        }));
        break;
    }

    if (format === "csv") {
      exportToCSV(exportData, `${filename}.csv`);
    } else if (format === "pdf") {
      exportToPDF(
        exportData,
        `${filename}.pdf`,
        `${reportTypes.find((r) => r.id === selectedReport)?.name} Report`
      );
    }
  };

  const renderOverviewReport = () => (
    <div
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}
    >
      {/* Key Metrics */}
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
          Key Metrics
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: "16px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <FiDollarSign
              size={24}
              style={{ color: "#10b981", marginBottom: "8px" }}
            />
            <div
              style={{ fontSize: "24px", fontWeight: "bold", color: "#1f2937" }}
            >
              ₦{reportData.overview.totalSales.toLocaleString()}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Total Sales
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "16px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <FiShoppingCart
              size={24}
              style={{ color: "#3b82f6", marginBottom: "8px" }}
            />
            <div
              style={{ fontSize: "24px", fontWeight: "bold", color: "#1f2937" }}
            >
              {reportData.overview.totalTransactions}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Transactions
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "16px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <FiUsers
              size={24}
              style={{ color: "#8b5cf6", marginBottom: "8px" }}
            />
            <div
              style={{ fontSize: "24px", fontWeight: "bold", color: "#1f2937" }}
            >
              {reportData.overview.totalCustomers}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>Customers</div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "16px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <FiTrendingUp
              size={24}
              style={{ color: "#f59e0b", marginBottom: "8px" }}
            />
            <div
              style={{ fontSize: "24px", fontWeight: "bold", color: "#1f2937" }}
            >
              ₦{reportData.overview.averageOrderValue.toFixed(0)}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Avg Order Value
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
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
          Top Products
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {reportData.overview.topProducts.map((product, index) => (
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
                  {product.name}
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  {product.quantity} units sold
                </div>
              </div>
              <div style={{ fontWeight: "bold", color: "#10b981" }}>
                ₦{product.sales.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sales by Category */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          gridColumn: "span 2",
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
          Sales by Category
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {reportData.overview.salesByCategory.map((category, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <div style={{ fontWeight: "600", color: "#1f2937" }}>
                  {category.category}
                </div>
                <div
                  style={{
                    width: `${category.percentage * 2}px`,
                    height: "6px",
                    backgroundColor: "#10b981",
                    borderRadius: "3px",
                  }}
                />
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <span style={{ fontSize: "14px", color: "#6b7280" }}>
                  {category.percentage}%
                </span>
                <span style={{ fontWeight: "bold", color: "#1f2937" }}>
                  ₦{category.amount.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSalesReport = () => (
    <div
      style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}
    >
      {/* Daily Sales Chart */}
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
          Daily Sales Trend
        </h3>
        <div
          style={{
            height: "250px",
            display: "flex",
            alignItems: "end",
            justifyContent: "space-between",
            padding: "20px",
          }}
        >
          {reportData.sales.dailySales.map((day, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: `${(day.amount / 2500) * 200}px`,
                  backgroundColor: "#10b981",
                  borderRadius: "4px 4px 0 0",
                  display: "flex",
                  alignItems: "end",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "10px",
                  paddingBottom: "4px",
                }}
              >
                ₦{(day.amount / 1000).toFixed(1)}k
              </div>
              <div style={{ fontSize: "10px", color: "#6b7280" }}>
                {new Date(day.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Summary */}
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
          Monthly Performance
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {reportData.sales.monthlySales.map((month, index) => (
            <div
              key={index}
              style={{
                padding: "16px",
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontWeight: "600", color: "#1f2937" }}>
                  {month.month}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    backgroundColor: month.growth > 0 ? "#d1fae5" : "#fef2f2",
                    color: month.growth > 0 ? "#065f46" : "#dc2626",
                  }}
                >
                  {month.growth > 0 ? "+" : ""}
                  {month.growth}%
                </span>
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#10b981",
                }}
              >
                ₦{month.amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInventoryReport = () => (
    <div
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}
    >
      {/* Stock Status */}
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
          Stock Status
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: "16px",
              backgroundColor: "#d1fae5",
              borderRadius: "8px",
            }}
          >
            <div
              style={{ fontSize: "24px", fontWeight: "bold", color: "#065f46" }}
            >
              {reportData.inventory.stockStatus.inStock}
            </div>
            <div style={{ fontSize: "12px", color: "#065f46" }}>In Stock</div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "16px",
              backgroundColor: "#fef3c7",
              borderRadius: "8px",
            }}
          >
            <div
              style={{ fontSize: "24px", fontWeight: "bold", color: "#92400e" }}
            >
              {reportData.inventory.stockStatus.lowStock}
            </div>
            <div style={{ fontSize: "12px", color: "#92400e" }}>Low Stock</div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "16px",
              backgroundColor: "#fecaca",
              borderRadius: "8px",
            }}
          >
            <div
              style={{ fontSize: "24px", fontWeight: "bold", color: "#dc2626" }}
            >
              {reportData.inventory.stockStatus.outOfStock}
            </div>
            <div style={{ fontSize: "12px", color: "#dc2626" }}>
              Out of Stock
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "16px",
              backgroundColor: "#e0e7ff",
              borderRadius: "8px",
            }}
          >
            <div
              style={{ fontSize: "24px", fontWeight: "bold", color: "#3730a3" }}
            >
              {reportData.inventory.stockStatus.totalProducts}
            </div>
            <div style={{ fontSize: "12px", color: "#3730a3" }}>
              Total Products
            </div>
          </div>
        </div>
      </div>

      {/* Top Moving Products */}
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
          Product Movement
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {reportData.inventory.topMovingProducts.map((product, index) => (
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
                  {product.name}
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  {product.movement} units moved
                </div>
              </div>
              <div
                style={{
                  padding: "4px 8px",
                  borderRadius: "12px",
                  backgroundColor:
                    product.trend === "up" ? "#d1fae5" : "#fecaca",
                  color: product.trend === "up" ? "#065f46" : "#dc2626",
                  fontSize: "12px",
                }}
              >
                {product.trend === "up" ? "↗" : "↘"} {product.trend}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expiring Products */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          gridColumn: "span 2",
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
          Products Expiring Soon
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {reportData.inventory.expiringProducts.map((product, index) => (
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
                  Quantity: {product.quantity} units
                </div>
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#dc2626",
                  fontWeight: "600",
                }}
              >
                Expires: {new Date(product.expiryDate).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCustomerReport = () => (
    <div
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}
    >
      {/* Customer Metrics */}
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
          Customer Metrics
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: "16px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <div
              style={{ fontSize: "24px", fontWeight: "bold", color: "#1f2937" }}
            >
              {reportData.customers.customerMetrics.totalCustomers}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Total Customers
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "16px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <div
              style={{ fontSize: "24px", fontWeight: "bold", color: "#1f2937" }}
            >
              {reportData.customers.customerMetrics.newCustomers}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              New Customers
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "16px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <div
              style={{ fontSize: "24px", fontWeight: "bold", color: "#1f2937" }}
            >
              {reportData.customers.customerMetrics.activeCustomers}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Active Customers
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "16px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <div
              style={{ fontSize: "24px", fontWeight: "bold", color: "#1f2937" }}
            >
              {reportData.customers.customerMetrics.customerRetention}%
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Retention Rate
            </div>
          </div>
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
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {reportData.customers.topCustomers.map((customer, index) => (
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
                  {customer.name}
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  {customer.visits} visits
                </div>
              </div>
              <div style={{ fontWeight: "bold", color: "#10b981" }}>
                ₦{customer.totalSpent.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Add this function to render the Reports section
  const renderReportsSection = () => (
    <div style={{ marginTop: "32px" }}>
      {/* Section Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "600",
            color: "#1f2937",
          }}
        >
          Business Intelligence
        </h2>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            style={{
              padding: "6px 12px",
              backgroundColor: "#f3f4f6",
              color: "#374151",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Real-time
          </button>
          <button
            style={{
              padding: "6px 12px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Auto-refresh: ON
          </button>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <div
            style={{ fontSize: "20px", fontWeight: "bold", color: "#10b981" }}
          >
            ₦{sectionData.quickStats.todayRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
            Today's Revenue
          </div>
          <div
            style={{
              fontSize: "10px",
              color: "#10b981",
              marginTop: "2px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "2px",
            }}
          >
            ↗ +12.4% vs yesterday
          </div>
        </div>

        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <div
            style={{ fontSize: "20px", fontWeight: "bold", color: "#3b82f6" }}
          >
            {sectionData.quickStats.monthlyGrowth}%
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
            Monthly Growth
          </div>
          <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "2px" }}>
            vs last month
          </div>
        </div>

        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <div
            style={{ fontSize: "20px", fontWeight: "bold", color: "#8b5cf6" }}
          >
            {sectionData.quickStats.weeklyOrders}
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
            Weekly Orders
          </div>
          <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "2px" }}>
            This week
          </div>
        </div>

        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <div
            style={{ fontSize: "20px", fontWeight: "bold", color: "#06b6d4" }}
          >
            {sectionData.quickStats.activeCustomers}
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
            Active Customers
          </div>
          <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "2px" }}>
            This month
          </div>
        </div>

        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <div
            style={{ fontSize: "20px", fontWeight: "bold", color: "#f59e0b" }}
          >
            {sectionData.quickStats.lowStockAlerts}
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
            Stock Alerts
          </div>
          <div style={{ fontSize: "10px", color: "#f59e0b", marginTop: "2px" }}>
            Needs attention
          </div>
        </div>

        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <div
            style={{ fontSize: "20px", fontWeight: "bold", color: "#1f2937" }}
          >
            98.2%
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
            System Health
          </div>
          <div style={{ fontSize: "10px", color: "#10b981", marginTop: "2px" }}>
            All systems ok
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 350px",
          gap: "24px",
          marginBottom: "24px",
        }}
      >
        {/* Performance Chart */}
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
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h3
              style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937" }}
            >
              Revenue Performance
            </h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
              >
                7D
              </button>
              <button
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
              >
                30D
              </button>
              <button
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
              >
                90D
              </button>
            </div>
          </div>

          {/* Mini Chart */}
          <div
            style={{
              height: "200px",
              display: "flex",
              alignItems: "end",
              justifyContent: "space-between",
              padding: "20px 0",
            }}
          >
            {[
              65, 85, 75, 95, 115, 90, 125, 110, 95, 130, 140, 155, 145, 170,
            ].map((height, index) => (
              <div
                key={index}
                style={{
                  width: "18px",
                  height: `${height}px`,
                  backgroundColor: index === 13 ? "#10b981" : "#d1fae5",
                  borderRadius: "2px",
                  margin: "0 2px",
                }}
              />
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "12px",
              color: "#6b7280",
              marginTop: "8px",
            }}
          >
            <span>2 weeks ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Recent Activity */}
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
            Recent Activity
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {sectionData.recentActivity.map((activity, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor:
                      activity.type === "sale"
                        ? "#10b981"
                        : activity.type === "stock"
                          ? "#f59e0b"
                          : activity.type === "customer"
                            ? "#3b82f6"
                            : "#ef4444",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", color: "#1f2937" }}>
                    {activity.message}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    {activity.time}
                  </div>
                </div>
                {activity.amount && (
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: activity.type === "return" ? "#ef4444" : "#10b981",
                    }}
                  >
                    {activity.type === "return" ? "-" : "+"}₦{activity.amount}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performers Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
        }}
      >
        {/* Top Products */}
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
            Top Performing Products
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {sectionData.topPerformers.products.map((product, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              >
                <div>
                  <div style={{ fontWeight: "600", color: "#1f2937" }}>
                    {product.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    {product.units} units sold
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: "bold", color: "#10b981" }}>
                    ₦{product.revenue.toLocaleString()}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: product.growth > 0 ? "#10b981" : "#ef4444",
                    }}
                  >
                    {product.growth > 0 ? "+" : ""}
                    {product.growth}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories */}
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
            Category Performance
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {sectionData.topPerformers.categories.map((category, index) => (
              <div key={index}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ fontWeight: "600", color: "#1f2937" }}>
                    {category.name}
                  </span>
                  <span style={{ fontSize: "14px", color: "#6b7280" }}>
                    {category.percentage}%
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${category.percentage * 2}%`,
                      height: "100%",
                      backgroundColor: "#10b981",
                      borderRadius: "4px",
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#10b981",
                    marginTop: "4px",
                  }}
                >
                  ₦{category.revenue.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

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
            Reports & Analytics
          </h1>
          <p
            style={{
              color: "var(--color-text-secondary)",
              margin: 0,
            }}
          >
            Business insights and performance analytics
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => handleExportReport("csv")}
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
            <FiDownload size={16} />
            Export CSV
          </button>

          <button
            onClick={() => handleExportReport("pdf")}
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
            <FiFileText size={16} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters and Controls */}
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
            gridTemplateColumns: "200px 200px 200px 1fr auto",
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
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Report Type
            </label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "white",
              }}
            >
              {reportTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
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
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                handleDateRangeChange("startDate", e.target.value)
              }
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            />
          </div>

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
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange("endDate", e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            />
          </div>

          <div />

          <button
            onClick={generateReport}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <>
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid white",
                    borderTop: "2px solid transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                Generating...
              </>
            ) : (
              <>
                <FiRefreshCw size={16} />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div>
        {selectedReport === "overview" && renderOverviewReport()}
        {selectedReport === "sales" && renderSalesReport()}
        {selectedReport === "inventory" && renderInventoryReport()}
        {selectedReport === "customers" && renderCustomerReport()}
      </div>

      {/* New Reports Section */}
      {renderReportsSection()}
    </div>
  );
}

export default Reports;
