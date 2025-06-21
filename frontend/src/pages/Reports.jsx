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
import { dataService } from "../services";
import { useSettingsStore } from "../store";

function Reports() {
  // Settings store for currency
  const { settings } = useSettingsStore();
  const { currency } = settings;

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [selectedReport, setSelectedReport] = useState("overview");
  const [reportData, setReportData] = useState({
    overview: {
      totalSales: 0,
      totalTransactions: 0,
      totalCustomers: 0,
      averageOrderValue: 0,
      topProducts: [],
      salesByCategory: [],
    },
    sales: {
      dailySales: [],
      monthlySales: [],
    },
    inventory: {
      stockStatus: {
        inStock: 0,
        lowStock: 0,
        outOfStock: 0,
        totalProducts: 0,
      },
      topMovingProducts: [],
      expiringProducts: [],
    },
    customers: {
      customerMetrics: {
        totalCustomers: 0,
        newCustomers: 0,
        activeCustomers: 0,
        customerRetention: 0,
      },
      topCustomers: [],
    },
  });

  // Add section data for additional dashboard info
  const [sectionData, setSectionData] = useState({
    quickStats: {
      todayRevenue: 0,
      yesterdayRevenue: 0,
      monthlyGrowth: 0,
      weeklyOrders: 0,
      activeCustomers: 0,
      lowStockAlerts: 0,
    },
    recentActivity: [],
    topPerformers: {
      products: [],
      categories: [],
    },
  });

  // Load report data from database
  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);
        console.log("🔄 [Reports] Loading report data...");

        // Load different report types based on selected report
        switch (selectedReport) {
          case "overview":
            await loadOverviewData();
            break;
          case "sales":
            await loadSalesData();
            break;
          case "inventory":
            await loadInventoryData();
            break;
          case "customers":
            await loadCustomerData();
            break;
          default:
            await loadOverviewData();
        }
      } catch (error) {
        console.error("❌ [Reports] Error loading report data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, [selectedReport, dateRange]);
  const loadOverviewData = async () => {
    try {
      const [dashboardStats, products, customers, sales] = await Promise.all([
        dataService.analytics.getDashboardStats(), // Changed from dashboard to analytics
        dataService.products.getAll(),
        dataService.customers.getAll(),
        dataService.sales.getAll(),
      ]);

      // Filter sales by date range
      const filteredSales = sales.filter((sale) => {
        const saleDate = new Date(sale.date);
        return (
          saleDate >= new Date(dateRange.startDate) &&
          saleDate <= new Date(dateRange.endDate)
        );
      });

      // Calculate product sales from filtered sales
      const productSales = {};
      filteredSales.forEach((sale) => {
        (sale.items || sale.sale_items || []).forEach((item) => {
          const productName =
            item.productName ||
            item.product_name ||
            products.find((p) => p.id === (item.productId || item.product_id))
              ?.name ||
            "Unknown Product";

          if (!productSales[productName]) {
            productSales[productName] = { sales: 0, quantity: 0 };
          }
          productSales[productName].sales += item.total || 0;
          productSales[productName].quantity += item.quantity || 0;
        });
      });

      const topProducts = Object.entries(productSales)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

      // Calculate category sales
      const categorySales = {};
      products.forEach((product) => {
        const category = product.category || "Other";
        if (!categorySales[category]) {
          categorySales[category] = 0;
        }
        // Add sales for this product
        const productSalesData = productSales[product.name];
        if (productSalesData) {
          categorySales[category] += productSalesData.sales;
        }
      });

      const totalCategorySales = Object.values(categorySales).reduce(
        (sum, sales) => sum + sales,
        0
      );
      const salesByCategory = Object.entries(categorySales)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage:
            totalCategorySales > 0 ? (amount / totalCategorySales) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      const totalSales = filteredSales.reduce(
        (sum, sale) => sum + (sale.totalAmount || sale.total_amount || 0),
        0
      );
      const totalTransactions = filteredSales.length;
      const averageOrderValue =
        totalTransactions > 0 ? totalSales / totalTransactions : 0;

      setReportData((prev) => ({
        ...prev,
        overview: {
          totalSales,
          totalTransactions,
          totalCustomers: customers.length,
          averageOrderValue,
          topProducts,
          salesByCategory,
        },
      }));
    } catch (error) {
      console.error("Error loading overview data:", error);
    }
  };

  const loadSalesData = async () => {
    try {
      const salesReport = await dataService.reports.getSalesReport(
        dateRange.startDate,
        dateRange.endDate
      );

      setReportData((prev) => ({
        ...prev,
        sales: {
          dailySales: salesReport.dailySales || [],
          monthlySales: [], // Would need historical data
        },
      }));
    } catch (error) {
      console.error("Error loading sales data:", error);
    }
  };

  const loadInventoryData = async () => {
    try {
      const inventoryReport = await dataService.reports.getInventoryReport();

      setReportData((prev) => ({
        ...prev,
        inventory: inventoryReport,
      }));
    } catch (error) {
      console.error("Error loading inventory data:", error);
    }
  };

  const loadCustomerData = async () => {
    try {
      const customerReport = await dataService.reports.getCustomerReport();

      setReportData((prev) => ({
        ...prev,
        customers: customerReport,
      }));
    } catch (error) {
      console.error("Error loading customer data:", error);
    }
  };

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
            Value: `${currency} ${(currentData.totalSales || 0).toLocaleString()}`,
          },
          {
            Metric: "Total Transactions",
            Value: currentData.totalTransactions || 0,
          },
          { Metric: "Total Customers", Value: currentData.totalCustomers || 0 },
          {
            Metric: "Average Order Value",
            Value: `${currency} ${(currentData.averageOrderValue || 0).toFixed(2)}`,
          },
          ...(currentData.topProducts || []).map((product) => ({
            Metric: `Top Product - ${product.name}`,
            Value: `${currency} ${(product.sales || 0).toLocaleString()} (${product.quantity || 0} units)`,
          })),
        ];
        break;
      case "sales":
        exportData = (currentData.dailySales || []).map((sale) => ({
          Date: sale.date,
          Amount: `${currency} ${(sale.amount || 0).toLocaleString()}`,
          Transactions: sale.transactions || 0,
        }));
        break;
      case "inventory":
        exportData = [
          {
            Category: "In Stock",
            Count: currentData.stockStatus?.inStock || 0,
          },
          {
            Category: "Low Stock",
            Count: currentData.stockStatus?.lowStock || 0,
          },
          {
            Category: "Out of Stock",
            Count: currentData.stockStatus?.outOfStock || 0,
          },
          {
            Category: "Total Products",
            Count: currentData.stockStatus?.totalProducts || 0,
          },
        ];
        break;
      case "customers":
        exportData = (currentData.topCustomers || []).map((customer) => ({
          "Customer Name": customer.name,
          "Total Spent": `${currency} ${(customer.totalSpent || 0).toLocaleString()}`,
          Visits: customer.visits || 0,
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
              {currency} {(reportData.overview.totalSales || 0).toLocaleString()}
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
              {currency}{" "}
              {(reportData.overview.averageOrderValue || 0).toFixed(0)}
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
                {currency} {(product.sales || 0).toLocaleString()}
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
                  {currency} {(category.amount || 0).toLocaleString()}
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
                {currency} {((day.amount || 0) / 1000).toFixed(1)}k
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
                {currency} {(month.amount || 0).toLocaleString()}
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
                {currency} {(customer.totalSpent || 0).toLocaleString()}
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
            {currency} {(sectionData.quickStats.todayRevenue || 0).toLocaleString()}
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
                    {activity.type === "return" ? "-" : "+"}{currency} {activity.amount}
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
                    {currency} {(product.revenue || 0).toLocaleString()}
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
                  {currency} {(category.revenue || 0).toLocaleString()}
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
