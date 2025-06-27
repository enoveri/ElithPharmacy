import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  FiX,
} from "react-icons/fi";
import { supabase } from "../../lib/supabase";

function MobileSettings() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [formSettings, setFormSettings] = useState({});

  // Get current user on mount - same as desktop
  useEffect(() => {
    const getUser = async () => {
    try {
      console.log("🔄 [MobileSettings] Getting current user...");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("👤 [MobileSettings] User received:", user ? "User found" : "No user");
      setUser(user);
      // Set loading to false if no user is found
      if (!user) {
        console.log("❌ [MobileSettings] No user found, stopping loading");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("❌ [MobileSettings] Error getting user:", error);
      setIsLoading(false);
    }
    };
    getUser();
  }, []);

  const fetchSettings = async () => {
    if (!user?.id) {
      console.log("❌ No user ID, skipping settings fetch");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log("🔄 [MobileSettings] Fetching settings for user:", user.id);

      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .maybeSingle();

      if (error) {
        console.error("❌ [MobileSettings] Error fetching settings:", error);
        throw error;
      }

      console.log("✅ [MobileSettings] Raw settings data:", data);

      // If no settings exist, create default settings
      if (!data) {
        console.log("📝 [MobileSettings] No settings found, creating defaults...");
        const defaultSettings = {
          user_id: user?.id,
          store_name: "My Pharmacy",
          pharmacy_name: "My Pharmacy",
          address: "",
          phone: "",
          email: user?.email || "",
          pharmacy_license: "",
          currency: "UGX",
          tax_rate: 18,
          timezone: "Africa/Kampala",
          date_format: "DD/MM/YYYY",
          low_stock_threshold: 10,
          auto_reorder_point: 10,
          low_stock_alerts: true,
          expiry_alerts: true,
          alert_threshold: 30,
          theme: "light",
          language: "en",
          session_timeout: 30,
          enable_audit_log: true,
          synced: false,
        };

        setSettings(defaultSettings);
        setFormSettings(defaultSettings);

        // Create default settings in database
        const { error: createError } = await supabase
          .from("settings")
          .insert(defaultSettings);

        if (createError) {
          console.error(
            "❌ [MobileSettings] Error creating default settings:",
            createError
          );
        }
      } else {
        setSettings(data);
        setFormSettings(data);
      }
    } catch (err) {
      console.error("❌ [MobileSettings] Error in fetchSettings:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };



  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setMessage({ type: "", text: "" });

      const { error } = await supabase
        .from("settings")
        .upsert(formSettings, { onConflict: "user_id" });

      if (error) throw error;

      setSettings(formSettings);
      setMessage({ type: "success", text: "Settings saved successfully!" });

      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      console.error("❌ [MobileSettings] Error saving settings:", err);
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    setFormSettings(settings);
    setMessage({ type: "success", text: "Settings reset to last saved state" });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  useEffect(() => {
    if (user) {
      fetchSettings();
    } else if (user === null) {
      // If user is explicitly null (not logged in), stop loading
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log("⚠️ [MobileSettings] Loading timeout, stopping loading state");
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading]);

  const updateFormSetting = (key, value) => {
    setFormSettings((prev) => ({ ...prev, [key]: value }));
  };

  const SettingsSection = ({ section, title, icon: Icon, children }) => {
    const isOpen = activeSection === section;

    return (
      <motion.div
        layout
        className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden"
        style={{
          marginBottom: "2rem",
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
        }}
      >
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
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">Tap to configure</p>
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
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 space-y-6 border-t border-gray-100">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const ToggleSwitch = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1">
        <p className="font-semibold text-gray-900 text-base">{label}</p>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
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
    <div className="py-3">
      <label className="block text-base font-semibold text-gray-700 mb-3">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 hover:bg-gray-50/70 transition-all duration-200"
      />
    </div>
  );

  const SelectField = ({ label, value, onChange, options }) => (
    <div className="py-3">
      <label className="block text-base font-semibold text-gray-700 mb-3">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 hover:bg-gray-50/70 transition-all duration-200"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  if (isLoading) {
    return (
      <div className="mobile-container flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 relative overflow-x-hidden">
      {/* Background overlay */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          background: `
            radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(120, 119, 198, 0.2) 0%, transparent 50%)
          `
        }}
      />

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
              {message.type === "success" ? (
                <FiCheck className="w-5 h-5" />
              ) : (
                <FiXCircle className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div 
        className="relative z-10 bg-white/95 backdrop-blur-lg border-b border-gray-200/50"
        style={{ padding: "2rem 1.5rem 1.5rem 1.5rem" }}
      >
        <div className="flex items-center justify-center">
          {user && (
            <p className="text-sm text-blue-600">
              Logged in as: {user.email}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleResetSettings}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-xl transition-all duration-200 font-medium disabled:opacity-50"
          >
            <FiRefreshCw className="w-4 h-4" />
            <span>Reset</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveSettings}
            disabled={saving || isLoading}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium disabled:opacity-50"
          >
            <FiSave className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save"}</span>
          </motion.button>
        </div>
      </div>

      {/* Settings Content with Explicit Spacing */}
      <div 
        className="relative z-10 flex-1 overflow-auto"
        style={{ 
          paddingLeft: "1.5rem", 
          paddingRight: "1.5rem",
          paddingBottom: "2rem",
          paddingTop: "2rem"
        }}
      >
        {/* General Section */}
        <div style={{ marginBottom: "3rem" }}>
          <SettingsSection
            section="general"
            title="General Settings"
            icon={FiSettingsIcon}
          >
            <InputField
              label="Business Name"
              value={formSettings.pharmacy_name || ""}
              onChange={(value) => updateFormSetting("pharmacy_name", value)}
              placeholder="Enter your pharmacy name"
            />
            <InputField
              label="Address"
              value={formSettings.address || ""}
              onChange={(value) => updateFormSetting("address", value)}
              placeholder="Enter your pharmacy address"
            />
            <div className="grid grid-cols-1 gap-4">
              <InputField
                label="Phone Number"
                value={formSettings.phone || ""}
                onChange={(value) => updateFormSetting("phone", value)}
                type="tel"
                placeholder="Enter phone number"
              />
              <InputField
                label="Email Address"
                value={formSettings.email || ""}
                onChange={(value) => updateFormSetting("email", value)}
                type="email"
                placeholder="Enter email address"
              />
            </div>
            <InputField
              label="Pharmacy License Number"
              value={formSettings.pharmacy_license || ""}
              onChange={(value) => updateFormSetting("pharmacy_license", value)}
              placeholder="Enter pharmacy license number"
            />
          </SettingsSection>
        </div>

        {/* Operational Settings Section */}
        <div style={{ marginBottom: "3rem" }}>
          <SettingsSection
            section="operational"
            title="Operational Settings"
            icon={FiPackage}
          >
            <SelectField
              label="Currency"
              value={formSettings.currency || "UGX"}
              onChange={(value) => updateFormSetting("currency", value)}
              options={[
                { value: "UGX", label: "Ugandan Shilling (UGX)" },
                { value: "USD", label: "US Dollar (USD)" },
                { value: "EUR", label: "Euro (EUR)" },
                { value: "GBP", label: "British Pound (GBP)" },
              ]}
            />
            <InputField
              label="Tax Rate (%)"
              value={formSettings.tax_rate || 18}
              onChange={(value) => updateFormSetting("tax_rate", parseFloat(value))}
              type="number"
              placeholder="18"
            />
            <InputField
              label="Low Stock Threshold"
              value={formSettings.low_stock_threshold || 10}
              onChange={(value) => updateFormSetting("low_stock_threshold", parseInt(value))}
              type="number"
              placeholder="10"
            />
          </SettingsSection>
        </div>

        {/* Alert Settings Section */}
        <div style={{ marginBottom: "3rem" }}>
          <SettingsSection
            section="alerts"
            title="Alert Settings"
            icon={FiBell}
          >
            <ToggleSwitch
              enabled={formSettings.low_stock_alerts || false}
              onChange={(value) => updateFormSetting("low_stock_alerts", value)}
              label="Low Stock Alerts"
              description="Get notified when products are running low"
            />
            <ToggleSwitch
              enabled={formSettings.expiry_alerts || false}
              onChange={(value) => updateFormSetting("expiry_alerts", value)}
              label="Expiry Alerts"
              description="Get notified about expiring products"
            />
          </SettingsSection>
        </div>

        {/* System Settings Section */}
        <div style={{ marginBottom: "3rem" }}>
          <SettingsSection
            section="system"
            title="System Settings"
            icon={FiDatabase}
          >
            <SelectField
              label="Theme"
              value={formSettings.theme || "light"}
              onChange={(value) => updateFormSetting("theme", value)}
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
                { value: "auto", label: "Auto" },
              ]}
            />
            <SelectField
              label="Session Timeout (minutes)"
              value={formSettings.session_timeout || 30}
              onChange={(value) => updateFormSetting("session_timeout", parseInt(value))}
              options={[
                { value: 15, label: "15 minutes" },
                { value: 30, label: "30 minutes" },
                { value: 60, label: "1 hour" },
                { value: 240, label: "4 hours" },
              ]}
            />
            <ToggleSwitch
              enabled={formSettings.enable_audit_log || false}
              onChange={(value) => updateFormSetting("enable_audit_log", value)}
              label="Enable Audit Log"
              description="Keep track of system activities"
            />
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}

export default MobileSettings;
