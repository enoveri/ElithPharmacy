import { useMemo, memo, useState } from "react";
import {
  FiDollarSign,
  FiShoppingCart,
  FiUsers,
  FiPackage,
  FiAlertTriangle,
  FiTrendingUp,
  FiBarChart,
  FiGrid,
  FiX,
  FiPlus,
} from "react-icons/fi";
import { mockData, mockHelpers } from "../lib/mockData";

// Memoized StatCard component to prevent unnecessary re-renders
const StatCard = memo(
  ({ title, value, icon: Icon, variant, trend, trendValue }) => (
    <div className={`stat-card ${variant} fade-in`}>
      <div className="stat-card-icon">
        <Icon size={24} />
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{title}</div>
      {trend && (
        <div className="mt-2 flex items-center text-sm opacity-90">
          <FiTrendingUp
            className={trend === "down" ? "rotate-180" : ""}
            size={16}
          />
          <span className="ml-1">{trendValue}%</span>
        </div>
      )}
    </div>
  )
);

// Memoized Key Metrics Section
const KeyMetricsSection = memo(() => (
  <div className="dashboard-section mb-8">
    <h2 className="section-title text-xl font-semibold text-gray-800 mb-6">
      Key Metrics
    </h2>
    <div className="dashboard-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      <StatCard
        title="Today's Sales"
        value={`$${mockData.dashboardStats.todaysSales.toFixed(2)}`}
        icon={FiDollarSign}
        variant="stat-card-green"
        trend="up"
        trendValue="12.5"
      />
      <StatCard
        title="Transactions Today"
        value={mockData.dashboardStats.todaysTransactions}
        icon={FiShoppingCart}
        variant="stat-card-blue"
      />
      <StatCard
        title="Total Products"
        value={mockData.dashboardStats.totalProducts}
        icon={FiPackage}
        variant="stat-card-purple"
      />
      <StatCard
        title="Total Customers"
        value={mockData.dashboardStats.totalCustomers}
        icon={FiUsers}
        variant="stat-card-teal"
      />
      <StatCard
        title="Low Stock Items"
        value={mockData.dashboardStats.lowStockItems}
        icon={FiAlertTriangle}
        variant="stat-card-orange"
      />
      <StatCard
        title="Monthly Revenue"
        value={`$${mockData.dashboardStats.monthlyRevenue.toFixed(2)}`}
        icon={FiTrendingUp}
        variant="stat-card-cyan"
        trend="up"
        trendValue={mockData.dashboardStats.monthlyGrowth}
      />
    </div>
  </div>
));

