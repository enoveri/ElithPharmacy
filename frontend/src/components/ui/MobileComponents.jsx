import { motion } from "framer-motion";
import { useSpring, animated } from "@react-spring/web";

// Modern Card Component with animations
export const MobileCard = ({ 
  children, 
  className = "", 
  onClick, 
  hover = true,
  delay = 0,
  ...props 
}) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4,
        delay,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={hover ? { scale: 1.02, y: -2 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`mobile-card ${className}`}
      {...props}
    >
      {children}
      
      <style jsx>{`
        .mobile-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #f1f5f9;
          cursor: ${onClick ? 'pointer' : 'default'};
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .mobile-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .mobile-card:hover::before {
          opacity: ${onClick ? 1 : 0};
        }
      `}</style>
    </motion.div>
  );
};

// Stat Card for dashboard
export const MobileStatCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = "blue",
  delay = 0 
}) => {
  const colorMap = {
    blue: { bg: "#eff6ff", text: "#3b82f6", border: "#dbeafe" },
    green: { bg: "#f0fdf4", text: "#16a34a", border: "#dcfce7" },
    orange: { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa" },
    red: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
    purple: { bg: "#faf5ff", text: "#9333ea", border: "#e9d5ff" },
  };

  const colors = colorMap[color];

  const animatedValue = useSpring({
    from: { number: 0 },
    to: { number: parseInt(value?.toString().replace(/,/g, "") || "0") },
    delay: delay * 200,
    config: { duration: 1000 }
  });

  return (
    <MobileCard delay={delay * 0.1} className="stat-card">
      <div className="stat-content">
        <div className="stat-header">
          <div 
            className="stat-icon"
            style={{ 
              backgroundColor: colors.bg,
              borderColor: colors.border 
            }}
          >
            <Icon size={24} style={{ color: colors.text }} />
          </div>
          {change && (
            <span className={`stat-change ${change.startsWith('+') ? 'positive' : 'negative'}`}>
              {change}
            </span>
          )}
        </div>
        
        <div className="stat-body">
          <animated.div className="stat-value">
            {animatedValue.number.to(n => {
              const formatted = Math.floor(n).toLocaleString();
              return value?.toString().includes('.') ? 
                `${formatted}.${value.toString().split('.')[1]}` : 
                formatted;
            })}
          </animated.div>
          <div className="stat-title">{title}</div>
        </div>
      </div>

      <style jsx>{`
        .stat-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid;
        }

        .stat-change {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .stat-change.positive {
          background: #f0fdf4;
          color: #16a34a;
        }

        .stat-change.negative {
          background: #fef2f2;
          color: #dc2626;
        }

        .stat-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          line-height: 1;
        }

        .stat-title {
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
        }
      `}</style>
    </MobileCard>
  );
};

// Action Button Component
export const MobileActionButton = ({ 
  children, 
  variant = "primary", 
  size = "md",
  fullWidth = false,
  loading = false,
  icon: Icon,
  ...props 
}) => {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300",
    success: "bg-green-600 text-white hover:bg-green-700 active:bg-green-800",
    danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        mobile-action-button
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${loading ? 'opacity-70 cursor-not-allowed' : ''}
      `}
      disabled={loading}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        {loading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {!loading && Icon && <Icon size={18} />}
        {children}
      </div>

      <style jsx>{`
        .mobile-action-button {
          border-radius: 12px;
          font-weight: 600;
          transition: all 0.2s ease;
          border: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }

        .mobile-action-button:focus {
          outline: none;
          ring: 2px;
          ring-color: #3b82f6;
          ring-offset: 2px;
        }
      `}</style>
    </motion.button>
  );
};

// Input Component
export const MobileInput = ({ 
  label, 
  error, 
  icon: Icon,
  ...props 
}) => {
  return (
    <div className="mobile-input-group">
      {label && (
        <label className="mobile-input-label">
          {label}
        </label>
      )}
      
      <div className="mobile-input-container">
        {Icon && (
          <div className="mobile-input-icon">
            <Icon size={20} />
          </div>
        )}
        <input
          className={`mobile-input ${Icon ? 'has-icon' : ''} ${error ? 'error' : ''}`}
          {...props}
        />
      </div>
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mobile-input-error"
        >
          {error}
        </motion.div>
      )}

      <style jsx>{`
        .mobile-input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mobile-input-label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .mobile-input-container {
          position: relative;
        }

        .mobile-input {
          width: 100%;
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 16px;
          background: white;
          transition: all 0.2s ease;
        }

        .mobile-input.has-icon {
          padding-left: 48px;
        }

        .mobile-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .mobile-input.error {
          border-color: #ef4444;
        }

        .mobile-input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
        }

        .mobile-input-error {
          font-size: 12px;
          color: #ef4444;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

// Loading Skeleton
export const MobileSkeleton = ({ width = "100%", height = "20px", className = "" }) => {
  return (
    <div 
      className={`mobile-skeleton ${className}`}
      style={{ width, height }}
    >
      <style jsx>{`
        .mobile-skeleton {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 8px;
        }

        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
};

// Floating Action Button
export const MobileFAB = ({ 
  children, 
  onClick, 
  color = "blue",
  position = "bottom-right",
  ...props 
}) => {
  const positions = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "bottom-center": "bottom-6 left-1/2 transform -translate-x-1/2"
  };

  const colors = {
    blue: "bg-blue-600 hover:bg-blue-700",
    green: "bg-green-600 hover:bg-green-700",
    red: "bg-red-600 hover:bg-red-700"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`mobile-fab ${positions[position]} ${colors[color]}`}
      onClick={onClick}
      {...props}
    >
      {children}

      <style jsx>{`
        .mobile-fab {
          position: fixed;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
          z-index: 20;
          transition: all 0.3s ease;
        }

        .mobile-fab:active {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </motion.button>
  );
};
