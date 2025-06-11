import { useState } from "react";
import {
  FiDollarSign,
  FiShoppingCart,
  FiUsers,
  FiPackage,
  FiTrendingUp,
  FiBarChart,
  FiX,
  FiArrowDown,
  FiDownload,
} from "react-icons/fi";

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("Month to date");

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
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "bold",
            color: "var(--color-text-primary)",
            margin: 0,
          }}
        >
          Dashboard
        </h1>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
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
      )}
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome to the pharmacy management system</p>
      </div>
      
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        <StatCard 
          title="Expired Products" 
          value={stats.expiredProducts}
          icon="hourglass_empty" 
          color="red" 
        />
        <StatCard 
          title="Total Sales Made" 
          value={`GH₵${stats.totalSales.toLocaleString()}`}
          icon="payments" 
          color="orange" 
        />
        <StatCard 
          title="Drugs Added" 
          value={stats.drugsAdded}
          icon="medication" 
          color="blue" 
        />
        <StatCard 
          title="Low Stock Drugs" 
          value={stats.lowStockDrugs}
          icon="inventory_2" 
          color="teal" 
        />
        <StatCard 
          title="Profit Current Month" 
          value={`GH₵${stats.profitCurrentMonth.toLocaleString()}`}
          icon="trending_up" 
          color="purple" 
        />
        <StatCard 
          title="Total Profit Made" 
          value={`GH₵${stats.totalProfit.toLocaleString()}`}
          icon="account_balance" 
          color="green" 
        />
      </div>
      
      {/* Sales charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold mb-6 text-gray-800 flex items-center">
            <span className="material-icons mr-2 text-blue-500">bar_chart</span>
            Sales Person Sales Chart
          </h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            {/* Chart will be implemented later */}
            <div className="text-center">
              <span className="material-icons text-5xl text-gray-300 mb-2">insert_chart</span>
              <p className="text-gray-500">Sales chart data will appear here</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold mb-6 text-gray-800 flex items-center">
            <span className="material-icons mr-2 text-blue-500">pie_chart</span>
            Sales Person Sales Chart
          </h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            {/* Chart will be implemented later */}
            <div className="text-center">
              <span className="material-icons text-5xl text-gray-300 mb-2">donut_large</span>
              <p className="text-gray-500">Sales chart data will appear here</p>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px 200px 1fr",
          gap: "24px",
          marginBottom: "24px",
        }}
      >
        {/* No. of Users */}
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
              margin: "0 0 20px 0",
            }}
          >
            No. of Users
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "16px",
                backgroundColor: "#f0fdfa",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#ccfbf1",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FiUsers color="#14b8a6" size={20} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  Total Customers
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#1f2937",
                  }}
                >
                  1.8k
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "16px",
                backgroundColor: "#eff6ff",
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
                <FiUsers color="#3b82f6" size={20} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  Total Suppliers
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#1f2937",
                  }}
                >
                  27
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Overview */}
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
              margin: "0 0 20px 0",
            }}
          >
            Stock Overview
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "4px",
                }}
              >
                Low Stock Items
              </div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                02
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "4px",
                }}
              >
                Item Group
              </div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                14
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "4px",
                }}
              >
                No of Items
              </div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                104
              </div>
            </div>
          </div>
        </div>

        {/* Sales Statistics */}
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
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#1f2937",
                margin: 0,
              }}
            >
              Sales Statistics
            </h3>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#10b981",
              }}
            >
              $ 67,347
            </div>
          </div>
          <div style={{ height: "120px", position: "relative" }}>
            <svg
              style={{ width: "100%", height: "100%" }}
              viewBox="0 0 400 120"
            >
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                points="20,100 60,80 100,70 140,60 180,50 220,45 260,55 300,40 340,50 380,45"
              />
              <circle cx="260" cy="45" r="6" fill="#10b981" />
            </svg>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "10px",
              color: "#6b7280",
              marginTop: "8px",
            }}
          >
            <span>JAN</span>
            <span>FEB</span>
            <span>MAR</span>
            <span>APR</span>
            <span>MAY</span>
            <span>JUN</span>
            <span>JUL</span>
            <span>AUG</span>
            <span>SEP</span>
            <span>OCT</span>
          </div>
        </div>
      </div>

      {/* Customer Statistics */}
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
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#1f2937",
              margin: 0,
            }}
          >
            Customer Statistics
          </h3>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#10b981",
            }}
          >
            1,377
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "end",
            justifyContent: "space-between",
            height: "160px",
            padding: "0 20px",
          }}
        >
          {[40, 60, 80, 100, 70, 90, 120, 60, 50, 70, 110, 130].map(
            (height, index) => (
              <div
                key={index}
                style={{
                  width: "20px",
                  height: `${height}px`,
                  backgroundColor: index === 6 ? "#10b981" : "#86efac",
                  borderRadius: "4px 4px 0 0",
                  opacity: index === 6 ? 1 : 0.7,
                }}
              />
            )
          )}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "10px",
            color: "#6b7280",
            marginTop: "8px",
            padding: "0 20px",
          }}
        >
          <span>JAN</span>
          <span>FEB</span>
          <span>MAR</span>
          <span>APR</span>
          <span>MAY</span>
          <span>JUN</span>
          <span>JUL</span>
          <span>AUG</span>
          <span>SEP</span>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