// Memoized Content Grid Section
const ContentGridSection = memo(() => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
    {/* Recent Sales */}
    <div className="card bg-white rounded-xl shadow-lg border-0 overflow-hidden">
      <div className="card-header bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
        <h3 className="card-title flex items-center text-lg font-semibold text-gray-800">
          <FiBarChart className="mr-3 text-blue-600" size={20} />
          Recent Sales
        </h3>
        <p className="card-subtitle text-sm text-gray-600 mt-1">
          Latest transactions
        </p>
      </div>
      <div className="card-content p-6">
        <div className="space-y-4">
          {mockData.sales.slice(0, 3).map((sale) => (
            <div
              key={sale.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:shadow-md transition-all duration-200"
            >
              <div>
                <p className="font-medium text-gray-800">
                  {sale.transactionNumber}
                </p>
                <p className="text-sm text-gray-600">
                  {mockHelpers.getCustomerById(sale.customerId)?.firstName}{" "}
                  {mockHelpers.getCustomerById(sale.customerId)?.lastName}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">
                  ${sale.totalAmount}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(sale.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card-footer p-6 bg-gray-50 border-t border-gray-100">
        <button className="btn btn-outline w-full py-2 text-blue-600 border-blue-200 hover:bg-blue-50">
          View All Sales
        </button>
      </div>
    </div>

    {/* Low Stock Alerts */}
    <div className="card bg-white rounded-xl shadow-lg border-0 overflow-hidden">
      <div className="card-header bg-gradient-to-r from-orange-50 to-yellow-50 p-6 border-b border-gray-100">
        <h3 className="card-title flex items-center text-lg font-semibold text-gray-800">
          <FiAlertTriangle className="mr-3 text-orange-600" size={20} />
          Stock Alerts
        </h3>
        <p className="card-subtitle text-sm text-gray-600 mt-1">
          Items needing attention
        </p>
      </div>
      <div className="card-content p-6">
        <div className="space-y-4">
          {mockData.lowStockAlerts.map((alert) => (
            <div
              key={alert.productId}
              className="p-4 bg-orange-50 rounded-lg border border-orange-200"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium text-gray-800">{alert.productName}</p>
                <span className="badge badge-warning bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                  Low Stock
                </span>
              </div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-600">
                  Current: {alert.currentStock} units
                </span>
                <span className="text-gray-500">
                  Min: {alert.minStockLevel}
                </span>
              </div>
              <div className="w-full bg-orange-200 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((alert.currentStock / alert.minStockLevel) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card-footer p-6 bg-gray-50 border-t border-gray-100">
        <button className="btn btn-warning w-full py-2 bg-orange-100 text-orange-700 hover:bg-orange-200">
          Manage Inventory
        </button>
      </div>
    </div>
  </div>
));

// Memoized Bottom Section
const BottomSection = memo(() => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
    {/* Product Categories */}
    <div className="card bg-white rounded-xl shadow-lg border-0 overflow-hidden">
      <div className="card-header bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-100">
        <h3 className="card-title text-lg font-semibold text-gray-800">
          Product Categories
        </h3>
        <p className="card-subtitle text-sm text-gray-600 mt-1">
          {mockData.categories.length} categories
        </p>
      </div>
      <div className="card-content p-6">
        <div className="space-y-3">
          {mockData.categories.slice(0, 5).map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            >
              <span className="text-sm font-medium text-gray-700">
                {category.name}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {mockHelpers.getProductsByCategory(category.id).length}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Recent Activity */}
    <div className="card lg:col-span-2 bg-white rounded-xl shadow-lg border-0 overflow-hidden">
      <div className="card-header bg-gradient-to-r from-green-50 to-teal-50 p-6 border-b border-gray-100">
        <h3 className="card-title text-lg font-semibold text-gray-800">
          Recent Activity
        </h3>
        <p className="card-subtitle text-sm text-gray-600 mt-1">
          Latest system activity
        </p>
      </div>
      <div className="card-content p-6">
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <FiShoppingCart className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">
                New sale completed
              </p>
              <p className="text-xs text-gray-600">
                Transaction #TXN-2024-000001 for $43.75
              </p>
              <p className="text-xs text-gray-500 mt-1">2 minutes ago</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FiUsers className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">
                New customer registered
              </p>
              <p className="text-xs text-gray-600">
                Emily Davis joined the system
              </p>
              <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <FiPackage className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">
                Stock alert triggered
              </p>
              <p className="text-xs text-gray-600">
                Digital Thermometer running low
              </p>
              <p className="text-xs text-gray-500 mt-1">3 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
));

// Memoized Quick Actions Section
const QuickActionsSection = memo(() => (
  <div className="card bg-white rounded-xl shadow-lg border-0 overflow-hidden">
    <div className="card-header bg-gradient-to-r from-indigo-50 to-blue-50 p-6 border-b border-gray-100">
      <h3 className="card-title text-lg font-semibold text-gray-800">
        Quick Actions
      </h3>
      <p className="card-subtitle text-sm text-gray-600 mt-1">Common tasks</p>
    </div>
    <div className="card-content p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button className="btn btn-primary flex flex-col items-center p-6 h-auto bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <FiShoppingCart className="mb-3" size={24} />
          <span className="text-sm font-medium">New Sale</span>
        </button>
        <button className="btn btn-secondary flex flex-col items-center p-6 h-auto bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
          <FiPackage className="mb-3" size={24} />
          <span className="text-sm font-medium">Add Product</span>
        </button>
        <button className="btn btn-success flex flex-col items-center p-6 h-auto bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          <FiUsers className="mb-3" size={24} />
          <span className="text-sm font-medium">New Customer</span>
        </button>
        <button className="btn btn-outline flex flex-col items-center p-6 h-auto border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          <FiBarChart className="mb-3" size={24} />
          <span className="text-sm font-medium">View Reports</span>
        </button>
      </div>
    </div>
  </div>
));

// Dashboard Layout Manager
const DashboardLayoutManager = memo(() => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [visibleComponents, setVisibleComponents] = useState([]);

  const availableComponents = [
    {
      id: "keyMetrics",
      name: "Key Metrics",
      icon: FiTrendingUp,
      component: KeyMetricsSection,
    },
    {
      id: "recentSales",
      name: "Recent Sales",
      icon: FiShoppingCart,
      component: RecentSalesCard,
    },
    {
      id: "stockAlerts",
      name: "Stock Alerts",
      icon: FiAlertTriangle,
      component: StockAlertsCard,
    },
    {
      id: "productCategories",
      name: "Product Categories",
      icon: FiPackage,
      component: ProductCategoriesCard,
    },
    {
      id: "recentActivity",
      name: "Recent Activity",
      icon: FiUsers,
      component: RecentActivityCard,
    },
    {
      id: "quickActions",
      name: "Quick Actions",
      icon: FiGrid,
      component: QuickActionsSection,
    },
  ];

  const toggleComponent = (componentId) => {
    setVisibleComponents((prev) =>
      prev.includes(componentId)
        ? prev.filter((id) => id !== componentId)
        : [...prev, componentId]
    );
  };

  return (
    <div className="relative">
      {/* Nine Dots Menu Button */}
      <div className="fixed top-20 right-6 z-50">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-3 rounded-xl shadow-lg transition-all duration-200"
          style={{
            backgroundColor: "var(--color-primary-600)",
            color: "white",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)";
          }}
        >
          {isMenuOpen ? (
            <FiX className="w-5 h-5" />
          ) : (
            <FiGrid className="w-5 h-5" />
          )}
        </button>

        {/* Components Menu */}
        {isMenuOpen && (
          <div
            className="absolute top-16 right-0 w-80 rounded-xl shadow-xl border p-4 animate-fade-in"
            style={{
              backgroundColor: "var(--color-bg-card)",
              borderColor: "var(--color-border-light)",
            }}
          >
            <h3
              className="font-semibold mb-4 text-lg"
              style={{ color: "var(--color-text-primary)" }}
            >
              Dashboard Components
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {availableComponents.map((component) => (
                <button
                  key={component.id}
                  onClick={() => toggleComponent(component.id)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                    visibleComponents.includes(component.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                  style={{
                    color: visibleComponents.includes(component.id)
                      ? "var(--color-primary-600)"
                      : "var(--color-text-secondary)",
                  }}
                >
                  <component.icon className="w-5 h-5" />
                  <span className="text-xs font-medium text-center">
                    {component.name}
                  </span>
                  {visibleComponents.includes(component.id) && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: "var(--color-success-500)" }}
                    />
                  )}
                </button>
              ))}
            </div>

            <div
              className="mt-4 pt-4 border-t"
              style={{ borderColor: "var(--color-border-light)" }}
            >
              <button
                onClick={() =>
                  setVisibleComponents(availableComponents.map((c) => c.id))
                }
                className="w-full btn btn-outline text-sm"
              >
                <FiPlus className="w-4 h-4" />
                Show All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Render Selected Components */}
      <div className="space-y-8">
        {visibleComponents.map((componentId) => {
          const component = availableComponents.find(
            (c) => c.id === componentId
          );
          if (!component) return null;

          const Component = component.component;
          return (
            <div key={componentId} className="animate-fade-in">
              <Component />
            </div>
          );
        })}

        {visibleComponents.length === 0 && (
          <div className="text-center py-16">
            <FiGrid
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: "var(--color-text-muted)" }}
            />
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Welcome to Elith Pharmacy
            </h3>
            <p style={{ color: "var(--color-text-muted)" }}>
              Click the grid icon in the top-right to add dashboard components
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

// Split existing components into individual cards
const RecentSalesCard = memo(() => (
  <div className="card bg-white rounded-xl shadow-lg border-0 overflow-hidden">
    <div className="card-header bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
      <h3 className="card-title flex items-center text-lg font-semibold text-gray-800">
        <FiBarChart className="mr-3 text-blue-600" size={20} />
        Recent Sales
      </h3>
      <p className="card-subtitle text-sm text-gray-600 mt-1">
        Latest transactions
      </p>
    </div>
    <div className="card-content p-6">
      <div className="space-y-4">
        {mockData.sales.slice(0, 3).map((sale) => (
          <div
            key={sale.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:shadow-md transition-all duration-200"
          >
            <div>
              <p className="font-medium text-gray-800">
                {sale.transactionNumber}
              </p>
              <p className="text-sm text-gray-600">
                {mockHelpers.getCustomerById(sale.customerId)?.firstName}{" "}
                {mockHelpers.getCustomerById(sale.customerId)?.lastName}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-green-600">
                ${sale.totalAmount}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(sale.date).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="card-footer p-6 bg-gray-50 border-t border-gray-100">
      <button className="btn btn-outline w-full py-2 text-blue-600 border-blue-200 hover:bg-blue-50">
        View All Sales
      </button>
    </div>
  </div>
));

const StockAlertsCard = memo(() => (
  <div className="card bg-white rounded-xl shadow-lg border-0 overflow-hidden">
    <div className="card-header bg-gradient-to-r from-orange-50 to-yellow-50 p-6 border-b border-gray-100">
      <h3 className="card-title flex items-center text-lg font-semibold text-gray-800">
        <FiAlertTriangle className="mr-3 text-orange-600" size={20} />
        Stock Alerts
      </h3>
      <p className="card-subtitle text-sm text-gray-600 mt-1">
        Items needing attention
      </p>
    </div>
    <div className="card-content p-6">
      <div className="space-y-4">
        {mockData.lowStockAlerts.map((alert) => (
          <div
            key={alert.productId}
            className="p-4 bg-orange-50 rounded-lg border border-orange-200"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium text-gray-800">{alert.productName}</p>
              <span className="badge badge-warning bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                Low Stock
              </span>
            </div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-gray-600">
                Current: {alert.currentStock} units
              </span>
              <span className="text-gray-500">Min: {alert.minStockLevel}</span>
            </div>
            <div className="w-full bg-orange-200 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((alert.currentStock / alert.minStockLevel) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="card-footer p-6 bg-gray-50 border-t border-gray-100">
      <button className="btn btn-warning w-full py-2 bg-orange-100 text-orange-700 hover:bg-orange-200">
        Manage Inventory
      </button>
    </div>
  </div>
));

const ProductCategoriesCard = memo(() => (
  <div className="card bg-white rounded-xl shadow-lg border-0 overflow-hidden">
    <div className="card-header bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-100">
      <h3 className="card-title text-lg font-semibold text-gray-800">
        Product Categories
      </h3>
      <p className="card-subtitle text-sm text-gray-600 mt-1">
        {mockData.categories.length} categories
      </p>
    </div>
    <div className="card-content p-6">
      <div className="space-y-3">
        {mockData.categories.slice(0, 5).map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
          >
            <span className="text-sm font-medium text-gray-700">
              {category.name}
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {mockHelpers.getProductsByCategory(category.id).length}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
));

const RecentActivityCard = memo(() => (
  <div className="card bg-white rounded-xl shadow-lg border-0 overflow-hidden">
    <div className="card-header bg-gradient-to-r from-green-50 to-teal-50 p-6 border-b border-gray-100">
      <h3 className="card-title text-lg font-semibold text-gray-800">
        Recent Activity
      </h3>
      <p className="card-subtitle text-sm text-gray-600 mt-1">
        Latest system activity
      </p>
    </div>
    <div className="card-content p-6">
      <div className="space-y-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <FiShoppingCart className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">
              New sale completed
            </p>
            <p className="text-xs text-gray-600">
              Transaction #TXN-2024-000001 for $43.75
            </p>
            <p className="text-xs text-gray-500 mt-1">2 minutes ago</p>
          </div>
        </div>

        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <FiUsers className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">
              New customer registered
            </p>
            <p className="text-xs text-gray-600">
              Emily Davis joined the system
            </p>
            <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
          </div>
        </div>

        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <FiPackage className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">
              Stock alert triggered
            </p>
            <p className="text-xs text-gray-600">
              Digital Thermometer running low
            </p>
            <p className="text-xs text-gray-500 mt-1">3 hours ago</p>
          </div>
        </div>
      </div>
    </div>
  </div>
));

const Dashboard = () => {
  return (
    <div className="space-y-8 p-2">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard Overview
        </h1>
        <p className="text-gray-600 text-lg">
          Welcome to Elith Pharmacy Management System
        </p>
      </div>

      {/* Dashboard Layout Manager */}
      <DashboardLayoutManager />
    </div>
  );
};

export default Dashboard;
