import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiDollarSign,
  FiShoppingCart,
  FiUsers,
  FiPackage,
  FiTrendingUp,
  FiPlus,
  FiArrowUpRight,
  FiArrowDownRight,
  FiActivity,
  FiBell,
  FiClock,
} from "react-icons/fi";
import { 
  MobileCard, 
  MobileStatCard, 
  MobileActionButton, 
  MobileFAB 
} from "../components/ui/MobileComponents";
import { dataService } from "../services";
import { useNotificationsStore, useSettingsStore } from "../store";

const MobileDashboard = () => {
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  const { notifications, unreadCount } = useNotificationsStore();
  const { currency } = settings;

  const [dashboardStats, setDashboardStats] = useState({
    todaysSales: 0,
    todaysTransactions: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    lowStockItems: 0,
    monthlyGrowth: 0,
  });
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [stats, sales, products] = await Promise.all([
          dataService.dashboard.getStats(),
          dataService.sales.getRecent(5),
          dataService.products.getLowStock(),
        ]);

        setDashboardStats(stats || {});
        setRecentSales(sales || []);
        setLowStockProducts(products || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const quickActions = [
    {
      title: "New Sale",
      icon: FiShoppingCart,
      color: "blue",
      action: () => navigate("/pos"),
    },
    {
      title: "Add Product",
      icon: FiPackage,
      color: "green",
      action: () => navigate("/inventory/add"),
    },
    {
      title: "Add Customer",
      icon: FiUsers,
      color: "purple",
      action: () => navigate("/customers/add"),
    },
    {
      title: "View Reports",
      icon: FiTrendingUp,
      color: "orange",
      action: () => navigate("/reports"),
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  if (loading) {
    return (
      <div className="mobile-dashboard loading">
        <div className="loading-container">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="loading-spinner"
          >
            <FiActivity size={32} />
          </motion.div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="mobile-dashboard"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Section */}
      <motion.section variants={itemVariants} className="welcome-section">
        <MobileCard className="welcome-card">
          <div className="welcome-content">
            <div className="welcome-text">
              <h1>Good morning! 👋</h1>
              <p>Here's what's happening at your pharmacy today</p>
            </div>
            <div className="welcome-stats">
              <div className="mini-stat">
                <span className="mini-stat-value">{dashboardStats.todaysTransactions}</span>
                <span className="mini-stat-label">Sales Today</span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-value">
                  {currency}{(dashboardStats.todaysSales || 0).toLocaleString()}
                </span>
                <span className="mini-stat-label">Revenue</span>
              </div>
            </div>
          </div>
        </MobileCard>
      </motion.section>

      {/* Quick Actions */}
      <motion.section variants={itemVariants} className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MobileCard 
                onClick={action.action}
                className="quick-action-card"
              >
                <div className={`quick-action-icon ${action.color}`}>
                  <action.icon size={24} />
                </div>
                <span className="quick-action-title">{action.title}</span>
              </MobileCard>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Stats Overview */}
      <motion.section variants={itemVariants} className="stats-section">
        <h2>Overview</h2>
        <div className="stats-grid">
          <MobileStatCard
            title="Total Revenue"
            value={`${currency}${(dashboardStats.totalRevenue || 0).toLocaleString()}`}
            change={`+${dashboardStats.monthlyGrowth || 0}%`}
            icon={FiDollarSign}
            color="green"
            delay={0}
          />
          <MobileStatCard
            title="Products"
            value={dashboardStats.totalProducts || 0}
            icon={FiPackage}
            color="blue"
            delay={1}
          />
          <MobileStatCard
            title="Customers"
            value={dashboardStats.totalCustomers || 0}
            icon={FiUsers}
            color="purple"
            delay={2}
          />
          <MobileStatCard
            title="Low Stock"
            value={dashboardStats.lowStockItems || 0}
            icon={FiBell}
            color="orange"
            delay={3}
          />
        </div>
      </motion.section>

      {/* Recent Activity */}
      <motion.section variants={itemVariants} className="activity-section">
        <div className="section-header">
          <h2>Recent Sales</h2>
          <MobileActionButton
            variant="outline"
            size="sm"
            onClick={() => navigate("/sales")}
          >
            View All
          </MobileActionButton>
        </div>
        
        <div className="activity-list">
          {recentSales.length > 0 ? (
            recentSales.slice(0, 3).map((sale, index) => (
              <motion.div
                key={sale.id}
                variants={itemVariants}
                custom={index}
              >
                <MobileCard className="activity-item">
                  <div className="activity-icon">
                    <FiShoppingCart size={16} />
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">Sale #{sale.id}</div>
                    <div className="activity-subtitle">
                      {sale.customer_name || "Walk-in Customer"}
                    </div>
                  </div>
                  <div className="activity-meta">
                    <div className="activity-amount">
                      {currency}{(sale.total || 0).toLocaleString()}
                    </div>
                    <div className="activity-time">
                      <FiClock size={12} />
                      {new Date(sale.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </MobileCard>
              </motion.div>
            ))
          ) : (
            <MobileCard className="empty-state">
              <FiShoppingCart size={48} />
              <h3>No recent sales</h3>
              <p>Start your first sale today!</p>
              <MobileActionButton onClick={() => navigate("/pos")}>
                Go to POS
              </MobileActionButton>
            </MobileCard>
          )}
        </div>
      </motion.section>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <motion.section variants={itemVariants} className="alerts-section">
          <MobileCard className="alert-card">
            <div className="alert-header">
              <div className="alert-icon">
                <FiBell size={20} />
              </div>
              <div>
                <h3>Low Stock Alert</h3>
                <p>{lowStockProducts.length} products need restocking</p>
              </div>
            </div>
            <MobileActionButton
              variant="outline"
              size="sm"
              onClick={() => navigate("/inventory")}
            >
              View Products
            </MobileActionButton>
          </MobileCard>
        </motion.section>
      )}

      {/* Floating Action Button */}
      <MobileFAB onClick={() => navigate("/pos")}>
        <FiPlus size={24} />
      </MobileFAB>

      <style jsx>{`
        .mobile-dashboard {
          padding: 16px;
          max-width: 100%;
          background: #f8fafc;
          min-height: 100vh;
        }

        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: #6b7280;
        }

        .loading-spinner {
          color: #3b82f6;
        }

        /* Welcome Section */
        .welcome-section {
          margin-bottom: 24px;
        }

        .welcome-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
        }

        .welcome-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .welcome-text h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .welcome-text p {
          font-size: 14px;
          opacity: 0.9;
          margin: 0;
        }

        .welcome-stats {
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: right;
        }

        .mini-stat-value {
          display: block;
          font-size: 18px;
          font-weight: 700;
        }

        .mini-stat-label {
          display: block;
          font-size: 12px;
          opacity: 0.8;
        }

        /* Sections */
        section {
          margin-bottom: 32px;
        }

        h2 {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 16px 0;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        /* Quick Actions */
        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .quick-action-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 20px 16px;
          text-align: center;
        }

        .quick-action-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .quick-action-icon.blue {
          background: #eff6ff;
          color: #3b82f6;
        }

        .quick-action-icon.green {
          background: #f0fdf4;
          color: #16a34a;
        }

        .quick-action-icon.purple {
          background: #faf5ff;
          color: #9333ea;
        }

        .quick-action-icon.orange {
          background: #fff7ed;
          color: #ea580c;
        }

        .quick-action-title {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        /* Activity List */
        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
        }

        .activity-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #eff6ff;
          color: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .activity-content {
          flex: 1;
        }

        .activity-title {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .activity-subtitle {
          font-size: 14px;
          color: #6b7280;
        }

        .activity-meta {
          text-align: right;
        }

        .activity-amount {
          font-size: 16px;
          font-weight: 700;
          color: #16a34a;
          margin-bottom: 4px;
        }

        .activity-time {
          font-size: 12px;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 4px;
          justify-content: flex-end;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
        }

        .empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          color: #374151;
          margin: 16px 0 8px 0;
        }

        .empty-state p {
          margin: 0 0 24px 0;
        }

        /* Alert Card */
        .alert-card {
          background: #fef3c7;
          border: 1px solid #fcd34d;
        }

        .alert-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .alert-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #f59e0b;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .alert-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: #92400e;
          margin: 0 0 4px 0;
        }

        .alert-header p {
          font-size: 14px;
          color: #a16207;
          margin: 0;
        }

        /* Responsive Design */
        @media (min-width: 768px) {
          .mobile-dashboard {
            padding: 24px;
          }

          .quick-actions-grid {
            grid-template-columns: repeat(4, 1fr);
          }

          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }

          .welcome-content {
            flex-direction: row;
          }

          .welcome-stats {
            flex-direction: row;
            gap: 24px;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default MobileDashboard;
