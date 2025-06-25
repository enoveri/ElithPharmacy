import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpring, animated } from "@react-spring/web";
import {
  FiSave,
  FiRefreshCw,
  FiUser,
  FiShield,
  FiDatabase,
  FiBell,
  FiMoon,
  FiSun,
  FiGlobe,
  FiDollarSign,
  FiPackage,
  FiMail,
  FiPhone,
  FiMapPin,
  FiChevronRight,
  FiCheck,
  FiXCircle,
  FiDownload,
  FiUpload,
  FiSettings as FiSettingsIcon,
  FiLogOut,
} from "react-icons/fi";
import { supabase } from "../../lib/supabase";

function MobileSettings() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Pull-to-refresh animation
  const [{ y }, api] = useSpring(() => ({ y: 0 }));

  // Mock settings data
  const [formSettings, setFormSettings] = useState({
    general: {
      storeName: "Elith Pharmacy",
      currency: "KSH",
      timezone: "Africa/Nairobi",
      language: "en",
      dateFormat: "DD/MM/YYYY",
      theme: "light",
    },
    notifications: {
      lowStock: true,
      newOrders: true,
      dailyReports: false,
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
    },
    business: {
      address: "123 Main Street, Nairobi",
      phone: "+254 700 000 000",
      email: "info@elithpharmacy.com",
      website: "www.elithpharmacy.com",
      businessHours: "8:00 AM - 8:00 PM",
      taxRate: 16,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordRequirements: "strong",
      loginHistory: true,
    },
  });

  useEffect(() => {
    loadSettings();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error("Error getting user:", error);
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      // In a real app, this would fetch from the database
      // const data = await dataService.getSettings();
      setSettings(formSettings);
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePullToRefresh = async () => {
    setRefreshing(true);

    api.start({
      y: 50,
      config: { tension: 300, friction: 30 },
    });

    try {
      await loadSettings();
      setTimeout(() => {
        api.start({ y: 0 });
        setRefreshing(false);
      }, 500);
    } catch (error) {
      api.start({ y: 0 });
      setRefreshing(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      // In a real app, this would save to the database
      // await dataService.updateSettings(formSettings);
      setMessage({ type: "success", text: "Settings saved successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save settings" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (section, key, value) => {
    setFormSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };
  const SettingsSection = ({ section, title, icon: Icon, children }) => {
    const isOpen = activeSection === section;

    return (
      <motion.div
        layout
        className="bg-white rounded-2xl shadow-lg border-0 mb-6 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
        }}
      >
        {" "}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveSection(isOpen ? null : section)}
          className="w-full flex items-center justify-between p-6 text-left"
        >
          <div className="flex items-center space-x-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
              <p className="text-sm text-gray-500 font-medium">
                Configure {title.toLowerCase()}
              </p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <FiChevronRight className="w-5 h-5 text-gray-400" />
          </motion.div>
        </motion.button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-gray-100"
            >
              <div className="p-4">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const ToggleSwitch = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <p className="font-medium text-gray-900">{label}</p>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onChange(!enabled)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          enabled ? "bg-blue-600" : "bg-gray-300"
        }`}
      >
        <motion.div
          animate={{ x: enabled ? 24 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
        />
      </motion.button>
    </div>
  );

  const InputField = ({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
  }) => (
    <div className="py-2">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );

  const SelectField = ({ label, value, onChange, options }) => (
    <div className="py-2">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <FiRefreshCw className="w-8 h-8 text-blue-600" />
        </motion.div>
      </div>
    );
  }
  return (
    <div className="mobile-container">
      {/* Message Toast */}
      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
              message.type === "success" ? "bg-green-600" : "bg-red-600"
            } text-white`}
          >
            <div className="flex items-center space-x-2">
              {" "}
              {message.type === "success" ? (
                <FiCheck className="w-5 h-5" />
              ) : (
                <FiXCircle className="w-5 h-5" />
              )}
              <span>{message.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>{" "}
      {/* User Profile Header */}
      <div
        className="bg-white/95 backdrop-blur-lg border-b border-gray-200/50 p-6"
        style={{
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="flex items-center space-x-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            <FiUser className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg">
              {user?.email || "User"}
            </h3>
            <p className="text-sm text-gray-500 font-medium">Administrator</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => supabase.auth.signOut()}
            className="p-3 text-red-600 hover:bg-red-50 rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm"
          >
            <FiLogOut className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
      {/* Pull to Refresh Indicator */}
      <animated.div
        style={{
          transform: y.to((y) => `translateY(${y}px)`),
        }}
        className="flex justify-center py-2"
      >
        {refreshing && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <FiRefreshCw className="w-6 h-6 text-blue-600" />
          </motion.div>
        )}
      </animated.div>{" "}
      {/* Settings Content */}
      <div
        className="flex-1 overflow-auto p-6"
        onTouchStart={() => {
          const startY = event.touches[0].clientY;
          const scrollTop = event.currentTarget.scrollTop;
          if (scrollTop === 0) {
            const handleTouchMove = (e) => {
              const currentY = e.touches[0].clientY;
              const pullDistance = currentY - startY;
              if (pullDistance > 100) {
                handlePullToRefresh();
                document.removeEventListener("touchmove", handleTouchMove);
              }
            };
            document.addEventListener("touchmove", handleTouchMove);
            document.addEventListener("touchend", () => {
              document.removeEventListener("touchmove", handleTouchMove);
            });
          }
        }}
      >
        <SettingsSection
          section="general"
          title="General"
          icon={FiSettingsIcon}
        >
          <InputField
            label="Store Name"
            value={formSettings.general?.storeName || ""}
            onChange={(value) => updateSetting("general", "storeName", value)}
          />
          <SelectField
            label="Currency"
            value={formSettings.general?.currency || "KSH"}
            onChange={(value) => updateSetting("general", "currency", value)}
            options={[
              { value: "KSH", label: "Kenyan Shilling (KSH)" },
              { value: "USD", label: "US Dollar (USD)" },
              { value: "EUR", label: "Euro (EUR)" },
            ]}
          />
          <SelectField
            label="Theme"
            value={formSettings.general?.theme || "light"}
            onChange={(value) => updateSetting("general", "theme", value)}
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
              { value: "auto", label: "Auto" },
            ]}
          />
        </SettingsSection>

        <SettingsSection
          section="notifications"
          title="Notifications"
          icon={FiBell}
        >
          <ToggleSwitch
            enabled={formSettings.notifications?.lowStock || false}
            onChange={(value) =>
              updateSetting("notifications", "lowStock", value)
            }
            label="Low Stock Alerts"
            description="Get notified when products are running low"
          />
          <ToggleSwitch
            enabled={formSettings.notifications?.newOrders || false}
            onChange={(value) =>
              updateSetting("notifications", "newOrders", value)
            }
            label="New Orders"
            description="Receive notifications for new orders"
          />
          <ToggleSwitch
            enabled={formSettings.notifications?.emailNotifications || false}
            onChange={(value) =>
              updateSetting("notifications", "emailNotifications", value)
            }
            label="Email Notifications"
            description="Send notifications via email"
          />
          <ToggleSwitch
            enabled={formSettings.notifications?.pushNotifications || false}
            onChange={(value) =>
              updateSetting("notifications", "pushNotifications", value)
            }
            label="Push Notifications"
            description="Browser push notifications"
          />
        </SettingsSection>

        <SettingsSection
          section="business"
          title="Business Info"
          icon={FiPackage}
        >
          <InputField
            label="Business Address"
            value={formSettings.business?.address || ""}
            onChange={(value) => updateSetting("business", "address", value)}
          />
          <InputField
            label="Phone Number"
            value={formSettings.business?.phone || ""}
            onChange={(value) => updateSetting("business", "phone", value)}
            type="tel"
          />
          <InputField
            label="Email"
            value={formSettings.business?.email || ""}
            onChange={(value) => updateSetting("business", "email", value)}
            type="email"
          />
          <InputField
            label="Website"
            value={formSettings.business?.website || ""}
            onChange={(value) => updateSetting("business", "website", value)}
            type="url"
          />
          <InputField
            label="Tax Rate (%)"
            value={formSettings.business?.taxRate || ""}
            onChange={(value) =>
              updateSetting("business", "taxRate", parseFloat(value) || 0)
            }
            type="number"
          />
        </SettingsSection>

        <SettingsSection section="security" title="Security" icon={FiShield}>
          <ToggleSwitch
            enabled={formSettings.security?.twoFactorAuth || false}
            onChange={(value) =>
              updateSetting("security", "twoFactorAuth", value)
            }
            label="Two-Factor Authentication"
            description="Add an extra layer of security"
          />
          <SelectField
            label="Session Timeout (minutes)"
            value={formSettings.security?.sessionTimeout || 30}
            onChange={(value) =>
              updateSetting("security", "sessionTimeout", parseInt(value))
            }
            options={[
              { value: 15, label: "15 minutes" },
              { value: 30, label: "30 minutes" },
              { value: 60, label: "1 hour" },
              { value: 240, label: "4 hours" },
            ]}
          />
          <ToggleSwitch
            enabled={formSettings.security?.loginHistory || false}
            onChange={(value) =>
              updateSetting("security", "loginHistory", value)
            }
            label="Login History"
            description="Keep track of login attempts"
          />
        </SettingsSection>

        {/* Data Management Section */}
        <motion.div
          layout
          className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 p-4"
        >
          <h3 className="font-medium text-gray-900 mb-4 flex items-center">
            <FiDatabase className="w-5 h-5 mr-2 text-blue-600" />
            Data Management
          </h3>
          <div className="space-y-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-between p-3 bg-blue-50 text-blue-600 rounded-lg"
            >
              <div className="flex items-center">
                <FiDownload className="w-4 h-4 mr-2" />
                Export Data
              </div>
              <FiChevronRight className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-between p-3 bg-green-50 text-green-600 rounded-lg"
            >
              <div className="flex items-center">
                <FiUpload className="w-4 h-4 mr-2" />
                Import Data
              </div>
              <FiChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      </div>
      {/* Save Button */}
      <div className="p-4 bg-white border-t border-gray-200">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={saveSettings}
          disabled={saving}
          className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50"
        >
          {saving ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="mr-2"
            >
              <FiRefreshCw className="w-5 h-5" />
            </motion.div>
          ) : (
            <FiSave className="w-5 h-5 mr-2" />
          )}
          {saving ? "Saving..." : "Save Settings"}
        </motion.button>
      </div>
    </div>
  );
}

export default MobileSettings;
